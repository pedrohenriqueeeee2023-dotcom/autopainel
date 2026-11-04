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
      if (chave === 'palavras') {
        const lista = Array.isArray(valor) ? valor : String(valor).split('\n');
        config.palavras = lista.map((p) => p.trim()).filter(Boolean);
      } else if (chave === 'nomeDoGrupo') {
        config.nomeDoGrupo = String(valor).trim();
      } else if (chave === 'enviosAtivos') {
        config.enviosAtivos = Boolean(valor);
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
