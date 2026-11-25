package app.searchandsort;

public class QuickSort
{
    static int comparisons = 0;
    static int swaps = 0;

    // Pivot = sidste element (Lomuto).
    public static void sort(Product[] products)
    {
        comparisons = 0;
        swaps = 0;
        quickSort(products, 0, products.length - 1);
    }

    private static void quickSort(Product[] products, int low, int high)
    {
        // Base case: 0 eller 1 vare i området.
        if (low >= high)
        {
            return;
        }

        // ---------- PARTITIONERING ----------
        // Bagefter står pivot på sin endelige plads: billigere til venstre, dyrere til højre.
        int pivotIndex = partition(products, low, high);

        // ---------- DE TO REKURSIVE KALD ----------
        // pivotIndex er med i ingen af dem da pivot står allerede rigtigt.
        quickSort(products, low, pivotIndex - 1);
        quickSort(products, pivotIndex + 1, high);
    }

    private static int partition(Product[] products, int low, int high)
    {
        int pivotPrice = products[high].getPrice();
        // i = sidste plads i "<= pivot"-området. low - 1 betyder at området er tomt i starten.
        int i = low - 1;

        // j = varen der undersøges nu. j < high: pivot sammenlignes ikke med sig selv.
        for (int j = low; j < high; j++)
        {
            comparisons++;
            if (products[j].getPrice() <= pivotPrice)
            {
                i++;
                // Lange hop: en vare kan springe forbi andre med samme pris. Derfor er Quick Sort IKKE stabil.
                swap(products, i, j);
            }
        }

        // Pivot flyttes ind lige efter "<= pivot"-området: det er dens endelige plads.
        swap(products, i + 1, high);
        return i + 1;
    }

    // ---------- Anden pivot: medianen af første, midterste og sidste ----------

    public static void sortMedianOfThree(Product[] products)
    {
        comparisons = 0;
        swaps = 0;
        quickSortMedianOfThree(products, 0, products.length - 1);
    }

    private static void quickSortMedianOfThree(Product[] products, int low, int high)
    {
        if (low >= high)
        {
            return;
        }

        // Eneste forskel: medianen flyttes ud på high, så partition() kan bruges uændret.
        // På sorteret input er medianen den midterste vare, så området deles i to lige store halvdele.
        moveMedianToEnd(products, low, high);
        int pivotIndex = partition(products, low, high);

        quickSortMedianOfThree(products, low, pivotIndex - 1);
        quickSortMedianOfThree(products, pivotIndex + 1, high);
    }

    private static void moveMedianToEnd(Product[] products, int low, int high)
    {
        int middle = low + (high - low) / 2;

        // Sorterer de tre, så products[low] <= products[middle] <= products[high].
        comparisons++;
        if (products[middle].getPrice() < products[low].getPrice())
        {
            swap(products, low, middle);
        }
        comparisons++;
        if (products[high].getPrice() < products[low].getPrice())
        {
            swap(products, low, high);
        }
        comparisons++;
        if (products[high].getPrice() < products[middle].getPrice())
        {
            swap(products, middle, high);
        }

        // Medianen står nu i midten. Byt den ud på high, hvor partition() forventer pivot.
        swap(products, middle, high);
    }

    private static void swap(Product[] products, int first, int second)
    {
        Product temp = products[first];
        products[first] = products[second];
        products[second] = temp;
        swaps++;
    }
}
