# O Profissional Certo — autenticação final

## O que foi corrigido

- Login real pelo Supabase Auth.
- Cadastro real de cliente e profissional.
- Recuperação de senha por e-mail.
- Página `/reset-password` para definir a nova senha.
- Leitura automática do campo `role` ou `tipo` da tabela `profiles`.
- `admin` abre diretamente o painel administrativo.
- `professional`, `profissional` ou `pro` abre o painel profissional.
- `client` ou `cliente` abre a área do cliente.
- Botão público **Painel Admin** removido.
- Nome alterado para **O Profissional Certo**.
- Ícone personalizado aplicado no cabeçalho, PWA e Android.

## Como abrir

Execute `CONFIGURAR_E_ABRIR.cmd`.

Na primeira execução, cole apenas:

1. Project URL do Supabase;
2. Publishable key do Supabase.

Nunca cole a Secret key / Service role no aplicativo.

## Redirecionamentos no Supabase

Mantenha autorizados:

- `http://127.0.0.1:3000/reset-password`
- `http://localhost:3000/reset-password`
- `https://SEU-DOMINIO/reset-password`

## Administrador

O aplicativo não usa o nome ou e-mail para liberar administração. Ele consulta a coluna `role` da linha cujo `id` é igual ao UID do usuário autenticado. A função deve estar como `admin`.
