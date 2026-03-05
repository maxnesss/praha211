# Produkční Env Checklist

Tento checklist je závazný před každým produkčním nasazením.

## 1. Stop Podmínky (Deploy Blok)

Pokud je splněno cokoliv níže, **nedeployovat**:

- chybí některý povinný env klíč
- některá povinná env hodnota je prázdná nebo placeholder
- `REGISTRATION_CODE` není nastaveno (produkce vrací `503` na `/api/auth/register`)
- `HEALTHCHECK_SECRET` není nastaveno (produkce vrací `503` na `/api/health/db`)
- `CRON_SECRET` není nastaveno (produkce vrací `503` na `/api/cron`)

## 2. Povinné Env Proměnné

- `DATABASE_URL`
- `NEXTAUTH_URL` (produkční HTTPS URL)
- `NEXTAUTH_SECRET` (dlouhý náhodný secret)
- `NEXT_PUBLIC_SITE_URL` (produkční HTTPS URL)
- `REGISTRATION_CODE` (nesmí být prázdné)
- `RESEND_API_KEY`
- `RESEND_FROM`
- `HEALTHCHECK_SECRET`
- `CRON_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

## 3. Volitelné (Doporučené) Env

- `RESEND_CONTACT_TO`
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `R2_ENDPOINT`
- `CLAIM_VALIDATION_LOCK_STALE_MS`
- `LOCAL_SELFIE_VALIDATION_TIMEOUT_MS`
- `CLAIM_VALIDATION_CRON_BATCH_SIZE`

## 4. Reverse Proxy / IP Důvěra

- přepisovat `X-Real-IP` a `X-Forwarded-For` na proxy
- nepouštět spoofované klientské hodnoty bez přepsání
- při Cloudflare nastavit trusted ranges + `real_ip_header CF-Connecting-IP`

Minimální nginx nastavení:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## 5. Povinný Pre-Deploy Runbook

Spustit v pořadí:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run lint
npm run build
CI=true npm run test:integration:all
npm run r2:smoke
```

Alternativa jedním příkazem:

```bash
npm run predeploy:runbook
```

## 6. Post-Deploy Smoke (Produkce)

Bezpečnostní endpointy:

```bash
curl -i -H "x-health-check-secret: <HEALTHCHECK_SECRET>" https://<domena>/api/health/db
curl -i -X POST -H "x-cron-secret: <CRON_SECRET>" "https://<domena>/api/cron?tasks=cleanup-empty-teams"
```

Kontrola hlaviček:

```bash
curl -I https://<domena>/ | grep -Ei "content-security-policy|strict-transport-security|x-frame-options|referrer-policy"
```

## 7. Finální Sign-Off

- [ ] všechny povinné env jsou nastavené a bez placeholderů
- [ ] pre-deploy runbook prošel bez chyb
- [ ] post-deploy smoke prošel
- [ ] health/cron endpointy jsou dostupné pouze se správným secret headerem
