// Busca ofertas no Mercado Livre pela API oficial (app de desenvolvedor).
// A busca livre do ML é bloqueada, então usamos os MAIS VENDIDOS de cada
// subcategoria e ficamos só com os que estão com desconto.
// O link de afiliado vem do Gerador de links do ML (você cola no painel).
const config = require('./config');
const { temPalavraProibida } = require('./filtros');

const API = 'https://api.mercadolibre.com';
let token = null;
let tokenExpira = 0;

const temChaves = () => Boolean(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET);
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

// Endereço do produto sem nada extra (é o que você cola no Gerador de links do ML)
function linkLimpo(produtoId, permalink) {
  try {
    const u = new URL(permalink || `https://www.mercadolivre.com.br/p/${produtoId}`);
    return u.origin + u.pathname;
  } catch {
    return `https://www.mercadolivre.com.br/p/${produtoId}`;
  }
}

// Transforma um produto de catálogo numa oferta.
// "produto" pode vir pronto da busca (nome e fotos); senão é buscado aqui.
// Devolve null se não passar nos filtros.
async function montarOferta(produtoId, produto, regras = {}) {
  if (produto && produto.name && temPalavraProibida(produto.name)) return null; // já sabemos o nome: descarta cedo
  const aceitarSemDesconto = regras.aceitarSemDesconto ?? Boolean(config.mlAceitarSemDesconto);
  const descontoMinimo = regras.descontoMinimo ?? config.mlDescontoMinimo;
  const precoMinimo = regras.precoMinimo || 0;
  let melhor = null;
  try {
    const anuncios = await chamar(`/products/${produtoId}/items?limit=1`);
    melhor = anuncios.results && anuncios.results[0];
  } catch {
    // alguns nichos (ex.: adulto) não mostram o preço pela API
  }
  const temDesconto = melhor && melhor.original_price && melhor.original_price > melhor.price;
  const desconto = temDesconto ? Math.round(100 - (100 * melhor.price) / melhor.original_price) : 0;
  if (!aceitarSemDesconto && (!temDesconto || desconto < descontoMinimo)) return null;
  if (precoMinimo && !(melhor && melhor.price >= precoMinimo)) return null;

  if (!produto || !produto.pictures) produto = await chamar(`/products/${produtoId}`);
  if (temPalavraProibida(produto.name)) return null;
  const foto = produto.pictures && produto.pictures[0] && (produto.pictures[0].url || produto.pictures[0].secure_url);
  return {
    id: 'ml-' + produtoId,
    loja: 'Mercado Livre',
    automatica: true, // veio da busca automática (as coladas à mão não têm isso)
    titulo: produto.name,
    preco: melhor ? melhor.price : null,
    precoAntes: temDesconto ? melhor.original_price : null,
    desconto,
    foto: foto ? foto.replace(/^http:/, 'https:') : null,
    // O link de afiliado do ML tem um código (ref) criado pelo próprio ML para cada
    // produto, então ele precisa sair do "Gerador de links" do ML. Até lá a oferta
    // fica na fila esperando e não é enviada.
    linkProduto: linkLimpo(produtoId, produto.permalink),
    link: null,
    precisaLink: true,
  };
}

// Duas formas de achar produtos:
//  - mlPalavras preenchido: busca no catálogo por palavra (serve para nichos que o ML
//    não mostra nos "mais vendidos", como o adulto)
//  - senão: mais vendidos de cada subcategoria (de mlGrupos, ou de mlCategorias)
// Também anota de qual grupo (ex.: beleza, casa) cada produto veio.
function categoriasComGrupo() {
  const grupos = config.mlGrupos;
  if (grupos && typeof grupos === 'object' && Object.keys(grupos).length) {
    const lista = [];
    for (const [grupo, cats] of Object.entries(grupos)) for (const c of cats || []) lista.push([c, grupo]);
    return lista;
  }
  return (config.mlCategorias || []).map((c) => [c, 'geral']);
}

async function acharCandidatos(registrar, grupoDe = new Map()) {
  const candidatos = new Map(); // id -> produto (ou null)
  const palavras = config.mlPalavras || [];
  if (palavras.length) {
    for (const palavra of palavras) {
      try {
        const r = await chamar(`/products/search?status=active&site_id=MLB&limit=${config.mlPorPalavra || 30}&q=${encodeURIComponent(palavra)}`);
        for (const p of r.results || []) if (!candidatos.has(p.id)) candidatos.set(p.id, p);
      } catch (erro) {
        registrar(`Mercado Livre: não consegui buscar "${palavra}" (${erro.message}).`);
      }
      await esperar(300);
    }
  } else {
    for (const [categoria, grupo] of categoriasComGrupo()) {
      try {
        const destaques = await chamar(`/highlights/MLB/category/${categoria}`);
        for (const c of destaques.content || []) {
          if (c.type === 'PRODUCT' && !candidatos.has(c.id)) { candidatos.set(c.id, null); grupoDe.set(c.id, grupo); }
        }
      } catch (erro) {
        registrar(`Mercado Livre: não consegui ler a categoria ${categoria} (${erro.message}).`);
      }
      await esperar(300);
    }
  }
  return candidatos;
}

// Escolhe "vagas" ofertas: primeiro garante o mínimo de cada grupo (os de maior desconto
// de cada um), depois completa com os maiores descontos de qualquer grupo.
const nota = (o) => (o.desconto || 0) * 1000 + (o.preco ? 1 : 0);
function escolherComMinimo(ofertas, vagas, minimoPorGrupo) {
  const ordenadas = [...ofertas].sort((a, b) => nota(b) - nota(a));
  const escolhidas = new Set();
  if (minimoPorGrupo > 0) {
    const grupos = [...new Set(ordenadas.map((o) => o.grupo))];
    for (const g of grupos) {
      ordenadas.filter((o) => o.grupo === g).slice(0, minimoPorGrupo).forEach((o) => escolhidas.add(o));
    }
  }
  for (const o of ordenadas) { if (escolhidas.size >= vagas) break; escolhidas.add(o); }
  // se o mínimo de todos os grupos passar das vagas, os de menor desconto saem
  return [...escolhidas].sort((a, b) => nota(b) - nota(a)).slice(0, vagas);
}

// Quantas ofertas normais cabem por dia (o limite diário menos os destaques)
function vagasNormais() {
  if (!config.mlLimiteDiario) return config.mlOfertasPorDia;
  const destaques = config.destaqueAtivo ? (config.destaquesPorDia || 0) : 0;
  return Math.max(0, config.mlLimiteDiario - destaques);
}

// Devolve as melhores ofertas: maior desconto primeiro, depois com preço, depois sem preço
async function buscarOfertasML(jaEnviados, registrar = console.log) {
  const grupoDe = new Map();
  const candidatos = await acharCandidatos(registrar, grupoDe);
  const ofertas = [];
  for (const [id, produto] of candidatos) {
    if (jaEnviados.has('ml-' + id)) continue;
    try {
      const o = await montarOferta(id, produto);
      if (o) ofertas.push({ ...o, grupo: grupoDe.get(id) || 'geral' });
    } catch {
      // produto sem dados ou bloqueado: pula
    }
    await esperar(250); // pausa pra não sobrecarregar a API
  }
  return escolherComMinimo(ofertas, vagasNormais(), config.mlMinimoPorGrupo || 0);
}

// ---------- Destaques: produtos de ticket mais alto (ex.: celulares, eletrodomésticos) ----------
// Pega os mais vendidos das categorias de destaque (e das subcategorias delas), fica com
// os acima do preço mínimo e com desconto, e ordena pelo valor economizado em reais
// (quanto mais caro e com mais desconto, melhor).
async function buscarDestaquesML(jaEnviados, registrar = console.log) {
  const categorias = new Set(config.destaqueCategorias || []);
  for (const c of [...categorias]) {
    try {
      const info = await chamar(`/categories/${c}`);
      for (const f of info.children_categories || []) categorias.add(f.id);
    } catch {}
    await esperar(200);
  }
  const candidatos = new Set();
  for (const categoria of categorias) {
    try {
      const destaques = await chamar(`/highlights/MLB/category/${categoria}`);
      for (const c of destaques.content || []) if (c.type === 'PRODUCT') candidatos.add(c.id);
    } catch {
      // subcategoria sem "mais vendidos": pula
    }
    await esperar(250);
  }
  const ofertas = [];
  for (const id of candidatos) {
    if (jaEnviados.has('ml-' + id)) continue;
    try {
      const o = await montarOferta(id, null, {
        aceitarSemDesconto: false,
        descontoMinimo: config.destaqueDescontoMinimo || 1,
        precoMinimo: config.destaquePrecoMinimo || 200,
      });
      if (o) ofertas.push({ ...o, destaque: true });
    } catch {}
    await esperar(250);
  }
  const economia = (o) => (o.precoAntes || o.preco) - o.preco;
  registrar(`Destaques: ${ofertas.length} produtos acima de R$ ${config.destaquePrecoMinimo || 200} com desconto.`);
  return ofertas.sort((a, b) => economia(b) - economia(a)).slice(0, config.destaquesPorDia || 2);
}

module.exports = { buscarOfertasML, buscarDestaquesML, temChaves, escolherComMinimo };
