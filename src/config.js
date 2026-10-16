/**
 * Configuração central da landing page do AutoPainel.
 * Textos comerciais, preços e destinos dos botões ficam aqui para serem
 * alterados sem mexer nos componentes.
 *
 * Destinos (`ctas.*.href`): enquanto o valor for `null`, o botão aponta para
 * a seção de planos (#planos) e, em desenvolvimento, um aviso é mostrado no
 * console. Preencha com a URL real de checkout / contato antes de publicar.
 */
export const CONFIG = {
  brand: {
    name: 'AutoPainel',
    tagline: 'Sistema para revendas de seminovos',
    site: 'https://autopainel.app.br/',
  },

  ctas: {
    // Ex.: 'https://autopainel.app.br/cadastro?plano=anual'
    trial: { label: 'Quero experimentar grátis', href: null },
    // Ex.: 'https://wa.me/55XXXXXXXXXXX?text=Quero%20conhecer%20o%20AutoPainel'
    contact: { label: 'Falar com a equipe', href: null },
  },

  offer: {
    badge: 'Oferta de lançamento',
    text: '30 dias grátis para os 3 primeiros clientes.',
  },

  plans: [
    {
      id: 'anual',
      name: 'Plano anual',
      price: 87,
      period: '/mês',
      highlight: true,
      // Confirme a condição comercial real antes de publicar.
      billing:
        'Valor equivalente a R$ 87/mês. Cobrança anual em pagamento único de R$ 1.044 por 12 meses de uso.',
    },
    {
      id: 'mensal',
      name: 'Plano mensal',
      price: 137,
      period: '/mês',
      highlight: false,
      billing: 'Cobrança mensal de R$ 137. Sem fidelidade.',
    },
  ],

  // Valores iniciais da calculadora de compra.
  calculator: { resale: 31000, margin: 35, costs: 2000, asking: 17500 },
};

/** Resolve o destino de um CTA, com fallback explícito para a seção de planos. */
export function ctaHref(key) {
  const cta = CONFIG.ctas[key];
  if (cta && cta.href) return cta.href;
  if (import.meta.env.DEV)
    console.warn(`[AutoPainel] Destino do CTA "${key}" não configurado em src/autopainel/config.js`);
  return '#planos';
}
