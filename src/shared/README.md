# Shared

Código compartilhado entre módulos. Não contém regra de negócio de um domínio específico.

## Estrutura

| Pasta        | Responsabilidade                                                             |
| ------------ | ---------------------------------------------------------------------------- |
| `constants/` | Valores fixos reutilizáveis (limites, enums, labels)                         |
| `errors/`    | Erros padronizados (`AppError`, classes HTTP, Prisma mapper, payload de API) |
| `http/`      | Middlewares, rotas transversais e utilitários HTTP                           |
| `logger/`    | Configuração central de logs (Pino)                                          |
| `types/`     | Tipos genéricos compartilhados entre módulos                                 |
| `utils/`     | Funções utilitárias puras sem dependência de domínio                         |

## Regra de dependência

Módulos podem importar de `shared`, mas `shared` **não** deve importar de `modules`.
