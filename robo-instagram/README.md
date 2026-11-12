# Robô do Instagram (Rota dos Achadinhos)

3 vezes por dia (10h, 15h e 20h) ele:
1. olha os vídeos recentes de uma lista de perfis de achadinhos do TikTok (`tiktokPerfis` em `config.js`);
2. baixa o mais visto que ainda não usou (de 5 a 90 segundos);
3. coloca no nosso layout: fundo rosa, logo e nome em cima, vídeo no meio, "SIGA PRA MAIS ACHADINHOS" embaixo;
4. posta como Reels na conta, com a legenda padrão.

Ele prepara o vídeo uns 45 min antes e posta dentro da hora marcada. Horário perdido não é compensado depois,
e ele nunca posta nos 10 primeiros minutos depois de ligar.

**Vem desligado** (`"ativo": false`): prepara os vídeos mas não posta. Ligue depois de ver o teste.

## 1. Chave da API (uma vez só)
A conta precisa ser **profissional** e estar ligada a uma **Página do Facebook**
(Instagram > Configurações > Central de Contas, ou pela Página > Configurações > Contas vinculadas).

1. Entre em **developers.facebook.com** > **Meus apps** > **Criar app** > caso de uso **Outro** > tipo **Empresa**.
2. No app, em **Configurações do app > Básico**, copie o **ID do app** e a **Chave secreta**.
3. Abra o **Explorador da Graph API** (developers.facebook.com/tools/explorer), escolha o seu app e marque as permissões:
   `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.
   Clique em **Generate Access Token** e autorize com a sua conta.
4. Clique no ícone **i** ao lado do token > **Abrir na Ferramenta de Token de Acesso** > **Estender token de acesso**.
   Copie o token longo (vale 60 dias; o robô renova sozinho antes de vencer).
5. De volta no Explorador, rode: `me/accounts?fields=name,instagram_business_account`
   O número em `instagram_business_account.id` é o **IG_USER_ID**.

## 2. Colocar no servidor
Abra o `.env` do robô do Instagram:
```bash
nano ~/robo-laureta/robo-instagram/.env
```
Preencha `IG_USER_ID`, `IG_TOKEN`, `FB_APP_ID` e `FB_APP_SECRET` (modelo em `.env.example`). Salve com Ctrl+O, Enter, Ctrl+X.

Confira se a conta certa está ligada:
```bash
cd ~/robo-laureta/robo-instagram && node robo.js conta
```

Gere um vídeo de teste (não posta nada):
```bash
cd ~/robo-laureta/robo-instagram && node robo.js teste
```

Ligue o robô (ainda desligado para postar):
```bash
cd ~/robo-laureta/robo-instagram && pm2 start robo.js --name robo-insta && pm2 save
```

## 3. Ligar as postagens
Crie/edite `dados/config.json` com `{ "ativo": true }` e reinicie: `pm2 restart robo-insta`.
Dá pra mudar também `horarios`, `tiktokPerfis`, `minimoVisualizacoes`, `legenda` e as cores/textos em `marca`
(o padrão de tudo está em `config.js`). Logo e fonte ficam em `marca/`.

Ver o que ele fez: `pm2 logs robo-insta`. Histórico dos posts: `dados/historico.json`.

## Atenção
- São vídeos de outros criadores. O Instagram reduz o alcance de conteúdo repostado e pode punir a conta
  se receber denúncias de direitos autorais. A legenda não tem link (link em legenda não é clicável).
- Precisa do `yt-dlp` no servidor (`YTDLP_PATH=/home/venus/bin/yt-dlp` no `.env`).
- A busca por hashtag do Instagram precisa de aprovação da Meta, por isso a fonte é o TikTok.
