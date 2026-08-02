# Contrato da API (referencia para integracao futura)

Este projeto ainda nao faz chamadas reais de API. Os nomes de campo dos
formularios ja foram alinhados com o contrato abaixo para facilitar a
integracao posterior.

## POST /auth/login

Request body:

```json
{
  "registration_number": "string",
  "password": "string"
}
```

Response (esperado, a definir com o backend):

```json
{
  "token": "string",
  "user": {
    "name": "string",
    "registration_number": "string",
    "role": "operator | manager | analyst | admin",
    "email": "string | null",
    "branch_id": "number | null"
  }
}
```

## POST /users

Request body:

```json
{
  "name": "string",
  "registration_number": "string",
  "role": "operator | manager | analyst | admin",
  "email": "string | null",
  "password": "string (min 6 caracteres)",
  "branch_id": "number | null (obrigatorio exceto quando role === 'admin')"
}
```

## Observacoes para a integracao futura

- `branch_id` deve ser `null`/omitido quando `role === "admin"`.
- O front hoje simula o fluxo com estado local (`app/mockSession.ts`) apenas
  para permitir navegar entre /register -> /login -> /profile. Isso deve ser
  substituido pela chamada real e pelo armazenamento de token quando a API
  estiver disponivel.
