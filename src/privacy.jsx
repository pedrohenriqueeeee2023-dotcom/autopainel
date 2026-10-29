import './styles/base.css';
import './Privacy.css';
import { createRoot } from 'react-dom/client';
import { CONFIG } from './config';
import Footer from './sections/Footer';
import CookieBanner from './CookieBanner';

const UPDATED = '29 de outubro de 2026';

/* Política de Privacidade e de Cookies (LGPD, Lei 13.709/2018). Os dados da
   empresa vêm de CONFIG.company; revise o texto com o seu jurídico. */
function Privacy() {
  const c = CONFIG.company;
  const name = c.legalName || CONFIG.brand.name;
  const contact = c.email ? (
    <>
      e-mail <a href={`mailto:${c.email}`}>{c.email}</a>
    </>
  ) : (
    <>WhatsApp {c.phone}</>
  );

  return (
    <div className="ap">
      <header className="ap-header">
        <a className="ap-logo" href="/" aria-label={`${CONFIG.brand.name} — voltar ao início`}>
          <span className="ap-logo-mark" aria-hidden="true" />
          {CONFIG.brand.name}
        </a>
      </header>
      <main className="pv">
        <a className="pv-back" href="/">
          ← Voltar ao site
        </a>
        <h1>Política de Privacidade e de Cookies</h1>
        <p className="pv-date">Última atualização: {UPDATED}</p>

        <p>
          Esta política explica como {name}
          {c.cnpj && <>, CNPJ {c.cnpj}</>}
          {c.address && <>, com sede em {c.address}</>}
          {(c.cnpj || c.address) && ','} trata os dados pessoais de quem visita{' '}
          {CONFIG.brand.site.replace(/^https?:\/\/|\/$/g, '')} e de quem usa o AutoPainel, de acordo com a Lei
          Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
        </p>

        <h2>1. Quem é o controlador</h2>
        <p>
          O controlador dos dados é {name}. Para qualquer assunto sobre os seus dados, fale com a gente pelo{' '}
          {contact}
          {c.dpo && <>. O nosso encarregado de dados (DPO) é {c.dpo}</>}.
        </p>

        <h2>2. Quais dados coletamos</h2>
        <ul>
          <li>
            <b>Dados de navegação</b>: páginas vistas, cliques, tempo na página, tipo de aparelho e navegador,
            cidade aproximada e endereço IP. Só são coletados por cookies de medição e anúncios se você
            aceitar.
          </li>
          <li>
            <b>Dados que você informa</b>: nome, telefone, e-mail, nome da loja e mensagens, quando cria a
            conta ou fala com a equipe pelo WhatsApp.
          </li>
          <li>
            <b>Dados de uso do sistema</b>: informações cadastradas no painel (veículos, clientes, leads),
            tratadas para prestar o serviço contratado.
          </li>
        </ul>

        <h2>3. Para que usamos e com qual base legal</h2>
        <ul>
          <li>
            Criar e manter a sua conta, fazer o onboarding e prestar o serviço: <b>execução de contrato</b>{' '}
            (art. 7º, V).
          </li>
          <li>
            Responder dúvidas e enviar informações que você pediu:{' '}
            <b>procedimentos preliminares ao contrato</b> e <b>legítimo interesse</b> (art. 7º, V e IX).
          </li>
          <li>
            Medir o desempenho do site e mostrar anúncios do AutoPainel: <b>consentimento</b> (art. 7º, I),
            que você pode retirar a qualquer momento.
          </li>
          <li>
            Cumprir obrigações legais e fiscais e nos defender em processos: <b>obrigação legal</b> e{' '}
            <b>exercício regular de direitos</b> (art. 7º, II e VI).
          </li>
        </ul>

        <h2>4. Com quem compartilhamos</h2>
        <p>
          Não vendemos dados pessoais. Compartilhamos apenas com fornecedores necessários para operar o
          serviço: hospedagem do site (Vercel), medição (Google Analytics), anúncios (Meta) e atendimento
          (WhatsApp). Alguns ficam fora do Brasil; nesses casos a transferência segue o art. 33 da LGPD, com
          cláusulas contratuais e garantias de proteção. Também podemos compartilhar dados quando a lei ou uma
          autoridade exigir.
        </p>

        <h2 id="cookies">5. Cookies</h2>
        <p>
          Cookies são pequenos arquivos guardados no seu navegador. Na primeira visita mostramos um aviso para
          você escolher. Você pode mudar a escolha quando quiser em <b>Preferências de cookies</b>, no rodapé.
        </p>
        <div className="pv-table">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Ferramenta</th>
                <th>Para que serve</th>
                <th>Precisa de aceite?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Necessários</td>
                <td>AutoPainel</td>
                <td>
                  Guardar a sua escolha de cookies, o horário da primeira visita (para contar o prazo da
                  condição especial) e manter o site funcionando.
                </td>
                <td>Não</td>
              </tr>
              <tr>
                <td>Medição</td>
                <td>Google Analytics</td>
                <td>Contar visitas e entender quais partes do site são mais usadas.</td>
                <td>Sim</td>
              </tr>
              <tr>
                <td>Anúncios</td>
                <td>Meta Pixel</td>
                <td>Medir os resultados dos anúncios no Facebook e Instagram.</td>
                <td>Sim</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Você também pode apagar ou bloquear cookies nas configurações do seu navegador.</p>

        <h2>6. Por quanto tempo guardamos</h2>
        <p>
          Guardamos os dados enquanto a sua conta estiver ativa ou enquanto forem necessários para as
          finalidades acima. Depois, eles são apagados ou anonimizados, exceto quando a lei exigir que sejam
          mantidos por mais tempo. Dados de medição seguem o prazo configurado nas ferramentas (até 14 meses
          no Google Analytics).
        </p>

        <h2>7. Segurança</h2>
        <p>
          Todo o site usa conexão criptografada (HTTPS/TLS), indicada pelo cadeado na barra do navegador.
          Adotamos controle de acesso, senhas protegidas e cabeçalhos de segurança para proteger os dados
          contra acesso não autorizado, perda ou vazamento. Se acontecer algum incidente relevante, avisaremos
          os titulares e a ANPD conforme a lei.
        </p>

        <h2>8. Seus direitos</h2>
        <p>Pela LGPD (art. 18), você pode pedir a qualquer momento:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, errados ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>portabilidade dos dados para outro fornecedor;</li>
          <li>informação sobre com quem compartilhamos;</li>
          <li>retirada do consentimento e eliminação dos dados tratados com base nele.</li>
        </ul>
        <p>
          Para exercer seus direitos, fale com a gente pelo {contact}. Respondemos em até 15 dias. Você também
          pode reclamar à Autoridade Nacional de Proteção de Dados (
          <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer">
            ANPD
          </a>
          ).
        </p>

        <h2>9. Mudanças nesta política</h2>
        <p>
          Podemos atualizar esta política. A data no topo mostra a última versão. Mudanças importantes serão
          avisadas no site.
        </p>
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Privacy />);
