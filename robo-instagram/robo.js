// Robô do Instagram: 3x por dia acha um Reels de produto por hashtag, coloca no nosso
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

const DADOS = path.join(__dirname, 'dados');
const ARQ_ESTADO = path.join(DADOS, 'estado.json');
const ARQ_USADOS = path.join(DADOS, 'usados.json');
const ARQ_HASHTAGS = path.join(DADOS, 'hashtags.json');
const ARQ_HISTORICO = path.join(DADOS, 'historico.json');
fs.mkdirSync(DADOS, { recursive: true });

const ler = (arq, padrao) => { try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return padrao; } };
const gravar = (arq, dados) => fs.writeFileSync(arq, JSON.stringify(dados, null, 2));
const registrar = (t) => console.log(new Date().toLocaleString('pt-BR'), t);

// ---------- Achar e preparar um vídeo ----------

async function candidatos() {
  const cache = ler(ARQ_HASHTAGS, {});
  const usados = new Set(ler(ARQ_USADOS, []));
  const proibidas = config.palavrasProibidas.map((p) => p.toLowerCase());
  const todos = new Map();
  for (const tag of config.hashtags) {
    try {
      const id = await ig.idDaHashtag(tag, cache);
      for (const m of await ig.videosDaHashtag(id)) todos.set(m.id, m);
    } catch (e) {
      registrar(`Hashtag #${tag}: ${e.message}`);
    }
  }
  gravar(ARQ_HASHTAGS, cache);
  return [...todos.values()]
    .filter((m) => !usados.has(m.id))
    .filter((m) => (m.like_count || 0) >= config.minimoCurtidas)
    .filter((m) => !proibidas.some((p) => (m.caption || '').toLowerCase().includes(p)))
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
}

async function baixar(url, destino) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('download falhou (' + r.status + ')');
  fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

// Prepara 1 vídeo na pasta indicada. Devolve { midia, arquivo } ou lança erro.
async function preparar(pasta) {
  const lista = await candidatos();
  if (!lista.length) throw new Error('nenhum Reels novo encontrado nas hashtags (tente outras hashtags ou baixe minimoCurtidas)');
  for (const m of lista.slice(0, 6)) {
    try {
      fs.rmSync(pasta, { recursive: true, force: true });
      fs.mkdirSync(pasta, { recursive: true });
      await baixar(m.media_url, path.join(pasta, 'orig.mp4'));
      const d = await duracao(path.join(pasta, 'orig.mp4'));
      if (d < config.duracaoMinima || d > config.duracaoMaxima) {
        marcarUsado(m.id); // não serve: não tenta de novo
        continue;
      }
      registrar(`Editando Reels ${m.permalink} (${m.like_count} curtidas, ${Math.round(d)}s)...`);
      const arquivo = await editar(pasta, { ...config.marca, duracaoMaxima: config.duracaoMaxima });
      gravar(path.join(pasta, 'midia.json'), m);
      return { midia: m, arquivo };
    } catch (e) {
      registrar(`Pulando ${m.permalink}: ${e.message}`);
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
    console.log('Original:', midia.permalink, `(${midia.like_count} curtidas)`);
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
