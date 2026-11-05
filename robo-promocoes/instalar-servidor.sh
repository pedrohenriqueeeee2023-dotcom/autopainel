#!/usr/bin/env bash
# Instala o robô num servidor Ubuntu (feito para a Oracle Cloud grátis, serve em qualquer VPS).
# Uso (no servidor):
#   curl -fsSL https://raw.githubusercontent.com/pedrohenriqueeeee2023-dotcom/autopainel/claude/magical-keller-k5qa0h/robo-promocoes/instalar-servidor.sh | bash
# Pode rodar de novo quantas vezes quiser: ele só arruma o que faltar.
set -euo pipefail

REPO="https://github.com/pedrohenriqueeeee2023-dotcom/autopainel.git"
BRANCH="claude/magical-keller-k5qa0h"
PASTA="$HOME/robo-laureta"
ROBO="$PASTA/robo-promocoes"
PORTA=3000

passo() { printf '\n\033[1;35m== %s ==\033[0m\n' "$1"; }

# Coloca CHAVE=valor no .env (troca se já existir)
definir() {
  local chave="$1" valor="$2"
  grep -v "^${chave}=" .env > .env.tmp || true
  printf '%s=%s\n' "$chave" "$valor" >> .env.tmp
  mv .env.tmp .env
}
valor_atual() { grep "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- || true; }

passo "1/8 Atualizando o servidor"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y git curl ca-certificates

passo "2/8 Acertando o relógio para o horário de Brasília"
sudo timedatectl set-timezone America/Sao_Paulo
date

passo "3/8 Memória extra (swap)"
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
  echo "Já tem swap."
fi

passo "4/8 Node.js"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

passo "5/8 Navegador (o robô usa para abrir o WhatsApp Web)"
ARQ="$(dpkg --print-architecture)"
if [ "$ARQ" = "amd64" ]; then
  if ! [ -x /usr/bin/google-chrome ]; then
    curl -fsSL -o /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y /tmp/chrome.deb
    rm -f /tmp/chrome.deb
  fi
  NAVEGADOR=/usr/bin/google-chrome
else
  # Servidor ARM (o grátis da Oracle): o Chrome do Google não existe para ARM, usamos o Chromium
  command -v snap >/dev/null || sudo apt-get install -y snapd
  [ -x /snap/bin/chromium ] || sudo snap install chromium
  NAVEGADOR=/snap/bin/chromium
fi
echo "Navegador: $NAVEGADOR"
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y fonts-noto-color-emoji >/dev/null 2>&1 || true

passo "6/8 Baixando o robô"
if [ -d "$PASTA/.git" ]; then
  git -C "$PASTA" pull --ff-only
else
  git clone -b "$BRANCH" "$REPO" "$PASTA"
fi
cd "$ROBO"
PUPPETEER_SKIP_DOWNLOAD=true npm install --omit=dev --no-audit --no-fund --loglevel=error


passo "7/8 Configurações (.env)"
[ -f .env ] || cp .env.example .env
definir CHROME_PATH "$NAVEGADOR"

if [ -z "$(valor_atual PAINEL_SENHA)" ]; then
  echo "O painel vai ficar na internet, então precisa de uma senha."
  while true; do
    read -rsp "Crie uma senha para o painel (8+ letras/números, pode usar @ ! . - _): " SENHA < /dev/tty; echo
    if [[ "$SENHA" =~ ^[A-Za-z0-9@!._-]{8,}$ ]]; then break; fi
    echo "Use pelo menos 8 caracteres, só letras, números e @ ! . - _ (sem espaço ou #). Tente de novo."
  done
  definir PAINEL_SENHA "$SENHA"
fi

DONO_ATUAL="$(valor_atual DONO)"
if [ -z "$DONO_ATUAL" ] || [ "$DONO_ATUAL" = "5511999999999" ]; then
  read -rp "Seu número de WhatsApp pessoal com 55 + DDD (ex.: 5511987654321), ou Enter para pular: " DONO < /dev/tty
  [ -n "$DONO" ] && definir DONO "$DONO"
fi

if [ -z "$(valor_atual SHOPEE_APP_ID)" ]; then
  read -rp "SHOPEE_APP_ID (Enter para pular e colocar depois): " SAPP < /dev/tty
  if [ -n "$SAPP" ]; then
    read -rsp "SHOPEE_SECRET: " SSEC < /dev/tty; echo
    definir SHOPEE_APP_ID "$SAPP"
    definir SHOPEE_SECRET "$SSEC"
  fi
fi
chmod 600 .env

# Libera a porta do painel no firewall do próprio servidor (as imagens da Oracle bloqueiam tudo)
if command -v ufw >/dev/null && sudo ufw status | grep -q "Status: active"; then
  sudo ufw allow "$PORTA"/tcp
fi
if command -v iptables >/dev/null && ! sudo iptables -C INPUT -p tcp --dport "$PORTA" -j ACCEPT 2>/dev/null; then
  LINHA="$(sudo iptables -L INPUT --line-numbers | awk '/REJECT/ {print $1; exit}')"
  if [ -n "$LINHA" ]; then
    sudo iptables -I INPUT "$LINHA" -p tcp --dport "$PORTA" -j ACCEPT
  else
    sudo iptables -A INPUT -p tcp --dport "$PORTA" -j ACCEPT
  fi
  if command -v netfilter-persistent >/dev/null; then
    sudo netfilter-persistent save
  fi
fi

passo "8/8 Ligando o robô (e deixando ele ligar sozinho se o servidor reiniciar)"
command -v pm2 >/dev/null || sudo npm install -g pm2 --no-audit --no-fund --loglevel=error
if pm2 describe robo >/dev/null 2>&1; then
  pm2 restart robo --update-env
else
  pm2 start robo.js --name robo --time --max-memory-restart 900M
fi
pm2 save
sudo env PATH="$PATH:/usr/bin" "$(command -v pm2)" startup systemd -u "$USER" --hp "$HOME" >/dev/null
pm2 install pm2-logrotate >/dev/null 2>&1 || true

IP="$(curl -fsS -m 5 https://api.ipify.org || hostname -I | awk '{print $1}')"
printf '\n\033[1;32mPronto! O robô está ligado.\033[0m\n'
echo "Painel: http://$IP:$PORTA"
echo "Usuário: qualquer um   Senha: a que você criou"
echo
echo "Se o painel não abrir, falta liberar a porta $PORTA na Oracle (passo do guia: 'Liberar a porta')."
echo "Ver o que o robô está fazendo:  pm2 logs robo"
echo "Atualizar o robô depois:        bash ~/robo-laureta/robo-promocoes/atualizar-servidor.sh"
