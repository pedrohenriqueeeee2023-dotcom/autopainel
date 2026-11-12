# Robô de Promoções: Achadinhos da Laureta

O que ele faz:
- **Shopee (automático):** todo dia de manhã busca ofertas de beleza, estética e moda feminina, filtra (desconto, nota, vendas) e já usa o **seu link de afiliado**.
- **Mercado Livre (semiautomático):** você cola o link de afiliado no painel e ele entra na frente da fila.
- Envia uma oferta (com foto) a cada 20 min, das 8h às 22h, sem repetir produto.
- **Painel no navegador** pra controlar tudo sem mexer em código.

## Primeira vez (Windows)
1. Instale o **Node.js LTS** (nodejs.org).
2. Copie `.env.example` para `.env` e preencha (pode deixar a Shopee em branco por enquanto).
3. Dê **dois cliques em `Iniciar robo.bat`**. Na primeira vez ele instala tudo (demora alguns minutos).
4. O painel abre sozinho no navegador: **http://localhost:3000**
5. No painel, leia o **QR Code** com o WhatsApp do chip do robô (Aparelhos conectados > Conectar um aparelho).

Pronto. Nas próximas vezes, só dois cliques no `Iniciar robo.bat`.
**Não feche a janela preta**: fechando, o robô desliga.

## O que dá pra fazer no painel
| Parte | Pra quê |
|---|---|
| 📱 WhatsApp | Ver se está conectado, ler o QR Code, trocar de número |
| 🚀 Envios | Ligar/pausar, enviar na hora, buscar ofertas da Shopee |
| 🛍️ Mercado Livre | Colar texto + link de afiliado e pôr na fila |
| 📋 Fila | Ver o que vai ser enviado, enviar já, subir pro topo, remover |
| 💬 Conversa | Ver as últimas mensagens do grupo |
| 🧾 Atividade | O que o robô fez (envios, erros) |
| ⚙️ Configurações | Grupo, intervalo, horário, filtros e palavras da Shopee |

## Comandos pelo WhatsApp (opcional)
Do seu número (`DONO` no `.env`), no privado do robô:
- `ml Texto da oferta | https://meli.la/xxxx`: coloca oferta do ML na fila
- `fila`: quantas ofertas estão esperando
- `agora`: envia a próxima na hora

## Chaves da Shopee
Painel em **affiliate.shopee.com.br** > Open API (se não aparecer, peça ao suporte de afiliados).
Coloque `SHOPEE_APP_ID` e `SHOPEE_SECRET` no `.env` e reinicie o robô.

## Rodar 24h sem o PC ligado
Passo a passo para a Oracle Cloud grátis: veja **[SERVIDOR-ORACLE.md](SERVIDOR-ORACLE.md)**.
O script `instalar-servidor.sh` faz tudo sozinho em qualquer servidor Ubuntu.

## Rodar 24h numa VPS (Linux), do jeito manual
```bash
npm install
npm install -g pm2
pm2 start robo.js --name robo
```
Na VPS, **coloque uma senha** em `PAINEL_SENHA` no `.env`. Sem senha, o painel só abre no próprio computador.
Acesse `http://IP-DA-VPS:3000` e entre com qualquer usuário + a senha.

## Vídeos de produtos (3x por dia)
Você manda o link de um vídeo (TikTok, Reels, Shorts ou Kwai) no privado do robô, ou cola no painel (card **Vídeos de produtos**).
O robô baixa o vídeo, acha o produto na Shopee com o seu link de afiliado, edita (vertical, preço e desconto em cima,
"LINK NA LEGENDA" embaixo) e te manda o vídeo pronto no privado.

Respostas no privado do robô (`N` é o número do vídeo):
- `ok N`: aprova (posta no próximo horário)
- `nao N`: descarta
- `produto N nome do produto`: procura outro produto na Shopee e refaz o vídeo
- `link N https://...`: usa esse link (Shopee vira link de afiliado com preço; outro link vai como está)
- `videos`: lista os vídeos e o status

Posta 1 vídeo aprovado em cada horário de **Horários** (padrão 10h, 15h e 20h, vale só dentro da hora).
Vem **desligado**: ligue no painel quando quiser que vá para o grupo. Com **Aprovação** em "Postar sem aprovar",
os vídeos com produto encontrado vão direto (os sem produto continuam esperando você).

Precisa de `ffmpeg` e `yt-dlp` no computador do robô. No servidor (Ubuntu):
```bash
sudo apt install -y ffmpeg
```
```bash
mkdir -p ~/bin && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ~/bin/yt-dlp && chmod +x ~/bin/yt-dlp
```
E no `.env`: `YTDLP_PATH=/home/venus/bin/yt-dlp`.
