require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const fila = require('./fila');
const { buscarOfertas } = require('./shopee');

const DONO = (process.env.DONO || '').replace(/\D/g, '');
const reais = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const client = new Client({
  authStrategy: new LocalAuth(), // salva o login, só precisa ler o QR uma vez
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

let grupo = null;
let ultimoDiaBusca = null;

client.on('qr', (qr) => {
  console.log('Leia o QR Code com o WhatsApp do robô (Aparelhos conectados):');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  const chats = await client.getChats();
  grupo = chats.find((c) => c.isGroup && c.name === config.nomeDoGrupo);
  if (!grupo) {
    console.log(`Grupo "${config.nomeDoGrupo}" não encontrado. Confira o nome em config.js.`);
    process.exit(1);
  }
  console.log('Robô ligado! Fila atual:', fila.tamanho());
  ciclo();
  setInterval(ciclo, config.intervaloMinutos * 60 * 1000);
});

// Roda a cada intervalo: busca ofertas novas uma vez por dia e envia a próxima
async function ciclo() {
  const agora = new Date();
  const hoje = agora.toDateString();

  if (ultimoDiaBusca !== hoje && agora.getHours() >= config.horaInicio - 1) {
    ultimoDiaBusca = hoje;
    await atualizarShopee();
  }

  if (agora.getHours() < config.horaInicio || agora.getHours() >= config.horaFim) return;
  await enviarProxima();
}

async function atualizarShopee() {
  if (!process.env.SHOPEE_APP_ID || !process.env.SHOPEE_SECRET) {
    return console.log('Sem chaves da Shopee no .env: usando só as ofertas do Mercado Livre.');
  }
  try {
    console.log('Buscando ofertas na Shopee...');
    fila.limparShopee(); // troca as de ontem pelas de hoje
    const ofertas = await buscarOfertas(fila.idsEnviados());
    fila.adicionarNoFim(ofertas);
    console.log(`${ofertas.length} ofertas da Shopee na fila.`);
  } catch (erro) {
    console.log('Erro ao buscar na Shopee:', erro.message);
  }
}

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

async function enviarProxima() {
  const oferta = fila.tirarPrimeira();
  if (!oferta) return console.log('Fila vazia.');
  const texto = montarTexto(oferta);
  try {
    if (oferta.foto) {
      const foto = await MessageMedia.fromUrl(oferta.foto, { unsafeMime: true });
      await grupo.sendMessage(foto, { caption: texto });
    } else {
      await grupo.sendMessage(texto);
    }
    fila.marcarEnviado(oferta.id);
    console.log('Enviada:', oferta.titulo);
  } catch (erro) {
    console.log('Falha ao enviar, tentando sem foto:', erro.message);
    try {
      await grupo.sendMessage(texto);
      fila.marcarEnviado(oferta.id);
    } catch (e) {
      console.log('Não enviou:', e.message);
    }
  }
}

// Comandos que VOCÊ manda no privado do robô (só o número DONO é aceito)
//   ml Sérum Vitamina C de R$89 por R$49 | https://meli.la/xxxx
//   fila
//   agora
client.on('message', async (msg) => {
  if (msg.from.endsWith('@g.us')) return; // ignora mensagens de grupos
  const contato = await msg.getContact();
  if (!DONO || contato.number !== DONO) return;

  const texto = msg.body.trim();

  if (/^ml\s/i.test(texto)) {
    const [titulo, link] = texto.slice(3).split('|').map((s) => s.trim());
    if (!titulo || !link || !link.startsWith('http')) {
      return msg.reply('Formato: ml Texto da oferta | link de afiliado');
    }
    fila.adicionarNaFrente({ id: 'ml-' + Date.now(), loja: 'Mercado Livre', titulo, link });
    return msg.reply(`✅ Adicionada na frente da fila. Fila: ${fila.tamanho()}`);
  }

  if (/^fila$/i.test(texto)) return msg.reply(`📋 Ofertas na fila: ${fila.tamanho()}`);

  if (/^agora$/i.test(texto)) {
    await enviarProxima();
    return msg.reply('📤 Enviei a próxima oferta.');
  }
});

client.initialize();
