// Painel de controle no navegador: http://localhost:3000
const express = require('express');
const path = require('path');

function iniciarPainel(robo) {
  const app = express();
  app.use(express.json());

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
    res.json({ ...robo.estado, config: robo.config, fila: robo.fila.listar() });
  });

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
