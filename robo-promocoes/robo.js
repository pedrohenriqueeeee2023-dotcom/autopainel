require('dotenv').config();
require('./corrigir-wwebjs'); // corrige o envio de fotos antes de carregar a biblioteca
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const config = require('./config');
const fila = require('./fila');
const { buscarOfertas } = require('./shopee');
const ml = require('./mercadolivre');
const { temPalavraProibida } = require('./filtros');
const { iniciarPainel } = require('./painel');

const DONO = (process.env.DONO || '').replace(/\D/g, '');
const reais = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Tudo o que o painel mostra
const estado = {
  whatsapp: 'iniciando', // iniciando | qr | conectando | conectado | desconectado
  qr: null,
  codigo: null, // código de conexão pelo número
  numero: null,
  grupoEncontrado: false,
  grupos: [],
  buscandoShopee: false,
  temChavesShopee: Boolean(process.env.SHOPEE_APP_ID && process.env.SHOPEE_SECRET),
  temChavesML: ml.temChaves(),
  buscandoML: false,
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

// Flags para o Chrome gastar menos processador/memória (o servidor é dividido com outros sistemas)
const puppeteer = {
  args: [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--disable-extensions', '--mute-audio', '--no-first-run', '--disable-background-networking',
  ],
  protocolTimeout: 120000, // servidor ocupado: dá mais tempo antes de considerar que travou
};
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

let ultimoQr = 0;
client.on('qr', async (qr) => {
  ultimoQr = Date.now();
  estado.whatsapp = 'qr';
  estado.qr = await QRCode.toDataURL(qr, { margin: 1, width: 280 });
  registrar('Aguardando leitura do QR Code.');
  qrcodeTerminal.generate(qr, { small: true });
});

// Código de 8 letras (conectar pelo número, sem QR). O WhatsApp troca a cada ~3 min.
client.on('code', (codigo) => {
  estado.codigo = codigo;
});

async function pedirCodigo(numero) {
  if (estado.whatsapp !== 'qr') {
    throw new Error(estado.whatsapp === 'conectado'
      ? 'O robô já está conectado a um WhatsApp.'
      : 'O robô ainda está ligando o WhatsApp. Espere uns segundos e tente de novo.');
  }
  let n = String(numero || '').replace(/\D/g, '');
  if (n.length === 10 || n.length === 11) n = '55' + n; // digitou só DDD + número
  if (n.length < 12 || n.length > 13) throw new Error('Digite o número com DDD, por exemplo (11) 98765-4321.');
  registrar('Gerando código de conexão pelo número...');
  estado.codigo = await client.requestPairingCode(n);
  return estado.codigo;
}

client.on('authenticated', () => {
  estado.whatsapp = 'conectando';
  estado.qr = null;
  estado.codigo = null;
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

// Erros que querem dizer "a página do WhatsApp Web recarregou e o robô perdeu
// o controle dela". Continuar tentando não adianta: só reiniciando.
const PAGINA_QUEBRADA = /detached Frame|Session closed|Target closed|Execution context was destroyed/i;
let reiniciando = false;
function verificarPaginaQuebrada(erro) {
  const msg = (erro && erro.message) || String(erro);
  if (!PAGINA_QUEBRADA.test(msg) || reiniciando) return false;
  reiniciando = true;
  estado.whatsapp = 'iniciando';
  registrar('A página do WhatsApp travou. Reiniciando para reconectar (o login continua salvo)...');
  if (estado.noServidor) {
    setTimeout(() => process.exit(1), 1500); // o pm2 liga de novo na hora
  } else {
    (async () => {
      try { await client.destroy(); } catch {}
      reiniciando = false;
      tentativas = 0;
      setTimeout(iniciarWhatsApp, 3000);
    })();
  }
  return true;
}

// A cada minuto confere se a página do WhatsApp ainda responde.
// Assim o robô se recupera sozinho antes da hora de enviar.
// Quando o servidor está ocupado a página pode demorar a responder sem estar travada,
// então só reinicia depois de 3 falhas seguidas (≈3 min), e nunca logo depois de ligar.
let falhasSeguidas = 0;
let iniciouEm = Date.now();
setInterval(async () => {
  if (reiniciando) return;
  // Preso ligando (sem QR e sem conectar) por mais de 5 min
  if (estado.whatsapp === 'iniciando' && Date.now() - iniciouEm > 5 * 60 * 1000) {
    verificarPaginaQuebrada(new Error('Session closed: o WhatsApp não terminou de ligar'));
    return;
  }
  // QR Code parado há mais de 3 min = página travada (o WhatsApp troca o QR a cada ~20s)
  if (estado.whatsapp === 'qr' && ultimoQr && Date.now() - ultimoQr > 3 * 60 * 1000) {
    verificarPaginaQuebrada(new Error('Session closed: o QR Code parou de atualizar'));
    return;
  }
  if (estado.whatsapp !== 'conectado' || !client.pupPage) { falhasSeguidas = 0; return; }
  try {
    await Promise.race([
      client.pupPage.evaluate(() => Boolean(window.WWebJS)),
      new Promise((_, falhar) => setTimeout(() => falhar(new Error('sem resposta')), 45000)),
    ]);
    falhasSeguidas = 0;
  } catch (erro) {
    const msg = (erro && erro.message) || '';
    // página realmente quebrada: reinicia na hora; só lenta: espera repetir
    if (PAGINA_QUEBRADA.test(msg)) { verificarPaginaQuebrada(erro); return; }
    falhasSeguidas++;
    if (falhasSeguidas >= 3) verificarPaginaQuebrada(new Error('Session closed: página parou de responder'));
  }
}, 60 * 1000);

// Liga o WhatsApp; se der erro, espera e tenta de novo sozinho
let tentativas = 0;
async function iniciarWhatsApp() {
  tentativas++;
  iniciouEm = Date.now();
  registrar(tentativas === 1 ? 'Iniciando o WhatsApp...' : `Tentando conectar de novo (tentativa ${tentativas})...`);
  try {
    await client.initialize();
    tentativas = 0;
  } catch (e) {
    registrar('Erro ao iniciar o WhatsApp: ' + e.message);
    if (estado.noServidor) {
      // No servidor é mais seguro começar do zero: o pm2 liga o robô de novo
      registrar('Reiniciando o robô em 10 segundos para tentar de novo do zero...');
      setTimeout(() => process.exit(1), 10000);
      return;
    }
    try { await client.destroy(); } catch {}
    const espera = Math.min(60, 10 * tentativas); // 10s, 20s, ... até 60s
    registrar(`Vou tentar de novo em ${espera} segundos.`);
    setTimeout(iniciarWhatsApp, espera * 1000);
  }
}

// Logo depois de conectar o WhatsApp Web ainda está carregando as conversas,
// então tenta algumas vezes antes de desistir (e nunca derruba o robô).
async function acharGrupo() {
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    if (estado.whatsapp !== 'conectado') return null;
    try {
      return await procurarGrupo();
    } catch (e) {
      if (tentativa === 6) {
        registrar('Não consegui ler os grupos agora (' + (e.message || e) + '). Use "Procurar grupo de novo" no painel.');
        return null;
      }
      await new Promise((r) => setTimeout(r, 5000 * tentativa));
    }
  }
  return null;
}

// Lista os grupos direto do WhatsApp Web, só com id e nome.
// (O client.getChats() da biblioteca quebra em algumas versões do WhatsApp
// porque tenta carregar os detalhes de todos os grupos de uma vez.)
async function listarGrupos() {
  const lista = await client.pupPage.evaluate(() => {
    const chats = window.require('WAWebCollections').Chat.getModelsArray();
    return chats
      .filter((c) => c && c.id && c.id.server === 'g.us')
      .map((c) => ({
        id: c.id._serialized,
        name: c.formattedTitle || c.name || (c.groupMetadata && c.groupMetadata.subject) || '',
      }));
  });
  return lista.filter((g) => g.name);
}

// Um "grupo" simples: manda mensagem pelo id, sem precisar do objeto completo
function grupoPorId({ id, name }) {
  return {
    id,
    name,
    sendMessage: (conteudo, opcoes) => client.sendMessage(id, conteudo, opcoes),
    fetchMessages: async (opcoes) => (await client.getChatById(id)).fetchMessages(opcoes),
  };
}

async function procurarGrupo() {
  const grupos = await listarGrupos();
  if (!grupos.length) throw new Error('as conversas ainda não carregaram');
  estado.grupos = [...new Set(grupos.map((g) => g.name))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const achado = grupos.find((g) => g.name === config.nomeDoGrupo)
    || grupos.find((g) => g.name.trim().toLowerCase() === String(config.nomeDoGrupo).trim().toLowerCase());
  grupo = achado ? grupoPorId(achado) : null;
  estado.grupoEncontrado = Boolean(grupo);
  if (grupo) registrar(`Grupo "${config.nomeDoGrupo}" encontrado.`);
  else registrar(`Grupo "${config.nomeDoGrupo}" NÃO encontrado. Escolha o grupo nas configurações.`);
  return grupo;
}

// ---------- Relógio: roda a cada 30 segundos ----------

// Lembra o dia da última busca automática (em dados/), para um reinício não trocar
// a lista de ofertas que esperam link no meio do dia
const ARQ_ULTIMA_BUSCA = require('path').join(__dirname, 'dados', 'ultima-busca.txt');
let ultimoDiaBusca = null;
try { ultimoDiaBusca = require('fs').readFileSync(ARQ_ULTIMA_BUSCA, 'utf8').trim() || null; } catch {}
let diaContagem = new Date().toDateString();

setInterval(tick, 30 * 1000);

async function tick() {
  if (estado.whatsapp !== 'conectado') return;
  const agora = new Date();
  const hoje = agora.toDateString();

  if (diaContagem !== hoje) { diaContagem = hoje; estado.enviadasHoje = 0; }

  if (ultimoDiaBusca !== hoje && agora.getHours() >= config.horaInicio - 1) {
    ultimoDiaBusca = hoje;
    try { require('fs').writeFileSync(ARQ_ULTIMA_BUSCA, hoje); } catch {}
    await atualizarOfertas();
  }

  const dentroDoHorario = agora.getHours() >= config.horaInicio && agora.getHours() < config.horaFim;
  if (!config.enviosAtivos || !dentroDoHorario) { estado.proximoEnvio = null; return; }

  if (!estado.proximoEnvio) estado.proximoEnvio = calcularProximoEnvio();
  if (Date.now() < estado.proximoEnvio) return;

  estado.proximoEnvio = Date.now() + config.intervaloMinutos * 60 * 1000;
  if (fila.prontas(filtroDaVez()) > 0) await enviarProxima();
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

// ---------- Intervalo entre envios que sobrevive a reinícios ----------
// Antes, ao reiniciar, o robô mandava a próxima oferta na hora. Agora ele lembra do
// último envio (em dados/) e espera o intervalo; logo depois de ligar espera ainda
// pelo menos 5 minutos.
const ARQ_ULTIMO_ENVIO = require('path').join(__dirname, 'dados', 'ultimo-envio.txt');
const LIGOU_EM = Date.now();
function guardarUltimoEnvio() {
  try { require('fs').writeFileSync(ARQ_ULTIMO_ENVIO, String(Date.now())); } catch {}
}
function calcularProximoEnvio() {
  let ultimo = 0;
  try { ultimo = Number(require('fs').readFileSync(ARQ_ULTIMO_ENVIO, 'utf8')) || 0; } catch {}
  let proximo = ultimo ? ultimo + config.intervaloMinutos * 60 * 1000 : Date.now();
  if (Date.now() - LIGOU_EM < 10 * 60 * 1000) proximo = Math.max(proximo, LIGOU_EM + 5 * 60 * 1000);
  return Math.max(proximo, Date.now());
}

// ---------- Destaques: no máximo N por dia, em horários separados ----------
// Guarda em dados/ quantos destaques já foram hoje (para não repetir se o robô reiniciar)
const ARQ_DESTAQUES = require('path').join(__dirname, 'dados', 'destaques-hoje.json');
function destaquesHoje() {
  const dia = new Date().toDateString();
  try {
    const d = JSON.parse(require('fs').readFileSync(ARQ_DESTAQUES, 'utf8'));
    if (d.dia === dia) return d;
  } catch {}
  return { dia, enviados: 0 };
}
function marcarDestaqueEnviado() {
  const d = destaquesHoje();
  d.enviados++;
  try { require('fs').writeFileSync(ARQ_DESTAQUES, JSON.stringify(d)); } catch {}
}
// É hora de um destaque? (ainda não bateu o limite e já passou do próximo horário)
function horaDeDestaque() {
  if (!config.destaqueAtivo) return false;
  const { enviados } = destaquesHoje();
  const horarios = config.destaqueHorarios || [];
  if (enviados >= Math.min(config.destaquesPorDia || 0, horarios.length)) return false;
  return new Date().getHours() >= horarios[enviados];
}
// Qual tipo de oferta mandar agora: destaque (se for a hora e tiver um pronto) ou as normais
function filtroDaVez() {
  const soDestaque = (o) => Boolean(o.destaque);
  if (horaDeDestaque() && fila.prontas(soDestaque) > 0) return soDestaque;
  return (o) => !o.destaque;
}

// ---------- Mercado Livre automático ----------

async function atualizarML() {
  if (!config.mlAtivo) return;
  if (!estado.temChavesML) {
    registrar('Mercado Livre automático desligado: faltam as chaves do app ou os códigos de afiliado no .env.');
    return;
  }
  if (estado.buscandoML) return;
  estado.buscandoML = true;
  try {
    const tirados = fila.removerSe((o) => temPalavraProibida(o.titulo));
    if (tirados) registrar(`${tirados} ofertas tiradas da fila por terem palavra proibida no nome.`);
    registrar('Buscando ofertas no Mercado Livre...');
    fila.limparMLAutomatico(); // troca as que ainda esperam link pelas novas
    const pular = new Set([...fila.idsEnviados(), ...fila.ids()]); // não repete o que já foi ou já está na fila
    const ofertas = await ml.buscarOfertasML(pular, registrar);
    fila.adicionarNoFim(ofertas);
    registrar(`${ofertas.length} ofertas do Mercado Livre colocadas na fila.`);

    if (config.destaqueAtivo) {
      registrar('Buscando destaques (celulares, eletrodomésticos)...');
      for (const o of ofertas) pular.add(o.id);
      const destaques = await ml.buscarDestaquesML(pular, registrar);
      fila.adicionarNoFim(destaques);
      registrar(`${destaques.length} destaques colocados na fila (vão no máximo ${config.destaquesPorDia} por dia).`);
    }
  } catch (erro) {
    registrar('Erro ao buscar no Mercado Livre: ' + erro.message);
  } finally {
    estado.buscandoML = false;
  }
}

// Busca nas duas lojas (uma depois da outra)
async function atualizarOfertas() {
  await atualizarShopee();
  await atualizarML();
}

// ---------- Envio ----------

const EMOJI = process.env.EMOJI_OFERTA || '🌸'; // muda por grupo (ex.: 🔥 no After Dark)

function montarTexto(o) {
  // Oferta do ML colada à mão: só tem texto e link
  if (o.loja === 'Mercado Livre' && !o.preco && !o.automatica) {
    return `🛍️ *${o.titulo}*\n\n🛒 Mercado Livre\n👉 ${o.link}`;
  }
  let preco;
  if (!o.preco) preco = '👀 Veja o preço no link'; // o ML não mostra o preço de alguns nichos
  else if (o.desconto > 0 && o.precoAntes) preco = `~De ${reais(o.precoAntes)}~\n🔥 *Por ${reais(o.preco)}* (${o.desconto}% OFF)`;
  else preco = `💰 *${reais(o.preco)}*`;
  return `${EMOJI} *${o.titulo}*\n\n${preco}\n\n🛒 ${o.loja}\n👉 ${o.link}`;
}

let enviando = false;

// Envia a primeira da fila (ou a de um id específico). Devolve { ok, erro }
async function enviarProxima(id) {
  if (enviando) return { ok: false, erro: 'Já estou enviando uma oferta, aguarde.' };
  if (estado.whatsapp !== 'conectado') return { ok: false, erro: 'WhatsApp não está conectado.' };
  if (!grupo && !(await acharGrupo())) return { ok: false, erro: 'Grupo não encontrado.' };

  const oferta = id ? fila.tirarPorId(id) : fila.tirarPrimeira(filtroDaVez());
  if (!oferta) {
    return { ok: false, erro: fila.tamanho() ? 'Nenhuma oferta com link pronto. Cole os links do Gerador do ML no painel.' : 'A fila está vazia.' };
  }
  if (oferta.precisaLink) {
    fila.adicionarNaFrente(oferta);
    return { ok: false, erro: 'Essa oferta ainda não tem o link de afiliado do ML. Cole os links do Gerador primeiro.' };
  }

  enviando = true;
  const texto = montarTexto(oferta);
  try {
    try {
      if (!oferta.foto) throw new Error('a oferta não tem foto');
      const foto = await MessageMedia.fromUrl(oferta.foto, { unsafeMime: true });
      await grupo.sendMessage(foto, { caption: texto });
    } catch (erroFoto) {
      registrar('Foto não foi (' + ((erroFoto && erroFoto.message) || erroFoto) + '). Enviando só o texto.');
      await grupo.sendMessage(texto); // sem foto
    }
    fila.marcarEnviado(oferta.id);
    guardarUltimoEnvio();
    estado.enviadasHoje++;
    if (oferta.destaque) marcarDestaqueEnviado();
    registrar((oferta.destaque ? 'Destaque enviado no grupo: ' : 'Enviada no grupo: ') + oferta.titulo);
    return { ok: true };
  } catch (erro) {
    fila.adicionarNaFrente(oferta); // devolve pra fila
    registrar('Falha ao enviar: ' + erro.message);
    if (verificarPaginaQuebrada(erro)) {
      return { ok: false, erro: 'O WhatsApp travou e o robô está reconectando. Tente de novo em 1 minuto.' };
    }
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
  let msgs;
  try {
    msgs = await grupo.fetchMessages({ limit: 25 });
  } catch (e) {
    throw new Error('Não consegui ler a conversa agora (o envio de ofertas não é afetado).');
  }
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

// Diagnóstico: manda uma foto de teste para o PRÓPRIO número do robô (não vai para o grupo)
async function testarFoto(url) {
  if (estado.whatsapp !== 'conectado') throw new Error('WhatsApp não está conectado.');
  const eu = client.info && client.info.wid && client.info.wid._serialized;
  const foto = url || (fila.listar().find((o) => o.foto) || {}).foto;
  if (!eu || !foto) throw new Error('Sem número do robô ou sem foto para testar.');
  const resultado = { foto };
  try {
    const media = await MessageMedia.fromUrl(foto, { unsafeMime: true });
    resultado.baixou = `${media.mimetype}, ${Math.round(media.data.length / 1024)} KB`;
    await client.sendMessage(eu, media, { caption: 'Teste de foto do robô (pode apagar)' });
    resultado.enviou = true;
  } catch (e) {
    resultado.enviou = false;
    resultado.erro = (e && (e.stack || e.message)) || String(e);
  }
  return resultado;
}

// ---------- Liga tudo ----------

// Um erro inesperado vira aviso no painel em vez de desligar o robô
process.on('unhandledRejection', (erro) => {
  if (verificarPaginaQuebrada(erro)) return;
  registrar('Erro inesperado (o robô continua ligado): ' + ((erro && erro.message) || erro));
});

iniciarPainel({
  estado,
  config,
  fila,
  enviarProxima,
  adicionarML,
  atualizarShopee,
  atualizarML,
  atualizarOfertas,
  acharGrupo,
  mensagensDoGrupo,
  registrar,
  desconectar: () => client.logout(),
  pedirCodigo,
  testarFoto,
  desligar: async () => {
    registrar('Desligando o robô a pedido do painel...');
    try { await client.destroy(); } catch {}
    process.exit(0);
  },
});

iniciarWhatsApp();
