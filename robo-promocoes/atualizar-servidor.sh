#!/usr/bin/env bash
# Baixa a versão nova do robô do GitHub e reinicia. Rode no servidor:
#   bash ~/robo-laureta/robo-promocoes/atualizar-servidor.sh   (ou a pasta de outro robô)
# O nome no pm2 vem de PM2_NOME no .env (padrão: robo)
set -euo pipefail
PASTA_ROBO="$(cd "$(dirname "$0")" && pwd)"
cd "$PASTA_ROBO/.."
# O npm install às vezes mexe no package-lock.json do servidor; descarta isso antes de baixar
git checkout -- robo-promocoes/package-lock.json 2>/dev/null || true
git pull --ff-only
cd "$PASTA_ROBO"
PUPPETEER_SKIP_DOWNLOAD=true npm install --omit=dev --no-audit --no-fund --loglevel=error
NOME_PM2="$(grep '^PM2_NOME=' .env 2>/dev/null | cut -d= -f2- || true)"
pm2 restart "${NOME_PM2:-robo}" --update-env
echo "Robô atualizado e reiniciado."
