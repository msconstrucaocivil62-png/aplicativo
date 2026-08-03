# O Profissional Certo 5.0

## O que está implementado
- Autenticação Supabase sem dependência do SDK no navegador.
- Redirecionamento por perfil: cliente, profissional e administrador.
- Painel administrativo protegido no servidor.
- Pedidos, propostas, contratação e chat usando tabelas do Supabase em produção.
- Categorias e suporte usando Supabase.
- Assinaturas e webhook Mercado Pago preparados.
- Recuperação de senha.
- Build web, Docker, PWA e Capacitor Android.
- API externa configurável para o aplicativo Android.

## Antes de colocar usuários reais
1. Execute `supabase/FINAL_PRODUCTION_MIGRATION.sql` no SQL Editor do Supabase.
2. Copie `.env.production.example` para `.env.production` e preencha os valores.
3. Mantenha `SUPABASE_SERVICE_ROLE_KEY` e `MERCADO_PAGO_ACCESS_TOKEN` somente no servidor.
4. Defina `PUBLIC_APP_URL` com HTTPS e cadastre `/api/payment/webhook` no Mercado Pago.
5. Execute `VALIDAR_E_BUILDAR.cmd`.
6. Publique o backend e teste `/api/health`.
7. Preencha `VITE_API_BASE_URL` com o endereço HTTPS do backend antes do build Android.
8. Execute `GERAR_ANDROID.cmd`; no Android Studio gere o Android App Bundle assinado.

## Segurança
Nunca coloque Service Role, Access Token do Mercado Pago ou senhas no frontend, GitHub ou Play Store.
