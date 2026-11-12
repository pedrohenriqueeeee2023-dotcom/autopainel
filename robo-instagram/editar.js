// Coloca o vídeo no nosso layout (1080x1920), estilo post de perfil:
//   fundo branco; em cima foto, nome + selo, @usuario e a headline com emoji;
//   embaixo o vídeo ocupando a largura toda.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { gerarCabecalho } = require('./cabecalho');

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';

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

// pasta: onde está "orig.mp4"; gera "cabecalho.png" e "final.mp4" na mesma pasta
// dados: { nome, usuario, headline, verificado, duracaoMaxima }
async function editar(pasta, dados) {
  const altura = await gerarCabecalho(dados, path.join(pasta, 'cabecalho.png'));
  const area = 1920 - altura; // espaço do vídeo

  const dur = Math.min(await duracao(path.join(pasta, 'orig.mp4')), dados.duracaoMaxima || 90);
  const audio = await temAudio(path.join(pasta, 'orig.mp4'));

  const filtro = [
    // vídeo na largura toda; se for mais alto que o espaço, corta o excesso de cima e de baixo
    `[0:v]scale=1080:-2,crop=1080:min(ih\\,${area}),setsar=1,fps=30[v]`,
    `[2:v][1:v]overlay=0:0[a]`,
    `[a][v]overlay=0:${altura}+(${area}-h)/2:shortest=1,format=yuv420p[saida]`,
  ].join(';');

  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', 'orig.mp4',
    '-i', 'cabecalho.png',
    '-f', 'lavfi', '-i', 'color=c=white:s=1080x1920:r=30',
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
