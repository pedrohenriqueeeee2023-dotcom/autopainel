# Robô 24h na Oracle Cloud (grátis)

Depois disto o robô fica ligado o tempo todo num servidor da Oracle, mesmo com o seu PC desligado.
Você controla tudo pelo painel, que dá para abrir até pelo celular.

Leva uns 30–40 minutos na primeira vez.

---

## 1. Criar a conta
1. Entre em **signup.cloud.oracle.com** e crie a conta.
2. Em **Home Region**, escolha **Brazil East (Sao Paulo)**. *Não dá para mudar depois.*
3. Eles pedem um cartão só para verificar (fazem uma cobrança pequena e devolvem). Contas "Always Free" não são cobradas.
4. Espere o e-mail dizendo que a conta está pronta (às vezes leva alguns minutos).

## 2. Criar o servidor
No painel da Oracle: **menu ☰ > Compute > Instances > Create instance**.

| Campo | O que escolher |
|---|---|
| Name | `robo-laureta` |
| Image | **Change image > Ubuntu > Canonical Ubuntu 24.04** (ou 22.04) |
| Shape | **Change shape > Ampere > VM.Standard.A1.Flex**, com **1 OCPU e 6 GB** de memória (aparece "Always Free-eligible") |
| SSH keys | **Generate a key pair for me** > clique em **Save private key** e guarde o arquivo `.key` |

Clique em **Create**. Quando ficar verde (**Running**), copie o **Public IP address**.

> **Deu "Out of capacity"?** É comum no plano grátis. Tente outro *Availability domain* na mesma tela, ou tente de novo mais tarde.

## 3. Liberar a porta do painel
Na página do servidor: **Primary VNIC > Subnet > Security Lists > Default Security List > Add Ingress Rules**:
- **Source CIDR:** `0.0.0.0/0`
- **IP Protocol:** TCP
- **Destination Port Range:** `3000`

Salve. (O firewall de dentro do servidor o script de instalação libera sozinho.)

## 4. Entrar no servidor (pelo seu PC)
1. Mova o arquivo `.key` que você baixou para `C:\Users\pedro.jesus\.ssh\` e renomeie para `oracle.key`.
2. Abra o **PowerShell** e rode (troque `IP` pelo IP do servidor):
   ```
   ssh -i $env:USERPROFILE\.ssh\oracle.key ubuntu@IP
   ```
   Na primeira vez ele pergunta se confia no servidor: digite `yes`.

> Se aparecer *"UNPROTECTED PRIVATE KEY FILE"*, rode isto no PowerShell e tente de novo:
> `icacls $env:USERPROFILE\.ssh\oracle.key /inheritance:r /grant:r "$($env:USERNAME):R"`

## 5. Instalar o robô
Já dentro do servidor, cole este comando e aperte Enter:
```
curl -fsSL https://raw.githubusercontent.com/pedrohenriqueeeee2023-dotcom/autopainel/claude/magical-keller-k5qa0h/robo-promocoes/instalar-servidor.sh | bash
```
Ele demora uns 5–10 minutos e faz as perguntas no final:
- **Senha do painel:** crie uma forte e que você não use em outro lugar.
- **Seu número** (o do `DONO`) e as **chaves da Shopee**: pode pular e colocar depois.

No fim ele mostra o endereço do painel, tipo `http://IP:3000`.

## 6. Conectar o WhatsApp
1. Abra `http://IP:3000` no navegador (pode ser no celular).
2. Usuário: qualquer coisa. Senha: a que você criou.
3. Leia o **QR Code** com o WhatsApp do chip do robô (*Aparelhos conectados > Conectar um aparelho*).

Pronto: o robô está rodando sozinho. Se o servidor reiniciar, ele volta sozinho.

> ⚠️ **Não ligue mais o robô do PC** (atalho "Robô Laureta"). Os dois brigariam pelo mesmo WhatsApp.

---

## No dia a dia
- **Controlar:** só abrir `http://IP:3000`. Salve nos favoritos do celular.
- **Atualizar o robô** quando tiver versão nova: entre no servidor (passo 4) e rode
  `bash ~/robo-laureta/robo-promocoes/atualizar-servidor.sh`
- **Ver o que ele está fazendo por dentro:** `pm2 logs robo` (sai com Ctrl+C)
- **Mudar a senha, o DONO ou as chaves da Shopee:** `nano ~/robo-laureta/robo-promocoes/.env`, salve (Ctrl+O, Enter, Ctrl+X) e rode `pm2 restart robo`

## Cuidados
- **A Oracle pode desligar servidores grátis "parados".** Se o servidor ficar 7 dias usando muito pouco processador e memória, a Oracle pode recuperá-lo. Se isso acontecer, é só refazer os passos 2 a 6. Para evitar de vez, dá para mudar a conta para *Pay As You Go*: continua sem custo enquanto você só usar coisas "Always Free", mas aí a Oracle cobraria se você criasse algo pago, então só faça isso com atenção.
- **A senha do painel não vai criptografada** (o endereço é `http`, não `https`). Use uma senha só para isso.
