# Conecta Pro 4.0 — configuração de produção

Esta entrega consolida a versão local funcional. Antes de receber usuários reais, configure:

1. Banco PostgreSQL/Supabase e migração do arquivo `.data/conecta_db.json`.
2. Autenticação de produção com sessões/JWT, confirmação de e-mail e redefinição de senha por provedor SMTP.
3. Armazenamento de imagens em nuvem (Supabase Storage, S3 ou equivalente).
4. Mercado Pago com credenciais de produção e webhook HTTPS.
5. Notificações push com Firebase Cloud Messaging.
6. Domínio HTTPS, política de privacidade, termos de uso e canal de suporte.
7. Capacitor Android, assinatura do AAB e cadastro no Google Play Console.

## Dados que o proprietário precisa fornecer

- Nome empresarial ou nome do responsável.
- CPF ou CNPJ usado na operação.
- E-mail e telefone oficiais de suporte.
- Conta Mercado Pago empresarial e credenciais de produção.
- Conta Google Play Console.
- Domínio desejado.
- Logo final e imagens de divulgação para a loja.

Nunca envie chaves secretas em imagens públicas. Use um arquivo `.env` local ou o painel seguro da hospedagem.
