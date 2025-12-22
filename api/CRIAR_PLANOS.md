# Como Criar os Planos BASIC e MEDIUM

Agora você pode criar os planos diretamente via API e o sistema criará automaticamente os produtos e preços no Stripe!

## Método Simples (Recomendado)

### 1. Criar Plano BASIC

```bash
curl -X POST http://localhost:3000/plans \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plano Básico",
    "type": "BASIC",
    "description": "Ideal para pequenas equipes",
    "maxUsers": 2,
    "maxChannels": 1,
    "maxConversations": 500,
    "priceMonthly": 4990
  }'
```

### 2. Criar Plano MEDIUM

```bash
curl -X POST http://localhost:3000/plans \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plano Médio",
    "type": "MEDIUM",
    "description": "Para equipes em crescimento",
    "maxUsers": 10,
    "maxChannels": 3,
    "maxConversations": 5000,
    "priceMonthly": 9990
  }'
```

## O que acontece automaticamente:

1. ✅ Cria o produto no Stripe com nome, descrição e metadata
2. ✅ Cria o preço recorrente mensal em BRL
3. ✅ Salva os IDs gerados no banco de dados
4. ✅ Retorna o plano completo criado

## Resposta esperada:

```json
{
  "id": "uuid-gerado",
  "name": "Plano Básico",
  "type": "BASIC",
  "description": "Ideal para pequenas equipes",
  "maxUsers": 2,
  "maxChannels": 1,
  "maxConversations": 500,
  "stripePriceId": "price_xxx",  // ← Gerado automaticamente!
  "stripeProductId": "prod_xxx", // ← Gerado automaticamente!
  "priceMonthly": 4990,
  "active": true,
  "createdAt": "2025-12-22T...",
  "updatedAt": "2025-12-22T..."
}
```

## Você também pode conferir no Stripe Dashboard:

Após criar, acesse:
- **Produtos**: https://dashboard.stripe.com/products
- Você verá os produtos criados com os nomes "Plano Básico" e "Plano Médio"

## Observações:

- Os campos `stripePriceId` e `stripeProductId` são **opcionais**
- Se não fornecidos, o sistema cria automaticamente no Stripe
- Se fornecidos, o sistema usa os IDs informados (útil se você já criou manualmente)
- A moeda é sempre BRL (Real)
- O intervalo é sempre mensal
