# Publicar O Profissional Certo no Render

## Repositório
Envie o conteúdo desta pasta para a raiz do repositório GitHub:
`msconstrucaocivil62-png/aplicativo`

O arquivo `render.yaml` cria um Web Service automaticamente.

## Variáveis solicitadas pelo Render

Preencha no painel do Render sem colocar aspas:

- `SUPABASE_URL`: URL do projeto Supabase sem `/rest/v1/`
- `SUPABASE_PUBLISHABLE_KEY`: chave publicável do Supabase
- `VITE_SUPABASE_URL`: a mesma URL do Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY`: a mesma chave publicável
- `VITE_MERCADO_PAGO_PUBLIC_KEY`: Public Key de produção do Mercado Pago
- `MERCADO_PAGO_ACCESS_TOKEN`: Access Token de produção do Mercado Pago
- `ALLOWED_ORIGINS`: inicialmente deixe com a URL que o Render gerar, por exemplo `https://o-profissional-certo.onrender.com`
- `APP_PUBLIC_URL`: a URL pública do Render
- `API_PUBLIC_URL`: a mesma URL pública do Render

Nunca coloque Secret Key, Client Secret ou Service Role no GitHub.

## Depois do primeiro deploy

1. Abra a URL `https://SEU-SERVICO.onrender.com/api/health` e confirme que retorna JSON com `ok: true`.
2. Atualize `ALLOWED_ORIGINS`, `APP_PUBLIC_URL` e `API_PUBLIC_URL` com a URL exata do serviço.
3. No Mercado Pago, configure o webhook de produção como:
   `https://SEU-SERVICO.onrender.com/api/mercado-pago/webhook`
4. No Supabase, adicione às Redirect URLs:
   - `https://SEU-SERVICO.onrender.com/**`
   - `https://SEU-SERVICO.onrender.com/reset-password`
