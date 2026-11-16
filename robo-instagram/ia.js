// Headline e legenda escritas pelo Gemini (Google). Precisa de GEMINI_API_KEY no .env.
// Sem a chave (ou se o Gemini falhar), o robô usa a headline tirada da legenda do TikTok
// e a legenda padrão do config.js.
// Tenta estes modelos em ordem (o Google aposenta modelos antigos de tempos em tempos)
const MODELOS = (process.env.GEMINI_MODELO || 'gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.8-flash').split(',').map((m) => m.trim()).filter(Boolean);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const temChave = () => Boolean(process.env.GEMINI_API_KEY);

const INSTRUCOES = `Você escreve posts para o perfil de Instagram "{nome}" (@{conta}), de achadinhos de produtos
baratos e úteis para o público brasileiro. Recebe alguns quadros (imagens) tirados do vídeo e a legenda original
dele no TikTok (pode ter hashtags, erros, ou ser vaga tipo "olha o final").

O MAIS IMPORTANTE: descreva o produto que APARECE NAS IMAGENS. A legenda original só ajuda; se ela não bater com
as imagens, siga as imagens. Se não der pra saber exatamente o que é, fale do que se vê (cor, formato, uso
visível) sem inventar função, marca ou tipo de produto.

Responda SÓ com um JSON assim:
{"produto": "...", "headline": "...", "legenda": "..."}

- produto: nome curto e genérico do produto, 2 a 4 palavras, minúsculas (ex.: "lousa mágica infantil").
- headline: frase que aparece escrita em cima do vídeo. É um GANCHO FORTE de curiosidade, em 1ª pessoa, como
  se fosse uma amiga falando, e NÃO DIZ QUAL É O PRODUTO (nada de nome, tipo, cor ou material dele) — quem
  lê precisa assistir o vídeo pra descobrir. Combine com o clima do produto (útil, bonito, engraçado, prático).
  Exemplos do estilo (não copie, crie variações):
    "Não acredito que eu precisava disso esse tempo todo"
    "Por que ninguém me contou disso antes?"
    "Comprei por curiosidade e agora não vivo sem"
    "Isso aqui devia ser proibido de tão bom"
    "Meu marido riu quando eu comprei. Agora ele usa todo dia"
  Português do Brasil, informal, de 30 a 80 caracteres, pode terminar com 1 emoji. Sem hashtag, sem @, sem
  preço, sem "link na bio", sem "achadinho".
- legenda: legenda do post. 1ª linha outro gancho forte (também sem revelar o produto); depois 1 ou 2 linhas
  dizendo o que é o produto (o que aparece nas imagens) e por que é útil;
  depois um convite pra salvar e mandar pra alguém; depois "Segue @{conta} pra mais achadinhos 🛍️";
  no fim 5 a 8 hashtags em português sobre achadinhos e o produto. Máximo 600 caracteres.
  Não invente preço, desconto, marca, loja ou link. Use 2 a 4 emojis no total.`;

// imagens: quadros do vídeo em JPEG (Buffers). Sem imagens, escreve só pela legenda original.
// usadas: headlines dos posts recentes (pra não repetir)
async function gerarTextos(tituloOriginal, { nome, conta, imagens = [], usadas = [] }) {
  if (!temChave()) return null;
  const prompt = INSTRUCOES.replace(/\{nome\}/g, nome).replace(/\{conta\}/g, conta) +
    '\n\nA headline tem que ser NOVA: não copie os exemplos ao pé da letra' +
    (usadas.length ? ' e não repita nem parafraseie estas, que já foram usadas:\n' + usadas.map((h) => '- ' + h).join('\n') : '.') +
    `\n\nLegenda original do vídeo:\n"""${String(tituloOriginal || '(sem legenda)').slice(0, 800)}"""` +
    (imagens.length ? `\n\nA seguir, ${imagens.length} quadros do vídeo em ordem.` : '\n\n(Não há imagens deste vídeo.)');
  const partes = [{ text: prompt }, ...imagens.map((b) => ({ inline_data: { mime_type: 'image/jpeg', data: b.toString('base64') } }))];
  // Cada modelo: até 3 tentativas quando o Gemini está ocupado (503/429)
  let json = null, ultimoErro = '';
  fora: for (const modelo of MODELOS) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: partes }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
        }),
      });
      const j = await resp.json().catch(() => ({}));
      if (resp.ok) { json = j; break fora; }
      ultimoErro = `${modelo}: ${(j.error && j.error.message) || resp.status}`;
      if (resp.status === 503 || resp.status === 429 || resp.status === 500) { await espera(4000 * (tentativa + 1)); continue; }
      break; // outro erro (ex.: modelo indisponível): passa pro próximo modelo
    }
  }
  if (!json) throw new Error('Gemini: ' + ultimoErro);
  const texto = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  const dados = JSON.parse(texto.replace(/^```(json)?|```$/g, '').trim());
  const headline = String(dados.headline || '').replace(/[#@]\S+/g, '').trim().slice(0, 120);
  const legenda = String(dados.legenda || '').trim().slice(0, 2000);
  if (!headline || !legenda) throw new Error('Gemini devolveu texto vazio');
  return { produto: String(dados.produto || '').toLowerCase().trim(), headline, legenda };
}

module.exports = { gerarTextos, temChave };
