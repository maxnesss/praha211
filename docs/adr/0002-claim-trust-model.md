# ADR 0002: Claim Trust Model (Rulebook V1)

- Status: Accepted
- Date: 2026-03-03
- Decision owners: PRAHA 112 core team

## Context

V první verzi chceme nízké frikce pro hráče a jednoduchý provoz.
Nechceme zatím vyžadovat geolokaci, složité ML ověřování ani manuální moderaci každého claimu.

## Decision

Používáme trust-based claim model:

- claim je potvrzen uživatelem,
- canonical čas claimu určuje server (`claimedAt`),
- každý uživatel může claimnout konkrétní district jen jednou
  (`@@unique([userId, districtCode])`),
- selfie slouží jako důkazní artefakt, ne jako automaticky validovaný geofence vstup.

## Guardrails

- rate limiting na write endpointu claimu,
- konzistentní `409` při duplicate claim race condition,
- validace vstupu na API vrstvě,
- privátní upload selfie přes podepsané URL do R2.

## Consequences

Pozitivní:

- rychlé MVP bez těžkého anti-cheat subsystému,
- stabilní a pochopitelná pravidla pro hráče.

Negativní:

- model je záměrně méně striktní vůči podvodům než geolocation-first přístup,
- případná budoucí anti-cheat pravidla musí být přidaná evolučně nad existující data.

## Future Evolution

Možné rozšíření bez porušení kompatibility:

- risk scoring claimů,
- sampled moderation,
- volitelná geolokační verifikace pro vyšší obtížnost.
