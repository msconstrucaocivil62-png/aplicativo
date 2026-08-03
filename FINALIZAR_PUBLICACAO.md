# O Profissional Certo — finalização para publicação

## Já preparado no projeto
- identidade visual e ícone do O Profissional Certo;
- login, cadastro e recuperação de senha com Supabase;
- `/reset-password`;
- redirecionamento automático pelo campo `profiles.role`;
- e-mail administrativo configurável por `VITE_ADMIN_EMAIL`;
- painel administrativo sem botão público;
- PWA, Docker e Capacitor;
- dados de senha removidos do banco local.

## Teste obrigatório
1. Execute `CONFIGURAR_E_ABRIR.cmd`.
2. Entre com uma conta `role = admin` e confirme o painel administrativo.
3. Entre com uma conta `role = client` e confirme a área do cliente.
4. Entre com uma conta `role = professional` e confirme a área profissional.
5. Teste o e-mail de recuperação e a rota `/reset-password`.

## Serviços que exigem contas do proprietário
- Mercado Pago: Access Token e webhook no servidor;
- Firebase: projeto Android e `google-services.json`;
- hospedagem HTTPS e domínio;
- Google Play Console e chave de assinatura AAB;
- política de privacidade publicada em URL pública.

Nunca coloque Secret Key ou Service Role no frontend.
