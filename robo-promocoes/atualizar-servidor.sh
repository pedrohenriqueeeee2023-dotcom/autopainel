#!/usr/bin/env bash
# Baixa a versão nova do robô do GitHub e reinicia. Rode no servidor:
#   bash ~/robo-laureta/robo-promocoes/atualizar-servidor.sh
set -euo pipefail
cd "$HOME/robo-laureta"
# O npm install às vezes mexe no package-lock.json do servidor; descarta isso antes de baixar
git checkout -- robo-promocoes/package-lock.json 2>/dev/null || true
git pull --ff-only
cd robo-promocoes
PUPPETEER_SKIP_DOWNLOAD=true npm install --omit=dev --no-audit --no-fund --loglevel=error
pm2 restart robo --update-env
echo "Robô atualizado e reiniciado."
