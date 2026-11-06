package app.dijkstra;

import java.util.LinkedHashMap;
import java.util.Map;

public class WeightedNode
{
    private final String name;
    private final Map<WeightedNode, Integer> neighbors;

    public WeightedNode(String name)
    {
        this.name = name;
        this.neighbors = new LinkedHashMap<>();
    }

    public String getName()
    {
        return name;
    }

    public Map<WeightedNode, Integer> getNeighbors()
    {
        return neighbors;
    }

    public void addNeighbor(WeightedNode neighbor, int weight)
    {
        if (weight < 0)
        {
            throw new IllegalArgumentException("Dijkstra kræver ikke-negative vægte");
        }
        neighbors.put(neighbor, weight);
    }
}
