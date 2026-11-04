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

## Rodar 24h numa VPS (Linux)
```bash
npm install
npm install -g pm2
pm2 start robo.js --name robo
```
Na VPS, **coloque uma senha** em `PAINEL_SENHA` no `.env`. Sem senha, o painel só abre no próprio computador.
Acesse `http://IP-DA-VPS:3000` e entre com qualquer usuário + a senha.
