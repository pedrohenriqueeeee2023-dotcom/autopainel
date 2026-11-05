// Guarda a fila de ofertas e o histórico do que já foi enviado (pasta "dados").
const fs = require('fs');
const path = require('path');

const PASTA = path.join(__dirname, 'dados');
const ARQ_FILA = path.join(PASTA, 'fila.json');
const ARQ_ENVIADOS = path.join(PASTA, 'enviados.json');

fs.mkdirSync(PASTA, { recursive: true });

function ler(arquivo, padrao) {
  try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch { return padrao; }
}
function salvar(arquivo, dados) {
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
}

const fila = {
  listar() { return ler(ARQ_FILA, []); },
  tamanho() { return ler(ARQ_FILA, []).length; },

  // As do Mercado Livre (que você manda) entram na frente
  adicionarNaFrente(oferta) { const f = ler(ARQ_FILA, []); f.unshift(oferta); salvar(ARQ_FILA, f); },
  adicionarNoFim(ofertas) { const f = ler(ARQ_FILA, []); f.push(...ofertas); salvar(ARQ_FILA, f); },

  // Próxima oferta que já pode ser enviada (as do ML sem link oficial esperam)
  tirarPrimeira() {
    const f = ler(ARQ_FILA, []);
    const i = f.findIndex((o) => !o.precisaLink);
    if (i === -1) return undefined;
    const [o] = f.splice(i, 1);
    salvar(ARQ_FILA, f);
    return o;
  },
  prontas() { return ler(ARQ_FILA, []).filter((o) => !o.precisaLink).length; },
  esperandoLink() { return ler(ARQ_FILA, []).filter((o) => o.precisaLink); },
  // Recebe os links do Gerador do ML na mesma ordem da lista mostrada no painel
  colocarLinks(links) {
    const f = ler(ARQ_FILA, []);
    const esperando = f.filter((o) => o.precisaLink);
    let usados = 0;
    for (let i = 0; i < esperando.length && i < links.length; i++) {
      esperando[i].link = links[i];
      esperando[i].precisaLink = false;
      usados++;
    }
    salvar(ARQ_FILA, f);
    return usados;
  },
  tirarPorId(id) {
    const f = ler(ARQ_FILA, []);
    const i = f.findIndex((o) => o.id === id);
    if (i === -1) return undefined;
    const [o] = f.splice(i, 1);
    salvar(ARQ_FILA, f);
    return o;
  },
  remover(id) { salvar(ARQ_FILA, ler(ARQ_FILA, []).filter((o) => o.id !== id)); },
  subir(id) {
    const o = fila.tirarPorId(id);
    if (o) fila.adicionarNaFrente(o);
  },
  limparShopee() { salvar(ARQ_FILA, ler(ARQ_FILA, []).filter((o) => o.loja !== 'Shopee')); },
  // Tira só as do ML que vieram da busca automática (as coladas à mão ficam)
  limparMLAutomatico() { salvar(ARQ_FILA, ler(ARQ_FILA, []).filter((o) => !(o.loja === 'Mercado Livre' && o.automatica))); },

  idsEnviados() { return new Set(ler(ARQ_ENVIADOS, [])); },
  marcarEnviado(id) {
    const lista = ler(ARQ_ENVIADOS, []);
    lista.push(id);
    salvar(ARQ_ENVIADOS, lista.slice(-5000)); // guarda só os últimos 5000
  },
};

module.exports = fila;
