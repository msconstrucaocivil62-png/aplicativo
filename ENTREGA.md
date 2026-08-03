# Entrega Conecta Pro — 31/07/2026

## Implementado nesta revisão

- Nome Conecta Pro preservado.
- Identidade visual existente preservada.
- Metadados em português e título de produção.
- PWA instalável com manifesto, service worker e ícones 192/512.
- Política de privacidade inicial e guia de publicação.
- Variáveis de ambiente para credenciais financeiras.
- Token do Mercado Pago ocultado da API pública.
- Senhas removidas da lista pública de usuários.
- Login não revela mais a senha administrativa em mensagens de erro.
- Dependência de IA não utilizada removida.

## Funcionalidades existentes preservadas

- Portal de cliente, profissional e administrador.
- Cadastro e login.
- Solicitações de serviços por categoria.
- Aceite e acompanhamento de pedidos.
- Perfis, categorias, avaliações e suporte.
- Planos e fluxo demonstrativo de pagamentos.
- Gestão administrativa de usuários, categorias, tickets e configuração.

## Limite importante

Esta entrega é uma base publicável como PWA para homologação, não uma cópia integral do GetNinjas em produção. Antes de aceitar usuários e pagamentos reais, execute os itens obrigatórios de `docs/GUIA_PUBLICACAO.md`, especialmente banco de produção, autenticação segura, Mercado Pago real, LGPD e remoção do modo demo.

## Validação

A instalação automática das dependências não pôde ser concluída neste ambiente porque o registro de pacotes disponível não contém `@tailwindcss/vite`. Execute `npm install` e `npm run check` em uma máquina com acesso ao registro público do npm antes da publicação.
