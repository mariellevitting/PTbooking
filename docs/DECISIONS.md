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
- **Form-faktor**: Nettside (responsiv). PWA / native app kan komme senere. (2026-06-05)

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
