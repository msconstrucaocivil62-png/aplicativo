# Conecta Pro 4.1 — preparação para publicação

## O que esta entrega já contém
- Build web de produção via `npm run build`.
- Servidor Express servindo a SPA em produção.
- Cabeçalhos de segurança, limite de JSON, rate limit e endpoint `/api/health`.
- Rotas de simulação e reset bloqueadas em produção.
- Código de recuperação de senha não é devolvido pela API em produção.
- Token do Mercado Pago não é exposto nem gravado pelo painel em produção.
- Dockerfile e Docker Compose para hospedagem.
- Capacitor configurado para gerar projeto Android.
- PWA, manifest, service worker, ícones e política de privacidade.

## Passos obrigatórios que dependem do proprietário
1. Copie `.env.production.example` para `.env.production` e preencha os segredos.
2. Contrate/configure domínio HTTPS e hospedagem.
3. Crie credenciais de produção no Mercado Pago e configure o webhook.
4. Configure SMTP para recuperação de senha e Firebase para notificações.
5. Substitua o banco JSON por PostgreSQL antes de receber grande volume de usuários.
6. Revise política de privacidade, termos, CNPJ/CPF, endereço de suporte e e-mail público.
7. Execute `BUILD_PRODUCAO.cmd`.
8. Para Android, instale Android Studio e execute `PREPARAR_ANDROID.cmd`.
9. No Android Studio, gere um AAB assinado e envie ao Google Play Console.

## Bloqueios honestos
A publicação efetiva não pode ser concluída sem acesso às contas do Mercado Pago, hospedagem, domínio, Firebase e Google Play Console. Não compartilhe senhas pessoais; use chaves de projeto e contas empresariais com permissões mínimas.
