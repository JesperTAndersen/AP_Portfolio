package app.searchandsort;

public class HeapSort
{
    static int comparisons = 0;
    static int swaps = 0;

    public static void sort(Product[] products)
    {
        comparisons = 0;
        swaps = 0;
        int n = products.length;

        // ---------- FASE 1: BYG MAX-HEAPEN ----------
        // Start ved den sidste node der har children (n / 2 - 1). Leaves (nodes uden children) er allerede små heaps.
        // Nedefra og op, så begge subtrees er heaps, når en node får lov at synke.
        for (int i = n / 2 - 1; i >= 0; i--)
        {
            heapify(products, n, i);
        }

        // ---------- FASE 2: BYT ROOT MED SIDSTE, GENOPRET HEAPEN ----------
        for (int end = n - 1; end > 0; end--)
        {
            // Root er den dyreste der er tilbage. Den byttes ud bagerst og står nu på sin endelige plads.
            // Det lange hop kan sende en vare forbi en anden med samme pris: Heap Sort er IKKE stabil.
            swap(products, 0, end);

            // Heapen er nu én kortere (0 .. end - 1). Kun root er forkert, så den synker ned.
            heapify(products, end, 0);
        }
    }

    // Lad varen på plads i synke, indtil den er dyrere end begge sine children.
    // heapSize = hvor meget af arrayet der stadig er heap. Resten er sorteret og må ikke røres.
    private static void heapify(Product[] products, int heapSize, int i)
    {
        int largest = i;
        int leftChild = 2 * i + 1;
        int rightChild = 2 * i + 2;

        if (leftChild < heapSize)
        {
            comparisons++;
            if (products[leftChild].getPrice() > products[largest].getPrice())
            {
                largest = leftChild;
            }
        }
        if (rightChild < heapSize)
        {
            comparisons++;
            if (products[rightChild].getPrice() > products[largest].getPrice())
            {
                largest = rightChild;
            }
        }

        // Et child er dyrere: byt, og fortsæt nedad fra child'ets plads.
        if (largest != i)
        {
            swap(products, i, largest);
            heapify(products, heapSize, largest);
        }
    }

    private static void swap(Product[] products, int first, int second)
    {
        Product temp = products[first];
        products[first] = products[second];
        products[second] = temp;
        swaps++;
    }
}
