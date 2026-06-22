# Modules

## Objetivo da arquitetura modular

Esta pasta implementa um **Modular Monolith** com princípios de **Clean Architecture** e **DDD Lite**. O objetivo é organizar o backend em módulos independentes por domínio, cada um com camadas bem definidas, permitindo que o projeto cresça de forma previsível sem acoplamento excessivo.

A regra de dependência é simples: camadas externas dependem das internas, nunca o contrário.

```
Routes → Controllers → Services
```

Módulos podem usar `shared/` e `config/`, mas `shared` **não** importa de `modules`.

## Módulos

| Módulo           | Responsabilidade futura                     |
| ---------------- | ------------------------------------------- |
| `auth`           | Autenticação, sessões e autorização         |
| `users`          | Gestão de usuários e perfis                 |
| `tickets`        | Chamados de suporte                         |
| `support`        | Operações de atendimento e fluxo de suporte |
| `knowledge-base` | Base de conhecimento e artigos de ajuda     |

## Camadas

### Controllers (`controllers/`)

Responsáveis **apenas por HTTP**.

- Recebem `Request` e `Response`
- Validam entrada (via DTOs)
- Chamam o Service correspondente
- Mapeiam o retorno para status code e JSON
- **Não** contêm regra de negócio

### Services (`services/`)

Responsáveis pela **regra de negócio**.

- Orquestram casos de uso do domínio
- Aplicam validações de negócio
- Coordenam repositórios e integrações (quando existirem)
- **Não** conhecem Express, HTTP ou status codes

### DTOs (`dtos/`)

Responsáveis pela **tipagem de entrada e saída**.

- Definem contratos de dados entre camadas
- Tipos TypeScript e schemas Zod (futuro)
- Separam o formato da API do modelo de domínio

### Routes (`routes/`)

Responsáveis pelo **mapeamento das rotas**.

- Definem verbos HTTP, paths e middlewares específicos
- Conectam endpoints aos Controllers
- Exportam o `Router` do Express para registro no `app.ts`

## Como criar novos módulos

1. Criar pasta em `src/modules/<nome-do-modulo>/`
2. Adicionar as pastas `controllers/`, `services/`, `routes/` e `dtos/`
3. Criar `index.ts` em cada pasta e no módulo para exportações
4. Registrar as rotas em `app.ts` com prefixo `/api/v1/<recurso>`
5. Implementar na ordem: **DTO → Service → Controller → Routes**
