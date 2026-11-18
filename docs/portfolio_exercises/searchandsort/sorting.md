# Portfolioopgave: Sortering

Portfolioen har fire dele, én pr. sorteringsalgoritme. Del 1 og 2 laves efter mandagens undervisning, del 3 og 4 efter fredagens. Brug det samme datasæt i alle fire dele, så du kan sammenligne algoritmerne på de samme data.

| Del | Algoritme | Kan laves efter |
| --- | --- | --- |
| 1 | Bubble Sort | Mandag |
| 2 | Merge Sort | Mandag |
| 3 | Quick Sort | Fredag |
| 4 | Heap Sort | Fredag |

## Del 1: Bubble Sort (mandag)

Lav en implementering af Bubble Sort med early exit, der sorterer en liste fra et virkeligt domæne.

- Design selv dit datasæt med mindst 10 elementer, fx produkter i en webshop (sorteret efter pris), spørgsmål til en quiz (efter sværhedsgrad) eller løbere i et løb (efter tid)
- Lav en lille klasse til dine elementer med et navn og den værdi, der sorteres efter
- Medtag mindst to elementer med **samme** værdi, så du kan vise, om sorteringen er stabil
- Tæl antal sammenligninger og antal ombytninger
- Kør din sortering på tre versioner af dit datasæt: tilfældig, allerede sorteret og omvendt sorteret
- Lav en visualisering der giver mening. Hvad er nyttigt at se, når man skal forstå algoritmen?

### Visualisering

Tænk over, hvad der er meningsfuldt at vise for at forklare nogen, hvordan Bubble Sort virker. Nogle muligheder:

- Print i konsollen hvad der sker i hvert trin, fx "Gennemløb 2: Hoodie (299 kr.) og T-shirt (149 kr.) bytter plads" eller "Gennemløb 3: ingen ombytninger, listen er sorteret". Vis evt. listen efter hvert gennemløb, og markér hvilke elementer der nu står på deres endelige plads.
- Lav et interaktivt step-by-step mode, hvor brugeren trykker y for at gå videre og kan følge med i, hvilke to elementer der sammenlignes lige nu.
- Lav en grafisk visualisering i JavaScript eller Processing, hvor elementerne er søjler, der skifter farve, når de sammenlignes, byttes eller står på deres endelige plads.

PS: Du kan også vælge at bruge JavaScript eller Processing, og så må du gerne få hjælp af AI til selve koden, men du skal selv beslutte, hvad du vil visualisere og hvorfor. Det er designbeslutningen, der er vigtig, ikke om du skriver koden selv.

## Del 2: Merge Sort (mandag)

Lav en implementering af Merge Sort, der sorterer det samme datasæt som din Bubble Sort.

- Brug dit datasæt fra Bubble Sort, så du kan sammenligne de to algoritmer på de samme data
- Markér tydeligt i koden, hvor de tre trin sker: del, løs rekursivt og kombinér (flet)
- Vis med dine elementer med samme værdi, at din Merge Sort er stabil, og peg på den linje i koden, der gør den stabil
- Tæl antal sammenligninger i fletningen, og kør på de samme tre versioner af datasættet som i Bubble Sort
- Lav en visualisering der giver mening. Hvad er nyttigt at se, når man skal forstå algoritmen?


### Visualisering

Tænk over, hvad der er meningsfuldt at vise for at forklare nogen, hvordan Merge Sort virker. Nogle muligheder:

- Print i konsollen hvad der sker i hvert trin, fx "mergeSort([Hoodie, Kasket, Jakke]) deles i [Hoodie] og [Kasket, Jakke]" eller "Fletter [Hoodie] og [Kasket, Jakke]: Kasket (99 kr.) er mindst". Ryk teksten ind for hvert rekursivt kald, så man kan se, hvor dybt man er.
- Lav et interaktivt step-by-step mode, hvor brugeren trykker y for at gå videre og kan følge med i, hvilke dele der er sorteret indtil videre, og hvilke kald der venter.
- Lav en grafisk visualisering i JavaScript eller Processing, der viser opdelingen som et træ, og hvor delene skifter farve, når de er flettet.

Overvej særligt, hvordan din visualisering viser, at koden gør venstre halvdel helt færdig, før den begynder på højre. Et træ, der viser alle niveauer på én gang, viser *hvad* der sker, men ikke *hvornår*.

PS: Du kan også vælge at bruge JavaScript eller Processing, og så må du gerne få hjælp af AI til selve koden, men du skal selv beslutte, hvad du vil visualisere og hvorfor. Det er designbeslutningen, der er vigtig, ikke om du skriver koden selv.

## Del 3: Quick Sort (fredag)

Lav en implementering af Quick Sort med sidste element som pivot (Lomuto-partitionering), der sorterer dit datasæt.

- Brug det samme datasæt som i del 1 og 2
- Markér tydeligt i koden, hvor partitioneringen sker, og hvor de to rekursive kald sker
- Tæl antal sammenligninger og ombytninger, og kør på de samme tre versioner af datasættet: tilfældig, sorteret og omvendt
- Forklar, hvad der sker med sorteret input, når pivot altid er det sidste element. Gør datasættet større, indtil du kan se forskellen tydeligt
- Vis med dine elementer med samme værdi, at Quick Sort **ikke** er stabil
- Prøv én anden måde at vælge pivot på, fx et tilfældigt element eller medianen af første, midterste og sidste element. Hvad sker der nu med sorteret input?
- Lav en visualisering der giver mening. Hvad er nyttigt at se, når man skal forstå algoritmen?


### Visualisering

Tænk over, hvad der er meningsfuldt at vise for at forklare nogen, hvordan Quick Sort virker. Nogle muligheder:

- Print i konsollen hvad der sker i hvert trin, fx "Pivot er Hoodie (299 kr.)" eller "Kasket (99 kr.) er mindre end pivot og flyttes til venstre". Vis listen efter hver partitionering, og markér hvor pivot nu står på sin endelige plads.
- Lav et interaktivt step-by-step mode, hvor brugeren trykker y for at gå videre og kan følge med i, hvor pegepindene `i` og `j` står, og hvilken del af listen der arbejdes på.
- Lav en grafisk visualisering i JavaScript eller Processing, hvor pivot har sin egen farve, og hvor områderne "mindre end pivot", "større end pivot" og "ikke undersøgt endnu" kan ses.

Overvej særligt, hvordan din visualisering viser forskellen på en god og en dårlig pivot.

PS: Du kan også vælge at bruge JavaScript eller Processing, og så må du gerne få hjælp af AI til selve koden, men du skal selv beslutte, hvad du vil visualisere og hvorfor. Det er designbeslutningen, der er vigtig, ikke om du skriver koden selv.

## Del 4: Heap Sort (fredag)

Lav en implementering af Heap Sort, der bygger en max-heap direkte i dit array og sorterer dit datasæt.

- Brug det samme datasæt som i del 1, 2 og 3
- Byg heapen selv i arrayet. Brug **ikke** `PriorityQueue`, som `SortExamples.heapSort()` gør
- Brug indeksformlerne til at finde børn og forælder: venstre barn `2i + 1`, højre barn `2i + 2`, forælder `(i - 1) / 2`
- Markér tydeligt i koden de to faser: byg max-heapen, og byt derefter roden med sidste element og genopret heapen igen og igen
- Tæl antal sammenligninger, og kør på de samme tre versioner af datasættet: tilfældig, sorteret og omvendt
- Vis med dine elementer med samme værdi, at Heap Sort **ikke** er stabil
- Lav en visualisering der giver mening. Hvad er nyttigt at se, når man skal forstå algoritmen?

### Visualisering

Tænk over, hvad der er meningsfuldt at vise for at forklare nogen, hvordan Heap Sort virker. Nogle muligheder:

- Print i konsollen hvad der sker i hvert trin, fx "Roden Jakke (499 kr.) byttes med sidste element og står nu på sin endelige plads" eller "Kasket (99 kr.) er mindre end sit største barn og flyttes ét niveau ned". Udskriv både arrayet og træet, niveau for niveau.
- Lav et interaktivt step-by-step mode, hvor brugeren trykker y for at gå videre og kan følge med i, hvilken del af arrayet der stadig er heap, og hvilken del der er sorteret.
- Lav en grafisk visualisering i JavaScript eller Processing, hvor træet og arrayet vises ved siden af hinanden, og hvor et element lyser op begge steder, når det flyttes.

Overvej særligt, hvordan din visualisering viser, at træet og arrayet er de samme data, bare tegnet på to måder.

PS: Du kan også vælge at bruge JavaScript eller Processing, og så må du gerne få hjælp af AI til selve koden, men du skal selv beslutte, hvad du vil visualisere og hvorfor. Det er designbeslutningen, der er vigtig, ikke om du skriver koden selv.

## Sammenligning og andre algoritmer (valgfrit)

Vælg en eller flere af disse, hvis du vil gå videre:

- **Sammenlign alle fire algoritmer.** Kør dem på dit datasæt i tre versioner (tilfældig, sorteret, omvendt), og gør datasættet større: 1.000, 2.000 og 4.000 elementer. Lav en tabel over sammenligninger. Passer tallene med O(n²) og O(n log n)? Hvornår vinder Bubble Sort, og hvornår taber Quick Sort?
- **Insertion Sort.** Kig på Insertion Sort, og lav den samme visualisering for den. Hvorfor bruger Javas egen sortering Insertion Sort til små dele af et array?
- **Bottom-up Merge Sort.** Lav en Merge Sort uden rekursion, der først fletter par af størrelse 1, så størrelse 2, så 4 og så videre. Hvordan ændrer det din visualisering?
- **Introsort-idéen.** Lav en Quick Sort, der skifter til Heap Sort, hvis rekursionen bliver for dyb. Kør den på sorteret input, og sammenlign med din almindelige Quick Sort.

## Til jeres præsentation

Når I præsenterer jeres portfolio, skal I kunne:

1. Forklare, hvad problemet er, og hvorfor jeres datasæt er et godt eksempel.
2. Gå et lille eksempel igennem i hånden for hver algoritme, fx med 4 - 6 af jeres elementer.
3. Vise de vigtigste linjer i jeres kode og forklare, hvad de gør.
4. Forklare tidskompleksiteten i best case og worst case for hver algoritme, og bruge jeres egne tællinger som bevis.
5. Forklare, hvilke algoritmer der er stabile, og vise det med jeres elementer med samme værdi.
6. Vise, hvordan I har testet, at sorteringen er korrekt, og fortælle om en fejl, I fandt undervejs.
7. Begrunde jeres visualiseringer: Hvad viser de, hvorfor valgte I netop det, og hvad viser de ikke?
8. Sige, hvilken af de fire algoritmer I ville vælge i en given situation, og hvorfor.
