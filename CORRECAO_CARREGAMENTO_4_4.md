# Correção 4.4 — inicialização e tela de login

- Corrige a tela infinita “Carregando O Profissional Certo”.
- Usuário sem sessão agora vê imediatamente a tela de login.
- Evita bloqueio do Supabase causado por consultas dentro de `onAuthStateChange`.
- Exibe o erro real quando a API ou os dados do usuário não carregam.
- Inclui botões para tentar novamente ou encerrar a sessão.
- Valida as respostas de `/api/state` antes de usar os dados.
