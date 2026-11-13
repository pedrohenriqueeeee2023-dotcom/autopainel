// Headline e legenda escritas pelo Gemini (Google). Precisa de GEMINI_API_KEY no .env.
// Sem a chave (ou se o Gemini falhar), o robô usa a headline tirada da legenda do TikTok
// e a legenda padrão do config.js.
// Tenta estes modelos em ordem (o Google aposenta modelos antigos de tempos em tempos)
const MODELOS = (process.env.GEMINI_MODELO || 'gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3.8-flash').split(',').map((m) => m.trim()).filter(Boolean);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const temChave = () => Boolean(process.env.GEMINI_API_KEY);

const INSTRUCOES = `Você escreve posts para o perfil de Instagram "{nome}" (@{conta}), de achadinhos de produtos
baratos e úteis para o público brasileiro. Recebe a legenda original de um vídeo de produto (pode ter hashtags e erros).

Responda SÓ com um JSON assim:
{"produto": "...", "headline": "...", "legenda": "..."}

- produto: nome curto e genérico do produto, 2 a 4 palavras, minúsculas (ex.: "lousa mágica infantil").
- headline: frase curta que aparece escrita em cima do vídeo, estilo post de perfil. Português do Brasil,
  informal e curiosa, de 40 a 90 caracteres, termina com 1 emoji. Sem hashtag, sem @, sem preço, sem "link na bio".
- legenda: legenda do post. 1ª linha um gancho forte; depois 1 ou 2 linhas sobre por que o produto é útil;
  depois um convite pra salvar e mandar pra alguém; depois "Segue @{conta} pra mais achadinhos 🛍️";
  no fim 5 a 8 hashtags em português sobre achadinhos e o produto. Máximo 600 caracteres.
  Não invente preço, desconto, marca, loja ou link. Use 2 a 4 emojis no total.`;

async function gerarTextos(tituloOriginal, { nome, conta }) {
  if (!temChave()) return null;
  const prompt = INSTRUCOES.replace(/\{nome\}/g, nome).replace(/\{conta\}/g, conta) +
    `\n\nLegenda original do vídeo:\n"""${String(tituloOriginal || '(sem legenda)').slice(0, 800)}"""`;
  // Cada modelo: até 3 tentativas quando o Gemini está ocupado (503/429)
  let json = null, ultimoErro = '';
  fora: for (const modelo of MODELOS) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
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
