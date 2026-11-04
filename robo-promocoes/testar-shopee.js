// Testa só a busca da Shopee, sem WhatsApp: npm run testar-shopee
require('dotenv').config();
const { buscarOfertas } = require('./shopee');

buscarOfertas(new Set())
  .then((ofertas) => {
    console.log(`${ofertas.length} ofertas encontradas:\n`);
    for (const o of ofertas.slice(0, 10)) {
      console.log(`- ${o.desconto}% OFF | R$ ${o.preco.toFixed(2)} | ${o.titulo}\n  ${o.link}`);
    }
  })
  .catch((e) => console.log('Erro:', e.message));
