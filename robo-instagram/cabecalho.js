// Gera a parte de cima do vídeo como imagem (estilo post de perfil):
// foto redonda, nome + selo, @usuario e a headline com emoji.
// Usa o Google Chrome do computador (puppeteer-core) para escrever com fonte e emoji de verdade.
const fs = require('fs');
const path = require('path');

const MARCA = path.join(__dirname, 'marca');

function acharChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const achado = candidatos.find((c) => { try { return fs.existsSync(c); } catch { return false; } });
  if (!achado) throw new Error('Google Chrome não encontrado (CHROME_PATH no .env)');
  return achado;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataUrl = (arq, tipo) => `data:${tipo};base64,${fs.readFileSync(arq).toString('base64')}`;

// Selo azul genérico (círculo com ✓)
const SELO = `<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
  <circle cx="12" cy="12" r="11" fill="#1d9bf0"/>
  <path d="M7 12.4l3.2 3.1L17.2 8.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function html({ nome, usuario, headline, verificado }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Inter'; src: url('${dataUrl(path.join(MARCA, 'inter.ttf'), 'font/ttf')}'); font-weight: 100 900; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; background: #fff; }
  body { font-family: 'Inter', 'Apple Color Emoji', 'Noto Color Emoji', 'Segoe UI Emoji', sans-serif; color: #0f1419; }
  #topo { padding: 150px 60px 40px; }
  .perfil { display: flex; align-items: center; gap: 26px; }
  .foto { width: 124px; height: 124px; border-radius: 50%; object-fit: cover; flex: none; }
  .nome { font-size: 46px; font-weight: 700; display: flex; align-items: center; gap: 10px; letter-spacing: -0.5px; }
  .usuario { font-size: 36px; color: #536471; margin-top: 4px; }
  .headline { font-size: 54px; line-height: 1.28; font-weight: 500; margin-top: 34px; letter-spacing: -0.3px; }
  </style></head><body><div id="topo">
    <div class="perfil">
      <img class="foto" src="${dataUrl(path.join(MARCA, 'logo.png'), 'image/png')}">
      <div><div class="nome">${esc(nome)}${verificado ? SELO : ''}</div>
      <div class="usuario">@${esc(usuario)}</div></div>
    </div>
    <div class="headline">${esc(headline)}</div>
  </div></body></html>`;
}

// Salva a imagem e devolve a altura (par, para o ffmpeg)
async function gerarCabecalho(dados, saida) {
  const puppeteer = require('puppeteer-core');
  const navegador = await puppeteer.launch({
    executablePath: acharChrome(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 1080, height: 800 });
    await pagina.setContent(html(dados), { waitUntil: 'load' });
    await pagina.evaluate(() => document.fonts.ready);
    const caixa = await (await pagina.$('#topo')).boundingBox();
    const altura = Math.min(900, Math.ceil(caixa.height / 2) * 2);
    await pagina.screenshot({ path: saida, clip: { x: 0, y: 0, width: 1080, height: altura } });
    return altura;
  } finally {
    await navegador.close();
  }
}

// ---------- Headline a partir da legenda do TikTok ----------
const RESERVAS = [
  'Achei esse achadinho e não consigo parar de usar 😍',
  'Esse achadinho é muito mais útil do que parece ✨',
  'Olha que ideia genial esse achadinho 🤩',
  'Gente, eu precisava mostrar esse achadinho pra vocês 😱',
  'Esse aqui virou meu achadinho favorito 💕',
];
const EMOJIS = ['😍', '🤩', '✨', '😱', '💕', '🔥'];
const TEM_EMOJI = /\p{Extended_Pictographic}/u;

function headlineDoTitulo(titulo) {
  let t = String(titulo || '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#@][\p{L}\p{N}_.]+/gu, ' ')
    .replace(/link na (bio|descri[cç][aã]o)/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,!|:-]+|[\s.,|:-]+$/g, '')
    .trim();
  const letras = (t.match(/\p{L}/gu) || []).length;
  if (letras < 15) return RESERVAS[Math.floor(Math.random() * RESERVAS.length)];
  if (t.length > 110) t = t.slice(0, 110).replace(/\s+\S*$/, '') + '…';
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!TEM_EMOJI.test(t)) t += ' ' + EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  return t;
}

module.exports = { gerarCabecalho, headlineDoTitulo };
