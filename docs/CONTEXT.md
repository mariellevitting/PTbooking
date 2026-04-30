# Kontekst

## Bakgrunn

Evolution Dance Studio i Sarpsborg er et foreldredrevet danseStudio med dansere, instruktører, foreldre og styre. I dag bookes privattimer slik:

1. Instruktører fyller inn ledige tider manuelt i et delt Google Docs-dokument
2. Dansere/foreldre må be om lenken, finne en tid, og sende melding (Messenger/Snapchat/TikTok) til instruktøren
3. Instruktøren oppdaterer dokumentet manuelt etter avtale
4. Betaling skjer separat, og instruktøren må mase om kvittering for å verifisere

Resultat: dobbeltbookinger, fragmentert kommunikasjon, instruktører som bruker tid på administrasjon.

## Stakeholders

| Rolle        | Hva de gjør                                       |
| ------------ | ------------------------------------------------- |
| Danser       | Booker og deltar på timer                         |
| Forelder     | Booker og betaler for sine barn (særlig de unge)  |
| Instruktør   | Tilbyr tider, holder timer, må vite om betaling   |
| Sportsleder  | Koordinerer timeplan og rom                       |
| Styre        | Administrasjon, økonomi                           |

> **Merk**: Den opprinnelige prototypen håndterer kun *danser* og *admin*. Foreldre er en kritisk gruppe som må vurderes i discovery.

## Hva prototypen i `docs/design-screens/` viser

23 skjermer fordelt på fire flyter:

- **Auth**: splash, logg inn, lag bruker, admin-login
- **Danser**: mine timer → bestill → velg instruktør → kalender → tid → dansestil → betaling → kvittering
- **Admin**: mine timer → kalender → marker tider → publiser
- **Avbestilling + profil**

## Kjente svakheter ved den opprinnelige prototypen

Disse er funnet i en tidligere gjennomgang og bør tas stilling til i discovery:

1. **Skrivefeil** på dansestil-skjermen ("Jaz", "Freestyl")
2. **Foreldre er ikke en rolle** – kun danser og admin
3. **Admin ser ingen betalingsstatus** – løser ikke kjernesmerten fra studentprosjektet
4. **Avbestilling har ingen vilkår** – ingen frist, gebyr eller refusjon
5. **Profilside er nesten tom** – kun to togglebrytere
6. **Ulik timepris uten forklaring** (250 kr vs 150 kr)
7. **Ingen gjentagende booking** ("samme tid hver tirsdag")
8. **Admin må gjennom 3 skjermer for én dag med tider** – tungvint for faste timeplaner
9. **"Logg inn som admin" eksponert på vanlig login** – sikkerhetsmessig svakt
10. **Personvern for barn under 15** – ikke håndtert (krever foreldresamtykke)

## Konkurrenter / alternativer

Det finnes ferdige løsninger som dekker mye av dette:

- **Spond** – mye brukt av norske idrettslag, gratis, har betaling og foreldretilgang
- **MindBody / Setmore / Fresha** – kommersielle studio-bookingsystemer
- **Calendly + Vipps + delt kalender** – kan settes opp på en ettermiddag

PT booking må ha en grunn til å eksistere ut over å være "vår egen". Dette er et hobbyprosjekt, så "fordi det er gøy å bygge" er et gyldig svar – men avklar ambisjonsnivå i discovery.

## Originalt studentprosjekt

Designet kommer fra et participatory design-prosjekt ved Østfold University College (Vitting, Jalloul, Chaaban, 2024). Adobe XD-lenke:
https://xd.adobe.com/view/5ea425bc-e2ff-44fe-8fb0-689fc59004e7-0bf7/
