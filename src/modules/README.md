# Modules

Estrutura base do **Modular Monolith** do SupportFlow. Cada pasta representa um bounded context com responsabilidades isoladas.

## Módulos

| Módulo           | Responsabilidade futura                     |
| ---------------- | ------------------------------------------- |
| `auth`           | Autenticação, sessões e autorização         |
| `users`          | Gestão de usuários e perfis                 |
| `tickets`        | Chamados de suporte                         |
| `support`        | Operações de atendimento e fluxo de suporte |
| `knowledge-base` | Base de conhecimento e artigos de ajuda     |

## Camadas

Cada módulo segue a mesma organização interna. A dependência sempre aponta para dentro: **Routes → Controllers → Services**.

### Controller (`controllers/`)

Responsável **apenas por HTTP**.

- Recebe `Request` e `Response`
- Valida entrada (via DTOs)
- Chama o Service correspondente
- Mapeia o retorno para status code e JSON
- **Não** contém regra de negócio

### Service (`services/`)

Responsável pela **regra de negócio**.

- Orquestra casos de uso do domínio
- Aplica validações de negócio
- Coordena repositórios e integrações (quando existirem)
- **Não** conhece Express, HTTP ou status codes

### DTO (`dtos/`)

Responsável pela **tipagem de entrada e saída**.

- Define contratos de dados entre camadas
- Tipos TypeScript e schemas Zod (futuro)
- Separa o formato da API do modelo de domínio

### Routes (`routes/`)

Responsável pelo **mapeamento das rotas**.

- Define verbos HTTP, paths e middlewares específicos
- Conecta endpoints aos Controllers
- Exporta o `Router` do Express para registro no `app.ts`

## Adicionando um novo módulo

1. Criar pasta em `src/modules/<nome-do-modulo>/`
2. Replicar as pastas `controllers/`, `services/`, `routes/` e `dtos/`
3. Criar `index.ts` exportando as camadas
4. Registrar as rotas em `app.ts` com prefixo `/api/v1/<recurso>`
