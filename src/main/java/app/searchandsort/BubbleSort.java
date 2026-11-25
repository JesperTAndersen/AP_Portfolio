package app.searchandsort;

public class BubbleSort
{
    static int comparisons = 0;
    static int swaps = 0;

    public static void sort(Product[] products)
    {
        comparisons = 0;
        swaps = 0;
        int n = products.length;

        for (int i = 0; i < n - 1; i++)
        {
            boolean swapped = false;

            for (int j = 0; j < n - 1 - i; j++)
            {
                comparisons++;
                if (products[j].getPrice() > products[j + 1].getPrice())
                {
                    Product temp = products[j];
                    products[j] = products[j + 1];
                    products[j + 1] = temp;
                    swaps++;
                    swapped = true;
                }
            }

            if (!swapped)
            {
                break;
            }
        }
    }
}
