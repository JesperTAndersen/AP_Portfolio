package app.graphs.dijkstra;

import java.util.*;

public class Dijkstra
{
    public static void main(String[] args)
    {
        Map<String, WeightedNode> cities = createGraph();
        findShortestPath(cities.get("S"), cities.get("M"));
    }

    public static Map<String, WeightedNode> createGraph()
    {
        WeightedNode S = new WeightedNode("S");
        WeightedNode A = new WeightedNode("A");
        WeightedNode B = new WeightedNode("B");
        WeightedNode C = new WeightedNode("C");
        WeightedNode D = new WeightedNode("D");
        WeightedNode E = new WeightedNode("E");
        WeightedNode F = new WeightedNode("F");
        WeightedNode G = new WeightedNode("G");
        WeightedNode H = new WeightedNode("H");
        WeightedNode M = new WeightedNode("M");

        // Øverste rute – fælden: de lokalt billigste kanter, men C → M koster 12. I alt 15 km.
        S.addNeighbor(A, 1);
        A.addNeighbor(B, 1);
        B.addNeighbor(C, 1);
        C.addNeighbor(M, 12);

        // Midterste rute – blindgyde: udforskes helt, fordi den er tættere på S end M er.
        S.addNeighbor(D, 5);
        D.addNeighbor(E, 4);

        // Nederste rute – starter dyrere (S → F = 4), men er den korteste vej: 10 km.
        S.addNeighbor(F, 4);
        F.addNeighbor(G, 2);
        G.addNeighbor(H, 2);
        H.addNeighbor(M, 2);

        // Direkte vej: giver G en foreløbig afstand på 7, som senere forbedres til 6 via F.
        S.addNeighbor(G, 7);

        Map<String, WeightedNode> cities = new LinkedHashMap<>();
        for (WeightedNode node : List.of(S, A, B, C, D, E, F, G, H, M))
        {
            cities.put(node.getName(), node);
        }
        return cities;
    }

    // Gemmer afstanden på indsættelsestidspunktet, så PriorityQueue kan sortere efter den.
    static class NodeWithDist implements Comparable<NodeWithDist>
    {
        WeightedNode node;
        int dist;

        public NodeWithDist(WeightedNode node, int dist)
        {
            this.node = node;
            this.dist = dist;
        }

        @Override
        public int compareTo(NodeWithDist other)
        {
            return Integer.compare(this.dist, other.dist);
        }
    }

    public static void findShortestPath(WeightedNode source, WeightedNode destination)
    {
        Map<WeightedNode, Integer> distances = new HashMap<>();
        Map<WeightedNode, WeightedNode> prev = new HashMap<>();
        Set<WeightedNode> visited = new HashSet<>();
        PriorityQueue<NodeWithDist> queue = new PriorityQueue<>();

        distances.put(source, 0);
        queue.add(new NodeWithDist(source, 0));

        while (!queue.isEmpty())
        {
            // Grådigt valg: lavest SAMLET afstand fra start, ikke den billigste næste kant.
            NodeWithDist current = queue.poll();

            if (visited.contains(current.node))
            {
                continue;
            }
            visited.add(current.node);

            // Først når målet vælges fra køen, er afstanden endelig – ikke når det opdages.
            if (current.node.equals(destination))
            {
                break;
            }

            for (Map.Entry<WeightedNode, Integer> entry : current.node.getNeighbors().entrySet())
            {
                WeightedNode next = entry.getKey();
                int weight = entry.getValue();
                if (visited.contains(next))
                {
                    continue;
                }
                int newDist = current.dist + weight;

                // PriorityQueue kan ikke ændre en prioritet, så vi tilføjer en ny post;
                // den gamle springes over, når den tages ud.
                if (newDist < distances.getOrDefault(next, Integer.MAX_VALUE))
                {
                    distances.put(next, newDist);
                    prev.put(next, current.node);
                    queue.add(new NodeWithDist(next, newDist));
                }
            }
        }

        if (!visited.contains(destination))
        {
            System.out.println("Ingen vej fra " + source.getName() + " til " + destination.getName());
            return;
        }

        List<String> path = buildPath(prev, destination);
        System.out.println("Korteste vej: " + String.join(" → ", path));
        System.out.println("Samlet dist: " + distances.get(destination) + " km");
    }

    // prev peger baglæns, så vi går fra mål til start og indsætter forrest.
    private static List<String> buildPath(Map<WeightedNode, WeightedNode> prev, WeightedNode destination)
    {
        List<String> path = new ArrayList<>();
        WeightedNode step = destination;
        while (step != null)
        {
            path.add(0, step.getName());
            step = prev.get(step);
        }
        return path;
    }
}
