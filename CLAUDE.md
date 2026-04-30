# Instruks til Claude Code

Du jobber på PT booking – en booking-app for privattimer ved Evolution Dance Studio i Sarpsborg.

## Kontekst du må lese først

Før du gjør noe annet på en ny sesjon:
1. Les `docs/CONTEXT.md` – bakgrunn og problemstilling
2. Les `docs/DECISIONS.md` – tekniske valg (kan være tom hvis discovery ikke er gjort)
3. Se på relevante skjermer i `docs/design-screens/`

## Arbeidsstil

- **Norsk** i all kommunikasjon med eier (Mie). Engelsk i kode, commits og PR-titler.
- **Spør før du antar**. Hvis et issue er uklart, still spørsmål heller enn å gjette.
- **Små commits**, én logisk endring av gangen.
- **Test det du bygger** før du sier det er ferdig. UI-endringer: kjør dev-server og verifiser i nettleser.
- **Følg `docs/DECISIONS.md`** – ikke introduser nye biblioteker eller mønstre uten å oppdatere den filen først.

## Når du jobber med et issue

1. Les hele issuen + lenkede dokumenter
2. Hvis acceptance criteria er uklare: kommenter på issuen og spør, ikke begynn å kode
3. Lag en branch `<issue-nr>-kort-beskrivelse`
4. Commit ofte med tydelige meldinger
5. Åpne PR mot main, lenk til issuen med `Closes #N`

## Hva du IKKE skal gjøre

- Ikke push direkte til main (lag PR)
- Ikke installer pakker som ikke står i `docs/DECISIONS.md` uten å foreslå det først
- Ikke endre design-skjermene i `docs/design-screens/` – de er referanse
- Ikke commit hemmeligheter (.env, API-nøkler)
