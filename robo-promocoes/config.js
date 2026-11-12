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
  // Vídeos de produtos (você manda os links no privado do robô). Vem DESLIGADO.
  videoAtivo: false,
  // Cada vídeo vai pro seu privado e só posta no grupo depois de "ok N"
  videoAprovacao: true,
  // Horas em que posta um vídeo aprovado (vale só dentro da hora: 15 = das 15h às 15h59)
  videoHorarios: [10, 15, 20],
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
      if (chave === 'palavras' || chave === 'mlPalavras' || chave === 'palavrasProibidas') {
        const lista = Array.isArray(valor) ? valor : String(valor).split('\n');
        config[chave] = lista.map((p) => p.trim()).filter(Boolean);
      } else if (chave === 'cidade' || chave === 'nichoContexto') {
        if (String(valor).trim()) config[chave] = String(valor).trim();
      } else if (chave === 'gatilhosDesligados') {
        const lista = Array.isArray(valor) ? valor : String(valor).split(/[,\s]+/);
        config.gatilhosDesligados = lista.map((g) => String(g).trim()).filter(Boolean);
      } else if (chave === 'nomeDoGrupo') {
        config.nomeDoGrupo = String(valor).trim();
      } else if (chave === 'enviosAtivos' || chave === 'mlAtivo' || chave === 'mlAceitarSemDesconto' || chave === 'destaqueAtivo' || chave === 'videoAtivo' || chave === 'videoAprovacao') {
        config[chave] = Boolean(valor);
      } else if (chave === 'destaqueHorarios' || chave === 'videoHorarios') {
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
