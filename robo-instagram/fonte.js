// De onde vêm os vídeos: perfis do TikTok (yt-dlp). Acha, baixa e coloca no layout.
const fs = require('fs');
const path = require('path');
const config = require('./config');
const ig = require('./ig');
const { editar, duracao } = require('./editar');
const { headlineDoTitulo } = require('./cabecalho');

const DADOS = path.join(__dirname, 'dados');
const ARQ_USADOS = path.join(DADOS, 'usados.json');
fs.mkdirSync(DADOS, { recursive: true });
const ler = (arq, padrao) => { try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return padrao; } };
const gravar = (arq, dados) => fs.writeFileSync(arq, JSON.stringify(dados, null, 2));
const registrar = (t) => console.log(new Date().toLocaleString('pt-BR'), t);
let conta = null;

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
// evitar: ids de vídeos que já estão em outros posts da fila
async function candidatos(evitar = []) {
  const usados = new Set([...ler(ARQ_USADOS, []), ...evitar]);
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

// Embaralha só os 5 melhores, para não pegar sempre o mesmo perfil/vídeo
function variar(lista) {
  const topo = lista.slice(0, 5);
  for (let i = topo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topo[i], topo[j]] = [topo[j], topo[i]];
  }
  return [...topo, ...lista.slice(5)];
}

// Prepara 1 vídeo na pasta indicada. Devolve { midia, arquivo } ou lança erro.
// headlineFixa: usa essa headline em vez da tirada da legenda do TikTok
async function preparar(pasta, headlineFixa, evitar = []) {
  const lista = variar(await candidatos(evitar));
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
      const headline = headlineFixa || headlineDoTitulo(m.titulo);
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


// Refaz só a edição (ex.: headline nova) com o vídeo que já foi baixado
async function reeditar(pasta, midia, headline) {
  if (!conta) conta = await ig.minhaConta().catch(() => null);
  await editar(pasta, {
    nome: config.marca.nome,
    usuario: config.marca.usuario || (conta && conta.username) || 'rota.achadinhos',
    verificado: config.marca.verificado,
    headline,
    duracaoMaxima: config.duracaoMaxima,
  });
  gravar(path.join(pasta, 'midia.json'), { ...midia, headline });
}

module.exports = { preparar, reeditar, marcarUsado };
