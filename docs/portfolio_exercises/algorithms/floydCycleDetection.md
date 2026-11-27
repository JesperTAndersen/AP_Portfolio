# Portfolioopgave: Autopiloten der kører i ring

Autopiloten på en rumstation er begyndt at opføre sig mærkeligt. Den bliver ved med at sende besætningen gennem de samme rum, og ingen ved, hvor ruten går galt. Autopiloten kan kun én ting: Fra hvert rum følger den én fast forbindelse videre. Den har ingen logbog, så den kan ikke huske, hvor den har været.

I skal skrive et Java-program, der finder ud af, om autopiloten kører i ring, hvor ringen starter, og hvor lang den er. Undervejs skal man kunne se, hvad algoritmen gør, trin for trin.

## 1. Kører autopiloten i ring?

Autopiloten starter i rum A. Forbindelserne går i den retning, tabellen viser.

| Rum | Næste rum |
|---|---|
| A | B |
| B | C |
| C | D |
| D | E |
| E | C |
| F | Intet |

Byg ruten som en **Linkedlist**, hvor hvert rum er en node, og forbindelsen er `next`.

Brug **Floyds cyklusdetektion** til at undersøge ruten. Start begge markører i A. Den langsomme flytter ét rum ad gangen, og den hurtige flytter to. Vis, hvor de står efter hver iteration, i en tabel som denne:

| Iteration | Langsom | Hurtig |
|---|---|---|
| Start | A | A |
| 1 | | |
| 2 | | |
| … | | |

Stop, når de står i samme rum, og vis mødestedet.

## 2. Hvor starter ringen, og hvor lang er den?

Når markørerne har mødt hinanden, skal programmet finde:

- **det første rum i ringen.** Flyt den ene markør tilbage til A. Lad derefter begge markører flytte ét rum ad gangen, indtil de mødes. Vis trinene.
- **ringens længde.** Gå én gang rundt fra mødestedet, og tæl rummene.
- **halens længde**, altså antal trin fra A til ringens første rum.

## 3. Når der er en udgang

Ændr forbindelsen fra E, så den fører til F. Kør programmet igen, og vis trinene.

Afprøv også disse tilfælde, og forklar, hvad programmet gør i hvert af dem:

- en rute uden rum (`head` er `null`)
- en rute med ét rum, der peger på sig selv
- to rum, der har samme navn, men er forskellige noder
- en rute uden ring med et lige antal rum og en med et ulige antal rum

## 4. Logbog eller to markører?

Skriv også en version, der bruger en logbog: en `HashSet`, der husker hvert besøgt rum.

Byg en stor station med mange rum, fx 1.000.000, med en ring et sted i ruten. Kør begge versioner. Sammenlign dem på tid og ekstra hukommelse, og forklar forskellen med Big O.

## 5. Refleksion: Hvornår virker Floyd ikke?

Besætningen opdager, at rum B har to døre: én til C og én til F. Forklar, hvorfor Floyds algoritme ikke kan bruges direkte på stationen nu. Hvilken antagelse om ruten holder ikke længere? I skal ikke implementere en løsning her, kun forklare.

## Aflevering

- **Jeres Java-program** og en kort vejledning til at køre det.
- **En visualisering af algoritmen.** Konsol, eller webinterface (i så fald så må I få Claude til at visualiserer det).
- **Vedlæg skærmbilleder eller en kort video**, hvor man kan følge markørerne trin for trin på stationen fra opgave 1.
