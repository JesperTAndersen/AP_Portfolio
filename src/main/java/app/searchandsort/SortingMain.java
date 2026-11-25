package app.searchandsort;

import java.util.Random;

public class SortingMain
{
    private static final String[] ALGORITHMS = {"Bubble Sort", "Merge Sort", "Quick Sort", "Heap Sort"};
    private static final int[] SIZES = {1_000, 2_000, 4_000};

    public static void main(String[] args)
    {
        System.out.println("Datasæt (tilfældig rækkefølge):");
        printProducts(randomOrder());
        System.out.println();

        for (String algorithm : ALGORITHMS)
        {
            runOnWebshop(algorithm);
        }

        compareQuickSortPivots();
        compareAllOnBigData();
    }

    // To par med samme pris: Hoodie/Sweater (299) og T-shirt/Bælte (149).
    // I input står Hoodie før Sweater og T-shirt før Bælte. En stabil sortering bevarer det.
    private static Product[] randomOrder()
    {
        return new Product[]{
                new Product("Hoodie", 299),
                new Product("T-shirt", 149),
                new Product("Jakke", 499),
                new Product("Kasket", 99),
                new Product("Sokker", 49),
                new Product("Bukser", 349),
                new Product("Sweater", 299),
                new Product("Sko", 599),
                new Product("Bælte", 149),
                new Product("Skjorte", 249)
        };
    }

    private static Product[] sortedOrder()
    {
        return new Product[]{
                new Product("Sokker", 49),
                new Product("Kasket", 99),
                new Product("T-shirt", 149),
                new Product("Bælte", 149),
                new Product("Skjorte", 249),
                new Product("Hoodie", 299),
                new Product("Sweater", 299),
                new Product("Bukser", 349),
                new Product("Jakke", 499),
                new Product("Sko", 599)
        };
    }

    private static Product[] reversedOrder()
    {
        return new Product[]{
                new Product("Sko", 599),
                new Product("Jakke", 499),
                new Product("Bukser", 349),
                new Product("Sweater", 299),
                new Product("Hoodie", 299),
                new Product("Skjorte", 249),
                new Product("Bælte", 149),
                new Product("T-shirt", 149),
                new Product("Kasket", 99),
                new Product("Sokker", 49)
        };
    }

    private static void runOnWebshop(String algorithm)
    {
        System.out.println("- " + algorithm + " (10 varer) -");
        Product[] randomResult = runOnce(algorithm, "tilfældig", randomOrder());
        runOnce(algorithm, "sorteret ", sortedOrder());
        runOnce(algorithm, "omvendt  ", reversedOrder());

        System.out.print("  resultat (tilfældig): ");
        printProducts(randomResult);
        System.out.println();
    }

    private static Product[] runOnce(String algorithm, String label, Product[] input)
    {
        // Sorter en kopi, så input kan bruges til at tjekke stabilitet bagefter.
        Product[] products = input.clone();
        sortWith(algorithm, products);

        System.out.printf("  %s  sammenligninger: %3d   ombytninger: %3s   sorteret: %s   stabil: %s%n",
                label, comparisons(algorithm), swaps(algorithm), yesNo(isSorted(products)),
                stability(input, products));
        return products;
    }

    // ---------- Quick Sort: sidste element vs medianen af tre som pivot ----------

    private static void compareQuickSortPivots()
    {
        System.out.println("- Quick Sort: pivot = sidste element vs medianen af tre (sammenligninger) -");
        System.out.println("      n   sorteret: sidste   median   |   tilfældig: sidste   median");
        for (int n : SIZES)
        {
            Product[] sorted = createSorted(n);
            QuickSort.sort(sorted.clone());
            int sortedLast = QuickSort.comparisons;
            QuickSort.sortMedianOfThree(sorted.clone());
            int sortedMedian = QuickSort.comparisons;

            Product[] random = createRandom(n);
            QuickSort.sort(random.clone());
            int randomLast = QuickSort.comparisons;
            QuickSort.sortMedianOfThree(random.clone());
            int randomMedian = QuickSort.comparisons;

            System.out.printf("  %5d   %16d %8d   | %19d %8d%n", n, sortedLast, sortedMedian, randomLast, randomMedian);
        }
        System.out.println();
    }

    // ---------- Alle fire på større datasæt ----------

    private static void compareAllOnBigData()
    {
        System.out.println("- Alle fire, sammenligninger på større datasæt -");
        System.out.println("  algoritme       input           n=1000     n=2000     n=4000");
        for (String algorithm : ALGORITHMS)
        {
            printBigRow(algorithm, "tilfældig");
            printBigRow(algorithm, "sorteret");
            printBigRow(algorithm, "omvendt");
        }
    }

    private static void printBigRow(String algorithm, String input)
    {
        System.out.printf("  %-14s  %-10s", algorithm, input);
        for (int n : SIZES)
        {
            Product[] products;
            if (input.equals("tilfældig"))
            {
                products = createRandom(n);
            }
            else if (input.equals("sorteret"))
            {
                products = createSorted(n);
            }
            else
            {
                products = createReversed(n);
            }
            sortWith(algorithm, products);
            System.out.printf(" %10d", comparisons(algorithm));
        }
        System.out.println();
    }

    private static Product[] createSorted(int n)
    {
        Product[] products = new Product[n];
        for (int i = 0; i < n; i++)
        {
            products[i] = new Product("Vare " + i, i);
        }
        return products;
    }

    private static Product[] createReversed(int n)
    {
        Product[] products = new Product[n];
        for (int i = 0; i < n; i++)
        {
            products[i] = new Product("Vare " + i, n - i);
        }
        return products;
    }

    // Fast seed: samme "tilfældige" priser hver gang, så tallene kan sammenlignes mellem kørsler.
    private static Product[] createRandom(int n)
    {
        Random random = new Random(42);
        Product[] products = new Product[n];
        for (int i = 0; i < n; i++)
        {
            products[i] = new Product("Vare " + i, random.nextInt(10 * n));
        }
        return products;
    }

    // ---------- Hjælpemetoder ----------

    private static void sortWith(String algorithm, Product[] products)
    {
        switch (algorithm)
        {
            case "Bubble Sort" -> BubbleSort.sort(products);
            case "Merge Sort" -> MergeSort.sort(products);
            case "Quick Sort" -> QuickSort.sort(products);
            case "Heap Sort" -> HeapSort.sort(products);
        }
    }

    private static int comparisons(String algorithm)
    {
        return switch (algorithm)
        {
            case "Bubble Sort" -> BubbleSort.comparisons;
            case "Merge Sort" -> MergeSort.comparisons;
            case "Quick Sort" -> QuickSort.comparisons;
            default -> HeapSort.comparisons;
        };
    }

    // Merge Sort bytter ikke, den kopierer over i nye arrays. Derfor "-".
    private static String swaps(String algorithm)
    {
        return switch (algorithm)
        {
            case "Bubble Sort" -> "" + BubbleSort.swaps;
            case "Quick Sort" -> "" + QuickSort.swaps;
            case "Heap Sort" -> "" + HeapSort.swaps;
            default -> "-";
        };
    }

    // Test af korrektheden: hver pris må ikke være større end den næste.
    private static boolean isSorted(Product[] products)
    {
        for (int i = 0; i < products.length - 1; i++)
        {
            if (products[i].getPrice() > products[i + 1].getPrice())
            {
                return false;
            }
        }
        return true;
    }

    // Stabil = to varer med samme pris står i samme rækkefølge som i input.
    private static String stability(Product[] input, Product[] result)
    {
        for (int i = 0; i < result.length - 1; i++)
        {
            Product first = result[i];
            Product second = result[i + 1];
            if (first.getPrice() == second.getPrice() && indexOf(input, first) > indexOf(input, second))
            {
                return "nej, " + first.getName() + " er sprunget foran " + second.getName();
            }
        }
        return "ja";
    }

    private static int indexOf(Product[] products, Product target)
    {
        for (int i = 0; i < products.length; i++)
        {
            if (products[i] == target)
            {
                return i;
            }
        }
        return -1;
    }

    private static String yesNo(boolean value)
    {
        return value ? "ja" : "nej";
    }

    private static void printProducts(Product[] products)
    {
        for (int i = 0; i < products.length; i++)
        {
            System.out.print(products[i]);
            if (i < products.length - 1)
            {
                System.out.print(", ");
            }
        }
        System.out.println();
    }
}
