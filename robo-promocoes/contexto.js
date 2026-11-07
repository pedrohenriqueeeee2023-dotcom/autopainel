// "Por que hoje" — FASE 1: SÓ SUGESTÃO.
// Todo dia às 6h30 (horário de Brasília) olha clima, datas comemorativas, fase do salário,
// dia da semana, Google Trends e mais vendidos do Mercado Livre e SUGERE palavras de busca
// para a Shopee, com ganchos para a mensagem. Não mexe na fila, na busca nem no envio:
// nada aqui manda mensagem.
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, 'dados', 'contexto.json');
const TZ = 'America/Sao_Paulo';
const GATILHOS = ['clima', 'datas', 'salario', 'semana', 'trends', 'ml'];

// ---------- Banco de palavras por nicho ----------
// "beleza" = Rota dos Achadinhos (beleza + casa); "adulto" = Prazer em Promoção
const BANCO = {
  beleza: {
    quente: ['protetor solar facial', 'body splash', 'ventilador portátil', 'copo térmico', 'hidratante corporal'],
    frio: ['hidratante labial', 'creme para mãos', 'manta de sofá', 'pantufa feminina', 'edredom'],
    chuva: ['leave-in antifrizz', 'secador de cabelo', 'tapete antiderrapante', 'guarda-chuva'],
    salarioInicio: ['kit maquiagem', 'perfume feminino', 'escova secadora', 'jogo de panelas'],
    salarioMeio: ['kit skincare', 'organizador de maquiagem', 'jogo de cama'],
    salarioFim: ['achadinhos até 30 reais', 'batom', 'esmalte', 'pote hermético'],
    semana: {
      0: ['máscara facial', 'skincare noturno'],
      1: ['organizador de gaveta', 'garrafa de água'],
      2: ['sérum facial'],
      3: ['máscara capilar'],
      4: ['paleta de sombras'],
      5: ['batom', 'glitter', 'maquiagem'],
      6: ['produtos de limpeza', 'mop giratório'],
    },
    relevantes: ['maquiagem', 'batom', 'perfume', 'skincare', 'cabelo', 'unha', 'esmalte', 'creme', 'beleza',
      'cozinha', 'casa', 'decoração', 'panela', 'organizador', 'limpeza', 'roupa', 'vestido', 'bolsa'],
  },
  adulto: {
    quente: ['óleo de massagem', 'gel refrescante', 'lingerie sensual'],
    frio: ['gel esquenta', 'óleo de massagem aquecido', 'robe de cetim'],
    chuva: ['jogo erótico', 'vela de massagem'],
    salarioInicio: ['vibrador', 'sugador clitoriano', 'kit sex shop'],
    salarioMeio: ['kit casal', 'fantasia erótica'],
    salarioFim: ['gel excitante', 'lubrificante íntimo'],
    semana: {
      0: ['vela de massagem'],
      1: ['cosmético erótico'],
      2: ['lubrificante íntimo'],
      3: ['jogo erótico'],
      4: ['gel excitante'],
      5: ['lingerie sensual', 'fantasia erótica'],
      6: ['kit casal', 'óleo de massagem'],
    },
    relevantes: ['sexo', 'casal', 'namoro', 'lingerie', 'sensual', 'motel', 'beijo', 'romance'],
    ganchosSemana: {
      0: 'Domingo preguiçoso a dois 😏', 1: 'Segunda precisa de um incentivo 🔥', 2: 'Terça picante 🌶️',
      3: 'Quarta, metade da semana… merece 😈', 4: 'Quinta, esquentando pro fim de semana 🔥', 5: 'Sextou a dois 💋', 6: 'Sábado à noite promete 😏',
    },
  },
};

// ---------- Datas ----------
function hojeBrasilia() {
  // data "de calendário" em Brasília, sem hora (para comparar dias)
  const [d, m, a] = new Date().toLocaleDateString('pt-BR', { timeZone: TZ }).split('/').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}
const dia = (a, m, d) => new Date(Date.UTC(a, m - 1, d));
const somarDias = (data, n) => new Date(data.getTime() + n * 86400000);
const diasEntre = (a, b) => Math.round((b - a) / 86400000);
function enesimoDiaDaSemana(ano, mes, diaSemana, n) {
  const primeiro = dia(ano, mes, 1);
  return somarDias(primeiro, ((diaSemana - primeiro.getUTCDay() + 7) % 7) + (n - 1) * 7);
}
function pascoa(ano) { // algoritmo de Meeus
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), d2 = ((h + l - 7 * m + 114) % 31) + 1;
  return dia(ano, mes, d2);
}
function datasDoAno(ano) {
  const blackFriday = somarDias(enesimoDiaDaSemana(ano, 11, 4, 4), 1); // sexta depois da 4ª quinta
  return [
    { nome: 'Volta às aulas', data: dia(ano, 2, 1), janela: 20, beleza: ['estojo', 'mochila feminina', 'garrafa de água'], adulto: [] },
    { nome: 'Carnaval', data: somarDias(pascoa(ano), -47), janela: 20, beleza: ['glitter', 'maquiagem à prova d\'água', 'body splash'], adulto: ['fantasia erótica', 'lingerie sensual'] },
    { nome: 'Dia da Mulher', data: dia(ano, 3, 8), janela: 14, beleza: ['kit presente feminino', 'perfume feminino', 'kit skincare'], adulto: ['sugador clitoriano', 'vibrador'] },
    { nome: 'Dia do Consumidor', data: dia(ano, 3, 15), janela: 7, beleza: ['kit maquiagem', 'escova secadora'], adulto: ['kit sex shop'] },
    { nome: 'Páscoa', data: pascoa(ano), janela: 14, beleza: ['forma de chocolate', 'cesta de páscoa'], adulto: ['gel comestível'] },
    { nome: 'Dia das Mães', data: enesimoDiaDaSemana(ano, 5, 0, 2), janela: 21, beleza: ['kit presente mãe', 'perfume feminino', 'jogo de panelas', 'kit skincare'], adulto: [] },
    { nome: 'Dia dos Namorados', data: dia(ano, 6, 12), janela: 21, beleza: ['kit presente namorada', 'perfume feminino', 'lingerie'], adulto: ['kit casal', 'lingerie sensual', 'óleo de massagem', 'jogo erótico'] },
    { nome: 'Dia dos Pais', data: enesimoDiaDaSemana(ano, 8, 0, 2), janela: 14, beleza: ['kit presente pai'], adulto: [] },
    { nome: 'Dia do Cliente', data: dia(ano, 9, 15), janela: 7, beleza: ['kit maquiagem', 'organizador'], adulto: ['kit sex shop'] },
    { nome: 'Dia das Crianças', data: dia(ano, 10, 12), janela: 14, beleza: ['kit maquiagem infantil', 'mochila'], adulto: [] },
    { nome: '11.11', data: dia(ano, 11, 11), janela: 7, beleza: ['kit maquiagem', 'air fryer', 'perfume importado'], adulto: ['vibrador'] },
    { nome: 'Black Friday', data: blackFriday, janela: 21, beleza: ['air fryer', 'perfume importado', 'escova secadora', 'kit maquiagem'], adulto: ['vibrador', 'sugador clitoriano', 'kit sex shop'] },
    { nome: '12.12', data: dia(ano, 12, 12), janela: 7, beleza: ['kit presente', 'perfume feminino'], adulto: ['kit casal'] },
    { nome: 'Natal', data: dia(ano, 12, 25), janela: 30, beleza: ['kit presente feminino', 'enfeite de natal', 'perfume feminino', 'jogo de taças'], adulto: ['kit casal', 'lingerie vermelha'] },
    { nome: 'Réveillon', data: dia(ano, 12, 31), janela: 10, beleza: ['vestido branco', 'maquiagem', 'taça de champanhe'], adulto: ['lingerie branca'] },
  ];
}
function proximasDatas(hoje) {
  const ano = hoje.getUTCFullYear();
  return [...datasDoAno(ano), ...datasDoAno(ano + 1)]
    .map((d) => ({ ...d, faltam: diasEntre(hoje, d.data) }))
    .filter((d) => d.faltam >= 0 && d.faltam <= d.janela)
    .sort((a, b) => a.faltam - b.faltam);
}

// Salário costuma cair no 5º dia útil (sem contar feriados)
function quintoDiaUtil(ano, mes) {
  let uteis = 0;
  for (let d = 1; d <= 31; d++) {
    const data = dia(ano, mes, d);
    const s = data.getUTCDay();
    if (s !== 0 && s !== 6) uteis++;
    if (uteis === 5) return data;
  }
  return dia(ano, mes, 7);
}
function faseDoSalario(hoje) {
  const quinto = quintoDiaUtil(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1);
  const desde = diasEntre(quinto, hoje);
  const d = hoje.getUTCDate();
  if (desde >= 0 && desde <= 6) return { fase: 'inicio', texto: 'salário acabou de cair' };
  if (d >= 15 && d <= 21) return { fase: 'meio', texto: 'quinzena / vale' };
  return { fase: 'fim', texto: 'fim de mês (dinheiro curto)' };
}

// ---------- Fontes externas (todas opcionais; se falharem o resto continua) ----------
async function buscarJson(url, ms = 10000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { 'User-Agent': 'robo-promocoes' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function clima(cidade) {
  const geo = await buscarJson(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=pt&countryCode=BR&name=${encodeURIComponent(cidade)}`);
  const lugar = geo.results && geo.results[0];
  if (!lugar) throw new Error(`cidade "${cidade}" não encontrada`);
  const p = await buscarJson(`https://api.open-meteo.com/v1/forecast?latitude=${lugar.latitude}&longitude=${lugar.longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(TZ)}&forecast_days=2`);
  return {
    cidade: `${lugar.name}${lugar.admin1 ? ' - ' + lugar.admin1 : ''}`,
    max: Math.round(p.daily.temperature_2m_max[0]),
    min: Math.round(p.daily.temperature_2m_min[0]),
    chuva: p.daily.precipitation_probability_max[0] ?? 0,
  };
}
async function trends() {
  const r = await fetch('https://trends.google.com/trending/rss?geo=BR', { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const xml = await r.text();
  return [...xml.matchAll(/<item>\s*<title>([^<]+)<\/title>/g)].map((m) => m[1].trim()).slice(0, 20);
}
async function maisVendidosML(config) {
  const ml = require('./mercadolivre');
  if (!ml.temChaves()) return { semChave: true, nomes: [] };
  const grupos = config.mlGrupos && Object.values(config.mlGrupos).flat();
  const categorias = (grupos && grupos.length ? grupos : config.mlCategorias || []).slice(0, 6);
  const nomes = [];
  for (const c of categorias) {
    try {
      const h = await ml.chamar(`/highlights/MLB/category/${c}`);
      const ids = (h.content || []).filter((x) => x.type === 'PRODUCT').slice(0, 2).map((x) => x.id);
      for (const id of ids) {
        const p = await ml.chamar(`/products/${id}`);
        if (p && p.name) nomes.push(p.name);
      }
    } catch {
      // categoria sem dados: pula
    }
  }
  return { semChave: false, nomes };
}
// "Kit 10 Potes Herméticos Vidro 640ml Starhouse" -> "potes herméticos vidro"
function palavraDoProduto(nome) {
  const palavras = nome.toLowerCase().replace(/[^a-zà-ú\s-]/gi, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !['kit', 'com', 'para', 'por', 'sem', 'das', 'dos', 'peças', 'unidades'].includes(w));
  return palavras.slice(0, 3).join(' ');
}

// ---------- Monta as sugestões ----------
const NOMES_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const GANCHOS_SEMANA = {
  0: 'Domingo de autocuidado 🧖‍♀️', 1: 'Começando a semana organizada ✨', 2: 'Terça de achadinho 💕',
  3: 'Quarta de cuidar de você 💆‍♀️', 4: 'Quinta, quase sexta! 💄', 5: 'Sextou! Bora se arrumar 💃', 6: 'Sábado de casa em ordem 🏡',
};

async function gerar(config, registrar) {
  const desligados = new Set(config.gatilhosDesligados || []);
  const liga = (g) => !desligados.has(g);
  const nicho = BANCO[config.nichoContexto] ? config.nichoContexto : 'beleza';
  const banco = BANCO[nicho];
  const hoje = hojeBrasilia();
  const sinais = {};
  const sugestoes = [];
  const add = (palavra, motivo, gancho, peso) => {
    if (!palavra) return;
    const chave = palavra.toLowerCase();
    const ja = sugestoes.find((s) => s.palavra.toLowerCase() === chave);
    if (ja) { ja.peso += peso / 2; if (!ja.motivo.includes(motivo)) ja.motivo += ' + ' + motivo; return; }
    sugestoes.push({ palavra, motivo, gancho, peso });
  };

  if (liga('datas')) {
    const proximas = proximasDatas(hoje);
    sinais.datas = proximas.length ? proximas.map((d) => `${d.nome} (${d.faltam === 0 ? 'hoje' : 'em ' + d.faltam + ' dias'})`).join(', ') : 'nenhuma data perto';
    for (const d of proximas.slice(0, 2)) {
      const gancho = d.faltam === 0 ? `🎉 Hoje é ${d.nome}!` : `🎁 Faltam ${d.faltam} dias pro ${d.nome}!`;
      for (const p of d[nicho] || []) add(p, d.nome, gancho, 100 - d.faltam);
    }
  }

  if (liga('clima')) {
    try {
      const c = await clima(config.cidade || 'São Paulo');
      sinais.clima = `${c.cidade}: ${c.min}°–${c.max}°C, chuva ${c.chuva}%`;
      if (c.max >= 28) banco.quente.forEach((p) => add(p, `calor (${c.max}°C)`, `☀️ Calorão de ${c.max}° hoje! Se prepara:`, 60));
      if (c.max <= 20 || c.min <= 12) banco.frio.forEach((p) => add(p, `frio (${c.min}°C)`, `🥶 Esfriou! ${c.min}° hoje, se aquece:`, 60));
      if (c.chuva >= 60) banco.chuva.forEach((p) => add(p, `chuva (${c.chuva}%)`, '🌧️ Dia de chuva, aproveita pra comprar de casa:', 50));
    } catch (e) {
      sinais.clima = 'clima indisponível (' + e.message + ')';
    }
  }

  if (liga('salario')) {
    const s = faseDoSalario(hoje);
    sinais.salario = s.texto;
    const lista = s.fase === 'inicio' ? banco.salarioInicio : s.fase === 'meio' ? banco.salarioMeio : banco.salarioFim;
    const gancho = s.fase === 'inicio' ? '💸 Caiu o salário? Olha essas ofertas:' : s.fase === 'meio' ? '💰 Meio do mês, hora do mimo:' : '🤑 Fim de mês? Achadinhos baratinhos:';
    lista.forEach((p) => add(p, s.texto, gancho, 40));
  }

  if (liga('semana')) {
    const d = hoje.getUTCDay();
    sinais.semana = NOMES_SEMANA[d];
    const ganchoDia = (banco.ganchosSemana || GANCHOS_SEMANA)[d];
    (banco.semana[d] || []).forEach((p) => add(p, NOMES_SEMANA[d], ganchoDia, 20));
  }

  if (liga('trends')) {
    try {
      const lista = await trends();
      const doNicho = lista.filter((t) => banco.relevantes.concat(config.palavras || []).some((w) => t.toLowerCase().includes(String(w).toLowerCase())));
      sinais.trends = lista.slice(0, 6).join(', ') + (doNicho.length ? ` · do nicho: ${doNicho.join(', ')}` : ' · nada do nicho');
      doNicho.forEach((t) => add(t, 'em alta no Google', `🔥 Todo mundo procurando "${t}" hoje:`, 70));
    } catch (e) {
      sinais.trends = 'Google Trends indisponível (' + e.message + ')';
    }
  }

  if (liga('ml')) {
    try {
      const r = await maisVendidosML(config);
      if (r.semChave) sinais.ml = 'ML: sem chave';
      else {
        const palavras = [...new Set(r.nomes.map(palavraDoProduto).filter(Boolean))];
        sinais.ml = palavras.length ? 'mais vendidos: ' + palavras.slice(0, 5).join(', ') : 'sem dados agora';
        palavras.slice(0, 4).forEach((p) => add(p, 'mais vendido no ML', '🏆 O mais vendido do momento:', 30));
      }
    } catch (e) {
      sinais.ml = 'ML indisponível (' + e.message + ')';
    }
  }

  for (const g of desligados) sinais[g] = 'desligado';
  const resultado = {
    dia: hoje.toISOString().slice(0, 10),
    geradoEm: Date.now(),
    cidade: config.cidade,
    nicho,
    sinais,
    sugestoes: sugestoes.sort((a, b) => b.peso - a.peso).slice(0, 12).map(({ peso, ...s }) => s),
  };
  if (registrar) registrar(`Por que hoje: ${resultado.sugestoes.length} palavras sugeridas.`);
  return resultado;
}

// ---------- Agendador (6h30, Brasília) ----------
function criarContexto({ config, registrar }) {
  let atual = null;
  let gerando = null;
  try { atual = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8')); } catch {}

  async function recalcular() {
    if (gerando) return gerando;
    gerando = gerar(config, registrar)
      .then((r) => {
        atual = r;
        try { fs.writeFileSync(ARQUIVO, JSON.stringify(r, null, 2)); } catch {}
        return r;
      })
      .catch((e) => { if (registrar) registrar('Por que hoje: erro ao gerar (' + e.message + ')'); return atual; })
      .finally(() => { gerando = null; });
    return gerando;
  }

  function horaBrasilia() {
    const [h, m] = new Date().toLocaleTimeString('pt-BR', { timeZone: TZ, hour12: false }).split(':').map(Number);
    return h * 60 + m;
  }

  function iniciar() {
    const hojeTxt = () => hojeBrasilia().toISOString().slice(0, 10);
    const verificar = () => {
      // já passou das 6h30 e ainda não gerou hoje
      if (horaBrasilia() >= 6 * 60 + 30 && (!atual || atual.dia !== hojeTxt())) recalcular();
    };
    setTimeout(verificar, 30 * 1000); // ao ligar, se ainda não tem o de hoje
    setInterval(verificar, 60 * 1000);
  }

  return { iniciar, recalcular, atual: () => atual, gatilhos: GATILHOS };
}

module.exports = { criarContexto, gerar, GATILHOS };
