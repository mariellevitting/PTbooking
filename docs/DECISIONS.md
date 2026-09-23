# Tekniske og produktmessige beslutninger

> Sist oppdatert: 2026-06-08 (etter utviklingsøkt)

## Produkt

- **Ambisjonsnivå**: Starter som intern app for Evolution Dance Studio. Arkitekturen holdes ryddig for å muliggjøre multi-tenancy (SaaS) senere uten full omskriving. (2026-06-05)
- **Målgruppe (v1)**: Dansere, foreldre og trenere ved Evolution Dance Studio i Sarpsborg. (2026-06-05)
- **MVP-omfang**: Se seksjonen "Roller og brukere" og "MVP-features" nedenfor. (2026-06-05)

## Roller og brukere

- **Hvilke roller eksisterer (v1)**: Danser, Forelder, Trener. Admin utsettes til v2. (2026-06-05)
- **Trener**: Legger inn ledige tider, ser hvem som har booket, får varsel (notification) når noen booker eller avbestiller. (2026-06-05)
- **Danser**: Booker privattime selv (eldre dansere). (2026-06-05)
- **Forelder**: Booker og betaler på vegne av barn. Særlig relevant for unge dansere. (2026-06-05)
- **Personvern barn under 15**: Foreldre booker for barn – håndteres via foreldrerollen. Detaljert samtykkeflyt avklares i egen issue. (2026-06-05)

## MVP-features (v1)

Disse er med i v1:

- [x] Logg inn / lag bruker
- [x] Booke privattime (velg trener, dato, tid)
- [x] Velge dansestil per time (én om gangen, eller flere med ulik stil)
- [x] Avbestilling (med 24t-advarsel)
- [x] Trener markerer ledige tider
- [x] Trener ser hvem som har booket
- [x] Varsler (in-app) til trener ved ny booking og avbestilling
- [x] Varsler (in-app) til danser/forelder når trener avbestiller
- [x] Foreldretilgang (booke for barn)
- [x] Profilside med avatar
- [x] Kalendervisning gruppert per uke og dag (alle roller)
- [x] Historikk med antall gjennomførte timer

Utsettes til v2:

- Gjentagende timer ("hver tirsdag i 8 uker")
- Admin-rolle
- Push-varsler / e-post / SMS
- SaaS / multi-tenancy
- Betalingsstatus
- Venteliste

## Stack

- **Frontend rammeverk**: Next.js (App Router) + TypeScript (2026-06-05)
- **Styling**: Tailwind CSS (2026-06-05)
- **UI-komponentbibliotek**: shadcn/ui (2026-06-05)
- **Backend / database**: Supabase (Postgres + Auth + Storage) (2026-06-05)
- **Auth**: Supabase Auth (2026-06-05)
- **Hosting**: Vercel (gratis hobby-tier) (2026-06-05)
- **Form-faktor**: Nettside (responsiv) + native iOS-app via Capacitor. Nettsiden er også en installerbar PWA (`src/app/manifest.ts`, ikoner i `public/icons/`) slik at Android-brukere kan legge den på hjemskjermen. (2026-09-08)
- **i18n / flerspråklighet**: `next-intl`, uten URL-basert ruting (språk hentes fra cookie/DB, ikke `/en/...`-prefiks – nødvendig fordi Capacitor-appen laster en fast URL). Se eget avsnitt "Flerspråklighet" under. (2026-09-23)

### Flerspråklighet (norsk/engelsk, `next-intl`)
- **Oversettelsesfiler**: `src/messages/no.json` + `src/messages/en.json`, navnerom per seksjon (`booking`, `profile`, `push`, ...). Nye språk (svensk/dansk) = ny fil + én linje i `LOCALES`-lista, ingen ombygging av komponenter.
- **Lagring av språkvalg**: `profiles.language` ('no'|'en'|null) + `profiles.language_source` ('auto'|'manual'|null). `null` = ikke registrert ennå → enhetens/nettleserens språk brukes. `language_source='manual'` overstyrer alltid auto-deteksjon, også ved innlogging på ny enhet.
- **Deteksjon**: `src/proxy.ts` leser `Accept-Language`-header og setter `NEXT_LOCALE`-cookie hvis den mangler (kjøres på hver request, ren lesing – ingen DB-skriving i proxy). Er brukeren innlogget og har en lagret `profiles.language`, synkroniseres cookien til den verdien på hver request (DB er alltid fasit på tvers av enheter).
- **Førstegangsregistrering i DB**: `src/components/LocaleSync.tsx` (klientkomponent i root layout, samme mønster som `OneSignalWebInit`) skriver `language`/`language_source='auto'` til `profiles` første gang en innlogget bruker har `language IS NULL`. Selvbegrensende – kjører aldri igjen etter det.
- **Manuelt valg**: språkvelger under Min profil (`LanguageSwitcher.tsx`) → oppdaterer `profiles.language` + `language_source='manual'`, setter cookie, og laster siden på nytt (enkleste robuste måte å bytte språk på uten ruting).
- **Push-varsler / servergenerert tekst**: `/api/notify*` og `/api/reminders` slår opp `language` per mottaker og genererer tekst med `createTranslator({locale, messages})` – ALDRI trenerens/avsenderens språk. Dynamiske verdier (navn, klokkeslett) settes inn som ICU-variabler, ikke sammensatt streng.
- **Datoer**: `Intl`/next-intls `useFormatter()` – ingen hardkodede måned/ukedag-arrays. Tidssone forblir `Europe/Oslo` uansett språk (språk og tidssone/valuta/land er bevisst holdt separate – ikke koblet sammen).
- **Oversettes IKKE**: klubb-/trener-/brukerskrevet innhold (`clubs.info_text`, `payment_label`, feedback-meldinger, navn), konkurransenavn/egennavn (NM, FDJ, DOTY).
- **Nivånavn** (kun visningsnavn, ikke lagret verdi – nivå er fortsatt `int` i databasen): Rekrutt→Beginner, Litt øvet→Starter, Mester→Inter, Champ→Champ, Elite→Champ Prem.

## Betaling

- **Leverandør**: Ikke integrert. Hver klubb har egen betalingsmåte lagret i `clubs` (`payment_label`, `payment_info`, `payment_url`). Evolution = Spond, Trondheim = Vipps til hver trener. Betalingsboks på bekreftelsessiden minner brukeren om å sende kvittering til treneren. (2026-08-31)
- **Refusjons- og avbestillingsregler**: Advarsel vises ved avbestilling under 24 timer. Ingen automatisk gebyrberegning ennå.

## Multi-tenancy / klubber (2026-08-31)

- Danceitude er multi-tenant: én rad per klubb i `clubs`. Se `docs/CLUBS.md`.
- **Prinsipp**: klubb-spesifikt innhold (navn, farge, priser, betaling, info-tekst, dansestiler) ligger som data på `clubs`-raden, ikke hardkodet i komponenter. App-logikk (booking, avbestilling, varsler) er felles kode.
- **Fase 1 (ferdig)**: flyttet info-boksen "Bestille privattimer", priser, betaling og dansestiler til `clubs`. Kjør `supabase/club_config.sql`. Helper: `src/lib/club.ts`. Komponent: `src/components/PrivattimeInfo.tsx`.
- **Nasjonal standard, forblir i kode**: nivå-/poengsystemet (Rekrutt→Elite) og konkurransekalenderen (NM/FDJ/DOTY) – likt for alle norske freestyle-klubber.
- **Fase 2 (planlagt)**: klubb-filtrere "deltar"-tellere/deltakerlister/trenerlister; samle konkurransekalenderen ett sted.
- **Fase 3 (planlagt)**: rydde registreringskoder – fjerne env-variabel-hacket for Evolution, alt via `clubs`.

## Viktige tekniske valg og løsninger (2026-06-08)

### Tidssone
- Vercel-servere kjører i UTC. All datoformatering i server-komponenter MÅ bruke `timeZone: "Europe/Oslo"`.
- Hjelpefunksjoner ligger i `src/lib/dateUtils.ts`: `formatDate()`, `formatTime()`, `formatDateKey()`.
- Bruk alltid disse i stedet for `toLocaleTimeString`/`toLocaleDateString` direkte i server-komponenter.
- I klient-komponenter (availability/BookingForm) brukes `setHours()` for å opprette slots i lokal tid.

### Booking-flyt
- Én time om gangen, eller flere med ulik stil per time.
- Steg 1: Velg tid(er) → Steg 2: Sett dansestil per time → Steg 3: Bekreft alle.
- Maks 1 booking per slot (trigger setter `is_booked = true` automatisk).

### Avbestilling
- Danser/forelder avbestiller via `/booking/avbestill/[bookingId]`.
- Trener avbestiller via `/trainer/avbestill/[bookingId]`.
- Avbestilling av gjennomførte timer er blokkert server-side (redirect hvis `end_at < now`).
- Avbestill-knapp vises ikke på trenersiden hvis timen er ferdig (`end > new Date()`).

### RLS-policyer i Supabase
- Trenere kan avbestille egne bookinger: policy "Trainers can cancel bookings on their slots" er lagt til manuelt i Supabase SQL Editor (se `supabase/trainer_cancel_policy.sql`).
- Notifications: INSERT er åpen (WITH CHECK true), SELECT og UPDATE kun for eier.

### Push-varsler (OneSignal)
- iOS: native via `@onesignal/capacitor-plugin` (`src/components/OneSignalInit.tsx`).
- Web (særlig Android Chrome): OneSignal web-SDK v16 lastes i `src/components/OneSignalWebInit.tsx`. Hopper over hvis `window.Capacitor` finnes. Service worker: `public/OneSignalSDKWorker.js`.
- Begge kobler `OneSignal.login(user.id)` slik at samme `external_id` treffer alle kanaler. `/api/notify*`-rutene sender med `include_aliases.external_id` + `target_channel: "push"` – ingen backend-endring trengs for web.
- Krever at "Web"-plattform er lagt til i OneSignal-appen (site URL = https://app.danceitude.no).

### Varsler (in-app)
- Tabellen `notifications` brukes for alle varsler.
- `NotificationBell`-komponenten vises på alle tre dashbord (trener, danser, forelder).
- Varsel sendes til trener ved booking og avbestilling fra danser/forelder.
- Varsel sendes til danser/forelder ved avbestilling fra trener.
- Danser/forelder får IKKE varsel når de selv booker (ikke ønsket).

### Duplikater i availability_slots
- Tidlige testdata hadde duplikate slots. Renset opp med SQL.
- Publisert-siden deaktiverer allerede-publiserte tider (grå + overstreket).
- Eksisterende slots lastes ved sideload (useEffect) OG ved dagsklikk.

### Dashbord-struktur
- Alle tre roller har kalendervisning gruppert per uke og dag.
- Gjennomførte timer vises dempet med "X totalt 🎉" ved siden av overskriften.
- Trenerens kalender viser ledige tider med stiplet kant (bg-gray-50), opptatte med lilla venstrekant.
- Ledig-slot på trenerside har "Slett"-knapp som tar til `/trainer/slett-slot/[slotId]`.

## Drift

- **Domene**: Ikke avklart – starter med `.vercel.app`
- **Budsjett (kr/mnd)**: 0 kr/mnd på Vercel + Supabase gratis tier (2026-06-05)
- **CI / deploy-strategi**: GitHub → Vercel automatisk deploy på push til main. (2026-06-05)
- **Miljøvariabler på Vercel**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TRAINER_INVITE_CODE. TZ=Europe/Oslo er reservert av Vercel og kan ikke settes.

## Brand

- **Navn**: "PT booking" (arbeidstittel) – kan endres
- **Farger**: Lilla (#7c3aed / purple-600) som primærfarge
- **Logo**: Ikke avklart

## Workflow

- **Branch-strategi**: Jobber direkte på main i denne fasen (liten app, én utvikler).
- **Tester**: Smoke-tester manuelt. Full test-suite vurderes etter MVP.
