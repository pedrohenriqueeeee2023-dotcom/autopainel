// Configurações do robô do Instagram. O que estiver em dados/config.json substitui o padrão.
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, 'dados', 'config.json');

const padrao = {
  // Posta de verdade só quando estiver true (vem DESLIGADO: ligue depois de ver o teste)
  ativo: false,

  // Horas em que posta (fuso do servidor). Vale só dentro da hora: 15 = das 15h às 15h59.
  horarios: [10, 15, 20],

  // Perfis do TikTok de onde o robô pega os vídeos (o mais visto que ainda não usou)
  tiktokPerfis: ['cavatioficial', 'achadinhosdolima.08', 'acheishopeeaqui', 'albandivulga', '_achadinhosdoshopee'],
  // Quantos vídeos recentes olhar em cada perfil
  videosPorPerfil: 15,

  // Só pega vídeos com pelo menos isso de visualizações e de 5 a 90 segundos
  minimoVisualizacoes: 1000,
  duracaoMinima: 5,
  duracaoMaxima: 90,

  // Não usa vídeos com estas palavras na legenda original
  palavrasProibidas: ['sexy', 'lingerie', '+18', 'arma', 'remédio', 'emagrecer'],

  // Topo do vídeo (estilo post de perfil). Foto: marca/logo.png. usuario vazio = @ da conta ligada.
  marca: {
    nome: 'Rota dos Achadinhos',
    usuario: '',
    verificado: true,
  },

  // Legenda do post. {conta} vira o @ da conta.
  legenda: [
    '✨ Achadinho do dia!',
    '',
    'Salva pra não perder 💾 e manda pra amiga que precisa 💕',
    'Segue {conta} pra mais achadinhos todo dia 🛍️',
    '',
    '#achadinhos #achadinhosshopee #achadosshopee #comprinhas #achadinhosdodia',
  ].join('\n'),
};

const config = JSON.parse(JSON.stringify(padrao));
try {
  const salvo = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
  Object.assign(config, salvo, { marca: { ...padrao.marca, ...(salvo.marca || {}) } });
} catch {
  // ainda não tem config salva: usa o padrão
}

module.exports = config;
