// Filtro de palavras proibidas no nome do produto (ex.: "masculino").
// Ignora maiúsculas e acentos.
const config = require('./config');

const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function temPalavraProibida(titulo) {
  const nome = normalizar(titulo);
  return (config.palavrasProibidas || []).some((p) => p && nome.includes(normalizar(p)));
}

// Marca está na lista de marcas boas? Confere a marca que o ML informa; se não tiver,
// procura o nome da marca no título (só marcas com 5 letras ou mais, pra não confundir).
const soLetras = (t) => normalizar(t).replace(/[^a-z0-9]/g, '');
function marcaBoa(marca, titulo) {
  const lista = (config.marcasBoas || []).map(soLetras).filter(Boolean);
  if (marca) {
    const m = soLetras(marca);
    if (m) return lista.some((b) => m === b || m.startsWith(b));
  }
  const nome = ' ' + normalizar(titulo).replace(/[^a-z0-9]+/g, ' ') + ' ';
  return (config.marcasBoas || []).some((b) => {
    const n = normalizar(b).replace(/[^a-z0-9]+/g, ' ').trim();
    return n.replace(/ /g, '').length >= 5 && nome.includes(' ' + n + ' ');
  });
}

module.exports = { temPalavraProibida, marcaBoa };
