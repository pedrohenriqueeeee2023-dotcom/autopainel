// Painel de controle no navegador: http://localhost:3000
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Link secreto para outra pessoa conectar o WhatsApp sem ter a senha do painel.
// Fica salvo em dados/ para continuar o mesmo depois de reiniciar.
const arquivoLink = path.join(__dirname, 'dados', 'link-conexao.txt');
function novoLink() {
  const t = crypto.randomBytes(16).toString('hex');
  fs.mkdirSync(path.dirname(arquivoLink), { recursive: true });
  fs.writeFileSync(arquivoLink, t);
  return t;
}
let linkConexao;
try { linkConexao = fs.readFileSync(arquivoLink, 'utf8').trim(); } catch {}
if (!/^[0-9a-f]{32}$/.test(linkConexao || '')) linkConexao = novoLink();

const linkValido = (t) =>
  typeof t === 'string' && t.length === linkConexao.length &&
  crypto.timingSafeEqual(Buffer.from(t), Buffer.from(linkConexao));

// Nome que aparece no painel (muda por robô: NOME_ROBO no .env)
const NOME_ROBO = process.env.NOME_ROBO || 'Robô Laureta';

// Cor de destaque do painel (muda por robô: COR_NEON=#ff2a3d no .env). Padrão: rosa neon.
function temaCss() {
  // Aceita com ou sem # (no .env o # sem aspas vira comentário, então use COR_NEON=ff2a3d)
  const hex = '#' + String(process.env.COR_NEON || '').trim().replace(/^["']?#?|["']$/g, '');
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return '/* cor padrão */\n';
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const clarear = (c) => Math.round(c + (255 - c) * 0.3); // tom mais claro para textos
  const claro = '#' + [r, g, b].map((c) => clarear(c).toString(16).padStart(2, '0')).join('');
  return `:root { --neon-rgb: ${r}, ${g}, ${b}; --neon: ${hex}; --neon-2: ${claro}; }\n`;
}

function iniciarPainel(robo) {
  const app = express();
  app.use(express.json());

  // Cores do robô (público: a página de conexão também usa)
  const css = temaCss();
  app.get('/tema.css', (req, res) => res.type('text/css').set('Cache-Control', 'no-cache').send(css));

  // ---- Página pública de conexão (só com o link secreto; vem antes da senha) ----
  const soComLink = (req, res, next) =>
    linkValido(req.params.link) ? next() : res.status(404).send('Link inválido ou trocado. Peça um link novo.');

  app.get('/conectar/:link', soComLink, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'paginas', 'conectar.html'));
  });
  app.get('/conectar/:link/estado', soComLink, (req, res) => {
    const e = robo.estado;
    const esperando = e.whatsapp === 'qr';
    res.set('Cache-Control', 'no-store');
    res.json({ whatsapp: e.whatsapp, qr: esperando ? e.qr : null, codigo: esperando ? e.codigo : null, nome: NOME_ROBO });
  });
  // Limita a 1 código a cada 15s (o WhatsApp não gosta de muitos pedidos seguidos)
  let ultimoPedido = 0;
  let pedindo = false;
  app.post('/conectar/:link/codigo', soComLink, async (req, res) => {
    try {
      if (pedindo || Date.now() - ultimoPedido < 15000) throw new Error('Espere uns segundos e tente de novo.');
      pedindo = true;
      const codigo = await robo.pedirCodigo(req.body && req.body.numero);
      ultimoPedido = Date.now();
      res.json({ ok: true, codigo });
    } catch (erro) {
      res.json({ ok: false, erro: erro.message });
    } finally {
      pedindo = false;
    }
  });

  // Ponte com o robô do Instagram (mesmo computador): ele manda prévias e avisos para o DONO.
  // Só aceita pedidos do próprio computador e só arquivos da pasta de dados do robô do Instagram.
  const PASTA_INSTA = path.resolve(__dirname, '..', 'robo-instagram', 'dados') + path.sep;
  app.post('/interno/dono', async (req, res) => {
    const ip = req.socket.remoteAddress || '';
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip) || req.headers['x-forwarded-for']) {
      return res.status(403).json({ ok: false, erro: 'só do próprio computador' });
    }
    const { texto, arquivo } = req.body || {};
    const arq = arquivo ? path.resolve(String(arquivo)) : null;
    if (arq && !arq.startsWith(PASTA_INSTA)) return res.status(400).json({ ok: false, erro: 'arquivo fora da pasta permitida' });
    try {
      await robo.enviarParaDono({ texto: String(texto || '').slice(0, 4000), arquivo: arq });
      res.json({ ok: true });
    } catch (e) {
      res.json({ ok: false, erro: e.message });
    }
  });

  // Vídeo do Reels para o Instagram baixar na hora de postar (a API da Meta precisa de um link público).
  // Só abre com o código aleatório daquele post, e só enquanto o post não foi publicado.
  app.get('/publico/reels/:arquivo', (req, res) => {
    const token = String(req.params.arquivo).replace(/\.mp4$/, '');
    if (!/^[a-f0-9]{32}$/.test(token)) return res.status(404).end();
    let posts = [];
    try { posts = JSON.parse(require('fs').readFileSync(path.join(PASTA_INSTA, 'posts.json'), 'utf8')); } catch {}
    const post = posts.find((p) => p.token === token && p.status !== 'postado');
    const arquivo = post && path.join(PASTA_INSTA, 'posts', String(Number(post.n)), 'final.mp4');
    if (!arquivo || !require('fs').existsSync(arquivo)) return res.status(404).end();
    res.type('video/mp4').sendFile(arquivo);
  });

  // Senha opcional (obrigatória se o painel ficar na internet, ex.: VPS)
  const senha = process.env.PAINEL_SENHA;
  if (senha) {
    app.use((req, res, next) => {
      const [, b64 = ''] = (req.headers.authorization || '').split(' ');
      const digitada = Buffer.from(b64, 'base64').toString().split(':').slice(1).join(':');
      if (digitada === senha) return next();
      res.set('WWW-Authenticate', 'Basic realm="Robo de Promocoes"').status(401).send('Senha necessária');
    });
  }

  app.use(express.static(path.join(__dirname, 'public')));

  const responder = (fn) => async (req, res) => {
    try {
      res.json((await fn(req)) || { ok: true });
    } catch (erro) {
      res.json({ ok: false, erro: erro.message });
    }
  };

  app.get('/api/estado', (req, res) => {
    res.json({ ...robo.estado, config: robo.config, fila: robo.fila.listar(), linkConexao, nomeRobo: NOME_ROBO });
  });
  app.post('/api/link-conexao/novo', responder(async () => {
    linkConexao = novoLink();
    robo.registrar('Link de conexão trocado (o antigo parou de funcionar).');
    return { ok: true, linkConexao };
  }));

  app.post('/api/fila', responder((req) => robo.adicionarML(req.body.titulo, req.body.link)));
  // Links que voltaram do Gerador do ML, na mesma ordem da lista do painel
  app.post('/api/ml/links', responder(async (req) => {
    const texto = String((req.body && req.body.texto) || '');
    const links = (texto.match(/https?:\/\/[^\s"'<>]+/g) || [])
      .filter((l) => /(^https?:\/\/)([a-z0-9-]+\.)*(mercadolivre\.com\.br|meli\.la)\//i.test(l));
    if (!links.length) return { ok: false, erro: 'Não achei nenhum link do Mercado Livre no que você colou.' };
    const esperando = robo.fila.esperandoLink().length;
    const usados = robo.fila.colocarLinks(links);
    robo.registrar(`${usados} links de afiliado do ML colocados nas ofertas.`);
    // O painel copia de 30 em 30 (limite do Gerador do ML): só avisa se não bater com o lote
    const lote = Math.min(30, esperando);
    const aviso = links.length !== lote
      ? ` Atenção: você colou ${links.length} links e o lote tinha ${lote}; usei na ordem.`
      : (esperando > usados ? ` Faltam ${esperando - usados}: copie o próximo lote.` : '');
    return { ok: true, usados, aviso };
  }));
  app.delete('/api/fila/:id', responder((req) => robo.fila.remover(req.params.id)));
  app.post('/api/fila/:id/subir', responder((req) => robo.fila.subir(req.params.id)));
  app.post('/api/enviar', responder((req) => robo.enviarProxima(req.body.id)));
  app.post('/api/shopee/buscar', responder(async () => {
    const { temChavesShopee, temChavesML } = robo.estado;
    if (!temChavesShopee && !(temChavesML && robo.config.mlAtivo)) {
      return { ok: false, erro: 'Nenhuma loja automática configurada (faltam as chaves da Shopee e do Mercado Livre).' };
    }
    robo.atualizarOfertas(); // roda em segundo plano
    return { ok: true };
  }));
  app.post('/api/config', responder(async (req) => {
    const grupoAntes = robo.config.nomeDoGrupo;
    const cidadeAntes = robo.config.cidade;
    const gatilhosAntes = JSON.stringify(robo.config.gatilhosDesligados || []);
    robo.config.salvar(req.body);
    robo.registrar('Configurações salvas.');
    if (robo.config.nomeDoGrupo !== grupoAntes) await robo.acharGrupo();
    // "Por que hoje": trocou a cidade ou os gatilhos? recalcula em segundo plano
    if (robo.contexto && (robo.config.cidade !== cidadeAntes || JSON.stringify(robo.config.gatilhosDesligados || []) !== gatilhosAntes)) {
      robo.contexto.recalcular();
    }
  }));
  app.post('/api/grupo/atualizar', responder(() => robo.acharGrupo().then(() => ({ ok: true }))));
  app.get('/api/grupo/mensagens', responder(async () => ({ ok: true, mensagens: await robo.mensagensDoGrupo() })));
  app.post('/api/whatsapp/desconectar', responder(async () => {
    robo.registrar('Desconectando o WhatsApp a pedido do painel...');
    await robo.desconectar();
  }));

  // "Por que hoje" (só sugestão)
  app.get('/api/contexto', (req, res) => {
    res.json({ ok: true, gatilhos: robo.contexto ? robo.contexto.gatilhos : [], contexto: robo.contexto ? robo.contexto.atual() : null });
  });
  app.post('/api/contexto/recalcular', responder(async () => {
    if (!robo.contexto) return { ok: false, erro: 'Recurso indisponível.' };
    return { ok: true, contexto: await robo.contexto.recalcular() };
  }));
  // Robô do Instagram (pm2 robo-insta, mesmo servidor): estado, comandos e vídeo de prévia
  const INSTA = `http://127.0.0.1:${process.env.INSTA_PORTA || 3005}`;
  const insta = async (caminho, corpo) => {
    const r = await fetch(INSTA + caminho, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : {});
    return r.json();
  };
  app.get('/api/insta', responder(async () => {
    try { return { ok: true, ...(await insta('/estado')) }; } catch { return { ok: true, desligado: true }; }
  }));
  app.post('/api/insta/comando', responder(async (req) => {
    try {
      const { resposta } = await insta('/comando', { texto: String((req.body && req.body.texto) || '') });
      return { ok: !/^❌/.test(resposta || ''), resposta, erro: resposta };
    } catch { return { ok: false, erro: 'O robô do Instagram está desligado.' }; }
  }));
  app.post('/api/insta/ativo', responder(async (req) => {
    try { return await insta('/ativo', { ativo: Boolean(req.body && req.body.ativo) }); } catch { return { ok: false, erro: 'O robô do Instagram está desligado.' }; }
  }));
  app.get('/api/insta/video/:n', (req, res) => {
    const arquivo = path.join(PASTA_INSTA, 'posts', String(Number(req.params.n)), 'final.mp4');
    if (!require('fs').existsSync(arquivo)) return res.status(404).send('Vídeo não encontrado');
    res.sendFile(arquivo);
  });
  app.post('/api/teste-foto', responder(async (req) => ({ ok: true, ...(await robo.testarFoto(req.body && req.body.url)) })));
  app.post('/api/desligar', (req, res) => {
    res.json({ ok: true });
    setTimeout(() => robo.desligar(), 500); // responde antes de desligar
  });

  const porta = Number(process.env.PORTA) || 3000;
  // Sem senha, o painel só abre neste computador. Com senha, abre de qualquer lugar.
  const host = senha ? '0.0.0.0' : '127.0.0.1';
  app.listen(porta, host, () => {
    robo.registrar(`Painel aberto em http://localhost:${porta}`);
  });
}

module.exports = { iniciarPainel };
