// Robô do Instagram: 3x por dia pega um vídeo de produto de perfis do TikTok, coloca no nosso
// layout, manda pra você aprovar no WhatsApp e posta na conta.
//
//   node robo.js          roda sempre (no servidor: pm2 start robo.js --name robo-insta)
//   node robo.js teste    prepara 1 vídeo em dados/teste/ e NÃO posta (pra ver o layout)
//   node robo.js conta    mostra qual conta do Instagram está ligada
//
// Aprovação pelo WhatsApp: o robô do WhatsApp (robo-promocoes) manda as prévias para o DONO
// e repassa para cá as respostas: aprovar N, trocar N, legenda N ..., headline N ..., horario N 1|2|3
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const http = require('http');
const config = require('./config');
const ig = require('./ig');
const fonte = require('./fonte');

const DADOS = path.join(__dirname, 'dados');
const ARQ_POSTS = path.join(DADOS, 'posts.json');
const ARQ_HISTORICO = path.join(DADOS, 'historico.json');
fs.mkdirSync(DADOS, { recursive: true });

const ler = (arq, padrao) => { try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return padrao; } };
const gravar = (arq, dados) => fs.writeFileSync(arq, JSON.stringify(dados, null, 2));
const registrar = (t) => console.log(new Date().toLocaleString('pt-BR'), t);

const WHATS = process.env.WHATS_URL || 'http://127.0.0.1:3001'; // painel do robô do WhatsApp
const PORTA = Number(process.env.INSTA_PORTA) || 3005;

// ---------- Datas ----------
const diaDe = (d = new Date()) => d.toDateString();
function amanha() { const d = new Date(); d.setDate(d.getDate() + 1); return diaDe(d); }
const nomeDia = (dia) => (dia === diaDe() ? 'hoje' : dia === amanha() ? 'amanhã' : dia);

// ---------- Posts (um por horário) ----------
// status: preparando | aguardando (sua aprovação) | aprovado | postado | perdido | erro
function lerPosts() { return ler(ARQ_POSTS, []); }
function salvarPosts(lista) { gravar(ARQ_POSTS, lista.slice(-300)); }
function atualizar(n, mudancas) {
  const lista = lerPosts();
  const p = lista.find((x) => x.n === n);
  if (!p) return null;
  Object.assign(p, mudancas);
  salvarPosts(lista);
  return p;
}
const pastaDo = (n) => path.join(DADOS, 'posts', String(n));
const legendaPadrao = (conta) => config.legenda.replace(/\{conta\}/g, conta ? '@' + conta.username : 'a gente');

// ---------- WhatsApp (pelo robô do WhatsApp) ----------
async function avisar(texto, arquivo) {
  try {
    const r = await fetch(WHATS + '/interno/dono', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, arquivo }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false) throw new Error(j.erro || 'status ' + r.status);
  } catch (e) {
    registrar('Não consegui mandar no WhatsApp: ' + e.message);
  }
}

async function mandarPrevia(p) {
  await avisar(
    `📸 *Reels #${p.n}* para *${nomeDia(p.dia)} às ${p.hora}h*\n\n` +
    `*Headline:* ${p.headline}\n\n*Legenda:*\n${p.legenda}\n\n` +
    `✅ *aprovar ${p.n}* (posta no horário)\n` +
    `🔄 *trocar ${p.n}* (procuro outro vídeo)\n` +
    `✏️ *headline ${p.n} texto novo*\n` +
    `📝 *legenda ${p.n} texto novo*`,
    path.join(pastaDo(p.n), 'final.mp4'),
  );
}

// Acha e edita um vídeo para o post; manda a prévia
let preparando = false;
async function preparar(p, headlineFixa) {
  preparando = true;
  try {
    atualizar(p.n, { status: 'preparando' });
    registrar(`Reels #${p.n}: preparando para ${nomeDia(p.dia)} às ${p.hora}h...`);
    const { midia } = await fonte.preparar(pastaDo(p.n), headlineFixa);
    const pronto = atualizar(p.n, { status: 'aguardando', midia, headline: midia.headline, erro: null });
    registrar(`Reels #${p.n}: pronto, esperando aprovação.`);
    await mandarPrevia(pronto);
  } catch (e) {
    atualizar(p.n, { status: 'erro', erro: e.message });
    registrar(`Reels #${p.n}: ${e.message}`);
    await avisar(`❌ Não consegui preparar o Reels #${p.n} (${p.hora}h): ${e.message}\nVou tentar de novo em 15 minutos.`);
  } finally {
    preparando = false;
  }
}

// 3 próximos horários livres (de hora em hora, das 9h às 21h; se não der hoje, amanhã)
function opcoesDeHorario() {
  const ocupados = new Set(lerPosts().filter((p) => ['aguardando', 'aprovado', 'preparando'].includes(p.status)).map((p) => p.dia + '|' + p.hora));
  const opcoes = [];
  const agora = new Date();
  for (const [dia, inicio] of [[diaDe(), agora.getHours() + 1], [amanha(), 9]]) {
    for (let h = Math.max(inicio, 9); h <= 21 && opcoes.length < 3; h++) {
      if (!ocupados.has(dia + '|' + h)) opcoes.push({ dia, hora: h });
    }
  }
  return opcoes;
}

async function marcarPerdido(p, motivo) {
  const opcoes = opcoesDeHorario();
  atualizar(p.n, { status: 'perdido', motivo, opcoes, estavaAprovado: p.status === 'aprovado' });
  registrar(`Reels #${p.n}: perdeu o horário das ${p.hora}h (${motivo}).`);
  await avisar(
    `⏰ *Perdemos o horário das ${p.hora}h* (Reels #${p.n}): ${motivo}.\n\nEscolha um novo horário:\n` +
    opcoes.map((o, i) => `*${i + 1}* ${nomeDia(o.dia)} às ${o.hora}h`).join('\n') +
    `\n\nResponda *horario ${p.n} 1*, *2* ou *3*. Ou *trocar ${p.n}* para outro vídeo.`,
  );
}

// ---------- Relógio (a cada minuto) ----------
let conta = null;
let postando = false;
const LIGOU_EM = Date.now();

async function tick() {
  const agora = new Date();
  const hoje = diaDe();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  let lista = lerPosts();

  // 1) Cria o post de cada horário de hoje com antecedência (para dar tempo de aprovar)
  for (const h of config.horarios) {
    const existe = lista.some((p) => p.horaOriginal === h && p.diaOriginal === hoje);
    const falta = h * 60 - minutosAgora;
    if (!existe && falta <= config.antecedenciaMinutos && falta > 0) {
      const n = lista.reduce((m, p) => Math.max(m, p.n), 0) + 1;
      lista.push({ n, dia: hoje, hora: h, diaOriginal: hoje, horaOriginal: h, status: 'novo', legenda: legendaPadrao(conta), criadoEm: Date.now() });
      salvarPosts(lista);
    }
  }

  // 2) Prepara os que precisam (um por vez); erro tenta de novo em 15 min
  if (!preparando) {
    const p = lista.find((x) => x.status === 'novo' || x.status === 'trocar' ||
      (x.status === 'erro' && Date.now() - (x.ultimaTentativa || 0) > 15 * 60000 && x.dia === hoje && x.hora > agora.getHours()));
    if (p) {
      atualizar(p.n, { ultimaTentativa: Date.now() });
      preparar(p); // segue em segundo plano
    }
  }
  lista = lerPosts();

  // 3) Horário passou sem postar: avisa e oferece 3 horários novos
  for (const p of lista) {
    if (!['aguardando', 'aprovado', 'novo', 'erro'].includes(p.status)) continue; // 'preparando' espera terminar
    const passou = p.dia !== hoje ? new Date(p.dia) < new Date(hoje) : agora.getHours() > p.hora;
    if (!passou) continue;
    const motivo = p.status === 'aguardando' ? 'o vídeo não foi aprovado a tempo'
      : p.status === 'aprovado' ? 'o robô estava desligado ou ocupado'
        : 'não consegui preparar um vídeo a tempo';
    await marcarPerdido(p, motivo);
  }

  // 4) Na hora marcada, posta o aprovado
  if (postando) return;
  const daVez = lerPosts().find((p) => p.status === 'aprovado' && p.dia === hoje && p.hora === agora.getHours());
  if (!daVez) return;
  if (!config.ativo) return; // chave geral desligada: não posta
  if (Date.now() - LIGOU_EM < 5 * 60 * 1000) return; // nunca logo depois de ligar
  postando = true;
  try {
    registrar(`Reels #${daVez.n}: postando...`);
    const pub = await ig.postarReels(path.join(pastaDo(daVez.n), 'final.mp4'), daVez.legenda, registrar);
    fonte.marcarUsado(daVez.midia.id);
    atualizar(daVez.n, { status: 'postado', postadoEm: Date.now(), link: pub.permalink || pub.id });
    const hist = ler(ARQ_HISTORICO, []);
    hist.push({ quando: new Date().toISOString(), n: daVez.n, original: daVez.midia.permalink, post: pub.permalink });
    gravar(ARQ_HISTORICO, hist.slice(-500));
    fs.rmSync(pastaDo(daVez.n), { recursive: true, force: true });
    registrar(`Reels #${daVez.n} postado: ${pub.permalink || pub.id}`);
    await avisar(`✅ Reels #${daVez.n} postado no Instagram!\n${pub.permalink || ''}`);
  } catch (e) {
    registrar(`Reels #${daVez.n}: falha ao postar: ${e.message}`);
    await marcarPerdido({ ...daVez }, 'deu erro ao postar (' + e.message + ')');
  } finally {
    postando = false;
  }
}

// ---------- Comandos (vêm do WhatsApp do DONO) ----------
// Devolve o texto de resposta, ou null se não for um comando daqui
async function comando(texto) {
  let m;
  const achar = (n) => lerPosts().find((p) => p.n === Number(n));

  if ((m = texto.match(/^(?:aprovar|aprovo|sim)\s+#?(\d+)$/i))) {
    const p = achar(m[1]);
    if (!p) return `❌ Não achei o Reels #${m[1]}.`;
    if (p.status !== 'aguardando') return `❌ O Reels #${p.n} está "${p.status}".`;
    atualizar(p.n, { status: 'aprovado' });
    registrar(`Reels #${p.n} aprovado.`);
    return `✅ Reels #${p.n} aprovado. Posto ${nomeDia(p.dia)} às ${p.hora}h.` + (config.ativo ? '' : '\n⚠️ As postagens estão desligadas (ativo: false).');
  }
  if ((m = texto.match(/^(?:trocar|troca|n[aã]o)\s+#?(\d+)$/i))) {
    const p = achar(m[1]);
    if (!p) return `❌ Não achei o Reels #${m[1]}.`;
    if (['postado', 'preparando'].includes(p.status)) return `❌ O Reels #${p.n} está "${p.status}".`;
    if (p.midia) fonte.marcarUsado(p.midia.id); // não usa esse vídeo de novo
    if (p.status === 'perdido') {
      atualizar(p.n, { midia: null });
      return `🔄 Ok, vou usar outro vídeo. Primeiro escolha o horário: *horario ${p.n} 1*, *2* ou *3*.`;
    }
    atualizar(p.n, { status: 'trocar', midia: null });
    registrar(`Reels #${p.n}: reprovado, procurando outro vídeo.`);
    return `🔄 Procurando outro vídeo para o Reels #${p.n}. Te mando a prévia nova em alguns minutos.`;
  }
  if ((m = texto.match(/^legenda\s+#?(\d+)\s+([\s\S]+)$/i))) {
    const p = achar(m[1]);
    if (!p || p.status === 'postado') return `❌ Não dá pra mudar o Reels #${m[1]}.`;
    atualizar(p.n, { legenda: m[2].trim() });
    return `📝 Legenda do Reels #${p.n} trocada.` + (p.status === 'aguardando' ? ` Responda *aprovar ${p.n}* pra confirmar.` : '');
  }
  if ((m = texto.match(/^headline\s+#?(\d+)\s+([\s\S]+)$/i))) {
    const p = achar(m[1]);
    if (!p || !p.midia || !['aguardando', 'aprovado', 'perdido'].includes(p.status)) return `❌ Não dá pra mudar o Reels #${m[1]} agora.`;
    const headline = m[2].trim();
    (async () => {
      try {
        await fonte.reeditar(pastaDo(p.n), p.midia, headline);
        const novo = atualizar(p.n, { headline, status: p.status === 'perdido' ? 'perdido' : 'aguardando' });
        if (novo.status === 'aguardando') await mandarPrevia(novo);
      } catch (e) {
        await avisar(`❌ Não consegui refazer o Reels #${p.n}: ${e.message}`);
      }
    })();
    return `✏️ Refazendo o Reels #${p.n} com a headline nova...`;
  }
  if ((m = texto.match(/^hor[aá]rio\s+#?(\d+)\s+([123])$/i))) {
    const p = achar(m[1]);
    if (!p || p.status !== 'perdido' || !p.opcoes) return `❌ O Reels #${m[1]} não está esperando horário novo.`;
    const o = p.opcoes[Number(m[2]) - 1];
    if (!p.midia) {
      atualizar(p.n, { dia: o.dia, hora: o.hora, status: 'trocar', opcoes: null });
      return `🕐 Reels #${p.n} remarcado para ${nomeDia(o.dia)} às ${o.hora}h. Vou preparar um vídeo e te mando pra aprovar.`;
    }
    const status = p.estavaAprovado ? 'aprovado' : 'aguardando';
    const novo = atualizar(p.n, { dia: o.dia, hora: o.hora, status, opcoes: null });
    if (status === 'aguardando') { await mandarPrevia(novo); return `🕐 Remarcado para ${nomeDia(o.dia)} às ${o.hora}h. Mandei a prévia de novo pra você aprovar.`; }
    return `🕐 Reels #${p.n} remarcado para ${nomeDia(o.dia)} às ${o.hora}h.`;
  }
  if (/^(reels|insta)$/i.test(texto)) {
    const ativos = lerPosts().filter((p) => !['postado'].includes(p.status)).slice(-10);
    if (!ativos.length) return '📸 Nenhum Reels na fila agora.';
    return '📸 *Reels*\n' + ativos.map((p) => `#${p.n} · ${nomeDia(p.dia)} ${p.hora}h · ${p.status}`).join('\n') +
      (config.ativo ? '' : '\n⚠️ Postagens desligadas (ativo: false).');
  }
  return null;
}

// Servidor só para o próprio computador (o robô do WhatsApp repassa os comandos)
function iniciarServidor() {
  const json = (res, dados) => res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(dados));
  http.createServer((req, res) => {
    // Estado para o painel
    if (req.method === 'GET' && req.url === '/estado') {
      const hoje = diaDe();
      const posts = lerPosts().slice(-15).reverse().map((p) => ({
        n: p.n, quando: `${nomeDia(p.dia)} às ${p.hora}h`, status: p.status, headline: p.headline, legenda: p.legenda,
        original: p.midia && p.midia.permalink, link: p.link, erro: p.erro, motivo: p.motivo,
        opcoes: p.opcoes && p.opcoes.map((o) => `${nomeDia(o.dia)} às ${o.hora}h`),
        temVideo: fs.existsSync(path.join(pastaDo(p.n), 'final.mp4')),
      }));
      const postadosHoje = lerPosts().filter((p) => p.status === 'postado' && new Date(p.postadoEm).toDateString() === hoje).length;
      return json(res, { conta: conta && conta.username, ativo: config.ativo, horarios: config.horarios, antecedencia: config.antecedenciaMinutos, posts, postadosHoje });
    }
    if (req.method !== 'POST' || !['/comando', '/ativo'].includes(req.url)) { res.writeHead(404).end(); return; }
    let corpo = '';
    req.on('data', (d) => { corpo += d; if (corpo.length > 20000) req.destroy(); });
    req.on('end', async () => {
      let dados = {};
      try { dados = JSON.parse(corpo); } catch {}
      if (req.url === '/ativo') {
        // Liga/desliga as postagens e guarda em dados/config.json
        config.ativo = Boolean(dados.ativo);
        const arq = path.join(DADOS, 'config.json');
        gravar(arq, { ...ler(arq, {}), ativo: config.ativo });
        registrar(`Postagens ${config.ativo ? 'LIGADAS' : 'DESLIGADAS'} pelo painel.`);
        return json(res, { ok: true, ativo: config.ativo });
      }
      let resposta = null;
      try { resposta = await comando(String(dados.texto || '').trim()); } catch (e) { resposta = '❌ ' + e.message; }
      json(res, { resposta });
    });
  }).listen(PORTA, '127.0.0.1', () => registrar(`Esperando comandos do WhatsApp na porta ${PORTA}.`));
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
    avisar('⚠️ Robô do Instagram: não consegui renovar o token (' + e.message + '). Gere um novo no Explorador da Graph API.');
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
    const { midia, arquivo } = await fonte.preparar(path.join(DADOS, 'teste'));
    console.log('\nVídeo de teste pronto (NÃO foi postado):', arquivo);
    console.log('Original:', midia.permalink, `(${midia.views} visualizações)`, '\nHeadline:', midia.headline);
    return;
  }
  conta = await ig.minhaConta();
  // Se o robô reiniciou no meio de uma preparação, recomeça
  const lista = lerPosts();
  for (const p of lista) if (p.status === 'preparando') p.status = p.midia ? 'aguardando' : 'novo';
  salvarPosts(lista);

  registrar(`Robô do Instagram ligado na conta @${conta.username}. ` +
    `${config.ativo ? 'Posta' : 'Postagens DESLIGADAS'} às ${config.horarios.join('h, ')}h, com aprovação pelo WhatsApp.`);
  iniciarServidor();
  await cuidarDoToken();
  setInterval(cuidarDoToken, 24 * 3600 * 1000);
  setInterval(() => tick().catch((e) => registrar('Erro: ' + e.message)), 60 * 1000);
  tick().catch((e) => registrar('Erro: ' + e.message));
}

if (require.main === module) {
  iniciar().catch((e) => {
    registrar('Erro ao ligar: ' + e.message);
    process.exit(1);
  });
}

module.exports = { comando, opcoesDeHorario, tick };
