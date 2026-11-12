// Coloca o vídeo no nosso layout (1080x1920):
//   fundo na cor da marca, logo + nome em cima, vídeo no meio, faixa "siga" embaixo.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';
const MARCA = path.join(__dirname, 'marca');

function rodar(cmd, args, cwd, timeoutMin = 15) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err = (err + d).slice(-3000); });
    const t = setTimeout(() => { p.kill('SIGKILL'); reject(new Error(cmd + ' demorou demais')); }, timeoutMin * 60000);
    p.on('error', (e) => { clearTimeout(t); reject(new Error(e.code === 'ENOENT' ? `${cmd} não está instalado` : e.message)); });
    p.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) resolve(out);
      else reject(new Error(`${path.basename(cmd)} falhou: ` + (err.trim().split('\n').pop() || 'código ' + code)));
    });
  });
}

async function duracao(arquivo) {
  const out = await rodar(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', arquivo]);
  return Number(out.trim()) || 0;
}

async function temAudio(arquivo) {
  const out = await rodar(FFPROBE, ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', arquivo]);
  return out.trim().length > 0;
}

// pasta: onde está "orig.mp4"; gera "final.mp4" na mesma pasta
async function editar(pasta, marca) {
  fs.copyFileSync(path.join(MARCA, 'fonte.ttf'), path.join(pasta, 'fonte.ttf'));
  fs.copyFileSync(path.join(MARCA, 'logo.png'), path.join(pasta, 'logo.png'));
  fs.writeFileSync(path.join(pasta, 't1.txt'), marca.nome.toUpperCase());
  fs.writeFileSync(path.join(pasta, 't2.txt'), marca.subtitulo);
  fs.writeFileSync(path.join(pasta, 't3.txt'), marca.rodape);

  const dur = Math.min(await duracao(path.join(pasta, 'orig.mp4')), marca.duracaoMaxima || 90);
  const audio = await temAudio(path.join(pasta, 'orig.mp4'));
  const cor = '0x' + marca.cor.replace('#', '');
  const amarelo = '0x' + marca.corDestaque.replace('#', '');
  const escuro = '0x' + marca.corTexto.replace('#', '');
  const fonte = 'fontfile=fonte.ttf';

  const filtro = [
    // vídeo no meio: 1000 de largura, cortado em até 1250 de altura (tira as pontas de cima/baixo)
    '[0:v]scale=1000:-2,crop=1000:min(ih\\,1250),setsar=1,fps=30,' +
      'pad=iw+16:ih+16:8:8:color=white[v]',
    '[1:v]scale=170:170[logo]',
    `[2:v][v]overlay=(W-w)/2:330+(1266-h)/2:shortest=1[a]`,
    '[a][logo]overlay=60:135[b]',
    `[b]drawtext=${fonte}:textfile=t1.txt:fontsize=66:fontcolor=${amarelo}:borderw=7:bordercolor=${escuro}:x=255:y=158,` +
      `drawtext=${fonte}:textfile=t2.txt:fontsize=40:fontcolor=white:borderw=3:bordercolor=${escuro}:x=258:y=248,` +
      `drawtext=${fonte}:textfile=t3.txt:fontsize=50:fontcolor=${escuro}:box=1:boxcolor=${amarelo}:boxborderw=26:x=(w-text_w)/2:y=1650[saida]`,
  ].join(';');

  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', 'orig.mp4',
    '-i', 'logo.png',
    '-f', 'lavfi', '-i', `color=c=${cor}:s=1080x1920:r=30`,
    '-t', String(dur),
    '-filter_complex', filtro,
    '-map', '[saida]',
  ];
  if (audio) args.push('-map', '0:a:0', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100');
  args.push(
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-maxrate', '6M', '-bufsize', '12M',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    'final.mp4',
  );
  await rodar(FFMPEG, args, pasta);
  return path.join(pasta, 'final.mp4');
}

module.exports = { editar, duracao };
