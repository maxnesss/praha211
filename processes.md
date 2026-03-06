# PRAHA 112 - Procesy aplikace

Tento dokument popisuje hlavni tokove procesy podle aktualni implementace v kodu.
Primarne pokryva: registraci, prihlaseni a potvrzeni mestske casti (claim).

Poznamka:
- Kompletní scoring pravidla (vsechny event typy, achievement tiers, thresholds, backfill pravidla) jsou v `docs/scoring.md`.

## 1. Proces: Registrace (e-mail + heslo)

### Spoustec
- Uzivatel odesle formular na `/sign-up`.
- Frontend validuje data pres `registerSchema`.

### Frontend kroky
1. Stranka `app/sign-up/page.tsx` nasbira `name`, `nickname`, `email`, `password`, `registrationCode`.
2. Probehne klientska validace (Zod) v prohlizeci.
3. Frontend posle `POST /api/auth/register` s JSON payloadem.
4. Po uspesne registraci frontend zobrazi informaci o overovacim e-mailu.
5. Po kratke prodleve dojde k redirectu na `/sign-in`.

### Backend kroky (`POST /api/auth/register`)
1. Rate-limit (`auth-register`): max 6 pokusu / 15 minut (neprihlasena identita: fingerprint, volitelne IP).
2. Parsovani JSON tela, Zod validace `registerSchema`.
3. Kontrola a vyhodnoceni registracniho kodu:
   - primarne z `REGISTRATION_CODE`,
   - fallback `sokol` jen mimo produkci (local/CI),
   - v produkci bez kodu vraci endpoint `503`.
4. Kontrola, zda uz e-mail neexistuje:
   - pokud e-mail existuje a neni overeny, token se znovu otoci a (pokud jde) znovu odesle overovaci e-mail,
   - odpoved zustava zamerne obecna (`200`) kvuli anti-enumeration.
5. Kontrola obsazene prezdivky.
6. Hash hesla (`bcryptjs`, cost 12).
7. Vytvoreni `User` zaznamu:
   - `role = USER`
   - `avatar = DEFAULT_USER_AVATAR`
   - `passwordHash = hashed password`
   - `emailVerificationTokenHash` + expirace
8. Vytvoreni uvitacich systemovych zprav do inboxu.
9. Odeslani overovaciho e-mailu (mimo test domeny).
10. Odpoved `201`.

### Datove efekty
- Tabulka `User`: novy uzivatel, unikatni `email`, unikatni `nickname` (pokud vyplnena).
- Tabulka `UserMessage`: 2 uvitaci systemove zpravy.

### Chybove vetve
- `400`: neplatny vstup / neplatne telo pozadavku.
- `409`: prezdivka uz existuje.
- `503`: registrace je docasne vypnuta (chybi produkcni `REGISTRATION_CODE`).
- `429`: prilis mnoho pokusu o registraci.
- `500`: neocekavana chyba.

## 2. Proces: Prihlaseni (Credentials)

### Spoustec
- Uzivatel odesle formular na `/sign-in`.

### Frontend kroky
1. `app/sign-in/page.tsx` nacte `email`, `password`.
2. Klientska validace pres `signInSchema`.
3. Volani `signIn("credentials", { redirect: false })`.
4. Pri uspechu redirect na `callbackUrl` nebo `/radnice`.

### Backend kroky (NextAuth Credentials provider)
1. Credentials callback route ma rate-limit (`auth-credentials-signin`): max 12 / 10 minut.
2. Validace credentials pres `signInSchema`.
3. Nacteni uzivatele dle e-mailu.
4. Overeni `passwordHash` + `bcrypt compare`.
5. Kontrola stavu uctu:
   - zmrazeny ucet -> `ACCOUNT_FROZEN`,
   - neovereny e-mail -> `EMAIL_NOT_VERIFIED`.
6. Pokud sedi, vraci user payload do NextAuth.
7. V JWT callbacku se ulozi:
   - `id`, `role`, `avatar`
   - `sessionVersion` (pro invalidaci starsich session)
8. V session callbacku se propise do `session.user`.

### Chybove vetve
- Neplatne credentials => `authorize` vraci `null`, UI zobrazi "Neplatny e-mail nebo heslo.".
- Zmrazeny nebo neovereny ucet => prihlaseni je zamitnuto s odpovidajicim chovanim na prihlasovaci strance.
- Pri preteceni limitu prihlaseni route vraci `429`.

## 3. Proces: Registracni kod

### Spoustec
- Uzivatel odesle formular na `/sign-up` s polem `registrationCode`.

### Validace
1. Klient i server validuji `registrationCode` pres `registerSchema`.
2. Kod je povinny, normalizuje se na lowercase.
3. Ocekavana hodnota:
   - primarne `REGISTRATION_CODE`,
   - fallback `sokol` jen v local/CI rezimu.
4. Pokud v produkci chybi `REGISTRATION_CODE`, registrace je vypnuta (`503`).

### Chybove vetve
- Pri spatnem kodu vrati API `400` s hlaskou `Neplatny registracni kod.`.
- Pri chybejicim produkcnim kodu vrati API `503`.

## 4. Proces: Autorizace a pristup na chranene stranky

Aplikace nepouziva globalni middleware pro auth; ochrana probiha na urovni stranek/API.

### Chranene server stranky (priklad)
- `app/radnice/page.tsx`, `app/district/[code]/page.tsx`, `app/profile/page.tsx`, `app/tym/page.tsx`.

Krok:
1. `getServerSession(authOptions)`.
2. Pokud chybi `session.user.id`, redirect na `/sign-in` (casto s `callbackUrl`).

### Chranene API
- Napr. `/api/districts/[code]/claim`, `/api/uploads/selfie/sign`, `/api/uploads/selfie/view`.

Krok:
1. `getServerSession(authOptions)`.
2. Pri chybejici session vrati `401`.

## 5. Proces: Potvrzeni mestske casti (Claim district)

Tento proces je dvoukrokovy: nejdriv upload selfie do R2, potom odeslani zadosti o potvrzeni.

### 5.1 Frontend claim flow (`components/claim-district-form.tsx`)
1. Uzivatel otevre modal "Odemknout mestskou cast".
2. Vybere soubor + potvrdi 2 checkboxy:
   - fyzicka navsteva
   - viditelna oficialni cedule
3. Frontend validuje soubor:
   - MIME (`jpeg/png/webp/heic/heif`)
   - max velikost 10 MB
4. Frontend vola `POST /api/uploads/selfie/sign`.
5. Dostane `uploadUrl` + `selfieKey`.
6. Soubor nahraje `PUT` requestem primo do R2 (pres signed URL).
7. Po uspesnem uploadu vola `POST /api/districts/{code}/claim` s `selfieUrl=selfieKey`.
8. Po uspechu UI zobrazi potvrzeni + unlock efekt + `router.refresh()`.

### 5.2 Backend: podpis uploadu (`POST /api/uploads/selfie/sign`)
1. Kontrola session (`401` pokud neprihlasen).
2. Rate-limit `selfie-upload-sign`: max 30 / 5 minut (uzivatel).
3. Validace payloadu (filename/type/size, optional districtCode).
4. Generovani object key:
   - `selfies/{userId}/{YYYY}/{MM}/{DD}/{uuid}.{ext}`
5. Vytvoreni signed PUT URL pro Cloudflare R2.
6. Odpoved s `uploadUrl`, `selfieKey`, `expiresIn`.

### 5.3 Backend: claim enqueue + validace (`POST /api/districts/[code]/claim`)
1. Kontrola session (`401` pokud neprihlasen).
2. Kontrola, zda uzivatel neni zmrazeny (`403`).
3. Rate-limit `district-claim`: max 30 / 5 minut (uzivatel).
4. Kontrola existence districtu (`404` pokud neexistuje).
5. Validace payloadu (`districtClaimSchema`):
   - `selfieUrl` musi byt interni key `selfies/...`
   - `attestVisited=true`
   - `attestSignVisible=true`
6. Kontrola ownership selfie key (`selfies/{userId}/...`) + existence objektu v R2.
7. Kontrola, zda uzivatel uz district nema potvrzeny a zda nema pending submission.
8. Vytvoreni `DistrictClaimSubmission` se stavem `PENDING`.
9. Spusteni lokalni validace:
   - v CI se zpracuje hned (`processPendingClaimValidations`) a pri schvaleni muze prijit `201` s claimem,
   - bezne prostredi vraci `202` a validace dobehne asynchronne.
10. Pri uspesnem schvaleni se vytvori `DistrictClaim` a refreshne leaderboard tag.

### 5.4 Backend: stav claimu (`GET /api/districts/[code]/claim`)
1. Kontrola session (`401`).
2. Pokud existuje `DistrictClaim`, vraci `status: "CLAIMED"`.
3. Pokud existuje pending submission, vraci `status: "PENDING"`.
4. Jinak vraci `status: "NONE"`.

### Datove efekty
- Tabulka `DistrictClaimSubmission`: nova zadost o potvrzeni.
- Tabulka `DistrictClaim`: vznikne az po schvaleni validace.

### Chybove vetve
- `400`: neplatny payload / nesplnene attest podminky.
- `401`: neprihlaseny uzivatel.
- `403`: zmrazeny ucet / cizi selfie key.
- `404`: district nebo selfie neexistuje.
- `409`: district uz byl potvrzen nebo uz existuje pending zadost.
- `429`: rate-limit.
- `500`: interni chyba.

## 6. Proces: Zobrazeni nahrane selfie (privatni pristup)

### Spoustec
- Uzivatel klikne na "Otevrit nahranou selfie" (odkaz na `/api/uploads/selfie/view?key=...`).

### Backend kroky (`GET /api/uploads/selfie/view`)
1. Kontrola session (`401` pokud neprihlasen).
2. Rate-limit `selfie-view`: max 60 / 5 minut (uzivatel).
3. Validace `key` (`selfies/...`).
4. Kontrola opravneni:
   - bezny uzivatel vidi jen vlastni selfie,
   - `ADMIN` muze i cizi.
5. Vygeneruje se signed GET URL do R2 (kratka expirace).
6. Server vrati `302` redirect na podepsanou URL.

### Bezpecnostni poznamka
- Obrazky nejsou verejne linkovane; pristup je pres kratkodobe podepsane URL.

## 7. Dulezite technicke poznamky

- Session strategie je `jwt` (NextAuth).
- Canonical cas claimu je serverovy `claimedAt`.
- Rate-limit pouziva DB bucket (`RateLimitBucket`) s in-memory fallbackem pri chybe DB.
- U neprihlasenych endpointu je identita defaultne fingerprint klienta.
- Pokud je nastaveno `RATE_LIMIT_TRUST_PROXY_HEADERS=true`, muze se pouzit IP z proxy hlavicek.
- Chranene route se kontroluji per-page/per-endpoint pomoci `getServerSession`.

## 8. Procesy tymu (create, apply, approve/reject, leave, remove member)

Zakladni pravidla podle implementace:
- 1 hrac muze byt jen v 1 tymu (`User.teamId`).
- Tym ma max 5 clenu (`TEAM_MAX_MEMBERS = 5` + DB trigger guard).
- Velitel tymu je hrac, ktery tym vytvoril (`Team.leaderUserId`).

### 8.1 Vytvoreni tymu (`POST /api/teams`)

#### Spoustec
- Uzivatel bez tymu potvrdi vytvoreni tymu ve formulari/modalu.

#### Backend kroky
1. Kontrola session (`401` pokud neprihlasen).
2. Rate-limit `teams-create`: max 5 pokusu / 1 hodina (uzivatel).
3. Parsovani JSON + validace `createTeamSchema`:
   - `name` min 2, max 40
   - slugovatelny na delku >= 2
4. Vypocet `slug = toTeamSlug(name)`.
5. Serializable transakce s retry:
   - nacte uzivatele
   - overi, ze uzivatel neni v tymu
   - vytvori `Team` + nastavi uzivatele jako leadera a clena
6. Odpoved `201` s novym tymem.

#### Datove efekty
- Nova radka v `Team`.
- Autor je pripojen jako clen (`User.teamId = team.id`) a velitel (`leaderUserId`).

#### Chybove vetve
- `400`: neplatny nazev/slug.
- `401`: neprihlaseny uzivatel.
- `404`: uzivatel nenalezen.
- `409`: uz je v tymu / kolize nazvu-slugu / soubezna zmena.
- `429`: rate-limit.
- `500`: interni chyba.

### 8.2 Zadost o vstup do tymu (`POST /api/teams/[slug]/apply`)

#### Spoustec
- Uzivatel mimo tym otevre detail tymu a klikne na zadost o vstup.

#### Backend kroky
1. Kontrola session (`401` pokud neprihlasen).
2. Rate-limit `teams-apply`: max 20 zadosti / 10 minut (uzivatel).
3. Serializable transakce s retry:
   - nacte cilovy tym a uzivatele
   - overi, ze uzivatel neni v jinem tymu a neni velitel tohoto tymu
   - overi, zda uz neexistuje `PENDING` request
   - `upsert` do `TeamJoinRequest` se stavem `PENDING`
4. Odpoved `200` s potvrzenim.

#### Datove efekty
- Vznik nebo reset zadosti v `TeamJoinRequest` na `PENDING`.

#### Chybove vetve
- `401`: neprihlaseny uzivatel.
- `404`: tym/uzivatel nenalezen.
- `409`: uz je v tymu, uz je velitel, zadost uz ceka, nebo soubezna zmena.
- `429`: rate-limit.
- `500`: interni chyba.

### 8.3 Schvaleni zadosti velitelem (`POST /api/teams/[slug]/requests/[requestId]/approve`)

#### Spoustec
- Velitel tymu otevre detail tymu a schvali konkretni zadost.

#### Backend kroky
1. Kontrola session (`401` pokud neprihlasen).
2. Serializable transakce s retry:
   - nacte tym podle slug + zadost podle `requestId`
   - overi, ze caller je velitel tymu
   - overi, ze zadost patri do tymu a je `PENDING`
   - overi, ze zadatel stale neni v jinem tymu
   - spocita aktualni pocet clenu tymu a overi limit 5
   - prida zadatele do tymu (`updateMany ... where teamId is null`)
   - nastavi schvalovanou zadost na `ACCEPTED`
   - vsechny ostatni `PENDING` zadosti stejneho uzivatele nastavi na `REJECTED`
3. Odpoved `200`.

#### Datove efekty
- `User.teamId` zadatele je nastaven na cilovy tym.
- Vybrana zadost -> `ACCEPTED`, ostatni cekajici -> `REJECTED`.

#### Chybove vetve
- `401`: neprihlaseny uzivatel.
- `403`: akci neprovadi velitel tymu.
- `404`: tym / zadost / zadatel nenalezen.
- `409`: zadost uz zpracovana, zadatel uz v jinem tymu, tym plny, nebo soubezna zmena.
- `500`: interni chyba.

### 8.4 Zamitnuti zadosti velitelem (`POST /api/teams/[slug]/requests/[requestId]/reject`)

#### Spoustec
- Velitel tymu zamitne konkretni zadost.

#### Backend kroky
1. Kontrola session (`401`).
2. Serializable transakce s retry:
   - overi tym, velitele, existenci zadosti a stav `PENDING`
   - zmeni stav zadosti na `REJECTED` + nastavi `respondedAt`
3. Odpoved `200`.

#### Datove efekty
- `TeamJoinRequest.status` prejde z `PENDING` na `REJECTED`.

#### Chybove vetve
- `401`: neprihlaseny uzivatel.
- `403`: akci neprovadi velitel tymu.
- `404`: tym nebo zadost nenalezena.
- `409`: zadost uz neni `PENDING` nebo soubezna zmena.
- `500`: interni chyba.

### 8.5 Odejiti z tymu (`POST /api/teams/[slug]/leave`)

#### Spoustec
- Clen tymu klikne na opusteni tymu.

#### Backend kroky
1. Kontrola session (`401`).
2. Serializable transakce s retry:
   - overi tym + uzivatele
   - overi, ze je clenem daneho tymu
   - velitel nesmi odejit sam (`LEADER_CANNOT_LEAVE`)
   - nastavi `User.teamId = null`
3. Odpoved `200`.

#### Datove efekty
- Uzivatel je odebran z tymu (`teamId = null`).

#### Chybove vetve
- `401`: neprihlaseny uzivatel.
- `404`: tym nebo uzivatel nenalezen.
- `409`: neni clenem tymu, velitel se pokousi odejit, nebo soubezna zmena.
- `500`: interni chyba.

### 8.6 Odebrani clena velitelem (`POST /api/teams/[slug]/members/[memberId]/remove`)

#### Spoustec
- Velitel tymu odebere konkretniho clena.

#### Backend kroky
1. Kontrola session (`401`).
2. Serializable transakce s retry:
   - overi tym a opravneni velitele
   - velitel nemuze odebrat sam sebe
   - overi, ze `memberId` je clenem tohoto tymu
   - nastavi clenuv `teamId = null`
3. Odpoved `200`.

#### Datove efekty
- Odebirany hrac je vyjmut z tymu.

#### Chybove vetve
- `401`: neprihlaseny uzivatel.
- `403`: akci neprovadi velitel tymu.
- `404`: tym nebo clen nenalezen v tymu.
- `409`: pokus odebrat velitele nebo soubezna zmena.
- `500`: interni chyba.

### 8.7 Doplnek: primy join endpoint je vypnuty
- `POST /api/teams/[slug]/join` vraci `410`.
- Aplikace tim vynucuje workflow se zadosti (`/apply`) a schvalenim velitelem.

### 8.8 Doplnek: ochrana proti soubehu a preplneni tymu
- Team mutation endpointy bezne bezi v `Serializable` transakci s retry (`P2034`).
- DB trigger `enforce_team_member_limit` zajistuje max 5 clenu i pri race conditions.

## 9. Rychly seznam procesu (mapa)

1. Landing (`/`) -> pokud login existuje, redirect `/radnice`.
2. Registrace (`/sign-up`) -> `POST /api/auth/register` -> overovaci e-mail -> `/sign-in`.
3. Prihlaseni (`/sign-in`) -> NextAuth credentials -> `/radnice` nebo callback URL.
4. Claim district (`/district/[code]`) -> sign upload -> upload do R2 -> claim API -> enqueue/validace -> schvaleny claim.
5. Zobrazeni selfie -> private signed view link.
6. Tym create (`/api/teams`) -> zadost (`/apply`) -> schvaleni/zamitnuti velitelem.
7. Sprava clenu tymu -> leave / remove member dle role.
