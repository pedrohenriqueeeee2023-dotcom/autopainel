// API oficial do Instagram (Graph API da Meta).
// Precisa de: conta profissional ligada a uma Página do Facebook, um app da Meta
// e um token com instagram_basic, instagram_content_publish e pages_show_list.
const fs = require('fs');

const VERSAO = process.env.IG_API_VERSION || 'v23.0';
const BASE = `https://graph.facebook.com/${VERSAO}`;

const usuario = () => {
  if (!process.env.IG_USER_ID || !process.env.IG_TOKEN) throw new Error('Preencha IG_USER_ID e IG_TOKEN no .env');
  return process.env.IG_USER_ID;
};

async function chamar(metodo, caminho, params = {}) {
  const url = new URL(BASE + caminho);
  const corpo = new URLSearchParams({ ...params, access_token: process.env.IG_TOKEN });
  let resp;
  if (metodo === 'GET') {
    for (const [k, v] of corpo) url.searchParams.set(k, v);
    resp = await fetch(url);
  } else {
    resp = await fetch(url, { method: metodo, body: corpo });
  }
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || json.error) {
    const e = json.error || {};
    throw new Error(`Instagram: ${e.message || resp.status}${e.code ? ' (código ' + e.code + ')' : ''}`);
  }
  return json;
}

async function minhaConta() {
  return chamar('GET', '/' + usuario(), { fields: 'username,name,followers_count,media_count' });
}

// ---------- Busca por hashtag (Reels populares) ----------
// Limite da Meta: 30 hashtags diferentes por semana. O id de cada uma fica guardado.
async function idDaHashtag(tag, cache) {
  const chave = tag.toLowerCase();
  if (cache[chave]) return cache[chave];
  const r = await chamar('GET', '/ig_hashtag_search', { user_id: usuario(), q: chave });
  const id = r.data && r.data[0] && r.data[0].id;
  if (!id) throw new Error(`hashtag #${tag} não encontrada`);
  cache[chave] = id;
  return id;
}

async function videosDaHashtag(hashtagId, tipo = 'top_media') {
  const r = await chamar('GET', `/${hashtagId}/${tipo}`, {
    user_id: usuario(),
    fields: 'id,media_type,media_url,permalink,caption,like_count,comments_count,timestamp',
    limit: 50,
  });
  return (r.data || []).filter((m) => m.media_type === 'VIDEO' && m.media_url);
}

// ---------- Postar um Reels (envio direto do arquivo, sem precisar de link público) ----------
async function postarReels(arquivo, legenda, registrar = () => {}) {
  const tamanho = fs.statSync(arquivo).size;
  const cont = await chamar('POST', `/${usuario()}/media`, {
    media_type: 'REELS',
    upload_type: 'resumable',
    caption: legenda,
    share_to_feed: 'true',
  });
  registrar(`Enviando o vídeo pro Instagram (${Math.round(tamanho / 1024 / 1024)} MB)...`);
  const up = await fetch(`https://rupload.facebook.com/ig-api-upload/${VERSAO}/${cont.id}`, {
    method: 'POST',
    headers: { Authorization: 'OAuth ' + process.env.IG_TOKEN, offset: '0', file_size: String(tamanho) },
    body: fs.readFileSync(arquivo),
  });
  const upJson = await up.json().catch(() => ({}));
  if (!up.ok || upJson.success === false) throw new Error('Falha ao enviar o arquivo: ' + JSON.stringify(upJson).slice(0, 300));

  // O Instagram processa o vídeo antes de deixar publicar (até ~5 min)
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    const st = await chamar('GET', '/' + cont.id, { fields: 'status_code,status' });
    if (st.status_code === 'FINISHED') {
      const pub = await chamar('POST', `/${usuario()}/media_publish`, { creation_id: cont.id });
      const info = await chamar('GET', '/' + pub.id, { fields: 'permalink' }).catch(() => ({}));
      return { id: pub.id, permalink: info.permalink };
    }
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
      throw new Error('O Instagram recusou o vídeo: ' + (st.status || st.status_code));
    }
  }
  throw new Error('O Instagram demorou demais pra processar o vídeo');
}

// ---------- Token: avisa quando estiver perto de vencer e tenta renovar ----------
async function diasParaVencer() {
  if (!process.env.FB_APP_ID || !process.env.FB_APP_SECRET) return null;
  const r = await fetch(`${BASE}/debug_token?input_token=${encodeURIComponent(process.env.IG_TOKEN)}` +
    `&access_token=${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`).then((x) => x.json());
  const exp = r.data && r.data.expires_at;
  if (!exp) return Infinity; // token que não vence (ex.: token de página)
  return (exp * 1000 - Date.now()) / 86400000;
}

async function renovarToken() {
  const url = `${BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FB_APP_ID}` +
    `&client_secret=${process.env.FB_APP_SECRET}&fb_exchange_token=${encodeURIComponent(process.env.IG_TOKEN)}`;
  const r = await fetch(url).then((x) => x.json());
  if (!r.access_token) throw new Error((r.error && r.error.message) || 'não consegui renovar o token');
  return r.access_token;
}

module.exports = { minhaConta, idDaHashtag, videosDaHashtag, postarReels, diasParaVencer, renovarToken };
