# 📡 Documentação API — Sea and Soul ERP

> Base URL: `https://api.seasoul.ao/v1`
> Autenticação: Bearer JWT
> Formato: JSON

---

## Autenticação

### POST `/auth/login`
```json
// Request
{ "email": "user@seasoul.ao", "password": "..." }

// Response
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "name": "...", "role": "..." }
}
```

### POST `/auth/refresh`
```json
// Request
{ "refreshToken": "eyJ..." }

// Response
{ "accessToken": "eyJ..." }
```

### POST `/auth/2fa/verify`
```json
// Request
{ "token": "123456" }
// Response
{ "verified": true }
```

---

## Reservas (PMS)

### GET `/reservations`
Parâmetros: `resort_id`, `status`, `date_from`, `date_to`, `page`, `limit`

### POST `/reservations`
```json
{
  "resort_id": "resort_cabo_ledo",
  "room_id": "uuid",
  "guest": { "name": "...", "email": "...", "phone": "..." },
  "check_in": "2026-04-01",
  "check_out": "2026-04-05",
  "adults": 2,
  "children": 0
}
```

### POST `/reservations/:id/checkin`
Gera PIN fechadura via Seam API e notifica hóspede.

### POST `/reservations/:id/checkout`
Revoga PIN e consolida fatura final.

---

## Fechaduras (Seam API)

### POST `/locks/pin/generate`
```json
// Request
{ "reservation_id": "uuid", "room_id": "uuid" }

// Response
{ "pin": "4829", "valid_from": "...", "valid_until": "..." }
```

### DELETE `/locks/pin/:reservation_id`
Revoga o PIN da reserva.

### GET `/locks/status/:room_id`
```json
{ "locked": true, "battery": 85, "last_access": "..." }
```

---

## POS + Faturação

### POST `/pos/sales`
```json
{
  "resort_id": "...",
  "reservation_id": "uuid | null",
  "items": [
    { "product_id": "uuid", "qty": 2, "unit_price": 5000 }
  ],
  "payment_method": "cash | card | room_charge"
}
```

### POST `/pos/invoices/:sale_id/emit`
Assina RSA, envia à AGT e devolve PDF URL.
```json
{
  "invoice_number": "FT 2026/00001",
  "agt_status": "accepted",
  "agt_qr_code": "...",
  "pdf_url": "https://files.seasoul.ao/faturas/..."
}
```

### GET `/agt/saft/:year/:month`
Devolve ficheiro SAF-T XML do período.

---

## Stock

### GET `/stock/items`
Parâmetros: `resort_id`, `department`, `low_stock`

### POST `/stock/movements`
```json
{
  "item_id": "uuid",
  "type": "in | out",
  "qty": 10,
  "reason": "compra | venda | ajuste",
  "sale_id": "uuid | null"
}
```

---

## RH + Assiduidade

### POST `/attendance/checkin`
```json
{
  "employee_id": "uuid",
  "resort_id": "...",
  "lat": -9.0333,
  "lng": 13.2667,
  "type": "entry | exit | break_start | break_end"
}
// Validação GPS geofencing no backend
```

### GET `/attendance/report`
Parâmetros: `resort_id`, `month`, `year`, `employee_id`

### POST `/payroll/process`
```json
{
  "resort_id": "...",
  "month": 4,
  "year": 2026
}
// Calcula salários com base na assiduidade do mês
```

---

## Painel Central

### GET `/dashboard/overview`
```json
{
  "resorts": [
    {
      "id": "resort_cabo_ledo",
      "occupancy": 87,
      "revenue_today": 450000,
      "checkins_today": 12,
      "checkouts_today": 8
    }
  ],
  "total_revenue_mtd": 12500000
}
```

---

## Webhooks

### Seam API → `/webhooks/seam`
Recebe eventos de acesso às fechaduras em tempo real.

### AGT → `/webhooks/agt`
Recebe confirmações de faturas processadas.

---

*Documentação completa disponível em: `https://api.seasoul.ao/docs` (Swagger UI)*

*ENGERIS — engeris.co.ao | Março 2026*
