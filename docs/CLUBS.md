# Klubber i Danceitude

> Sist oppdatert: 2026-08-31

Danceitude er multi-tenant: hver danseklubb er én rad i `clubs`-tabellen.
Alt **klubb-spesifikt innhold** (navn, farge, priser, betaling, info-tekst,
dansestiler) ligger på den raden – **ikke** i koden.

## Regelen for endringer

| Type endring | Hvor | Krever deploy? |
|---|---|---|
| Tekst / pris / betaling / info-boks / dansestiler for **én klubb** | `clubs`-raden (SQL / admin) | Nei |
| Hvordan booking, avbestilling, varsler o.l. funker | Kode | Ja – gjelder alle klubber |

Når noe skal endres for innhold: **si alltid hvilken klubb**. Uten klubbnavn
tolkes det som en app-endring (alle klubber).

## Felt på `clubs`

| Felt | Brukes til |
|---|---|
| `name`, `short_name`, `city` | Klubbnavn som vises i appen |
| `invite_code` | Kode for registreringslenke `/register/<KODE>` |
| `trainer_code`, `dancer_code`, `parent_code` | Rollespesifikke registreringskoder (Fase 3 rydder disse) |
| `primary_color` | Klubbfarge (ikke tatt i bruk i UI ennå – egen jobb) |
| `website` | Lenke på registreringssiden |
| `lesson_info` | Introtekst i "Bestille privattimer" |
| `lesson_duration_min` | Varighet på en privattime (min) |
| `lesson_price_text` | Prisbeskrivelse. `**tekst**` = fet skrift |
| `default_price` | Fallback-pris når en trener ikke har satt egen pris |
| `payment_label` | Kort navn på betalingsmåte ("Spond" / "Vipps") |
| `payment_info` | Betalingstekst. `**tekst**` blir lenke hvis `payment_url` er satt |
| `payment_url` | Valgfri betalingslenke (Spond o.l.) |
| `receipt_note` | "Husk kvittering"-tekst |
| `dance_styles` | Hvilke stiler klubben tilbyr (trenerprofil + booking) |

Kode: `src/lib/club.ts` (henting + fallback-verdier), `src/components/PrivattimeInfo.tsx` (info-kortet).
SQL: `supabase/club_config.sql`.

## Registrerte klubber

### Evolution Danseklubb
- **Sted:** Sarpsborg
- **invite_code:** `EVOLUTION`
- **Betaling:** Spond (lenke lagret i `payment_url`)
- **Privattime:** 30 min, 250 / 200 / 150 kr avhengig av trener
- **Dansestiler:** Slow, Freestyle, Jazz, Moderne, Freestyle dobbel, Slow dobbel, Akro, Hiphop, Show
- **Registreringskoder:** via env-variabler (`TRAINER_INVITE_CODE` m.fl.) – ryddes i Fase 3

### Trondheim Danseklubb
- **Sted:** Trondheim
- **invite_code:** `TRONDHEIM`
- **Betaling:** Vipps direkte til hver trener (ingen felles lenke, ingen gebyr)
- **Privattime:** 30 min (bekreftes med klubben), pris settes per trener
- **Dansestiler:** Freestyle, Slow, Freestyle dobbel, Slow dobbel
- **Status:** Under onboarding. Mangler bekreftet: trenerliste + pris per trener,
  varighet, endelig introtekst. Klubbkoder (trener/danser/forelder) ikke satt ennå.

### Testklubb
- Brukes til testing. `invite_code: TESTKLUBB`.

## Felles for alle klubber (nasjonal standard – ikke klubb-spesifikt)

- **Nivå- og poengsystem** (Rekrutt → Litt øvet → Mester → Champ → Elite,
  freestyle/slow-poeng). Likt for alle norske freestyle-klubber. Ligger i koden.
- **Konkurransekalender** (NM, FDJ, DOTY). Nasjonale konkurranser alle kan delta i.
  Ligger i koden i dag, samles ett sted i Fase 2.

## Faser

1. **Fase 1 (ferdig):** Klubb-konfig – navn, priser, betaling, info-tekst,
   dansestiler flyttet fra kode til `clubs`. `supabase/club_config.sql`.
2. **Fase 2:** Klubb-filtrering – "deltar"-tellere, deltakerlister og trenerlister
   skal kun vise egen klubb. Samle konkurransekalenderen ett sted.
3. **Fase 3:** Rydde registreringskoder – fjerne env-hacket, alt via `clubs`.
4. **Senere:** Admin-UI for å redigere klubb-konfig uten SQL. Klubbfarge i UI.
