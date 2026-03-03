# ADR 0001: Score Ledger Model

- Status: Accepted
- Date: 2026-03-03
- Decision owners: PRAHA 112 core team

## Context

PRAHA 112 odděluje dva herní cíle:

- Completion je konečný cíl (`112/112` městských částí).
- Score je otevřená soutěž (základní body + denní multiplikátor + streak bonus).

Potřebujeme:

- deterministický výpočet bodů,
- možnost bezpečných oprav/backfillů,
- auditovatelnou historii bodových změn.

## Decision

Používáme ledger model nad modelem `ScoreEvent`:

- každý bodový dopad je samostatný event s `eventKey`,
- `eventKey` je unikátní per user (`@@unique([userId, eventKey])`),
- claims se ukládají samostatně v `DistrictClaim`,
- agregace skóre se počítá z ledgeru (`syncUserScoreEvents`),
- změny v historických datech řešíme synchronizací/backfillem namísto ručních ad-hoc update.

## Consequences

Pozitivní:

- auditovatelnost a reprodukovatelnost bodování,
- idempotentní přepočet bez duplicitních bodů,
- jasné oddělení doménových dat (claim) a účetní vrstvy (score events).

Negativní:

- vyšší komplexita než přímý denormalizovaný `totalScore` sloupec,
- potřeba udržovat integrační testy na konzistenci ledgeru.

## Implementation Notes

- `prisma/schema.prisma`: model `ScoreEvent`, unikátní `eventKey`.
- `lib/game/score-ledger.ts`: synchronizace eventů.
- `scripts/backfill-score-events.mjs`: provozní backfill.
