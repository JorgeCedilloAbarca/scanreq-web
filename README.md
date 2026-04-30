# ScanReq — Netlify Functions

Carpetas y archivos listos para incluir en el repo scanreq-web.

## Estructura

```
netlify/
  functions/
    create-checkout.js     → POST /api/create-checkout
    stripe-webhook.js      → POST /api/stripe-webhook
    validate-license.js    → POST /api/validate-license
    package.json           → dependencias de las functions
netlify.toml               → configuración de Netlify
```

## Variables de entorno

Añadir en Netlify → Site configuration → Environment variables:

| Variable                  | Valor                                          |
|---------------------------|------------------------------------------------|
| SUPABASE_URL              | https://gzyjuaodrugphtkbyouz.supabase.co       |
| SUPABASE_SERVICE_ROLE_KEY | tu service_role key de Supabase                |
| STRIPE_SECRET_KEY         | sk_test_... (test) / sk_live_... (producción)  |
| STRIPE_WEBHOOK_SECRET     | whsec_... (se genera al crear el webhook)      |
| PRICE_ID_USD              | price_1TRpFODD36m2w52OH7TUvFzi                 |
| PRICE_ID_EUR              | price_1TRpLmDD36m2w52OExPj5tfw                 |

## Endpoints

- POST https://scanreq.com/api/create-checkout
- POST https://scanreq.com/api/stripe-webhook
- POST https://scanreq.com/api/validate-license

## Webhook de Stripe

En Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: https://scanreq.com/api/stripe-webhook
- Evento: checkout.session.completed
- Copiar el Signing secret → STRIPE_WEBHOOK_SECRET
