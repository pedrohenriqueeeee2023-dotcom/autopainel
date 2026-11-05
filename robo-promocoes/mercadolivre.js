// Busca ofertas no Mercado Livre pela API oficial (app de desenvolvedor).
// A busca livre do ML é bloqueada, então usamos os MAIS VENDIDOS de cada
// subcategoria e ficamos só com os que estão com desconto.
// O link de afiliado é montado com os seus códigos (ML_MATT_WORD / ML_MATT_TOOL).
const config = require('./config');

const API = 'https://api.mercadolibre.com';
let token = null;
let tokenExpira = 0;

const temChaves = () => Boolean(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET);
const temAfiliado = () => Boolean(process.env.ML_MATT_WORD && process.env.ML_MATT_TOOL);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function pegarToken() {
  if (token && Date.now() < tokenExpira) return token;
  if (!temChaves()) throw new Error('Faltam ML_CLIENT_ID e ML_CLIENT_SECRET no .env (rode configurar-ml.sh)');
  const r = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`o Mercado Livre recusou as chaves do app (${r.status})`);
  token = j.access_token;
  tokenExpira = Date.now() + (Number(j.expires_in || 21600) - 300) * 1000; // renova 5 min antes
  return token;
}

async function chamar(caminho) {
  const r = await fetch(API + caminho, {
    headers: { Authorization: `Bearer ${await pegarToken()}`, Accept: 'application/json' },
  });
  if (r.status === 401) { token = null; } // token venceu: pega outro na próxima
  if (!r.ok) throw new Error(`${caminho} respondeu ${r.status}`);
  return r.json();
}

// Link do produto com os seus códigos de afiliado
function linkAfiliado(produtoId, permalink) {
  const base = permalink || `https://www.mercadolivre.com.br/p/${produtoId}`;
  const u = new URL(base);
  u.searchParams.set('matt_word', process.env.ML_MATT_WORD);
  u.searchParams.set('matt_tool', process.env.ML_MATT_TOOL);
  return u.toString();
}

// Transforma um produto de catálogo numa oferta (ou null se não tiver desconto bom)
async function montarOferta(produtoId) {
  const anuncios = await chamar(`/products/${produtoId}/items?limit=1`);
  const melhor = anuncios.results && anuncios.results[0];
  if (!melhor || !melhor.original_price || !(melhor.original_price > melhor.price)) return null;
  const desconto = Math.round(100 - (100 * melhor.price) / melhor.original_price);
  if (desconto < config.mlDescontoMinimo) return null;

  const produto = await chamar(`/products/${produtoId}`);
  const foto = produto.pictures && produto.pictures[0] && (produto.pictures[0].url || produto.pictures[0].secure_url);
  return {
    id: 'ml-' + produtoId,
    loja: 'Mercado Livre',
    automatica: true, // veio da busca automática (as coladas à mão não têm isso)
    titulo: produto.name,
    preco: melhor.price,
    precoAntes: melhor.original_price,
    desconto,
    foto: foto ? foto.replace(/^http:/, 'https:') : null,
    link: linkAfiliado(produtoId, produto.permalink),
  };
}

// Passa pelas subcategorias e devolve as melhores ofertas (maior desconto primeiro)
async function buscarOfertasML(jaEnviados, registrar = console.log) {
  if (!temAfiliado()) throw new Error('Faltam ML_MATT_WORD e ML_MATT_TOOL no .env (seus códigos de afiliado)');
  const candidatos = new Set();
  for (const categoria of config.mlCategorias) {
    try {
      const destaques = await chamar(`/highlights/MLB/category/${categoria}`);
      for (const c of destaques.content || []) if (c.type === 'PRODUCT') candidatos.add(c.id);
    } catch (erro) {
      registrar(`Mercado Livre: não consegui ler a categoria ${categoria} (${erro.message}).`);
    }
    await esperar(300);
  }

  const ofertas = [];
  for (const id of candidatos) {
    if (jaEnviados.has('ml-' + id)) continue;
    try {
      const o = await montarOferta(id);
      if (o) ofertas.push(o);
    } catch {
      // produto sem dados ou bloqueado: pula
    }
    await esperar(250); // pausa pra não sobrecarregar a API
  }
  return ofertas.sort((a, b) => b.desconto - a.desconto).slice(0, config.mlOfertasPorDia);
}

module.exports = { buscarOfertasML, temChaves, temAfiliado };
