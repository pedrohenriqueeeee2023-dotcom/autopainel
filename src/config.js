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

  /**
   * Dados da empresa (rodapé e Política de Privacidade). Campos vazios ('')
   * não aparecem na página. Preencha com os dados reais.
   */
  company: {
    legalName: '', // Razão social, ex.: 'AutoPainel Tecnologia Ltda.'
    cnpj: '', // ex.: '00.000.000/0001-00'
    address: '', // ex.: 'Rua X, 100, Sala 2, Belo Horizonte (MG), CEP 00000-000'
    email: '', // e-mail de contato e de privacidade, ex.: 'contato@autopainel.app.br'
    phone: '(31) 99185-8934',
    dpo: '', // Encarregado de dados (LGPD, art. 41), ex.: 'Nome Sobrenome'
  },

  ctas: {
    // Oferta: 7 dias de teste. O botão leva direto para criar a conta.
    trial: {
      label: 'Quero testar 7 dias',
      href: 'https://autopainel.app.br/login',
    },
    // Ex.: 'https://wa.me/55XXXXXXXXXXX?text=Quero%20conhecer%20o%20AutoPainel'
    contact: {
      label: 'Falar com a equipe',
      href: 'https://wa.me/5531991858934?text=Quero%20conhecer%20o%20AutoPainel',
    },
  },

  offer: {
    badge: 'Teste de 7 dias',
    text: 'Raio-X grátis e onboarding feito pela nossa equipe.',
  },

  /**
   * Prova social. `example: true` marca dados de exemplo: a página mostra um
   * aviso discreto. Troque pelos números e depoimentos reais antes de publicar
   * e mude para `false`.
   */
  proof: {
    example: true,
    stats: [
      { label: 'revendas usando o painel', value: 37 },
      { label: 'carros anunciados', value: 2480 },
      { label: 'leads atendidos no CRM', value: 9600 },
    ],
    testimonials: [
      {
        text: 'Eu cadastrava o mesmo carro em quatro sites. Hoje publico uma vez e o anúncio já está na OLX e no Mercado Livre.',
        name: 'Ricardo Menezes',
        role: 'Campinas (SP)',
        photo:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces&auto=format&q=70',
      },
      {
        text: 'O aviso de carro compatível me fez ligar para dois clientes que eu teria esquecido. Os dois compraram.',
        name: 'Juliana Prado',
        role: 'Goiânia (GO)',
        photo:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces&auto=format&q=70',
      },
      {
        text: 'Antes de comprar na troca eu digito a placa. Parei de pagar acima do que o carro vale.',
        name: 'André Lopes',
        role: 'Curitiba (PR)',
        photo:
          'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?w=160&h=160&fit=crop&crop=faces&auto=format&q=70',
      },
    ],
  },
};

/** Resolve o destino de um CTA, com fallback explícito para a seção de planos. */
export function ctaHref(key) {
  const cta = CONFIG.ctas[key];
  if (cta && cta.href) return cta.href;
  if (import.meta.env.DEV)
    console.warn(`[AutoPainel] Destino do CTA "${key}" não configurado em src/config.js`);
  return '#planos';
}
