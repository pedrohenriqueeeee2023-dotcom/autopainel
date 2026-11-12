// Vídeos de produtos, 3x por dia no grupo.
//
// Como funciona:
//  1. Você manda no privado do robô um link de vídeo (TikTok, Reels, Shorts, Kwai).
//  2. O robô baixa (yt-dlp), acha o produto na Shopee com o SEU link de afiliado
//     e edita o vídeo (vertical, preço e desconto em cima, "link na legenda" embaixo).
//  3. Modo aprovação (padrão): ele te manda o vídeo pronto no privado e só posta
//     no grupo depois que você responder "ok N".
//  4. Nos horários de config.videoHorarios (ex.: 10h, 15h, 20h) posta o próximo aprovado.
//
// Segurança: nada aqui posta no grupo fora dos horários, e só se config.videoAtivo
// estiver ligado (vem DESLIGADO). Reiniciar o robô não posta nada na hora.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { buscarProdutoShopee, produtoPorLinkShopee } = require('./shopee');

const PASTA = path.join(__dirname, 'dados', 'videos');
const ARQ_LISTA = path.join(__dirname, 'dados', 'videos.json');
const ARQ_HOJE = path.join(__dirname, 'dados', 'videos-hoje.json');
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const COR = (process.env.COR_NEON || 'ff3d8b').replace('#', '');
const LIMITE_MB = 15; // o WhatsApp aceita até 16 MB sem virar "documento"

// Sites aceitos como link de vídeo
const LINK_VIDEO = /https?:\/\/[^\s]*(tiktok\.com|instagram\.com|youtube\.com\/shorts|youtu\.be|kwai\.com|kw\.ai)[^\s]*/i;

fs.mkdirSync(PASTA, { recursive: true });

function ler() { try { return JSON.parse(fs.readFileSync(ARQ_LISTA, 'utf8')); } catch { return []; } }
function salvar(lista) { fs.writeFileSync(ARQ_LISTA, JSON.stringify(lista.slice(-200), null, 2)); }
function atualizarItem(n, mudancas) {
  const lista = ler();
  const item = lista.find((v) => v.n === n);
  if (!item) return null;
  Object.assign(item, mudancas);
  salvar(lista);
  return item;
}
const pastaDo = (n) => path.join(PASTA, String(n));
const arquivoFinal = (n) => path.join(pastaDo(n), 'final.mp4');

// Roda um programa (yt-dlp/ffmpeg) e devolve a saída; erro traz o fim do stderr
function rodar(cmd, args, cwd, timeoutMin = 6) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err = (err + d).slice(-3000); });
    const t = setTimeout(() => { p.kill('SIGKILL'); reject(new Error(cmd + ' demorou demais')); }, timeoutMin * 60000);
    p.on('error', (e) => {
      clearTimeout(t);
      reject(new Error(e.code === 'ENOENT' ? `${cmd} não está instalado no computador do robô` : e.message));
    });
    p.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) resolve(out);
      else reject(new Error(`${path.basename(cmd)} falhou: ` + (err.trim().split('\n').pop() || 'código ' + code)));
    });
  });
}

// ---------- Palavras do produto a partir da legenda do vídeo ----------
const IGNORAR = new Set(('achadinho achadinhos achado achados shopee shein mercadolivre aliexpress link bio ' +
  'na no da do de para pra com sem que e o a os as um uma meu minha seu sua esse essa isso aqui ' +
  'achei comprei amei ameiii testei usei vale pena vem ver veja olha olhem gente vcs voces você viral fyp foryou ' +
  'foryoupage parati paravoce tiktok tiktokmademebuyit reels shorts trend promo promocao promoção ' +
  'oferta ofertas desconto barato barata comprinhas compras unboxing review resenha dica dicas casa ' +
  'este esta esse essa último ultimo última ultima melhor melhores novo nova novidade super top coisa coisas ' +
  'produto produtos item itens app loja tudo muito mais hoje agora corre garantir marca comenta comentários ' +
  'achou maravilhoso maravilhosos maravilhosa útil úteis util uteis lindo linda perfeito perfeita incrível incrivel amo ' +
  'descrição descricao perfil video vídeo ela ele elas eles você voce quem também tambem ama bom boa').split(' '));
// Começos de palavra que nunca são o produto (#shopeefinds, #achadinhosdashopee, #fypシ...)
const IGNORAR_INICIO = /^(shopee|achad|achei|fyp|fy|foryou|viral|tiktok|reels|link|promo|oferta|comprinha)/;

// Texto livre da legenda primeiro; hashtags (que costumam ser genéricas) só completam
function palavrasDaLegenda(texto) {
  const semLinks = String(texto || '').replace(/https?:\/\/\S+/g, ' ').replace(/@\S+/g, ' ');
  const tags = (semLinks.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.slice(1));
  const livre = semLinks.replace(/#[\p{L}\p{N}_]+/gu, ' ');
  const separar = (s) => s.replace(/[^\p{L}\p{N}\s]/gu, ' ').toLowerCase().split(/\s+/);
  const candidatas = [...separar(livre), ...separar(tags.join(' '))]
    .filter((p) => p.length >= 3 && !/^\d+$/.test(p) && !IGNORAR.has(p) && !IGNORAR_INICIO.test(p));
  // Tira repetidas e as cortadas ("utensil" quando também tem "utensilios")
  const unicas = [...new Set(candidatas)].filter((p, _, todas) => !todas.some((o) => o !== p && o.startsWith(p) && o.length - p.length <= 3));
  return unicas.slice(0, 4).join(' ');
}

// ---------- Etapas ----------

async function baixar(item) {
  const pasta = pastaDo(item.n);
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });
  await rodar(YTDLP, [
    '--no-playlist', '--no-warnings', '--no-progress',
    '-f', 'b[ext=mp4][vcodec^=avc]/b[ext=mp4]/bv*+ba/b',
    '-S', 'res:1080',
    '--merge-output-format', 'mp4',
    '--max-filesize', '300M',
    '--write-info-json',
    '-o', 'orig.%(ext)s',
    item.url,
  ], pasta);
  const orig = fs.readdirSync(pasta).find((f) => f.startsWith('orig.') && !f.endsWith('.json') && !f.endsWith('.part'));
  if (!orig) throw new Error('o vídeo não foi baixado');
  let info = {};
  try { info = JSON.parse(fs.readFileSync(path.join(pasta, 'orig.info.json'), 'utf8')); } catch {}
  return { orig, legendaOriginal: [info.title, info.description].filter(Boolean).join(' ').slice(0, 500) };
}

// Acha a fonte para escrever no vídeo (copia para a pasta do vídeo: evita problema de caminho no ffmpeg)
function prepararFonte(pasta) {
  const candidatos = [
    process.env.FONTE_VIDEO,
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    'C:\\Windows\\Fonts\\arialbd.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  ].filter(Boolean);
  const achada = candidatos.find((c) => { try { return fs.existsSync(c); } catch { return false; } });
  if (!achada) return false;
  fs.copyFileSync(achada, path.join(pasta, 'fonte.ttf'));
  return true;
}

const reais = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');

// Edita: 720x1280, até 60s, faixa de preço em cima e "link na legenda" embaixo, H.264 leve
async function editar(item) {
  const pasta = pastaDo(item.n);
  const p = item.produto;
  const linhas = [];
  if (p && p.preco) linhas.push(p.desconto > 0 ? `${reais(p.preco)}  •  ${p.desconto}% OFF` : reais(p.preco));
  const temFonte = prepararFonte(pasta);
  fs.writeFileSync(path.join(pasta, 'topo.txt'), linhas[0] || 'ACHADINHO DO DIA');
  fs.writeFileSync(path.join(pasta, 'base.txt'), 'LINK NA LEGENDA');

  const filtros = [
    'scale=720:1280:force_original_aspect_ratio=decrease',
    'pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black',
    'setsar=1',
  ];
  if (temFonte) {
    filtros.push(
      `drawtext=fontfile=fonte.ttf:textfile=topo.txt:fontsize=46:fontcolor=white:box=1:boxcolor=0x${COR}@0.92:boxborderw=22:x=(w-text_w)/2:y=110`,
      `drawtext=fontfile=fonte.ttf:textfile=base.txt:fontsize=38:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=18:x=(w-text_w)/2:y=h-230`,
    );
  }

  const comprimir = (crf) => rodar(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', item.orig, '-t', '60',
    '-vf', filtros.join(','),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-maxrate', '2500k', '-bufsize', '5000k',
    '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
    '-movflags', '+faststart',
    'final.mp4',
  ], pasta, 10);

  await comprimir(26);
  if (fs.statSync(arquivoFinal(item.n)).size > LIMITE_MB * 1024 * 1024) await comprimir(33);
}

async function acharProduto(item) {
  if (!item.palavras) return null;
  try { return await buscarProdutoShopee(item.palavras); } catch { return null; }
}

// ---------- O módulo ----------

function criarVideos({ config, registrar, enviarParaDono, enviarNoGrupo, montarTexto, ligouEm }) {
  let ocupado = false;

  function legenda(item) {
    if (!item.produto) return null;
    return montarTexto({ ...item.produto, titulo: item.produto.titulo }).replace(/^\S+/, '🎬');
  }

  function resumo(v) {
    const p = v.produto;
    return `#${v.n} · ${ROTULO[v.status] || v.status}${p ? ' · ' + p.titulo.slice(0, 50) : ''}`;
  }

  async function mandarPrevia(item) {
    const p = item.produto;
    let texto = `🎬 *Vídeo #${item.n} pronto*\n\n`;
    if (p) {
      texto += `Produto que achei: *${p.titulo}*\n${p.preco ? reais(p.preco) : ''}${p.desconto ? ` (${p.desconto}% OFF)` : ''}\n${p.link}\n\n`;
    } else {
      texto += `⚠️ Não achei o produto na Shopee${item.palavras ? ` (procurei "${item.palavras}")` : ''}.\n\n`;
    }
    texto += (p ? `✅ *ok ${item.n}* para aprovar (posta no próximo horário)\n` : '') +
      `🔎 *produto ${item.n} nome do produto* para procurar de novo\n` +
      `🔗 *link ${item.n} https://...* para usar um link da Shopee\n` +
      `🗑️ *nao ${item.n}* para descartar`;
    await enviarParaDono({ arquivo: arquivoFinal(item.n), texto });
  }

  // Baixa, acha o produto, edita e manda a prévia (um vídeo por vez)
  async function processarFila() {
    if (ocupado) return;
    ocupado = true;
    try {
      for (;;) {
        const item = ler().find((v) => v.status === 'novo');
        if (!item) break;
        try {
          atualizarItem(item.n, { status: 'baixando' });
          registrar(`Vídeo #${item.n}: baixando...`);
          const { orig, legendaOriginal } = await baixar(item);
          const palavras = palavrasDaLegenda(legendaOriginal);
          Object.assign(item, { orig, legendaOriginal, palavras });
          item.produto = await acharProduto(item);
          atualizarItem(item.n, { status: 'editando', orig, legendaOriginal, palavras, produto: item.produto });
          registrar(`Vídeo #${item.n}: editando${item.produto ? ' (produto: ' + item.produto.titulo.slice(0, 40) + ')' : ' (produto não encontrado)'}...`);
          await editar(item);
          await concluir(item);
        } catch (erro) {
          atualizarItem(item.n, { status: 'erro', erro: erro.message });
          registrar(`Vídeo #${item.n}: erro — ${erro.message}`);
          enviarParaDono({ texto: `❌ Não consegui preparar o vídeo #${item.n}: ${erro.message}` }).catch(() => {});
        }
      }
    } finally {
      ocupado = false;
    }
  }

  // Depois de editar: vai para aprovação, ou direto para "pronto" se a aprovação estiver desligada
  async function concluir(item) {
    const precisaAprovar = config.videoAprovacao || !item.produto;
    atualizarItem(item.n, { status: precisaAprovar ? 'aguardando' : 'pronto', erro: null });
    registrar(`Vídeo #${item.n}: ${precisaAprovar ? 'enviado para você aprovar' : 'pronto para postar'}.`);
    try { await mandarPrevia(item); } catch (e) { registrar(`Vídeo #${item.n}: não consegui mandar a prévia (${e.message}).`); }
  }

  function adicionar(url) {
    const m = String(url || '').match(LINK_VIDEO);
    if (!m) return { ok: false, erro: 'Mande um link do TikTok, Instagram (Reels), YouTube Shorts ou Kwai.' };
    const lista = ler();
    const repetido = lista.find((v) => v.url === m[0] && !['erro', 'recusado'].includes(v.status));
    if (repetido) return { ok: false, erro: `Esse vídeo já está na lista (#${repetido.n}).` };
    const n = (lista.reduce((max, v) => Math.max(max, v.n), 0) || 0) + 1;
    lista.push({ n, url: m[0], status: 'novo', criadoEm: Date.now() });
    salvar(lista);
    registrar(`Vídeo #${n} recebido: ${m[0]}`);
    processarFila();
    return { ok: true, n };
  }

  // Troca o produto (por nome ou link da Shopee) e refaz a edição com o preço novo
  async function trocarProduto(n, { palavras, link }) {
    const item = ler().find((v) => v.n === n);
    if (!item || !item.orig) throw new Error(`Não achei o vídeo #${n} (ou ele ainda está baixando).`);
    if (!['aguardando', 'pronto'].includes(item.status)) throw new Error(`O vídeo #${n} está "${ROTULO[item.status] || item.status}".`);
    let produto = null;
    if (link) {
      if (/shopee\.|shp\.ee/i.test(link)) produto = await produtoPorLinkShopee(link);
      if (!produto) {
        // Link de outra loja (ex.: ML): usa como está, sem preço
        produto = { id: 'link-' + n, loja: /mercadoli|meli\.la/i.test(link) ? 'Mercado Livre' : 'Loja', titulo: item.produto?.titulo || item.palavras || 'Achadinho', link };
      }
    } else {
      item.palavras = palavras;
      produto = await buscarProdutoShopee(palavras);
      if (!produto) throw new Error(`Não achei "${palavras}" na Shopee.`);
    }
    item.produto = produto;
    atualizarItem(n, { status: 'editando', produto, palavras: item.palavras });
    await editar(item);
    await concluir(item);
  }

  function aprovar(n) {
    const item = ler().find((v) => v.n === n);
    if (!item) return { ok: false, erro: `Não achei o vídeo #${n}.` };
    if (!item.produto) return { ok: false, erro: `O vídeo #${n} ainda não tem produto. Use "produto ${n} nome" ou "link ${n} https://...".` };
    if (item.status !== 'aguardando') return { ok: false, erro: `O vídeo #${n} está "${ROTULO[item.status] || item.status}".` };
    atualizarItem(n, { status: 'pronto' });
    registrar(`Vídeo #${n} aprovado.`);
    return { ok: true };
  }

  function descartar(n) {
    const item = atualizarItem(n, { status: 'recusado' });
    if (!item) return { ok: false, erro: `Não achei o vídeo #${n}.` };
    fs.rmSync(pastaDo(n), { recursive: true, force: true });
    registrar(`Vídeo #${n} descartado.`);
    return { ok: true };
  }

  // ---------- Horários ----------
  function hoje() {
    const dia = new Date().toDateString();
    try { const h = JSON.parse(fs.readFileSync(ARQ_HOJE, 'utf8')); if (h.dia === dia) return h; } catch {}
    return { dia, feitos: [] };
  }
  function marcarHorario(hora) {
    const h = hoje();
    h.feitos.push(hora);
    fs.writeFileSync(ARQ_HOJE, JSON.stringify(h));
  }

  let postando = false;
  async function tick({ conectado }) {
    if (!config.videoAtivo || !conectado || postando) return;
    if (Date.now() - ligouEm < 10 * 60 * 1000) return; // nunca posta logo depois de ligar
    const horaAgora = new Date().getHours();
    // Só vale DENTRO da hora marcada (das 15h às 15h59): horário perdido não é compensado depois
    const hora = (config.videoHorarios || []).find((h) => h === horaAgora);
    if (hora === undefined || hoje().feitos.includes(hora)) return;

    const item = ler().find((v) => v.status === 'pronto');
    if (!item) {
      marcarHorario(hora);
      registrar(`Horário de vídeo das ${hora}h sem vídeo aprovado.`);
      enviarParaDono({ texto: `⚠️ Chegou o horário de vídeo das ${hora}h e não tinha nenhum vídeo aprovado. Mande links de vídeos no meu privado.` }).catch(() => {});
      return;
    }
    postando = true;
    try {
      await enviarNoGrupo({ arquivo: arquivoFinal(item.n), texto: legenda(item) });
      marcarHorario(hora);
      atualizarItem(item.n, { status: 'postado', postadoEm: Date.now() });
      registrar(`Vídeo #${item.n} postado no grupo: ${item.produto.titulo}`);
      fs.rmSync(pastaDo(item.n), { recursive: true, force: true }); // libera espaço
      const restam = ler().filter((v) => v.status === 'pronto').length;
      if (restam < 2) enviarParaDono({ texto: `📉 Restam ${restam} vídeo(s) aprovado(s). Mande mais links de vídeo no meu privado.` }).catch(() => {});
    } catch (erro) {
      registrar(`Falha ao postar o vídeo #${item.n}: ${erro.message} (tento de novo em 30s)`);
    } finally {
      postando = false;
    }
  }

  // ---------- Comandos pelo WhatsApp (o robô só chama isto para o número DONO) ----------
  // Devolve o texto de resposta, ou null se a mensagem não é sobre vídeos
  async function comando(texto) {
    let m;
    if ((m = texto.match(/^ok\s+#?(\d+)$/i))) {
      const r = aprovar(Number(m[1]));
      return r.ok ? `✅ Vídeo #${m[1]} aprovado. Vai no próximo horário (${(config.videoHorarios || []).join('h, ')}h).${config.videoAtivo ? '' : '\n⚠️ Os vídeos estão desligados no painel.'}` : '❌ ' + r.erro;
    }
    if ((m = texto.match(/^n[aã]o\s+#?(\d+)$/i))) {
      const r = descartar(Number(m[1]));
      return r.ok ? `🗑️ Vídeo #${m[1]} descartado.` : '❌ ' + r.erro;
    }
    if ((m = texto.match(/^produto\s+#?(\d+)\s+(.+)$/i))) {
      trocarProduto(Number(m[1]), { palavras: m[2].trim() })
        .catch((e) => enviarParaDono({ texto: '❌ ' + e.message }).catch(() => {}));
      return `🔎 Procurando "${m[2].trim()}" e refazendo o vídeo #${m[1]}...`;
    }
    if ((m = texto.match(/^link\s+#?(\d+)\s+(https?:\/\/\S+)$/i))) {
      trocarProduto(Number(m[1]), { link: m[2] })
        .catch((e) => enviarParaDono({ texto: '❌ ' + e.message }).catch(() => {}));
      return `🔗 Usando esse link e refazendo o vídeo #${m[1]}...`;
    }
    if (/^v[ií]deos?$/i.test(texto)) {
      const ativos = ler().filter((v) => !['postado', 'recusado'].includes(v.status)).slice(-15);
      if (!ativos.length) return '🎬 Nenhum vídeo na lista. Me mande links de vídeos de produtos.';
      return '🎬 *Vídeos*\n' + ativos.map(resumo).join('\n');
    }
    if (LINK_VIDEO.test(texto)) {
      const r = adicionar(texto);
      return r.ok ? `📥 Recebi! Vídeo #${r.n}: vou baixar, achar o produto e editar. Te mando pra aprovar.` : '❌ ' + r.erro;
    }
    return null;
  }

  function listar() {
    return ler().filter((v) => v.status !== 'recusado').slice(-30).reverse()
      .map(({ n, url, status, erro, produto, palavras, criadoEm, postadoEm }) => ({ n, url, status, erro, produto, palavras, criadoEm, postadoEm }));
  }

  // Se o robô reiniciou no meio de um download/edição, recomeça esses
  const lista = ler();
  for (const v of lista) if (v.status === 'baixando' || v.status === 'editando') v.status = 'novo';
  salvar(lista);
  setTimeout(processarFila, 5000);

  return { adicionar, aprovar, descartar, trocarProduto, comando, tick, listar, arquivoFinal, processarFila };
}

const ROTULO = {
  novo: 'na fila', baixando: 'baixando', editando: 'editando', aguardando: 'esperando sua aprovação',
  pronto: 'aprovado', postado: 'postado', erro: 'erro', recusado: 'descartado',
};

module.exports = { criarVideos, palavrasDaLegenda, LINK_VIDEO, ROTULO };
