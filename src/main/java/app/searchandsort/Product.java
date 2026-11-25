package app.searchandsort;

// En vare i webshoppen. Alle fire sorteringer sorterer efter price.
public class Product
{
    private final String name;
    private final int price;

    public Product(String name, int price)
    {
        this.name = name;
        this.price = price;
    }

    public String getName()
    {
        return name;
    }

    public int getPrice()
    {
        return price;
    }

    @Override
    public String toString()
    {
        return name + " (" + price + ")";
    }
}
