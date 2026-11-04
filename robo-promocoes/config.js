// Tudo o que você pode ajustar sem mexer no resto do código.
module.exports = {
  // Nome EXATO do grupo de WhatsApp onde as ofertas serão enviadas
  nomeDoGrupo: 'Promoções do Pedro',

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

  // Filtros de qualidade das ofertas
  descontoMinimo: 30, // % de desconto
  notaMinima: 4.6,    // estrelas
  vendasMinimas: 50,  // unidades vendidas

  // Quantas ofertas da Shopee buscar por dia
  ofertasPorDia: 30,
};
