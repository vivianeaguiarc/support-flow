# Modules

## Objetivo da arquitetura modular

Esta pasta implementa um **Modular Monolith** com princípios de **Clean Architecture** e **DDD Lite**. O backend é organizado por domínio de negócio, com camadas bem definidas nos módulos principais.

A regra de dependência é simples: **camadas externas dependem das internas, nunca o contrário**. Módulos podem usar `shared/` e `config/`, mas `shared` **não** importa de `modules`.

## Módulos ativos

| Módulo          | Padrão               | Responsabilidade                                         |
| --------------- | -------------------- | -------------------------------------------------------- |
| `tickets`       | Clean Architecture   | Chamados, SLA, roteamento, comentários, anexos, métricas |
| `notifications` | Clean Architecture   | Notificações por evento de negócio                       |
| `auth`          | Legado (em evolução) | Login, refresh token, logout                             |
| `users`         | Legado (em evolução) | Gestão de usuários e perfis                              |
| `customers`     | Interno              | Entidade referenciada na abertura de chamados            |

## Módulos reservados (stubs)

| Módulo           | Status                                   |
| ---------------- | ---------------------------------------- |
| `support`        | Placeholder — não registrado em `app.ts` |
| `knowledge-base` | Placeholder — não registrado em `app.ts` |

## Clean Architecture (`tickets`, `notifications`)

```
presentation/   → routes, controllers, DTOs (Zod), docs Swagger
application/    → use cases, services de orquestração, inputs, mappers
domain/         → entidades, enums, regras puras
infrastructure/ → repositórios Prisma, query builders
```

Fluxo:

```
HTTP → Route → Middleware → Controller → Use Case / Service → Repository → PostgreSQL
```

### Camadas

**Presentation** — apenas HTTP: validação de entrada (DTOs Zod), chamada de use cases/services, mapeamento de resposta.

**Application** — orquestra casos de uso, aplica RBAC quando necessário, coordena repositórios e serviços de evento. Não importa Express nem DTOs de presentation.

**Domain** — regras de negócio puras (transições de status, SLA, validação de arquivo). Sem Express, sem Prisma.

**Infrastructure** — persistência (Prisma), adapters e query builders.

## Padrão legado (`auth`, `users`)

```
routes/ → controllers/ → services/ → repositories/
```

Será migrado gradualmente para o mesmo padrão de `tickets` e `notifications`.

## Como criar novos módulos

1. Criar pasta em `src/modules/<nome-do-modulo>/`
2. Preferir estrutura Clean Architecture: `domain/`, `application/`, `infrastructure/`, `presentation/`
3. Registrar rotas em `src/app.ts` com prefixo `/api/v1/<recurso>`
4. Adicionar testes de integração em `<modulo>/integration/`
5. Documentar endpoints em `presentation/docs/*.swagger.ts`

## Regras de dependência

- `presentation` → `application` → `domain` ← `infrastructure`
- `shared/` é transversal; **não** importa de `modules/`
- Tipos compartilhados entre módulos ficam em `shared/types/` (ex.: `UserRole`, `TicketStatus`)
- Constantes transversais ficam em `shared/constants/` (ex.: upload de anexos)
