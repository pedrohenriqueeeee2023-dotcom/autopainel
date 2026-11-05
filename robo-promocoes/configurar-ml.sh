#!/usr/bin/env bash
# Guarda as chaves do app de desenvolvedor do Mercado Livre no .env e testa.
# Uso (no servidor): bash ~/robo-laureta/robo-promocoes/configurar-ml.sh
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || cp .env.example .env

definir() {
  local chave="$1" valor="$2"
  grep -v "^${chave}=" .env > .env.tmp || true
  printf '%s=%s\n' "$chave" "$valor" >> .env.tmp
  mv .env.tmp .env
}

echo
echo "Cole os dados do seu app do Mercado Livre (developers.mercadolivre.com.br)."
read -rp "Client ID (ou App ID): " ID < /dev/tty
read -rsp "Client Secret (Chave secreta, não aparece enquanto digita): " SEGREDO < /dev/tty; echo
ID="$(echo "$ID" | tr -d '[:space:]')"; SEGREDO="$(echo "$SEGREDO" | tr -d '[:space:]')"
if [ -z "$ID" ] || [ -z "$SEGREDO" ]; then echo "Faltou algum dos dois. Nada foi salvo."; exit 1; fi
definir ML_CLIENT_ID "$ID"
definir ML_CLIENT_SECRET "$SEGREDO"
chmod 600 .env
echo "Salvo. Testando agora..."
echo
node testar-ml.js
