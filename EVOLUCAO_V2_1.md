# Conecta Pro — Evolução V2.1

Esta versão mantém a identidade visual já aprovada e consolida o fluxo de marketplace:

- cliente publica um pedido;
- profissionais compatíveis visualizam a oportunidade;
- profissional envia proposta com valor, prazo e mensagem;
- cliente compara e aceita uma proposta;
- pedido é vinculado ao profissional e passa para andamento;
- cliente e profissional conversam no chat do pedido;
- histórico fica persistido no banco local;
- avaliação e reputação continuam disponíveis.

## Correções técnicas

- Removida a dependência do plugin `@tailwindcss/vite`, que causava falhas de instalação em alguns registros npm.
- Visual preservado por Tailwind Browser no `index.html`.
- HMR desativado para evitar conflito de WebSocket.
- Inicializador encerra processos antigos na porta 3000 e aguarda resposta real antes de abrir o navegador.
- Corrigida a precedência do filtro de pedidos no centro de negociação.
