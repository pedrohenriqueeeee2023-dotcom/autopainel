// Filtro de palavras proibidas no nome do produto (ex.: "masculino").
// Ignora maiúsculas e acentos.
const config = require('./config');

const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function temPalavraProibida(titulo) {
  const nome = normalizar(titulo);
  return (config.palavrasProibidas || []).some((p) => p && nome.includes(normalizar(p)));
}

module.exports = { temPalavraProibida };
