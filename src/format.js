const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatBRL = (v) => brl.format(Math.round(v));
export const formatNum = (v) => num.format(v);
/** "R$ 31.000" / "31000" → 31000 */
export const parseBRL = (s) => Number(String(s).replace(/\D/g, '')) || 0;
