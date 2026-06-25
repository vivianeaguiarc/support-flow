# Versionamento da API

## Estratégia v1/v2

O versionamento é feito por **prefixo de caminho**:

- `/api/v1/*` — versão **estável**. Documentação em `/api/docs`.
- `/api/v2/*` — versão **em evolução**. Documentação em `/api/docs/v2`.

Cada versão tem sua própria especificação OpenAPI, servida de forma isolada no
Swagger UI. O `accessToken` (JWT) é compartilhado entre as versões.

## Compatibilidade

Dentro de uma mesma versão maior, apenas mudanças **retrocompatíveis** são
permitidas:

- adicionar endpoints, campos opcionais ou novos valores de enum não usados como
  filtro obrigatório;
- adicionar respostas/headers opcionais.

Essas mudanças não exigem nova versão.

## Breaking changes

São consideradas _breaking_ e exigem uma nova versão (`v2`, `v3`, ...):

- remover endpoint ou operação;
- remover/renomear campo de resposta ou tornar obrigatório um campo de request
  antes opcional;
- alterar o tipo de um campo de request/response;
- remover um status code documentado;
- alterar parâmetros de forma incompatível.

A pipeline de **contract testing** (`pnpm contract:check`) compara
`docs/openapi.json` com `docs/openapi.baseline.json` e falha quando detecta uma
dessas mudanças. Veja o `README` para atualizar o baseline quando a mudança for
intencional.

## Política de descontinuação (deprecation)

1. Campos/endpoints a serem removidos são marcados com `deprecated: true` no
   OpenAPI e mantidos em funcionamento durante o período de transição.
2. A versão anterior permanece disponível por uma janela de descontinuação
   anunciada após o lançamento da nova versão.
3. Após o fim da janela, a versão antiga pode ser removida.

## Referências

- [Autenticação](./authentication.md)
- [Arquitetura](./architecture.md)
