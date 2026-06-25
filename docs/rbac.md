# RBAC — Papéis e Permissões

O SupportFlow usa **RBAC (Role-Based Access Control)** por tenant. Cada requisição
autenticada é autorizada no backend com base na role do usuário e nas permissões
associadas. O Swagger expõe apenas a _tag_ **RBAC Admin** (gestão de papéis); os
detalhes do modelo ficam aqui.

## Roles

| Role         | Descrição                                                               |
| ------------ | ----------------------------------------------------------------------- |
| `ADMIN`      | Administração completa do tenant (usuários, configurações, automações). |
| `SUPERVISOR` | Gestão operacional do atendimento — filas, atribuição e métricas.       |
| `AGENT`      | Atendente — opera chamados atribuídos e da fila.                        |
| `CUSTOMER`   | Cliente — abre e acompanha os próprios chamados.                        |
| `OMBUDSMAN`  | Ouvidoria — acompanha e transita status de chamados sob sua alçada.     |

## Permissions

Permissões são verbos sobre recursos (ex.: `tickets.read`, `tickets.assign`,
`audit.read`, `roles.manage`). Roles são mapeadas para conjuntos de permissões;
rotas declaram a permissão exigida e o middleware as valida antes do handler.

## Matriz de permissões (resumo)

| Capacidade               | ADMIN | SUPERVISOR | AGENT | CUSTOMER | OMBUDSMAN |
| ------------------------ | :---: | :--------: | :---: | :------: | :-------: |
| Visualizar chamados      |  ✅   |     ✅     |  ✅   |    ✅    |    ✅     |
| Criar chamado            |  ✅   |     ✅     |  ✅   |    ✅    |     —     |
| Alterar status           |  ✅   |     ✅     |  ✅   |    —     |    ✅     |
| Atribuir responsável     |  ✅   |     ✅     |   —   |    —     |     —     |
| Visualizar métricas      |  ✅   |     ✅     |  ✅   |    —     |     —     |
| Usuários/clientes        |  ✅   |     ✅     |  ✅   |    —     |     —     |
| Configurações/automações |  ✅   |     —      |   —   |    —     |     —     |
| Gestão de papéis (RBAC)  |  ✅   |     —      |   —   |    —     |     —     |

> A matriz é um resumo orientado a UX. A fonte da verdade é o mapeamento
> role → permissão aplicado no backend.

## Múltiplos papéis por usuário

O modelo suporta a atribuição de permissões adicionais a um usuário além da role
base (evento `USER_PERMISSION_ASSIGNED`). A autorização efetiva é a **união** das
permissões da role com as permissões concedidas individualmente.

## Super admin

`SUPER_ADMIN` é um papel transversal de plataforma (acima do tenant). Pode operar
em qualquer organização informando `x-tenant-id`/`x-tenant-slug`. A tag
**RBAC Admin** exige a permissão `roles.manage` (ou `SUPER_ADMIN`).

## Tenant admin

`ADMIN` é o administrador **dentro** de um tenant: gerencia usuários,
configurações, automações e papéis daquele tenant, sem acesso a outras
organizações.

## Endpoints de gestão (RBAC Admin)

- `GET/POST /admin/roles`
- `PATCH/DELETE /admin/roles/{id}`
- `POST /admin/roles/{id}/permissions`
- `GET/POST /admin/permissions`

## Referências

- [Autenticação](./authentication.md)
- [Segurança](./security.md)
