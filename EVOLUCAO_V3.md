# Conecta Pro V3 — Fase 1

- Senhas armazenadas com scrypt e salt individual.
- Migração automática das senhas antigas em texto puro.
- Credenciais administrativas removidas da interface.
- Cadastro exige senha com pelo menos 8 caracteres, letras e números.
- Recuperação com código de 6 dígitos e validade de 10 minutos.
- Respostas da API não devolvem hashes, salts ou códigos internos.
- Profissionais novos entram com status `pending_review`.

Esta ainda é uma versão local de homologação. Para produção, o envio do código deve ser integrado a um provedor de e-mail e as rotas devem usar sessão/JWT com autorização por recurso.
