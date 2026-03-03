# ADR 0003: Team Limits and Approval Workflow

- Status: Accepted
- Date: 2026-03-03
- Decision owners: PRAHA 112 core team

## Context

Týmová vrstva potřebuje:

- předvídatelnou kapacitu týmů,
- jasnou odpovědnost velitele,
- bezpečné chování při souběžných požadavcích (join/approve/remove).

## Decision

Používáme leader-governed model s pevnými limity:

- tým má maximální počet členů (`TEAM_MAX_MEMBERS`),
- vstup do týmu je přes žádost a schválení velitelem,
- velitel nemůže tým opustit bez předchozího vyřešení členství,
- schvalování/zamítání i přesuny členství běží v serializable transakcích,
- DB guard na úrovni triggeru chrání limit i při souběhu.

## Consequences

Pozitivní:

- konzistentní výsledky i při paralelních requestech,
- jasná role velitele a menší chaos v řízení týmu,
- menší riziko překročení limitu kvůli race conditions.

Negativní:

- složitější implementace než přímý auto-join,
- občasné `409` při souběžných kolizích, které klient musí umět obsloužit.

## Implementation Notes

- `lib/team-utils.ts`: business konstanty (včetně limitu).
- `lib/db/serializable-transaction.ts`: retry pro serializable konflikty.
- API routy:
  - `/api/teams`
  - `/api/teams/[slug]/apply`
  - `/api/teams/[slug]/requests/[requestId]/approve`
  - `/api/teams/[slug]/requests/[requestId]/reject`
  - `/api/teams/[slug]/members/[memberId]/remove`
  - `/api/teams/[slug]/leave`
