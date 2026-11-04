# AP Portfolio

Portfolioopgaver samlet i ét Maven-projekt med Java 21.

```text
AP_Portfolio/
├── pom.xml
├── src/main/java/app/
│   └── dijkstra/
├── visualiseringer/
│   └── dijkstra/
└── docs/portfolio_exercises/
```

| Opgave | Indhold |
| --- | --- |
| [Dijkstra](src/main/java/app/dijkstra/Dijkstra.java) | [Opgavebeskrivelse](docs/portfolio_exercises/graphs/shortestpath.md) · [JavaScript](visualiseringer/dijkstra/index.html) · [Java + PriorityQueue](visualiseringer/dijkstra/java.html) |

## Kør en opgave

Byg Java-koden og kør Dijkstra fra repoets rod:

```powershell
mvn compile
java -cp target/classes app.dijkstra.Dijkstra
```

Åbn `visualiseringer/dijkstra/index.html` direkte i en browser, eller kør:

```powershell
Start-Process .\visualiseringer\dijkstra\index.html
```

Browserdelen kræver ingen installation og kører sin egen JavaScript-implementering.

Java-versionen bruger beregninger fra den samme Java-metode som konsolversionen.
Kør følgende fra repoets rod med Java 21 eller nyere (JDK):

```powershell
.\visualiseringer\dijkstra\start-java.ps1
```

Scriptet kompilerer Java-koden, eksporterer alle start/mål-par og åbner
`java.html`. Der kræves ingen server eller ekstra biblioteker. Kør scriptet
igen efter ændringer i Java-koden; genindlæs en eventuel allerede åben fane.
Eksportfilen `java-data.js` genereres lokalt og er Git-ignoreret.

## Kontroller JavaScript-algoritmen

Med Node.js, uden ekstra pakker:

```powershell
node --test visualiseringer/dijkstra/dijkstra.test.cjs
```

Kontroller også Java-eksporten og køforløbene:

```powershell
.\visualiseringer\dijkstra\start-java.ps1 -NoOpen
node --test visualiseringer/dijkstra/java-trace.test.cjs
```

## Tilføj en ny opgave

Java-kode placeres i `src/main/java/app/<opgavenavn>/` og eventuelle browserfiler
i `visualiseringer/<opgavenavn>/`. Alle Java-opgaver bruger den fælles `pom.xml`.
