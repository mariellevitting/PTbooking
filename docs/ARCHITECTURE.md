# Arkitektur

> Sist oppdatert: 2026-06-05

## Hva vi bygger

En bookingapp for privattimer ved Evolution Dance Studio. Trenere legger ut ledige tider, dansere og foreldre booker disse tidene. Trenere får varsel ved ny booking.

Appen starter som nettside for Evolution, men holdes ryddig for fremtidig multi-tenancy (SaaS).

---

## Roller

| Rolle    | Hva de kan gjøre                                                      |
|----------|-----------------------------------------------------------------------|
| Danser   | Logg inn, se ledige tider, booke time, avbestille, se egne timer      |
| Forelder | Samme som danser, men booker på vegne av barn                         |
| Trener   | Logg inn, legge ut ledige tider, se bookinger, se betalingsstatus, mottar varsler |

---

## Datamodell (skisse)

```
users
  id, email, name, role (dancer | parent | trainer), created_at

children                          -- foreldre kobles til barn
  id, parent_id (→ users), name, birthdate

trainers                          -- ekstra info om trenere
  id, user_id (→ users), bio, dance_styles[]

availability_slots                -- tider trener legger ut
  id, trainer_id (→ trainers), start_at, end_at, is_booked

bookings
  id, slot_id (→ availability_slots), booker_id (→ users),
  dancer_id (→ users | children), dance_style, status (pending | confirmed | cancelled),
  created_at

notifications
  id, user_id (→ users), type, payload (jsonb), read_at, created_at
```

---

## Mappestruktur (Next.js App Router)

```
src/
  app/
    (auth)/
      login/
      register/
    (dancer)/
      dashboard/
      book/
        [trainerId]/
    (trainer)/
      dashboard/
      availability/
    (parent)/
      dashboard/
      children/
  components/
    ui/              -- shadcn/ui-komponenter
    booking/
    trainer/
    auth/
  lib/
    supabase/        -- klient + server-klienter
    utils/
  types/             -- TypeScript-typer
docs/
  design-screens/    -- XD-referanse (ikke endre)
  CONTEXT.md
  DECISIONS.md
  ARCHITECTURE.md
```

---

## Tech stack

| Lag         | Valg                        |
|-------------|----------------------------|
| Frontend    | Next.js 14 (App Router) + TypeScript |
| Styling     | Tailwind CSS               |
| Komponenter | shadcn/ui                  |
| Database    | Supabase (Postgres)        |
| Auth        | Supabase Auth              |
| Hosting     | Vercel                     |
| Kostnad     | 0 kr/mnd (gratis tier)     |

---

## Viktige avgrensninger (v1)

- Ingen gjentagende timer
- Ingen admin-rolle
- Ingen native push-varsler (in-app varsler holder)
- Betaling ikke implementert i v1
- Kun nettside (ikke PWA/native app)
