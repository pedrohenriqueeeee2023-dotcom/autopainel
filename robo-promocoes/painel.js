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

function iniciarPainel(robo) {
  const app = express();
  app.use(express.json());

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
    res.json({ whatsapp: e.whatsapp, qr: esperando ? e.qr : null, codigo: esperando ? e.codigo : null });
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
    res.json({ ...robo.estado, config: robo.config, fila: robo.fila.listar(), linkConexao });
  });
  app.post('/api/link-conexao/novo', responder(async () => {
    linkConexao = novoLink();
    robo.registrar('Link de conexão trocado (o antigo parou de funcionar).');
    return { ok: true, linkConexao };
  }));

  app.post('/api/fila', responder((req) => robo.adicionarML(req.body.titulo, req.body.link)));
  app.delete('/api/fila/:id', responder((req) => robo.fila.remover(req.params.id)));
  app.post('/api/fila/:id/subir', responder((req) => robo.fila.subir(req.params.id)));
  app.post('/api/enviar', responder((req) => robo.enviarProxima(req.body.id)));
  app.post('/api/shopee/buscar', responder(async () => {
    if (!robo.estado.temChavesShopee) return { ok: false, erro: 'Coloque as chaves da Shopee no arquivo .env.' };
    robo.atualizarShopee(); // roda em segundo plano
    return { ok: true };
  }));
  app.post('/api/config', responder(async (req) => {
    const grupoAntes = robo.config.nomeDoGrupo;
    robo.config.salvar(req.body);
    robo.registrar('Configurações salvas.');
    if (robo.config.nomeDoGrupo !== grupoAntes) await robo.acharGrupo();
  }));
  app.post('/api/grupo/atualizar', responder(() => robo.acharGrupo().then(() => ({ ok: true }))));
  app.get('/api/grupo/mensagens', responder(async () => ({ ok: true, mensagens: await robo.mensagensDoGrupo() })));
  app.post('/api/whatsapp/desconectar', responder(async () => {
    robo.registrar('Desconectando o WhatsApp a pedido do painel...');
    await robo.desconectar();
  }));

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
