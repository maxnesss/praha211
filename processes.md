# PRAHA 112 - Procesy aplikace

Tento dokument popisuje hlavni tokove procesy podle aktualni implementace v kodu.
Primarne pokryva: registraci, prihlaseni a potvrzeni mestske casti (claim).

## 1. Proces: Registrace (e-mail + heslo)

### Spoustec
- Uzivatel odesle formular na `/sign-up`.
- Frontend validuje data pres `registerSchema`.

### Frontend kroky
1. Stranka `app/sign-up/page.tsx` nasbira `name`, `email`, `password`.
2. Probehne klientska validace (Zod) v prohlizeci.
3. Frontend posle `POST /api/auth/register` s JSON payloadem.
4. Po uspesne registraci frontend automaticky vola `signIn("credentials")`.
5. Pri uspechu dojde k redirectu na `/overview`.

### Backend kroky (`POST /api/auth/register`)
1. Rate-limit (`auth-register`): max 6 pokusu / 15 minut (IP).
2. Parsovani JSON tela, Zod validace `registerSchema`.
3. Kontrola, zda uz e-mail neexistuje.
4. Hash hesla (`bcryptjs`, cost 12).
5. Vygenerovani unikatni prezdivky (`generateUniqueNickname`).
6. Vytvoreni `User` zaznamu:
   - `role = USER`
   - `avatar = DEFAULT_USER_AVATAR`
   - `passwordHash = hashed password`
7. Odpoved `201`.

### Datove efekty
- Tabulka `User`: novy uzivatel, unikatni `email`, unikatni `nickname` (pokud vyplnena).

### Chybove vetve
- `400`: neplatny vstup / neplatne telo pozadavku.
- `409`: e-mail (nebo prezdivka) uz existuje.
- `429`: prilis mnoho pokusu o registraci.
- `500`: neocekavana chyba.

## 2. Proces: Prihlaseni (Credentials)

### Spoustec
- Uzivatel odesle formular na `/sign-in`.

### Frontend kroky
1. `app/sign-in/page.tsx` nacte `email`, `password`.
2. Klientska validace pres `signInSchema`.
3. Volani `signIn("credentials", { redirect: false })`.
4. Pri uspechu redirect na `callbackUrl` nebo `/overview`.

### Backend kroky (NextAuth Credentials provider)
1. Validace credentials pres `signInSchema`.
2. Nacteni uzivatele dle e-mailu.
3. Overeni `passwordHash` + `bcrypt compare`.
4. Pokud sedi, vraci user payload do NextAuth.
5. V JWT callbacku se ulozi:
   - `id`, `role`, `avatar`
6. V session callbacku se propise do `session.user`.

### Chybove vetve
- Neplatne credentials => `authorize` vraci `null`, UI zobrazi "Neplatny e-mail nebo heslo.".

## 3. Proces: Prihlaseni/registrace pres Google

### Spoustec
- Uzivatel klikne na "Pokracovat pres Google" na `/sign-in` nebo `/sign-up`.

### Backend kroky (NextAuth `signIn` callback)
1. Overi se provider `google`.
2. E-mail se normalizuje (`trim().toLowerCase()`).
3. Pokud Google vrati `email_verified === false`, prihlaseni je zamitnuto.
4. Pokud uzivatel neexistuje:
   - vytvori se `User` s `role=USER`, default avatar, unikatni prezdivka.
5. Pokud uzivatel existuje, ale chybi `name` / `nickname` / `avatar`:
   - doplni se chybejici pole.
6. JWT callback pripadne dovyplni token daty z DB.

### Datove efekty
- "Just-in-time" zalozeni uzivatele pri prvnim Google loginu.

## 4. Proces: Autorizace a pristup na chranene stranky

Aplikace nepouziva globalni middleware pro auth; ochrana probiha na urovni stranek/API.

### Chranene server stranky (priklad)
- `app/overview/page.tsx`, `app/district/[code]/page.tsx`, `app/profile/page.tsx`, `app/teams/page.tsx`.

Krok:
1. `getServerSession(authOptions)`.
2. Pokud chybi `session.user.id`, redirect na `/sign-in` (casto s `callbackUrl`).

### Chranene API
- Napr. `/api/districts/[code]/claim`, `/api/uploads/selfie/sign`, `/api/uploads/selfie/view`.

Krok:
1. `getServerSession(authOptions)`.
2. Pri chybejici session vrati `401`.

## 5. Proces: Potvrzeni mestske casti (Claim district)

Tento proces je dvoukrokovy: nejdriv upload selfie do R2, potom zapis claimu do DB.

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

### 5.3 Backend: claim zapis (`POST /api/districts/[code]/claim`)
1. Kontrola session (`401` pokud neprihlasen).
2. Rate-limit `district-claim`: max 30 / 5 minut (uzivatel).
3. Kontrola existence districtu (`404` pokud neexistuje).
4. Validace payloadu (`districtClaimSchema`):
   - `selfieUrl` musi byt HTTP URL nebo interni key `selfies/...`
   - `attestVisited=true`
   - `attestSignVisible=true`
5. Kontrola, zda uzivatel uz district nema potvrzeny (`@@unique [userId, districtCode]`).
6. Nacteni historickych claimu uzivatele.
7. Spocitani score:
   - `sameDayMultiplier = min(2, 1 + claimsTodayBefore * 0.15)`
   - `streakBonus = streakAfterClaim * 5`
   - `awardedPoints = round(basePoints * sameDayMultiplier + streakBonus)`
8. Vytvoreni `DistrictClaim` zaznamu.
9. `revalidateTag(LEADERBOARD_CACHE_TAG, "max")`.
10. Odpoved `201` s detailem claimu.

### Datove efekty
- Tabulka `DistrictClaim`: novy claim, body, multiplikator, streak bonus.
- Unikatni constraint zabrani dvojitemu claimu stejne mestske casti jednim uzivatelem.

### Chybove vetve
- `400`: neplatny payload / nesplnene attest podminky.
- `401`: neprihlaseny uzivatel.
- `404`: district neexistuje.
- `409`: district uz byl potvrzen.
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
- Rate-limit store je in-memory (global map), tedy proces-local.
- Chranene route se kontroluji per-page/per-endpoint pomoci `getServerSession`.

## 8. Rychly seznam procesu (mapa)

1. Landing (`/`) -> pokud login existuje, redirect `/overview`.
2. Registrace (`/sign-up`) -> `POST /api/auth/register` -> auto login -> `/overview`.
3. Prihlaseni (`/sign-in`) -> NextAuth credentials/google -> `/overview` nebo callback URL.
4. Claim district (`/district/[code]`) -> sign upload -> upload do R2 -> claim API -> prepocet score.
5. Zobrazeni selfie -> private signed view link.
