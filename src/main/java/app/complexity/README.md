# Kompleksitet og datastrukturer

Kode: [`Complexity.java`](Complexity.java) (målingerne) og [`Student.java`](Student.java) (entitetsklassen).
Opgave: [complexity_and_datastructures.md](../../../../../docs/portfolio_exercises/complexity/complexity_and_datastructures.md)

Tiderne er målt med `System.nanoTime()`. Hver måling køres 5 gange, fordi den første kørsel
er langsommere, mens Java "varmer op". Tallene nedenfor er fra én kørsel og svinger lidt.

## ArrayList vs LinkedList

500.000 elementer i hver.

| Operation | ArrayList | LinkedList |
|---|---|---|
| `get(250000)` | ~0,002 ms — **O(1)** | ~3 ms — **O(n)** |
| `add(250000, 99)` | ~0,3 ms — **O(n)** | ~3 ms — **O(n)** |
| `remove(250000)` | ~0,2 ms — **O(n)** | ~3 ms — **O(n)** |
| `add(0, 99)` x 10.000 | ~1.600 ms — **O(n)** pr. kald | ~1,4 ms — **O(1)** pr. kald |

**ArrayList** ligger i et array. `get` angiver bare pladsen (index), og den kan hentes direkte i
konstant tid, O(1). Indsætter eller sletter man i midten, skal alle elementerne efter pladsen
rykkes én plads, så det er O(n). Bagerst er der intet at rykke, så `add` bagerst er O(1)
(amortized, se ArrayDeque nedenfor).

**LinkedList** er en dobbelthægtet liste (doubly linked list): hver node har en pointer til den
næste og den forrige, og listen kender første og sidste node (head og tail). Der er intet index,
så for at finde plads 250.000 skal den gå node for node. Det er O(n) (Java går fra den nærmeste
ende, men midten er netop længst væk fra begge). Selve indsættelsen er bare at sætte pointere om,
O(1), men *at finde pladsen* er O(n), så `get`, `add` og `remove` i midten er alle O(n).

Derfor er begge O(n) i midten, men af forskellige grunde: ArrayList *rykker* elementer,
LinkedList *leder* efter pladsen. ArrayList er alligevel hurtigst i praksis, fordi elementerne
ligger samlet i hukommelsen og rykkes i én hurtig blok-kopi, mens LinkedList hopper mellem noder
spredt rundt i hukommelsen.

**Forrest** vender det: LinkedList kender head, så den laver en ny node og sætter pointerne om,
O(1), uden at rykke eller lede efter noget. ArrayList skal rykke alle 500.000 elementer én
plads, O(n), og det 10.000 gange.

**Hvorfor forskellige, når begge implementerer `List`?** `List` er kun et interface: det siger
*hvilke* metoder der findes, ikke *hvordan* data ligger i hukommelsen. Kompleksiteten kommer fra
den underliggende datastruktur (array eller hægtede noder).

## Søgning: List vs HashSet

500.000 elementer, `contains` kaldt 100 gange.

| `contains(x)` | ArrayList | HashSet |
|---|---|---|
| forrest (0) | hurtig — 1 sammenligning | hurtig — O(1) |
| bagerst (499999) | langsom — O(n) | hurtig — O(1) |
| findes ikke (-1) | langsom — O(n), **worst case** | hurtig — O(1) |

**ArrayList** itererer gennem listen og sammenligner element for element, O(n). Forrest findes
elementet med det samme (best case). Bagerst skal den igennem næsten hele listen. Et element der
*ikke findes* er worst case: den kan først svare "nej", når den har tjekket alle n elementer.

**HashSet** itererer ikke. Den bruger elementets `hashCode()` til at regne direkte ud, hvilken
plads (bucket) elementet skal ligge i, og kigger kun dér. Det er O(1) i gennemsnit, uanset om
elementet ligger "forrest", "bagerst" eller slet ikke findes. Se mere om buckets nedenfor.

## Comparable, equals() og hashCode()

Entitetsklassen er `Student` (`id`, `name`). Den implementerer `Comparable<Student>` og overrider
`equals()` og `hashCode()`. Alle tre bygger på `id`. Klassen tæller kaldene, så programmet viser
hvilke metoder hver struktur bruger. Med 100.000 studerende i sættet:

| Struktur | `add` | `contains` | `remove` | Bruger |
|---|---|---|---|---|
| `TreeSet` | **O(log n)** | **O(log n)** | **O(log n)** | `compareTo()` (16 kald for 100.000 elementer) |
| `HashSet` | **O(1)** gns. | **O(1)** gns. | **O(1)** gns. | `hashCode()` + `equals()` (1 + 1 kald) |

**TreeSet** er et balanceret binært søgetræ. Ved hvert skridt bruger den
`compareTo()` til at vælge: mindre → gå til venstre, større → gå til højre. Hvert skridt
halverer det, der er tilbage, så kompleksiteten er O(log n).

Indsætter man alle n elementer, koster det **O(n log n)** i alt: hvert `add` er O(log n), og det
gøres n gange. De første er billigere, fordi træet er lille, men halvdelen af elementerne
indsættes i et træ med mindst n/2 elementer, og det kan halveres næsten lige så mange gange som
n. Til sammenligning koster n gange `add` i et HashSet kun O(n). Til gengæld holder TreeSet
elementerne sorteret: at indsætte n elementer i et TreeSet er reelt at sortere dem, og sortering
med sammenligninger kan ikke gøres hurtigere end O(n log n).

**HashSet** har inde bagved et array af buckets. `hashCode()` giver et tal, og ud fra det tal
regnes et index i arrayet ud: den bucket, elementet hører til. Flere forskellige objekter kan
lande i samme bucket (en collision), så når HashSet har fundet bucketen, bruger den `equals()`
til at tjekke, hvilket objekt i bucketen der faktisk er det rigtige. Er der kun få objekter pr.
bucket, er det O(1) i gennemsnit. Bliver sættet for fyldt, laver HashSet et større array og
fordeler alt igen (rehash), så buckets forbliver små. Worst case giver alle objekter samme
`hashCode()`, så de ligger i én bucket, og så skal den lede igennem dem alle, O(n).

Målingen (100.000 studerende ind, find, fjern) viser, at HashSet er hurtigst, men forskellen er
ikke kæmpestor: 100.000 kan kun halveres ca. 17 gange, så TreeSet når frem på ca. 17 skridt.

**Hvad er vigtigt, når vi implementerer de tre metoder?**
- `equals()` og `hashCode()` skal passe sammen: er `a.equals(b)`, skal `a.hashCode() == b.hashCode()`.
  Ellers lander to "ens" objekter i hver sin bucket, og HashSet finder ikke objektet med
  `contains`, eller tillader dubletter. (To objekter med samme hashCode behøver *ikke* være ens.)
- `compareTo()` og `equals()` skal være enige: `a.compareTo(b) == 0` netop når `a.equals(b)`.
  Ellers er TreeSet og HashSet uenige om, hvorvidt to objekter er det samme.
- Byg alle tre på de samme felter, og brug felter der ikke ændres (`id` er `final`). Ændres et
  felt, mens objektet ligger i sættet, ligger det i den forkerte bucket / det forkerte sted i træet.

## PriorityQueue og ArrayDeque

| Struktur | Sætte ind | Tage ud |
|---|---|---|
| `PriorityQueue` | O(log n) — `offer` | O(log n) — `poll` |
| `ArrayDeque` som kø | O(1) amortized — `offer` | O(1) — `poll` |
| `ArrayDeque` som stak | O(1) amortized — `push` | O(1) — `pop` |

Sæt 5, 1, 4, 2, 3 ind og tag ud igen:

- `PriorityQueue` → `[1, 2, 3, 4, 5]`: det **mindste** element (efter `compareTo`) kommer ud først.
- `ArrayDeque` som kø → `[5, 1, 4, 2, 3]`: FIFO, det **ældste** kommer ud først.
- `ArrayDeque` som stak → `[3, 2, 4, 1, 5]`: LIFO, det **nyeste** kommer ud først.

**ArrayDeque** tager altid fra en ende: forrest eller bagerst. Den holder styr på, hvor
enderne er i arrayet (head og tail index), så det rigtige element står klar uden at den skal
sammenligne eller lede efter noget. Derfor O(1).

**Kø eller stak bestemmes af typen.** `ArrayDeque` implementerer interfacet `Deque` (udtales
"deck", *double-ended queue*), som arver fra `Queue`:

```
Queue        offer, poll, peek                    (kun FIFO)
  └─ Deque   + push, pop, offerFirst, pollLast …  (begge ender)
       └─ ArrayDeque                              (implementeringen: et array)
```

Den type variablen er erklæret som, bestemmer hvilke metoder man må kalde, ligesom
`List<Integer> list = new ArrayList<>()`. I koden:

- `Queue<Integer> queue = new ArrayDeque<>()` kan kun bruges som kø: `push` giver compile-fejl.
- `Deque<Integer> stack = new ArrayDeque<>()` bruges som stak med `push`/`pop`. Java har intet
  rent stak-interface (den gamle klasse `Stack` er forældet og arver fra `Vector`), så man skal
  selv holde sig til `push`/`pop`, for `Deque` tillader også `offer`/`poll`.

PriorityQueue implementerer også `Queue`, så den bruger de samme metoder (`offer`/`poll`). Kun
*hvilket* element `poll` giver, er forskelligt.

**Amortized** betyder "i gennemsnit over mange operationer". ArrayDeque ligger i et array. Når
det er fyldt, laves et nyt array, der er dobbelt så stort, og alt kopieres over. Den ene
indsættelse koster O(n), men det sker sjældent (ved 16, 32, 64, … elementer). Fordelt over alle
indsættelserne koster hver indsættelse et konstant beløb, altså O(1) amortized.

**PriorityQueue** er en heap: et træ, hvor en forælder altid er mindre end sine børn, så det
mindste element altid ligger øverst. Den er ikke helt sorteret, kun så meget at toppen er rigtig.
- `offer`: det nye element lægges nederst og bytter plads opad, så længe det er mindre end sin
  forælder.
- `poll`: toppen tages ud, det sidste element flyttes op på toppen og bytter plads nedad, til det
  passer. Så står det næstmindste klar øverst.

Hvert niveau i træet fordobler antallet af pladser, så der er få niveauer: ca. 19 for
500.000 elementer. Begge dele er derfor O(log n).

**Hvorfor forskel, når begge er køer?** ArrayDeque tager ud efter *ankomstrækkefølge*, så det
næste element ligger allerede klar i en ende, O(1). PriorityQueue tager ud efter *prioritet*
(værdien, via `compareTo`), og så skal den sammenligne elementer og holde heapen i orden ved
hver ind- og udtagning, O(log n). Det er derfor Dijkstra og A* bruger PriorityQueue (vi vil
altid have den korteste afstand), mens BFS og DFS kan nøjes med ArrayDeque.
