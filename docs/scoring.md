# Scoring Specification (PRAHA 112)

Tento dokument je kanonická specifikace bodování pro PRAHA 112.
Pokud se změní pravidla v kódu, musí se aktualizovat i tento soubor.

## 1. Základní princip

- Completion je konečný cíl: `112/112`.
- Score je otevřená soutěž, počítaná z event ledgeru `ScoreEvent`.
- Skóre uživatele je vždy součet `ScoreEvent.points`.

## 2. Čas a timezone

- Kanonický čas claimu je serverový `claimedAt`.
- Denní logika (same-day multiplikátor, streak) používá timezone `Europe/Prague`.
- Den se normalizuje na klíč `YYYY-MM-DD` v pražském čase.

## 3. Výpočet `DISTRICT_CLAIM`

Vstupy:

- `basePoints` (dle městské části)
- `claimsTodayBefore` (počet claimů uživatele ve stejný den před aktuálním claimem)
- `streakAfterClaim` (délka aktuální série po započtení claimu)

Vzorce:

- `sameDayMultiplier = min(2, 1 + claimsTodayBefore * 0.15)`
- `streakBonus = streakAfterClaim * 5`
- `awardedPoints = round(basePoints * sameDayMultiplier + streakBonus)`

## 4. ScoreEvent typy a body

| Event type | Event key pattern | Body | Kdy vzniká |
| --- | --- | --- | --- |
| `DISTRICT_CLAIM` | `district_claim:{DISTRICT_CODE}` | `awardedPoints` | při potvrzení části |
| `CHAPTER_COMPLETE` | `chapter_complete:{CHAPTER_SLUG}` | `750` | při dokončení celé kapitoly |
| `PRAHA_PART_COMPLETE` | `praha_part_complete:{1..22}` | `300` | při dokončení odznaku Praha část |
| `ACHIEVEMENT_BADGE_UNLOCK` | `achievement_badge_unlock:{BADGE_ID}` | dle obtížnosti | při odemčení speciálního odznaku |

Body dle obtížnosti pro `ACHIEVEMENT_BADGE_UNLOCK`:

- `EASY = 75`
- `MEDIUM = 150`
- `HARD = 300`
- `LEGENDARY = 600`

## 5. Speciální odznaky (achievement badges)

### 5.1 PROGRESS

Milníky:

- `1`, `10`, `25`, `75`, `100`, `112` potvrzení

Poznámky:

- milestone `50` byl odstraněn

Obtížnost:

- `>= 112` -> `LEGENDARY`
- `>= 75` -> `HARD`
- `>= 25` -> `MEDIUM`
- jinak `EASY`

### 5.2 STREAK

Milníky:

- `3`, `7`, `30` dní

Poznámky:

- milestone `14` byl odstraněn

Obtížnost:

- `>= 30` -> `LEGENDARY`
- `>= 7` -> `MEDIUM`
- jinak `EASY`

### 5.3 RHYTHM

- `rhythm_weekend_patrol`: claim v sobotu i neděli (`MEDIUM`)
- `rhythm_early_bird`: claim mezi `04:00-07:59` (`EASY`)
- `rhythm_night_owl`: claim mezi `21:00-23:59` (`EASY`)

### 5.4 TEAM

- `team_joined_first`: uživatel je / byl v týmu (`MEDIUM`)
- `team_has_led`: uživatel někdy vedl plný tým (`5/5`) (`HARD`)

## 6. `occurredAt` pravidla pro eventy

- `DISTRICT_CLAIM`: `claim.claimedAt`
- `CHAPTER_COMPLETE`: nejpozdější `claimedAt` v kapitole
- `PRAHA_PART_COMPLETE`: nejpozdější `claimedAt` mezi částmi patřícími do dané Praha části
- `ACHIEVEMENT_BADGE_UNLOCK`:
  - standardně nejpozdější claim uživatele
  - fallback při nulovém počtu claimů: `user.createdAt` (typicky team achievement)

## 7. Synchronizace a backfill

- Kompletní sada managed score eventů se přepočítává přes `syncUserScoreEvents`.
- Eventy jsou idempotentní díky unikátnímu klíči `@@unique([userId, eventKey])`.
- Při změně scoring pravidel je nutné spustit:

```bash
npm run score:backfill
```

- Synchronizace se volá minimálně při:
  - vytvoření claimu
  - vytvoření týmu
  - schválení žádosti do týmu
  - hlasování o veliteli (pro aktuálního velitele)

## 8. Source of truth v kódu

- `lib/game/scoring-core.ts` (výpočet `awardedPoints`, streak helpery)
- `lib/game/badges.ts` (definice achievement badge, thresholds, obtížnost)
- `lib/game/score-ledger.ts` (typy eventů, body, event keys, synchronizace)
- `prisma/schema.prisma` (`ScoreEvent`, enum `ScoreEventType`)
- `scripts/backfill-score-events.mjs` (provozní přepočet)
