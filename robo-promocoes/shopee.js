// Busca ofertas na API oficial de afiliados da Shopee.
// O campo "offerLink" já vem com o SEU link de afiliado.
const crypto = require('crypto');
const config = require('./config');
const { temPalavraProibida } = require('./filtros');

const URL_API = 'https://open-api.affiliate.shopee.com.br/graphql';

async function chamarApi(query, variables) {
  const appId = process.env.SHOPEE_APP_ID;
  const secret = process.env.SHOPEE_SECRET;
  if (!appId || !secret) throw new Error('Preencha SHOPEE_APP_ID e SHOPEE_SECRET no arquivo .env');

  const corpo = JSON.stringify({ query, variables });
  const timestamp = Math.floor(Date.now() / 1000);
  const assinatura = crypto
    .createHash('sha256')
    .update(appId + timestamp + corpo + secret)
    .digest('hex');

  const resposta = await fetch(URL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${assinatura}`,
    },
    body: corpo,
  });
  const json = await resposta.json();
  if (json.errors) throw new Error('Erro da Shopee: ' + JSON.stringify(json.errors));
  return json.data;
}

const BUSCA = `
  query Busca($keyword: String, $page: Int, $limit: Int) {
    productOfferV2(keyword: $keyword, sortType: 2, page: $page, limit: $limit) {
      nodes {
        itemId
        productName
        priceMin
        priceDiscountRate
        sales
        ratingStar
        imageUrl
        offerLink
      }
    }
  }`;

// Busca uma palavra e devolve só as ofertas que passam nos filtros
async function buscarPalavra(palavra) {
  const dados = await chamarApi(BUSCA, { keyword: palavra, page: 1, limit: 50 });
  return dados.productOfferV2.nodes
    .filter((p) =>
      !temPalavraProibida(p.productName) &&
      Number(p.priceDiscountRate) >= config.descontoMinimo &&
      Number(p.ratingStar) >= config.notaMinima &&
      Number(p.sales) >= config.vendasMinimas)
    .map((p) => {
      const preco = Number(p.priceMin);
      const desconto = Number(p.priceDiscountRate);
      return {
        id: 'shopee-' + p.itemId,
        loja: 'Shopee',
        titulo: p.productName,
        preco,
        precoAntes: preco / (1 - desconto / 100),
        desconto,
        foto: p.imageUrl,
        link: p.offerLink,
      };
    });
}

// Passa por todas as palavras e devolve as melhores ofertas (maior desconto primeiro)
async function buscarOfertas(jaEnviados) {
  const todas = [];
  for (const palavra of config.palavras) {
    try {
      todas.push(...(await buscarPalavra(palavra)));
    } catch (erro) {
      console.log(`Falha ao buscar "${palavra}":`, erro.message);
    }
    await new Promise((r) => setTimeout(r, 1500)); // pausa pra não sobrecarregar a API
  }
  const unicas = new Map();
  for (const o of todas) if (!jaEnviados.has(o.id)) unicas.set(o.id, o);
  return [...unicas.values()]
    .sort((a, b) => b.desconto - a.desconto)
    .slice(0, config.ofertasPorDia);
}

module.exports = { buscarOfertas };
