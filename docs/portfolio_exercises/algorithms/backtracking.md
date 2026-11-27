# Portfolio: Backtracking

Du har en labyrint, du skal gå igennem. Labyrinten er repræsenteret af et to-dimensionelt array hvor
- `1` betyder "du kan gå her"
- `0` betyder "mur - her kan du ikke gå"

Labyrinten kan fx se sådan ud: 

```java
int[][] maze = {
        {1, 0, 1, 1, 1, 0},
        {1, 1, 1, 0, 1, 0},
        {0, 0, 1, 0, 1, 1},
        {0, 1, 1, 1, 0, 1},
        {0, 1, 0, 0, 0, 1},
        {0, 1, 1, 1, 1, 1}
};
```

Du starter i øverste venstre hjørne (0,0) og skal finde vej til nederste højre hjørne (5,5). 

Kig på koden i `algorithms.maze.MazeExercise`. Der mangler at blive implementeret en metode, der kan gå gennem labyrinten.
I kan med fordel arbejde sammen i par og skrive pseudokode for metoden inden I implementerer. 

Brug `int[][] path = new int[N][N];` til at holde styr på vejen gennem labyrinten. Den skal både bruges, når du 
printer løsningen og når du tjekker for om du allerede har besøgt et felt. 

Opgaven er nu

- Implementer metoden `solveMaze(..)`. For hvert skridt skal du
  - Tjekke om du går udenfor labyrintens grænser
  - Tjekke om feltet er gyldigt ([row][col] == 1)
  - Tjekke om feltet er en del af en sti du har prøvet før (`path`)
  - Tjekke om du har nået målet ([row][col] == 3)
  - Markere feltet som en del af stien (`path`)
  - Prøv de fire retninger én af gangen
    - ned
    - højre
    - op
    - venstre
  - Hvis ingen muligheder virker, så backtrack (og fjern feltet fra `path`)

Du kan søge inspiration i `algorithms.backtracking.NQueeens`  

Du er velkommen til at (få en AI til at) lave noget visualisering af vejen gennem labyrinten og call stacken 
