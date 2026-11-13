# Portfolio: Kompleksitet og datastrukturer

## 2. Datastrukturer og kompleksitet i praksis

I Tech uden Tech-øvelsen (se materiealer i `docs.datastructures.big_o` fandt vi ud af, at forskellige datastrukturer har forskellig kompleksitet for de samme operationer.
Nu skal du kode eksempler, der bekræfter det eller udfordrer det.

> **Sådan måler du tid**
> - Brug `System.nanoTime()` – mange af operationerne tager under ét millisekund.
> - Kør hver måling et par gange. Den første kørsel er ofte langsommere, fordi Java lige skal "varme op".
> - Er én operation for hurtig til at måle, så gentag den fx 10.000 gange og mål den samlede tid.

## ArrayList vs LinkedList

Opret en `ArrayList<Integer>` og en `LinkedList<Integer>` med 500.000 elementer i hver.
Mål og sammenlign følgende operationer:

- `get(250000)` — hent elementet midt i listen
- `add(250000, 99)` — indsæt et element midt i listen
- `remove(250000)` — slet elementet midt i listen
- `add(0, 99)` — indsæt et element forrest i listen (gentag 10.000 gange)

Forklar dine resultater med kompleksitet. Hvorfor opfører de sig forskelligt, selvom begge implementerer `List`?

> Hint: Tænk på hvad der sker fysisk i hukommelsen, når du indsætter eller sletter midt i et array vs en hægtet liste.
> Og tænk på, hvordan du *finder* plads nummer 250.000 i hver af dem.

## Søgning: List vs HashSet

Opret en `ArrayList<Integer>` og et `HashSet<Integer>` med de samme 500.000 elementer.
Mål og sammenlign:

- `contains(x)` for et element forrest i listen
- `contains(x)` for et element bagerst i listen
- `contains(x)` for et element der *ikke* findes

Forklar forskellen. Hvad er kompleksiteten for hvert kald, og hvorfor? Hvilket af de tre kald er worst case for listen?

## Comparable, equals() og hashCode()

Lav en entitetsklasse, der implementerer `Comparable<T>` og som overrider
metoderne `equals()` og `hashCode()`.

Opret et `TreeSet` og et `HashSet`, der kan holde objekter af din klasse.

For hver af datastrukturerne skal du tilføje, fjerne og finde et objekt.
Skriv kompleksiteten for de tre operationer.

Demonstrer forskellen på de to datastrukturer ved at indsætte, fjerne og
finde et antal objekter og tage tid på operationerne.

Hvilken af de tre metoder `compareTo()`, `equals()` og `hashCode()` bruger `TreeSet`, og hvilke bruger `HashSet`? 
Hvad er vigtigt når vi implementerer de tre metoder? 

## PriorityQueue og ArrayDeque

Vi har brugt `PriorityQueue` i Dijkstra og A*. Vi har brugt `ArrayDeque` i BFS og DFS både som kø og som stak.

Find kompleksiteten for at sætte et element ind og tage et element ud i de tre strukturer:

| Struktur | Sætte ind | Tage ud |
|---|---|---|
| `PriorityQueue` | | |
| `ArrayDeque` som kø | | |
| `ArrayDeque` som stak | | |

Du kan finde svarene i Javas dokumentation for de to klasser. Kig i klassebeskrivelsen øverst på siden (læg mærke til ordet amortized hos ArrayDeque. 
Hvad betyder mon det?).

Argumentér derefter for, hvorfor kompleksiteten ser sådan ud:

- Hvilket element tager vi ud af hver struktur?
- Hvad skal strukturen gøre, når der sættes et element ind eller tages et ud, for at det rigtige element står klar næste gang?
- Hvorfor er der forskel på `PriorityQueue` og `ArrayDeque`, når de begge er køer?
