// Configurações do robô. Os valores abaixo são o padrão;
// o que você muda pelo painel fica salvo em dados/config.json.
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, 'dados', 'config.json');

const padrao = {
  // Nome EXATO do grupo de WhatsApp onde as ofertas serão enviadas
  nomeDoGrupo: 'Achadinhos da Laureta',

  // Envios ligados (true) ou pausados (false)
  enviosAtivos: true,

  // Minutos entre um envio e outro (menos que 15 aumenta o risco de banimento)
  intervaloMinutos: 20,

  // Horário em que o robô pode enviar (das 8h até 21h59)
  horaInicio: 8,
  horaFim: 22,

  // Palavras buscadas na Shopee (nicho: mulher, beleza, estética)
  palavras: [
    'skincare', 'sérum facial', 'protetor solar facial', 'hidratante facial',
    'maquiagem', 'base maquiagem', 'batom', 'máscara de cílios', 'paleta de sombras',
    'perfume feminino', 'body splash', 'creme corporal',
    'chapinha', 'secador de cabelo', 'escova secadora', 'máscara capilar',
    'esmalte', 'kit unhas', 'depilador feminino',
    'bolsa feminina', 'vestido feminino', 'brinco feminino',
  ],

  // Filtros de qualidade das ofertas da Shopee
  descontoMinimo: 30, // % de desconto
  notaMinima: 4.6,    // estrelas
  vendasMinimas: 50,  // unidades vendidas

  // Quantas ofertas da Shopee buscar por dia
  ofertasPorDia: 30,

  // Mercado Livre automático (mais vendidos com desconto, via app de desenvolvedor)
  mlAtivo: true,
  mlDescontoMinimo: 20, // % de desconto
  mlOfertasPorDia: 20,
  // Subcategorias de Beleza: pele, cabelo, maquiagem, perfumes, unhas, depilação,
  // tratamentos e artefatos para cabelo (chapinha, secador...)
  // Se tiver palavras aqui, o ML busca por palavra no catálogo em vez das categorias
  // (para nichos que não aparecem nos "mais vendidos", como o adulto)
  mlPalavras: [],
  mlPorPalavra: 30,
  // Aceitar produtos sem desconto (ou que o ML não mostra o preço)
  mlAceitarSemDesconto: false,
  // "Por que hoje" (só sugestão): cidade do clima, nicho do banco de palavras
  // ('beleza' ou 'adulto') e gatilhos desligados ('clima','datas','salario','semana','trends','ml')
  cidade: 'Belo Horizonte',
  nichoContexto: 'beleza',
  gatilhosDesligados: [],

  // Ofertas com qualquer uma destas palavras no nome são descartadas (Shopee e ML)
  palavrasProibidas: [],

  // Só marcas conhecidas no ML (true) e a lista delas. Confere a marca do produto no ML
  // (ou o nome, se o ML não informar a marca). Não vale para os destaques.
  mlSoMarcas: true,
  marcasBoas: [
    // perfumaria e corpo
    'Wepink', 'Natura', 'O Boticário', 'Boticário', 'Eudora', 'Avon', 'Quem Disse Berenice', 'Granado', 'Phebo',
    "Victoria's Secret", 'Bath & Body Works', 'Carolina Herrera', 'Lancôme', 'Paco Rabanne', 'Antonio Banderas',
    'Shakira', 'Calvin Klein', 'Nivea', 'Dove', 'Monange', 'Rexona', 'Veet', 'Gillette Venus',
    // maquiagem
    'Vult', 'Ruby Rose', 'Dailus', 'Bruna Tavares', 'Boca Rosa', 'Mari Maria', 'Océane', 'Fran By Franciny Ehlke',
    'Niina Secrets', 'Max Love', 'Vizzela', 'Maybelline', "L'Oréal", 'Revlon', 'MAC', 'Melu', 'Payot',
    // skincare
    'Sallve', 'Principia', 'Creamy', 'Simple Organic', 'Adcos', 'Garnier', 'Neutrogena', 'La Roche-Posay',
    'CeraVe', 'Cetaphil', 'Vichy', 'Bioderma', 'Avène', 'Eucerin', 'ISDIN', 'Episol', 'Darrow', 'Mantecorp',
    // cabelo
    'Elseve', 'Pantene', 'Seda', 'Tresemmé', 'Siàge', 'Lola Cosmetics', 'Salon Line', 'Inoar', 'Truss', 'Wella',
    'Kérastase', 'Redken', 'Amend', 'Haskell', 'Taiff', 'Philips', 'Gama', 'Babyliss', 'Britânia', 'Mondial', 'Philco',
    // casa
    'Tramontina', 'Electrolux', 'Brastemp', 'Consul', 'Oster', 'Arno', 'WAP', 'Oxford', 'Mallory', 'Black+Decker',
    'Brinox', 'Ordene', 'Coza', 'Rochedo', 'Polishop', 'Cadence', 'Multilaser',
  ],
  // Preço máximo das ofertas normais do ML (R$). 0 = sem limite. Não vale para os destaques.
  mlPrecoMaximo: 150,
  // No máximo quantas ofertas da mesma marca por busca (pra não vir 8 batons iguais de cores diferentes)
  mlMaximoPorMarca: 2,
  // Marca boa e barata entra mesmo sem desconto, até este preço (R$). 0 = não aceita sem desconto.
  mlSemDescontoAte: 60,
  // Buscas extras no catálogo do ML, além dos mais vendidos (ex.: marcas e produtos que vendem bem)
  mlBuscasExtras: [
    'wepink body splash', 'body splash', 'boticário', 'natura', 'eudora', 'vult', 'ruby rose', 'bruna tavares',
    'boca rosa beauty', 'mari maria makeup', 'principia', 'creamy skincare', 'sallve', 'cerave', 'la roche-posay',
    'lola cosmetics', 'salon line', 'nivea', 'victorias secret body splash', 'granado',
  ],

  // Destaques: produtos de ticket mais alto (ex.: celulares e eletrodomésticos),
  // no máximo "destaquesPorDia" por dia, nos horários de "destaqueHorarios"
  destaqueAtivo: false,
  destaqueCategorias: ['MLB1055', 'MLB5726'], // Celulares e Smartphones, Eletrodomésticos
  destaquePrecoMinimo: 200,
  destaqueDescontoMinimo: 5,
  destaquesPorDia: 2,
  destaqueHorarios: [11, 19],
  // Limite de links do ML por dia (normais + destaques). 0 = usa mlOfertasPorDia.
  mlLimiteDiario: 0,
  // Grupos de categorias (ex.: { beleza: [...], casa: [...] }) e o mínimo de ofertas de cada
  mlGrupos: null,
  mlMinimoPorGrupo: 0,
  // Mínimo/máximo de um grupo específico, ex.: { casa: { minimo: 5, maximo: 5 } }
  mlLimitesGrupo: {},
  mlCategorias: ['MLB199407', 'MLB1263', 'MLB1248', 'MLB6284', 'MLB29884', 'MLB5383', 'MLB278194', 'MLB455174'],
};

const config = { ...padrao };
try {
  Object.assign(config, JSON.parse(fs.readFileSync(ARQUIVO, 'utf8')));
} catch {
  // ainda não existe config salva: usa o padrão
}

// Recebe valores vindos do painel, confere o tipo e salva
Object.defineProperty(config, 'salvar', {
  enumerable: false,
  value(novos) {
    for (const chave of Object.keys(padrao)) {
      if (!(chave in novos)) continue;
      const valor = novos[chave];
      if (chave === 'palavras' || chave === 'mlPalavras' || chave === 'palavrasProibidas' || chave === 'marcasBoas' || chave === 'mlBuscasExtras') {
        const lista = Array.isArray(valor) ? valor : String(valor).split('\n');
        config[chave] = lista.map((p) => p.trim()).filter(Boolean);
      } else if (chave === 'cidade' || chave === 'nichoContexto') {
        if (String(valor).trim()) config[chave] = String(valor).trim();
      } else if (chave === 'gatilhosDesligados') {
        const lista = Array.isArray(valor) ? valor : String(valor).split(/[,\s]+/);
        config.gatilhosDesligados = lista.map((g) => String(g).trim()).filter(Boolean);
      } else if (chave === 'nomeDoGrupo') {
        config.nomeDoGrupo = String(valor).trim();
      } else if (chave === 'enviosAtivos' || chave === 'mlAtivo' || chave === 'mlAceitarSemDesconto' || chave === 'destaqueAtivo' || chave === 'mlSoMarcas') {
        config[chave] = Boolean(valor);
      } else if (chave === 'destaqueHorarios') {
        const horas = (Array.isArray(valor) ? valor : String(valor).split(/[^0-9]+/))
          .filter((h) => h !== '').map(Number).filter((h) => Number.isInteger(h) && h >= 0 && h <= 23);
        if (horas.length) config[chave] = [...new Set(horas)].sort((a, b) => a - b);
      } else if (chave === 'mlCategorias' || chave === 'destaqueCategorias' || chave === 'mlGrupos' || chave === 'mlLimitesGrupo') {
        continue; // só muda pelo código
      } else if (!Number.isNaN(Number(valor)) && valor !== '') {
        config[chave] = Number(valor);
      }
    }
    if (config.intervaloMinutos < 5) config.intervaloMinutos = 5;
    fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
    fs.writeFileSync(ARQUIVO, JSON.stringify(config, null, 2));
  },
});

module.exports = config;
