# O Profissional Certo 4.3 — segurança e publicação

## Concluído nesta versão
- Todas as chamadas internas enviam o token de sessão do Supabase.
- O servidor valida o token antes de liberar dados e operações.
- Rotas administrativas exigem `profiles.role = admin`.
- Usuários comuns não conseguem escolher outro `userId` para alterar dados.
- Login, cadastro e recuperação locais ficam desativados fora do modo demonstrativo.
- Secret keys e Service Role não são aceitas pelo configurador do navegador.
- O servidor lê `.env.local` e valida a sessão contra o mesmo projeto Supabase.

## Antes de publicar
1. Rode `npm install` e `npm run check` em um computador com acesso normal ao npm.
2. Use `DEMO_MODE=false`.
3. Cadastre as variáveis do Supabase na hospedagem.
4. Configure `MERCADO_PAGO_ACCESS_TOKEN` somente no servidor.
5. Implemente e teste o webhook assinado do Mercado Pago antes de aceitar dinheiro real.
6. Gere um AAB assinado no Android Studio e mantenha a chave de assinatura em backup seguro.
7. Publique Política de Privacidade, Termos de Uso e canal de exclusão de conta.

## Limite conhecido
Os dados do painel e marketplace ainda usam a base local `.data/conecta_db.json` para conteúdo demonstrativo. A autenticação e autorização já são reais pelo Supabase. Antes de receber usuários e pagamentos reais, pedidos, propostas, mensagens, planos e métricas devem ser migrados integralmente para as tabelas Supabase já criadas.
