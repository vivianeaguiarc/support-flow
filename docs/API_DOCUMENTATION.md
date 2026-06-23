# Documentação da API - SupportFlow

## Visão Geral

Esta documentação descreve todos os endpoints da API SupportFlow, uma plataforma SaaS de Atendimento ao Cliente, SAC e Ouvidoria.

## Tecnologias

- **OpenAPI/Swagger 3.0**
- **swagger-ui-express** para interface web
- **swagger-jsdoc** para geração de documentação

## Acessando a Documentação

### Interface Swagger UI

Após iniciar o servidor, acesse:

```
http://localhost:3000/api-docs
```

A interface Swagger UI permite:

- Visualizar todos os endpoints disponíveis
- Testar endpoints diretamente na interface
- Ver exemplos de requisições e respostas
- Autenticar usando token JWT

### JSON da Documentação

Para obter a especificação OpenAPI em formato JSON:

```
http://localhost:3000/api-docs.json
```

## Como Usar

### 1. Iniciar o Servidor

```bash
npm run dev
```

### 2. Autenticar

1. Acesse http://localhost:3000/api-docs
2. Expanda o endpoint `POST /auth/login`
3. Clique em "Try it out"
4. Insira as credenciais:
   ```json
   {
     "email": "agente@supportflow.com",
     "password": "senha123"
   }
   ```
5. Copie o token retornado

### 3. Autorizar Requisições

1. Clique no botão "Authorize" 🔒 no topo da página
2. Cole o token no formato: `Bearer SEU_TOKEN_AQUI`
3. Clique em "Authorize" e depois "Close"

Agora você pode testar todos os endpoints protegidos!

## Módulos Documentados

### 🎫 Tickets

Gerenciamento completo de chamados:

- ✅ Criar chamado
- ✅ Listar chamados (com filtros, paginação e ordenação)
- ✅ Buscar por ID
- ✅ Atualizar status
- ✅ Atribuir a agente
- ✅ Recalcular prioridade
- ✅ Roteamento automático
- ✅ Atribuição automática
- ✅ Obter transições possíveis

### 📋 Histórico de Tickets

- ✅ Listar histórico completo de alterações

### 💬 Comentários

- ✅ Adicionar comentário interno
- ✅ Listar comentários

### 📎 Anexos

- ✅ Upload de arquivo
- ✅ Listar anexos
- ✅ Remover anexo

### 🔔 Notificações

- ✅ Listar notificações
- ✅ Marcar como lida
- ✅ Marcar todas como lidas

### 📊 Métricas e Resumos

- ✅ Resumo de chamados (summary)
- ✅ Métricas gerenciais (metrics)

### 🔐 Autenticação

- ✅ Login com JWT

### 💚 Health Check

- ✅ Verificar saúde da API

## Schemas Reutilizáveis

Todos os schemas principais estão definidos como componentes reutilizáveis:

### Enums

- `TicketStatus`: OPEN, IN_PROGRESS, WAITING_CUSTOMER, ESCALATED, RESOLVED, CLOSED
- `TicketPriority`: LOW, MEDIUM, HIGH, URGENT
- `UserRole`: ADMIN, AGENT, CUSTOMER
- `NotificationType`: TICKET_CREATED, TICKET_ASSIGNED, SLA_WARNING, etc.
- `TicketHistoryEvent`: CREATED, ASSIGNED, STATUS_CHANGED, etc.

### Entidades

- `Ticket`: Chamado completo
- `TicketComment`: Comentário interno
- `TicketAttachment`: Anexo do chamado
- `TicketHistory`: Histórico de alterações
- `Notification`: Notificação do sistema
- `TicketSummary`: Resumo agregado
- `TicketMetrics`: Métricas operacionais

### DTOs de Request

- `CreateTicketRequest`
- `UpdateTicketStatusRequest`
- `AssignTicketRequest`
- `CreateCommentRequest`

### DTOs de Response

- `PaginatedTickets`
- `RouteTicketResponse`
- `Error`

## Filtros e Paginação

### Listar Chamados

```
GET /tickets?page=1&limit=10&status=OPEN&priority=HIGH&sortBy=createdAt&sortOrder=desc
```

**Parâmetros disponíveis:**

- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (1-100, padrão: 10)
- `status`: Filtrar por status
- `priority`: Filtrar por prioridade
- `categoryId`: Filtrar por categoria
- `customerId`: Filtrar por cliente
- `assignedToId`: Filtrar por agente
- `unassigned`: Apenas não atribuídos (true/false)
- `overdue`: Apenas vencidos (true/false)
- `search`: Buscar em protocolo, título e descrição
- `createdFrom`: Data de criação a partir de
- `createdTo`: Data de criação até
- `sortBy`: Campo de ordenação (createdAt, slaDueAt, priority)
- `sortOrder`: Ordem (asc, desc)

**Resposta paginada:**

```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

## Exemplos de Uso

### Criar Chamado

```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Problema com cobrança",
    "description": "Fui cobrado duas vezes no meu cartão",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "priority": "HIGH"
  }'
```

### Atualizar Status

```bash
curl -X PATCH http://localhost:3000/api/v1/tickets/{id}/status \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

### Adicionar Comentário

```bash
curl -X POST http://localhost:3000/api/v1/tickets/{id}/comments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Cliente foi contatado por telefone"
  }'
```

### Upload de Anexo

```bash
curl -X POST http://localhost:3000/api/v1/tickets/{id}/attachments \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@/caminho/para/arquivo.pdf"
```

### Listar Notificações

```bash
curl -X GET "http://localhost:3000/api/v1/notifications?unread=true" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Segurança

### Autenticação JWT

Todos os endpoints (exceto `/auth/login` e `/health`) requerem autenticação via JWT Bearer token.

**Header obrigatório:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Autorização por Role

Diferentes endpoints requerem diferentes níveis de acesso:

- **CUSTOMER**: Pode criar chamados e visualizar seus próprios dados
- **AGENT**: Pode gerenciar chamados, adicionar comentários, anexos
- **ADMIN**: Acesso total, incluindo métricas e operações administrativas

### Isolamento Multi-Tenant

Todos os endpoints respeitam o `tenantId` do token JWT, garantindo que:

- Usuários só acessam dados de sua própria organização
- Filtros e buscas são sempre limitados ao tenant
- Cross-tenant access é bloqueado automaticamente

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `204 No Content`: Ação bem-sucedida sem conteúdo de resposta
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Não autenticado
- `403 Forbidden`: Sem permissão
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Estrutura de Erros

```json
{
  "error": "Mensagem descritiva do erro",
  "statusCode": 400
}
```

## Próximos Passos

Documentação futura recomendada:

1. **Módulo de Usuários**: Endpoints de gerenciamento de usuários
2. **Módulo de Clientes**: CRUD de clientes
3. **Módulo de Categorias**: Gerenciamento de categorias de tickets
4. **Módulo de SLA Policies**: Configuração de políticas de SLA
5. **Webhooks**: Documentar webhooks para eventos de tickets
6. **Rate Limiting**: Documentar limites de taxa
7. **Versionamento**: Estratégia de versionamento da API

## Ferramentas Recomendadas

### Testar a API

- **Swagger UI**: Interface integrada (recomendado)
- **Postman**: Importar o JSON da documentação
- **Insomnia**: Importar o JSON da documentação
- **curl**: Linha de comando

### Gerar Clientes

O JSON OpenAPI pode ser usado para gerar clientes automaticamente:

```bash
# JavaScript/TypeScript
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g typescript-axios \
  -o ./generated-client

# Python
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g python \
  -o ./generated-client
```

## Contribuindo

Ao adicionar novos endpoints:

1. Crie um arquivo `*.swagger.ts` no diretório `docs/` do módulo
2. Use JSDoc comments com anotações `@swagger`
3. Referencie schemas existentes quando possível
4. Adicione exemplos de request/response
5. Documente todos os parâmetros e códigos de status
6. Teste a documentação acessando `/api-docs`

## Suporte

Para dúvidas ou problemas:

- Documentação técnica: `/api-docs`
- Especificação JSON: `/api-docs.json`
- Email: support@supportflow.com
