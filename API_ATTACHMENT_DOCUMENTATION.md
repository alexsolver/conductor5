# API de Anexos de Tickets - Documentação

## Endpoint de Upload de Anexos

### `POST /api/tickets/:ticketId/attachments`

Faz upload de anexos para um ticket específico com suporte a descrição opcional.

#### Parâmetros da URL
- `ticketId` (string, obrigatório): UUID do ticket

#### Headers
- `Authorization: Bearer <access_token>` (obrigatório)
- `Content-Type: multipart/form-data`

#### Body (multipart/form-data)
- `attachments` (File[], obrigatório): Array de arquivos (máximo 5)
- `description` (string, opcional): Descrição do anexo (máximo 500 caracteres)

#### Tipos de Arquivo Suportados
```javascript
const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv', 'application/json',
  'video/mp4', 'video/avi', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/mp3'
];
```

#### Resposta de Sucesso (200)
```json
{
  "success": true,
  "message": "Successfully uploaded 2 file(s)",
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "ticket_id": "uuid", 
      "file_name": "timestamp_filename.ext",
      "file_size": 1024,
      "file_type": "image/jpeg",
      "file_path": "/uploads/attachments/tenant_id/filename",
      "content_type": "image/jpeg",
      "description": "Captura de tela do erro",
      "is_active": true,
      "created_by": "uuid",
      "created_at": "2025-08-08T17:00:00Z",
      "updated_at": "2025-08-08T17:00:00Z"
    }
  ]
}
```

#### Respostas de Erro

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Ticket not found"
}
```

**400 Bad Request**
```json
{
  "success": false,
  "message": "No files provided"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Error uploading attachments"
}
```

## Exemplo de Uso

### Frontend (React)
```typescript
const uploadFiles = async (files: File[], description: string) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('attachments', file);
  });
  
  if (description.trim()) {
    formData.append('description', description.trim());
  }

  const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    credentials: 'include',
  });

  return response.json();
};
```

### cURL
```bash
curl -X POST \
  -H "Authorization: Bearer your_access_token" \
  -F "attachments=@file1.jpg" \
  -F "attachments=@file2.pdf" \
  -F "description=Documentos de suporte técnico" \
  http://localhost:5000/api/tickets/uuid/attachments
```

## Recursos de Segurança

- ✅ **Autenticação**: Token JWT obrigatório
- ✅ **Isolamento de Tenant**: Validação automática de tenant_id
- ✅ **Validação de Ticket**: Verificação se o ticket existe e pertence ao tenant
- ✅ **Validação de Tipo**: Apenas tipos de arquivo permitidos
- ✅ **Audit Trail**: Registro automático no histórico do ticket
- ✅ **Sanitização**: Nomes de arquivo sanitizados automaticamente

## Estrutura de Armazenamento

```
uploads/
└── attachments/
    └── {tenant_id}/
        └── {timestamp}_{sanitized_filename}.ext
```

## Log de Auditoria

Cada upload gera automaticamente uma entrada no histórico do ticket:

```sql
INSERT INTO ticket_history (
  tenant_id, ticket_id, performed_by, action_type, description
) VALUES (
  'tenant_uuid', 'ticket_uuid', 'user_uuid', 'attachment_uploaded',
  'Uploaded 2 file(s): documento.pdf, imagem.jpg - Descrição fornecida pelo usuário'
);
```

## Validações Implementadas

1. **Autenticação**: Token JWT válido
2. **Autorização**: Usuário pertence ao tenant do ticket
3. **Existência**: Ticket existe e está ativo
4. **Limite**: Máximo 5 arquivos por upload
5. **Tipo**: Apenas tipos permitidos na whitelist
6. **Tamanho**: Limitado pela configuração do multer
7. **Tenant**: Isolamento completo entre tenants

---

*Documentação atualizada em: 08/08/2025*