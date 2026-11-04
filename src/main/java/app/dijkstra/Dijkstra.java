package app.dijkstra;

import java.util.*;
import java.util.function.Consumer;

public class Dijkstra
{
    public static void main(String[] args)
    {
        Map<String, WeightedNode> cities = createGraph();
        findShortestPath(cities.get("A"), cities.get("H"));
    }

    public static Map<String, WeightedNode> createGraph()
    {
        // Her bygges noderne.
        WeightedNode A = new WeightedNode("A");
        WeightedNode B = new WeightedNode("B");
        WeightedNode C = new WeightedNode("C");
        WeightedNode D = new WeightedNode("D");
        WeightedNode E = new WeightedNode("E");
        WeightedNode F = new WeightedNode("F");
        WeightedNode G = new WeightedNode("G");
        WeightedNode H = new WeightedNode("H");
        WeightedNode I = new WeightedNode("I");
        WeightedNode J = new WeightedNode("J");

        // Rettede veje med vægte i km.
        A.addNeighbor(B, 8);
        A.addNeighbor(C, 2);

        B.addNeighbor(D, 2);
        B.addNeighbor(E, 6);

        C.addNeighbor(B, 3);
        C.addNeighbor(E, 9);
        C.addNeighbor(I, 2);

        D.addNeighbor(E, 1);
        D.addNeighbor(F, 6);

        E.addNeighbor(F, 3);
        E.addNeighbor(G, 5);

        F.addNeighbor(H, 4);
        G.addNeighbor(H, 3);

        // Sidegren: kan nås fra A, men fører ikke videre til H.
        I.addNeighbor(J, 2);

        // Mappet bruges til at vælge start/mål og dele grafen med visualiseringen.
        Map<String, WeightedNode> cities = new LinkedHashMap<>();
        for (WeightedNode node : List.of(A, B, C, D, E, F, G, H, I, J))
        {
            cities.put(node.getName(), node);
        }

        return cities;
    }

    // Pakker en node og dens afstand sammen, så prioritetskøen kan sortere.
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
        findShortestPath(source, destination, null);
    }

    // Observatøren gemmer kun øjebliksbilleder; samme algoritme bruges uden visualisering.
    public static void findShortestPath(WeightedNode source, WeightedNode destination,
                                        Consumer<DijkstraTrace.Step> observer)
    {
        // Bedste kendte afstand fra start til hver node.
        Map<WeightedNode, Integer> dist = new HashMap<>();

        // Forgængeren bruges til at rekonstruere vejen til sidst.
        Map<WeightedNode, WeightedNode> prev = new HashMap<>();

        // Noder med endelig afstand, som ikke skal behandles igen.
        Set<WeightedNode> visited = new HashSet<>();

        // Køen sorterer selv ved hjælp af NodeWithDist.compareTo.
        PriorityQueue<NodeWithDist> queue = new PriorityQueue<>();

        // trace.save gemmer kun trin til visualiseringen.
        DijkstraTrace trace = new DijkstraTrace(dist, prev, visited, queue, observer);

        // Startnoden er 0 væk fra sig selv.
        dist.put(source, 0);
        queue.add(new NodeWithDist(source, 0));
        trace.save("start", null, null);

        while (!queue.isEmpty())
        {
            NodeWithDist current = queue.poll();
            trace.save("select", current, null);

            // Et gammelt køelement springes over, hvis noden allerede er visited.
            if (visited.contains(current.node))
            {
                trace.save("skip", current, null);
                continue;
            }
            // Når målet vælges fra køen, er dets korteste afstand fundet.
            if (current.node.equals(destination))
            {
                visited.add(current.node);
                break;
            }

            // Undersøg hver udgående kant.
            for (Map.Entry<WeightedNode, Integer> entry : current.node.getNeighbors().entrySet())
            {
                WeightedNode next = entry.getKey();
                int weight = entry.getValue();
                if (visited.contains(next))
                {
                    trace.save("skip-neighbor", current, next);
                    continue;
                }
                // Samlet afstand til naboen via current.
                int newDist = current.dist + weight;
                trace.save("inspect", current, next);

                // Opdater kun, hvis vi har fundet en kortere vej.
                // Det gamle køelement bliver liggende og springes over senere.
                if (newDist < dist.getOrDefault(next, Integer.MAX_VALUE))
                {
                    dist.put(next, newDist);
                    prev.put(next, current.node);
                    queue.add(new NodeWithDist(next, newDist));
                    trace.save("relax", current, next);
                }
                else
                {
                    trace.save("keep", current, next);
                }
            }
            // Noden er nu færdigbehandlet og bliver grøn i samme trin.
            visited.add(current.node);
            trace.save("settle", current, null);
        }

        if (!visited.contains(destination))
        {
            trace.save("unreachable", null, null);
            if (observer == null)
            {
                System.out.println("Ingen vej fra " + source.getName() + " til " + destination.getName());
            }
            return;
        }

        // Rekonstruer stien ved at følge prev fra mål tilbage til start.
        List<String> path = new ArrayList<>();
        WeightedNode step = destination;
        while (step != null)
        {
            path.add(0, step.getName());
            step = prev.get(step);
        }
        trace.saveComplete(new NodeWithDist(destination, dist.get(destination)), path);
        if (observer == null)
        {
            System.out.println("Korteste vej: " + path);
            System.out.println("Samlet dist: " + dist.get(destination) + " km");
        }
    }
}
