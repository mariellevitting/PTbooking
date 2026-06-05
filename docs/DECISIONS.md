# Tekniske og produktmessige beslutninger

> Sist oppdatert: 2026-06-05 (etter discovery-intervju, issue #1)

## Produkt

- **Ambisjonsnivå**: Starter som intern app for Evolution Dance Studio. Arkitekturen holdes ryddig for å muliggjøre multi-tenancy (SaaS) senere uten full omskriving. (2026-06-05)
- **Målgruppe (v1)**: Dansere, foreldre og trenere ved Evolution Dance Studio i Sarpsborg. (2026-06-05)
- **MVP-omfang**: Se seksjonen "Roller og brukere" og "MVP-features" nedenfor. (2026-06-05)

## Roller og brukere

- **Hvilke roller eksisterer (v1)**: Danser, Forelder, Trener. Admin utsettes til v2. (2026-06-05)
- **Trener**: Legger inn ledige tider, ser hvem som har booket, får varsel (notification) når noen booker. (2026-06-05)
- **Danser**: Booker privattime selv (eldre dansere). (2026-06-05)
- **Forelder**: Booker og betaler på vegne av barn. Særlig relevant for unge dansere. (2026-06-05)
- **Personvern barn under 15**: Foreldre booker for barn – håndteres via foreldrerollen. Detaljert samtykkeflyt avklares i egen issue. (2026-06-05)

## MVP-features (v1)

Disse er med i v1:

- [ ] Logg inn / lag bruker
- [ ] Booke privattime (velg trener, dato, tid)
- [ ] Velge dansestil
- [ ] Betaling (leverandør ikke avklart ennå – utsettes)
- [ ] Avbestilling
- [ ] Trener markerer ledige tider
- [ ] Trener ser hvem som har booket + betalingsstatus
- [ ] Varsler til trener ved ny booking
- [ ] Foreldretilgang (booke for barn)
- [ ] Profilside

Utsettes til v2:

- Gjentagende timer ("hver tirsdag i 8 uker") – privattimer er tilfeldige, trenere legger ut ledig tid ad hoc
- Admin-rolle
- Push-varsler (native)
- SaaS / multi-tenancy

## Stack

- **Frontend rammeverk**: Next.js (App Router) + TypeScript (2026-06-05)
- **Styling**: Tailwind CSS (2026-06-05)
- **UI-komponentbibliotek**: shadcn/ui (2026-06-05)
- **Backend / database**: Supabase (Postgres + Auth + Storage) (2026-06-05)
- **Auth**: Supabase Auth (2026-06-05)
- **Hosting**: Vercel (gratis hobby-tier) (2026-06-05)
- **Form-faktor**: Nettside (responsiv). PWA / native app kan komme senere. (2026-06-05)

## Betaling

- **Leverandør**: Ikke avklart. Klubben bruker Spond i dag. Vipps er aktuelt (norsk målgruppe). Utsettes til egen issue. (2026-06-05)
- **Refusjons- og avbestillingsregler**: Ikke avklart – håndteres i avbestillings-epicen.

## Drift

- **Domene**: Ikke avklart – starter med `.vercel.app`
- **Budsjett (kr/mnd)**: 0 kr/mnd på Vercel + Supabase gratis tier (2026-06-05)
- **CI / deploy-strategi**: GitHub → Vercel automatisk deploy på merge til main. Claude Code lager alltid PR, aldri push direkte til main. (2026-06-05)

## Brand

- **Navn**: "PT booking" (arbeidstittel) – kan endres
- **Beholder lilla fra XD**: Ikke avklart
- **Logo**: Ikke avklart

## Workflow

- **Branch-strategi**: Feature-branches + PR mot main. Ingen direkte push til main.
- **Tester**: Smoke-tester i første omgang. Full test-suite vurderes etter MVP.
