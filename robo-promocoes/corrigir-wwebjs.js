// Correção para a biblioteca whatsapp-web.js (1.34.x) com o WhatsApp Web atual:
// ao mandar FOTO, um campo interno da mídia (__x_id / id) sobrescrevia o id da
// mensagem e o envio falhava com "Data passed to getter must include an id property".
// Referência: github.com/wwebjs/whatsapp-web.js/issues/201922 (PRs #201923, #201938).
//
// Roda quando o robô liga: aplica a correção uma vez no arquivo da biblioteca.
// Se a biblioteca for atualizada e já vier corrigida (ou mudar o trecho), não faz nada.
const fs = require('fs');
const path = require('path');

const MARCA = '/* corrigido-pelo-robo: id da mensagem com midia */';

function corrigir() {
  let arquivo;
  try {
    arquivo = path.join(path.dirname(require.resolve('whatsapp-web.js/package.json')), 'src', 'util', 'Injected', 'Utils.js');
  } catch {
    return 'biblioteca não encontrada';
  }
  let codigo = fs.readFileSync(arquivo, 'utf8');
  if (codigo.includes(MARCA)) return 'já corrigida';

  const trecho = `            ...extraOptions,
        };
`;
  if (!codigo.includes(trecho)) return 'trecho não encontrado (talvez a biblioteca já tenha a correção)';

  codigo = codigo.replace(
    trecho,
    `${trecho}        ${MARCA}
        delete message.__x_id;
        message.id = newMsgKey;
`,
  );
  fs.writeFileSync(arquivo, codigo);
  return 'correção aplicada';
}

try {
  const resultado = corrigir();
  if (resultado !== 'já corrigida') console.log('Correção do envio de fotos:', resultado);
} catch (erro) {
  console.log('Não consegui aplicar a correção do envio de fotos:', erro.message);
}
