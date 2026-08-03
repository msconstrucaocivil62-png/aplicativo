# Guia de publicação — Conecta Pro

## Situação desta entrega

O projeto está configurado como aplicação web responsiva e PWA instalável, com nome, manifesto, ícones, modo offline básico e build de produção. Ele pode ser hospedado como site/app web e depois empacotado para Android.

## Antes de publicar oficialmente

1. Substituir o banco JSON local por PostgreSQL, Supabase ou Firebase.
2. Implementar autenticação por sessão/JWT, hash de senha e recuperação por e-mail/SMS.
3. Configurar credenciais reais do Mercado Pago apenas no servidor e webhook oficial.
4. Desativar rotas e botões de demonstração, troca de perfis, reset e pagamento simulado.
5. Adicionar Termos de Uso, canal de suporte e dados reais do controlador na Política de Privacidade.
6. Configurar domínio HTTPS, backups, logs, monitoramento e proteção contra abuso.
7. Criar conta Google Play Console, ficha da loja, classificação etária, formulário de segurança de dados e testes fechados exigidos pela conta.

## Build web

```bash
npm install
npm run check
npm start
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha apenas no servidor. Nunca publique tokens no Git.

## Android

Depois de hospedar e validar a versão web, use Capacitor ou Trusted Web Activity para gerar o AAB. O pacote sugerido é `br.com.conectapro.app`. Defina assinatura própria, versão, política de privacidade pública e URLs HTTPS antes de enviar à Play Store.
