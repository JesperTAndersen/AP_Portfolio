package app.searchandsort;

public class MergeSort
{
    static int comparisons = 0;

    public static void sort(Product[] products)
    {
        comparisons = 0;
        mergeSort(products);
    }

    private static void mergeSort(Product[] products)
    {
        // Base case: 0 eller 1 vare er allerede sorteret.
        if (products.length < 2)
        {
            return;
        }

        // ---------- 1. DEL ----------
        int middle = products.length / 2;
        Product[] left = new Product[middle];
        Product[] right = new Product[products.length - middle];
        for (int i = 0; i < middle; i++)
        {
            left[i] = products[i];
        }
        for (int i = middle; i < products.length; i++)
        {
            right[i - middle] = products[i];
        }

        // ---------- 2. LØS REKURSIVT ----------
        // Venstre halvdel sorteres HELT færdig (hele vejen ned og op igen), før højre begynder.
        mergeSort(left);
        mergeSort(right);

        // ---------- 3. KOMBINÉR (FLET) ----------
        merge(products, left, right);
    }

    private static void merge(Product[] result, Product[] left, Product[] right)
    {
        int resultIndex = 0; // næste plads i result
        int leftIndex = 0;   // forreste tilbageværende i left
        int rightIndex = 0;  // forreste tilbageværende i right

        // Begge halvdele er sorteret, så den forreste er altid den billigste der er tilbage:
        // det er nok at sammenligne de to forreste.
        while (leftIndex < left.length && rightIndex < right.length)
        {
            comparisons++;
            // <= gør Merge Sort STABIL: ved samme pris tages den fra left, som stod først i input.
            if (left[leftIndex].getPrice() <= right[rightIndex].getPrice())
            {
                result[resultIndex] = left[leftIndex];
                leftIndex++;
            }
            else
            {
                result[resultIndex] = right[rightIndex];
                rightIndex++;
            }
            resultIndex++;
        }

        // Den ene halvdel er tom. Resten af den anden er allerede sorteret og kopieres uden sammenligning.
        while (leftIndex < left.length)
        {
            result[resultIndex] = left[leftIndex];
            leftIndex++;
            resultIndex++;
        }
        while (rightIndex < right.length)
        {
            result[resultIndex] = right[rightIndex];
            rightIndex++;
            resultIndex++;
        }
    }
}
