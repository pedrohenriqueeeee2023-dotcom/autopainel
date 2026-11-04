# Robô de Promoções (beleza e moda feminina)

O que ele faz:
- **Shopee (automático):** todo dia de manhã busca ofertas de beleza, estética e moda feminina, filtra (desconto, nota, vendas) e já usa o **seu link de afiliado**.
- **Mercado Livre (semiautomático):** você manda o link de afiliado no privado do robô e ele entra na frente da fila.
- Envia uma oferta (com foto) a cada 20 min, das 8h às 22h, sem repetir produto.

## 1. Pegar as chaves da Shopee
1. Entre em **affiliate.shopee.com.br** com a sua conta de afiliado.
2. Vá em **Open API** e peça acesso (a aprovação pode levar alguns dias).
3. Copie o **AppID** e a **Secret**.

## 2. Instalar
Precisa do Node.js 18 ou mais novo. Dentro desta pasta:
```bash
npm install
```
Copie `.env.example` para `.env` e preencha as chaves e o seu número pessoal (`DONO`).

## 3. Ajustar
Em `config.js`: nome exato do grupo, intervalo, horários, palavras buscadas e filtros.

## 4. Testar a Shopee (sem WhatsApp)
```bash
npm run testar-shopee
```

## 5. Ligar o robô
```bash
npm start
```
Leia o QR Code com o WhatsApp **do chip do robô** (Aparelhos conectados > Conectar).

## Comandos (mande do seu número no privado do robô)
| Comando | O que faz |
|---|---|
| `ml Sérum Vitamina C de R$89 por R$49 \| https://meli.la/xxxx` | Coloca oferta do ML na frente da fila |
| `fila` | Mostra quantas ofertas estão esperando |
| `agora` | Envia a próxima oferta na hora |

Dica para achar ofertas do ML de beleza: `mercadolivre.com.br/ofertas` e filtre a categoria **Beleza e Cuidado Pessoal**.

## Deixar ligado 24h (VPS)
```bash
npm install -g pm2
pm2 start robo.js --name robo
pm2 logs robo
```
