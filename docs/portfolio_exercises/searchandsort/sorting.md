# Portfolio: Sortering

## 1. Bubble sort
- Kig på klassen `searchandsort.SortExamples` og metoden `bubbleSort()`. 
- Prøv at køre metoden `testBubble` fra `Main.main` og se om du forstår hvad der sker. 
Hvad sorteres de studerende efter? Hvad gør metoden `Collections.swap()`?
Hvad styrer den ydre løkke? Hvad styrer den indre løkke?
- Implementer en ny bubblesort-metode, som tager et `int[]` som parameter. Lad være med
  at copy-paste koden fra `SortExamples`. Kommenter din kode, så du ved hvad der sker i hvert step. 

NB: `Collections.swap()` virker ikke på et int[] så du får brug for at lave din egen 
swap. Du kan fx bruge nedenstående kode: 

```java 
private static void swap(int[] arr, int i, int j) {
int temp = arr[i];
arr[i] = arr[j];
arr[j] = temp;
}
```

## 2. Merge sort
- Kig på klassen `searchandsort.SortExamples` og metoderne `mergeSort()` 
og `merge()`.
- Prøv at køre metoden `testMerge` fra `Main.main` og se om du forstår hvad der sker.
Hvad er basecase i den rekursive metode `mergeSort()` og hvorfor? Hvorfor returnerer 
ingen af metoderne noget? 
- Implementer en ny mergesort-metode, som tager et `int[]` som parameter. Lad være med 
at copy-paste koden fra `SortExamples`. Kommenter din kode, så du ved hvad der sker i hvert step.

Bonus: kig på metoderne `mergeSortList` og `mergeList()`. Hvordan adskiller de sig 
fra de metoder, der tager arrays som paramter? Hvad betyder fx `new ArrayList<>(students.subList(0, mid))`? 
Hvorfor bruges metoden `set()` og ikke `add()` i `mergeList()`?


## 3. Quick sort
- Kig på klassen `searchandsort.SortExamples` og metoden `quickSort()`.
- Prøv at køre metoden `testQuick()`fra `Main.main` og se om du forstår hvad der sker.
- Udkommenter ` Collections.shuffle(list)` og se hvad der sker med `SortExamples.quickSort()`. Hvorfor sker dette? (Hint: worst case scenario)
- Implementer en ny quick sort-metode, som tager et `int[]` som parameter. Lad være med
  at copy-paste koden fra `SortExamples`. Kommenter din kode, så du ved hvad der sker i hvert step.
