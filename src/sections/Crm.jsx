const STEPS = [
  ['0.08', 'Cliente pede um Peugeot 2008 que a loja não tem.'],
  ['0.22', 'O pedido fica registrado no CRM, com orçamento.'],
  ['0.38', 'Um veículo compatível entra no estoque.'],
  ['0.52', 'O sistema identifica a correspondência.'],
  ['0.66', 'O vendedor responsável é notificado.'],
  ['0.8', 'A oportunidade vira ação: contato e visita.'],
];

export default function Crm() {
  return (
    <section id="crm" className="scene scene-crm" data-scene aria-labelledby="crm-title">
      <div className="stage" data-r="0 0.08" data-o="0.96 1">
        <div className="copy">
          <p className="eyebrow accent">02 · CRM inteligente</p>
          <h2 id="crm-title" className="h2">
            <span className="mask" data-r="0.01 0.09">
              <span>O carro chegou.</span>
            </span>
            <span className="mask" data-r="0.04 0.12">
              <span>O vendedor fica sabendo.</span>
            </span>
          </h2>
          <ol className="crm-steps">
            {STEPS.map(([at, text], i) => (
              <li key={at} data-at={at}>
                <span className="crm-step-n">{String(i + 1).padStart(2, '0')}</span>
                {text}
              </li>
            ))}
          </ol>
        </div>

        <div className="crm-board" aria-hidden="true">
          <div className="crm-track">
            <div className="ui-card crm-lead" data-r="0.06 0.16">
              <div className="ui-bar">
                <span className="dot" />
                <span>Cliente</span>
                <span className="crm-status">
                  <span className="s-wait">Aguardando veículo</span>
                  <span className="s-hot">Oportunidade ativa</span>
                </span>
              </div>
              <div className="crm-person">
                <span className="avatar">MS</span>
                <div>
                  <strong>Mariana Souza</strong>
                  <span>Cadastrada há 23 dias</span>
                </div>
              </div>
              <dl className="crm-want" data-at="0.22">
                <div>
                  <dt>Procura</dt>
                  <dd>Peugeot 2008</dd>
                </div>
                <div>
                  <dt>Ano</dt>
                  <dd>2020 ou mais novo</dd>
                </div>
                <div>
                  <dt>Orçamento</dt>
                  <dd>até R$ 85.000</dd>
                </div>
              </dl>
              <p className="crm-empty">Sem veículo compatível no estoque</p>
            </div>

            <div className="crm-match" data-at="0.52">
              <span className="crm-match-line" />
              <span className="crm-match-tag">
                <b>Compatível</b> modelo · ano · orçamento
              </span>
            </div>

            <div className="ui-card crm-car" data-r="0.36 0.48">
              <div className="ui-bar">
                <span className="dot ok" />
                <span>Entrada no estoque</span>
                <span className="ui-tag">hoje, 09:42</span>
              </div>
              <strong>Peugeot 2008 Allure 1.6</strong>
              <span className="muted">2021 · 39.800 km · automático</span>
              <span className="crm-price">R$ 82.900</span>
            </div>

            <div className="crm-notify" data-at="0.66">
              <span className="crm-bell" />
              <div>
                <strong>Carlos, você tem uma oportunidade</strong>
                <span>Peugeot 2008 compatível com Mariana Souza</span>
              </div>
            </div>

            <div className="ui-card crm-opp" data-at="0.8">
              <span className="eyebrow accent">Oportunidade</span>
              <strong>Mariana · Peugeot 2008 2021</strong>
              <div className="crm-opp-actions">
                <span className="ui-btn">Chamar no WhatsApp</span>
                <span className="ui-btn ghost">Agendar visita</span>
              </div>
            </div>
          </div>
        </div>

        <p className="crm-claim" data-r="0.84 0.92">
          Não deixe uma oportunidade de venda <em>esquecida no CRM.</em>
        </p>
      </div>
    </section>
  );
}
