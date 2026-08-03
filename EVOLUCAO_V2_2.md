# Conecta Pro V2.2

Entrega de homologacao local com inicializacao simplificada.

## Ajustes desta entrega

- Remocao de arquivos compactados duplicados dentro do projeto.
- Inicializador com deteccao de execucao dentro do ZIP.
- Encerramento automatico de processos antigos nas portas 3000 e 24678.
- Espera ativa antes de abrir o navegador.
- Script separado para encerrar o servidor.
- Fluxos de propostas, contratacao e chat mantidos da V2.1.

## Limitacoes de homologacao

- O banco JSON local nao deve ser usado em producao.
- A autenticacao demonstrativa precisa ser substituida por sessoes seguras.
- Mercado Pago/Pix precisa de credenciais no servidor e webhook HTTPS.
- Notificacoes push e GPS em segundo plano dependem do empacotamento mobile.
