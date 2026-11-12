// Robô do Instagram: 3x por dia pega um vídeo de produto de perfis do TikTok, coloca no nosso
// layout e posta sozinho na conta.
//
//   node robo.js          roda sempre (no servidor: pm2 start robo.js --name robo-insta)
//   node robo.js teste    prepara 1 vídeo em dados/teste/ e NÃO posta (pra ver o layout)
//   node robo.js conta    mostra qual conta do Instagram está ligada
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const config = require('./config');
const ig = require('./ig');
const { editar, duracao } = require('./editar');
const { headlineDoTitulo } = require('./cabecalho');

const DADOS = path.join(__dirname, 'dados');
const ARQ_ESTADO = path.join(DADOS, 'estado.json');
const ARQ_USADOS = path.join(DADOS, 'usados.json');
const ARQ_HISTORICO = path.join(DADOS, 'historico.json');
fs.mkdirSync(DADOS, { recursive: true });

const ler = (arq, padrao) => { try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return padrao; } };
const gravar = (arq, dados) => fs.writeFileSync(arq, JSON.stringify(dados, null, 2));
const registrar = (t) => console.log(new Date().toLocaleString('pt-BR'), t);

// ---------- Achar e preparar um vídeo (perfis do TikTok) ----------
const { spawn } = require('child_process');
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';

function ytdlp(args, cwd, timeoutMin = 5) {
  return new Promise((resolve, reject) => {
    const p = spawn(YTDLP, args, { cwd, windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err = (err + d).slice(-2000); });
    const t = setTimeout(() => { p.kill('SIGKILL'); reject(new Error('yt-dlp demorou demais')); }, timeoutMin * 60000);
    p.on('error', (e) => { clearTimeout(t); reject(new Error(e.code === 'ENOENT' ? 'yt-dlp não está instalado (YTDLP_PATH no .env)' : e.message)); });
    p.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) resolve(out);
      else reject(new Error('yt-dlp: ' + (err.trim().split('\n').pop() || 'código ' + code)));
    });
  });
}

// Lista os vídeos recentes de cada perfil e devolve os que ainda não usou, mais vistos primeiro
async function candidatos() {
  const usados = new Set(ler(ARQ_USADOS, []));
  const proibidas = config.palavrasProibidas.map((p) => p.toLowerCase());
  const todos = [];
  for (const perfil of config.tiktokPerfis) {
    const nome = perfil.replace(/^@/, '');
    try {
      const out = await ytdlp(['--flat-playlist', '--no-warnings', '-I', `1:${config.videosPorPerfil}`,
        '--print', '%(id)s\t%(view_count)s\t%(duration)s\t%(title).200s', `https://www.tiktok.com/@${nome}`]);
      for (const linha of out.trim().split('\n').filter(Boolean)) {
        const [id, views, dur, titulo = ''] = linha.split('\t');
        todos.push({
          id: 'tt-' + id, perfil: nome, views: Number(views) || 0, duracao: Number(dur) || 0, titulo,
          url: `https://www.tiktok.com/@${nome}/video/${id}`,
        });
      }
    } catch (e) {
      registrar(`Perfil @${nome}: ${e.message}`);
    }
  }
  return todos
    .filter((v) => !usados.has(v.id))
    .filter((v) => v.views >= config.minimoVisualizacoes)
    .filter((v) => !v.duracao || (v.duracao >= config.duracaoMinima && v.duracao <= config.duracaoMaxima))
    .filter((v) => !proibidas.some((p) => v.titulo.toLowerCase().includes(p)))
    .sort((a, b) => b.views - a.views);
}

// Prepara 1 vídeo na pasta indicada. Devolve { midia, arquivo } ou lança erro.
async function preparar(pasta) {
  const lista = await candidatos();
  if (!lista.length) throw new Error('nenhum vídeo novo nos perfis do TikTok (adicione perfis ou baixe minimoVisualizacoes)');
  for (const m of lista.slice(0, 6)) {
    try {
      fs.rmSync(pasta, { recursive: true, force: true });
      fs.mkdirSync(pasta, { recursive: true });
      await ytdlp(['--no-playlist', '--no-warnings', '--no-progress',
        '-f', 'b[ext=mp4][vcodec^=avc]/b[ext=mp4]/bv*+ba/b', '--merge-output-format', 'mp4',
        '-o', 'orig.mp4', m.url], pasta);
      const d = await duracao(path.join(pasta, 'orig.mp4'));
      if (d < config.duracaoMinima || d > config.duracaoMaxima) {
        marcarUsado(m.id); // não serve: não tenta de novo
        continue;
      }
      registrar(`Editando ${m.url} (${m.views} visualizações, ${Math.round(d)}s)...`);
      if (!conta) conta = await ig.minhaConta().catch(() => null);
      const headline = headlineDoTitulo(m.titulo);
      const arquivo = await editar(pasta, {
        nome: config.marca.nome,
        usuario: config.marca.usuario || (conta && conta.username) || 'rota.achadinhos',
        verificado: config.marca.verificado,
        headline,
        duracaoMaxima: config.duracaoMaxima,
      });
      m.headline = headline;
      gravar(path.join(pasta, 'midia.json'), { ...m, permalink: m.url });
      return { midia: { ...m, permalink: m.url, like_count: m.views }, arquivo };
    } catch (e) {
      registrar(`Pulando ${m.url}: ${e.message}`);
      marcarUsado(m.id);
    }
  }
  throw new Error('não consegui preparar nenhum dos vídeos encontrados');
}

function marcarUsado(id) {
  const u = ler(ARQ_USADOS, []);
  u.push(id);
  gravar(ARQ_USADOS, u.slice(-3000));
}

// ---------- Horários ----------

function estadoDeHoje() {
  const dia = new Date().toDateString();
  const e = ler(ARQ_ESTADO, {});
  if (e.dia === dia) return e;
  fs.rmSync(path.join(DADOS, 'hoje'), { recursive: true, force: true }); // dia novo: limpa os de ontem
  const novo = { dia, preparados: {}, postados: [], tentativas: {} };
  gravar(ARQ_ESTADO, novo);
  return novo;
}

let conta = null;
let ocupado = false;
const LIGOU_EM = Date.now();

async function tick() {
  if (ocupado) return;
  ocupado = true;
  try {
    const agora = new Date();
    const hora = agora.getHours();
    const est = estadoDeHoje();
    const pasta = (h) => path.join(DADOS, 'hoje', String(h));

    // 1) Prepara o vídeo do próximo horário a partir de 45 min antes
    const proximo = config.horarios.find((h) => !est.postados.includes(h) &&
      (h === hora || (h === hora + 1 && agora.getMinutes() >= 15)));
    est.tentativas = est.tentativas || {};
    const tentouHaPouco = Date.now() - (est.tentativas[proximo] || 0) < 10 * 60 * 1000;
    if (proximo !== undefined && !est.preparados[proximo] && !tentouHaPouco) {
      est.tentativas[proximo] = Date.now();
      gravar(ARQ_ESTADO, est);
      try {
        registrar(`Preparando o vídeo das ${proximo}h...`);
        const { midia } = await preparar(pasta(proximo));
        est.preparados[proximo] = midia.id;
        gravar(ARQ_ESTADO, est);
        registrar(`Vídeo das ${proximo}h pronto.`);
      } catch (e) {
        registrar(`Não consegui preparar o vídeo das ${proximo}h: ${e.message}`);
      }
    }

    // 2) Na hora marcada, posta (nunca nos 10 primeiros minutos depois de ligar)
    if (config.horarios.includes(hora) && !est.postados.includes(hora) && est.preparados[hora]) {
      if (!config.ativo) return; // desligado: prepara mas não posta
      if (Date.now() - LIGOU_EM < 10 * 60 * 1000) return;
      const arquivo = path.join(pasta(hora), 'final.mp4');
      const midia = ler(path.join(pasta(hora), 'midia.json'), {});
      const legenda = config.legenda.replace(/\{conta\}/g, conta ? '@' + conta.username : 'a gente');
      registrar(`Postando o vídeo das ${hora}h...`);
      est.postados.push(hora); // marca antes: se der erro no meio, não posta duas vezes
      gravar(ARQ_ESTADO, est);
      try {
        const pub = await ig.postarReels(arquivo, legenda, registrar);
        marcarUsado(midia.id);
        const hist = ler(ARQ_HISTORICO, []);
        hist.push({ quando: new Date().toISOString(), hora, original: midia.permalink, post: pub.permalink });
        gravar(ARQ_HISTORICO, hist.slice(-500));
        fs.rmSync(pasta(hora), { recursive: true, force: true });
        registrar(`Postado no Instagram: ${pub.permalink || pub.id}`);
      } catch (e) {
        registrar(`Falha ao postar o vídeo das ${hora}h: ${e.message}`);
      }
    }
  } finally {
    ocupado = false;
  }
}

// ---------- Token ----------
async function cuidarDoToken() {
  try {
    const dias = await ig.diasParaVencer();
    if (dias === null) return registrar('Aviso: sem FB_APP_ID/FB_APP_SECRET no .env, não consigo renovar o token sozinho.');
    if (dias > 15) return;
    registrar(`O token vence em ${Math.floor(dias)} dias. Renovando...`);
    const novo = await ig.renovarToken();
    const env = path.join(__dirname, '.env');
    fs.writeFileSync(env, fs.readFileSync(env, 'utf8').replace(/^IG_TOKEN=.*$/m, 'IG_TOKEN=' + novo));
    process.env.IG_TOKEN = novo;
    registrar('Token renovado.');
  } catch (e) {
    registrar('Não consegui conferir/renovar o token: ' + e.message);
  }
}

// ---------- Início ----------
async function iniciar() {
  const modo = process.argv[2];
  if (modo === 'conta') {
    console.log(await ig.minhaConta());
    return;
  }
  if (modo === 'teste') {
    const pasta = path.join(DADOS, 'teste');
    const { midia, arquivo } = await preparar(pasta);
    console.log('\nVídeo de teste pronto (NÃO foi postado):', arquivo);
    console.log('Original:', midia.permalink, `(${midia.views} visualizações)`);
    return;
  }
  conta = await ig.minhaConta();
  registrar(`Robô do Instagram ligado na conta @${conta.username}. ` +
    `${config.ativo ? 'Posta' : 'DESLIGADO (só prepara)'} às ${config.horarios.join('h, ')}h.`);
  await cuidarDoToken();
  setInterval(cuidarDoToken, 24 * 3600 * 1000);
  setInterval(() => tick().catch((e) => registrar('Erro: ' + e.message)), 60 * 1000);
  tick().catch((e) => registrar('Erro: ' + e.message));
}

iniciar().catch((e) => {
  registrar('Erro ao ligar: ' + e.message);
  process.exit(1);
});
