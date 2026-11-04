require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const config = require('./config');
const fila = require('./fila');
const { buscarOfertas } = require('./shopee');
const { iniciarPainel } = require('./painel');

const DONO = (process.env.DONO || '').replace(/\D/g, '');
const reais = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Tudo o que o painel mostra
const estado = {
  whatsapp: 'iniciando', // iniciando | qr | conectando | conectado | desconectado
  qr: null,
  numero: null,
  grupoEncontrado: false,
  grupos: [],
  buscandoShopee: false,
  temChavesShopee: Boolean(process.env.SHOPEE_APP_ID && process.env.SHOPEE_SECRET),
  proximoEnvio: null,
  enviadasHoje: 0,
  log: [],
  noServidor: 'pm_id' in process.env, // rodando pelo pm2 (servidor 24h)
};

function registrar(texto) {
  const item = { hora: new Date().toLocaleTimeString('pt-BR'), texto };
  estado.log.unshift(item);
  if (estado.log.length > 200) estado.log.length = 200;
  console.log(item.hora, texto);
}

const puppeteer = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
puppeteer.executablePath = acharNavegador();

// Usa o navegador baixado pelo robô; se não existir, usa o Chrome/Edge do computador
function acharNavegador() {
  const fs = require('fs');
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    const proprio = require('puppeteer').executablePath();
    if (proprio && fs.existsSync(proprio)) return undefined; // usa o padrão
  } catch {}
  const candidatos = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  const achado = candidatos.find((c) => { try { return fs.existsSync(c); } catch { return false; } });
  if (achado) console.log('Usando o navegador:', achado);
  return achado;
}

const client = new Client({
  authStrategy: new LocalAuth(), // salva o login, só precisa ler o QR uma vez
  puppeteer,
});

let grupo = null;

// ---------- Conexão com o WhatsApp ----------

client.on('qr', async (qr) => {
  estado.whatsapp = 'qr';
  estado.qr = await QRCode.toDataURL(qr, { margin: 1, width: 280 });
  registrar('Aguardando leitura do QR Code.');
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('authenticated', () => {
  estado.whatsapp = 'conectando';
  estado.qr = null;
  registrar('QR Code lido! Carregando conversas...');
});

client.on('ready', async () => {
  estado.whatsapp = 'conectado';
  estado.numero = client.info?.wid?.user || null;
  registrar('WhatsApp conectado.');
  await acharGrupo();
});

client.on('disconnected', async (motivo) => {
  estado.whatsapp = 'desconectado';
  estado.numero = null;
  grupo = null;
  estado.grupoEncontrado = false;
  registrar('WhatsApp desconectado (' + motivo + '). Reiniciando para gerar novo QR Code...');
  try { await client.destroy(); } catch {}
  setTimeout(iniciarWhatsApp, 3000);
});

// Liga o WhatsApp; se der erro, espera e tenta de novo sozinho
let tentativas = 0;
async function iniciarWhatsApp() {
  tentativas++;
  registrar(tentativas === 1 ? 'Iniciando o WhatsApp...' : `Tentando conectar de novo (tentativa ${tentativas})...`);
  try {
    await client.initialize();
    tentativas = 0;
  } catch (e) {
    registrar('Erro ao iniciar o WhatsApp: ' + e.message);
    try { await client.destroy(); } catch {}
    const espera = Math.min(60, 10 * tentativas); // 10s, 20s, ... até 60s
    registrar(`Vou tentar de novo em ${espera} segundos.`);
    setTimeout(iniciarWhatsApp, espera * 1000);
  }
}

async function acharGrupo() {
  if (estado.whatsapp !== 'conectado') return null;
  const chats = await client.getChats();
  const grupos = chats.filter((c) => c.isGroup);
  estado.grupos = grupos.map((c) => c.name).sort();
  grupo = grupos.find((c) => c.name === config.nomeDoGrupo) || null;
  estado.grupoEncontrado = Boolean(grupo);
  if (grupo) registrar(`Grupo "${config.nomeDoGrupo}" encontrado.`);
  else registrar(`Grupo "${config.nomeDoGrupo}" NÃO encontrado. Escolha o grupo nas configurações.`);
  return grupo;
}

// ---------- Relógio: roda a cada 30 segundos ----------

let ultimoDiaBusca = null;
let diaContagem = new Date().toDateString();

setInterval(tick, 30 * 1000);

async function tick() {
  if (estado.whatsapp !== 'conectado') return;
  const agora = new Date();
  const hoje = agora.toDateString();

  if (diaContagem !== hoje) { diaContagem = hoje; estado.enviadasHoje = 0; }

  if (ultimoDiaBusca !== hoje && agora.getHours() >= config.horaInicio - 1) {
    ultimoDiaBusca = hoje;
    await atualizarShopee();
  }

  const dentroDoHorario = agora.getHours() >= config.horaInicio && agora.getHours() < config.horaFim;
  if (!config.enviosAtivos || !dentroDoHorario) { estado.proximoEnvio = null; return; }

  if (!estado.proximoEnvio) estado.proximoEnvio = Date.now();
  if (Date.now() < estado.proximoEnvio) return;

  estado.proximoEnvio = Date.now() + config.intervaloMinutos * 60 * 1000;
  if (fila.tamanho() > 0) await enviarProxima();
}

// ---------- Shopee ----------

async function atualizarShopee() {
  if (!estado.temChavesShopee) {
    registrar('Sem chaves da Shopee no .env: usando só as ofertas do Mercado Livre.');
    return;
  }
  if (estado.buscandoShopee) return;
  estado.buscandoShopee = true;
  try {
    registrar('Buscando ofertas na Shopee...');
    fila.limparShopee(); // troca as antigas pelas novas
    const ofertas = await buscarOfertas(fila.idsEnviados());
    fila.adicionarNoFim(ofertas);
    registrar(`${ofertas.length} ofertas da Shopee colocadas na fila.`);
  } catch (erro) {
    registrar('Erro ao buscar na Shopee: ' + erro.message);
  } finally {
    estado.buscandoShopee = false;
  }
}

// ---------- Envio ----------

function montarTexto(o) {
  if (o.loja === 'Mercado Livre') {
    return `🛍️ *${o.titulo}*\n\n🛒 Mercado Livre\n👉 ${o.link}`;
  }
  return (
    `🌸 *${o.titulo}*\n\n` +
    `~De ${reais(o.precoAntes)}~\n` +
    `🔥 *Por ${reais(o.preco)}* (${o.desconto}% OFF)\n\n` +
    `🛒 Shopee\n👉 ${o.link}`
  );
}

let enviando = false;

// Envia a primeira da fila (ou a de um id específico). Devolve { ok, erro }
async function enviarProxima(id) {
  if (enviando) return { ok: false, erro: 'Já estou enviando uma oferta, aguarde.' };
  if (estado.whatsapp !== 'conectado') return { ok: false, erro: 'WhatsApp não está conectado.' };
  if (!grupo && !(await acharGrupo())) return { ok: false, erro: 'Grupo não encontrado.' };

  const oferta = id ? fila.tirarPorId(id) : fila.tirarPrimeira();
  if (!oferta) return { ok: false, erro: 'A fila está vazia.' };

  enviando = true;
  const texto = montarTexto(oferta);
  try {
    try {
      if (!oferta.foto) throw new Error('sem foto');
      const foto = await MessageMedia.fromUrl(oferta.foto, { unsafeMime: true });
      await grupo.sendMessage(foto, { caption: texto });
    } catch {
      await grupo.sendMessage(texto); // sem foto
    }
    fila.marcarEnviado(oferta.id);
    estado.enviadasHoje++;
    registrar('Enviada no grupo: ' + oferta.titulo);
    return { ok: true };
  } catch (erro) {
    fila.adicionarNaFrente(oferta); // devolve pra fila
    registrar('Falha ao enviar: ' + erro.message);
    return { ok: false, erro: erro.message };
  } finally {
    enviando = false;
  }
}

function adicionarML(titulo, link) {
  titulo = String(titulo || '').trim();
  link = String(link || '').trim();
  if (!titulo || !/^https?:\/\//.test(link)) {
    return { ok: false, erro: 'Preencha o texto e um link que comece com http.' };
  }
  fila.adicionarNaFrente({ id: 'ml-' + Date.now(), loja: 'Mercado Livre', titulo, link });
  registrar('Oferta do Mercado Livre adicionada: ' + titulo);
  return { ok: true };
}

async function mensagensDoGrupo() {
  if (!grupo) return [];
  const msgs = await grupo.fetchMessages({ limit: 25 });
  return msgs.map((m) => ({
    hora: new Date(m.timestamp * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    texto: m.body || (m.hasMedia ? '[imagem]' : '[mensagem]'),
    doRobo: m.fromMe,
  }));
}

// ---------- Comandos pelo WhatsApp (só o número DONO) ----------
//   ml Sérum Vitamina C de R$89 por R$49 | https://meli.la/xxxx
//   fila
//   agora
client.on('message', async (msg) => {
  if (msg.from.endsWith('@g.us')) return; // ignora mensagens de grupos
  const contato = await msg.getContact();
  if (!DONO || contato.number !== DONO) return;

  const texto = msg.body.trim();

  if (/^ml\s/i.test(texto)) {
    const [titulo, link] = texto.slice(3).split('|');
    const r = adicionarML(titulo, link);
    return msg.reply(r.ok ? `✅ Adicionada na frente da fila. Fila: ${fila.tamanho()}` : '❌ ' + r.erro);
  }
  if (/^fila$/i.test(texto)) return msg.reply(`📋 Ofertas na fila: ${fila.tamanho()}`);
  if (/^agora$/i.test(texto)) {
    const r = await enviarProxima();
    return msg.reply(r.ok ? '📤 Enviei a próxima oferta.' : '❌ ' + r.erro);
  }
});

// ---------- Liga tudo ----------

iniciarPainel({
  estado,
  config,
  fila,
  enviarProxima,
  adicionarML,
  atualizarShopee,
  acharGrupo,
  mensagensDoGrupo,
  registrar,
  desconectar: () => client.logout(),
  desligar: async () => {
    registrar('Desligando o robô a pedido do painel...');
    try { await client.destroy(); } catch {}
    process.exit(0);
  },
});

iniciarWhatsApp();
