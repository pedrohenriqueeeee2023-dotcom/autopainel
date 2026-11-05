// Testa o que o app de desenvolvedor do Mercado Livre consegue ler.
// Uso: node testar-ml.js   (precisa de ML_CLIENT_ID e ML_CLIENT_SECRET no .env)
// Não mostra as chaves: só o resultado de cada teste.
require('dotenv').config();

const API = 'https://api.mercadolibre.com';
const CATEGORIA = process.argv[2] || 'MLB1246'; // Beleza e Cuidado Pessoal

async function pegarToken() {
  const { ML_CLIENT_ID: id, ML_CLIENT_SECRET: segredo } = process.env;
  if (!id || !segredo) throw new Error('Faltam ML_CLIENT_ID e ML_CLIENT_SECRET no .env');
  const r = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: segredo }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Token recusado (${r.status}): ${j.message || j.error || 'sem detalhe'}`);
  return j.access_token;
}

async function testar(nome, caminho, token, resumir) {
  try {
    const r = await fetch(API + caminho, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    const j = await r.json().catch(() => null);
    const ok = r.ok ? '✅' : '❌';
    console.log(`${ok} ${nome}: HTTP ${r.status}${r.ok && resumir ? ' → ' + resumir(j) : r.ok ? '' : ' → ' + ((j && (j.message || j.error)) || '')}`);
    return r.ok ? j : null;
  } catch (e) {
    console.log(`❌ ${nome}: ${e.message}`);
    return null;
  }
}

(async () => {
  console.log('Pedindo acesso ao Mercado Livre...');
  let token;
  try {
    token = await pegarToken();
    console.log('✅ Token do app: OK\n');
  } catch (e) {
    console.log('❌ ' + e.message);
    process.exit(1);
  }

  const busca = await testar('Busca na categoria', `/sites/MLB/search?category=${CATEGORIA}&limit=3`, token,
    (j) => `${(j.results || []).length} resultados (ex.: ${j.results?.[0]?.title || '-'})`);

  const destaques = await testar('Mais vendidos da categoria', `/highlights/MLB/category/${CATEGORIA}`, token,
    (j) => `${(j.content || []).length} itens`);

  const primeiro = destaques?.content?.find((c) => c.type === 'PRODUCT') || destaques?.content?.[0];
  if (primeiro) {
    if (primeiro.type === 'PRODUCT') {
      const prod = await testar('Produto (catálogo)', `/products/${primeiro.id}`, token,
        (j) => `${j.name} | preço: ${j.buy_box_winner?.price ?? '-'} | foto: ${j.pictures?.length ? 'sim' : 'não'}`);
      const itemId = prod?.buy_box_winner?.item_id;
      await testar('Ofertas do produto', `/products/${primeiro.id}/items?limit=3`, token,
        (j) => `${(j.results || []).length} anúncios | preço: ${j.results?.[0]?.price ?? '-'} | antes: ${j.results?.[0]?.original_price ?? '-'}`);
      if (itemId) {
        await testar('Anúncio (item)', `/items/${itemId}`, token,
          (j) => `${j.title} | preço: ${j.price} | antes: ${j.original_price ?? '-'} | link: ${j.permalink ? 'sim' : 'não'}`);
      }
    } else {
      await testar('Anúncio (item)', `/items/${primeiro.id}`, token,
        (j) => `${j.title} | preço: ${j.price} | antes: ${j.original_price ?? '-'}`);
    }
  }

  await testar('Promoções do dia (busca)', `/sites/MLB/search?category=${CATEGORIA}&promotion_type=deal_of_the_day&limit=3`, token,
    (j) => `${(j.results || []).length} resultados`);
  console.log('\nFim do teste.');
  void busca;
})();
