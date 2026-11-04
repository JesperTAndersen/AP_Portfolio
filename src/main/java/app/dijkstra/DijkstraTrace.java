package app.dijkstra;

import java.util.*;
import java.util.function.Consumer;

/** Kopierer algoritmens tilstand uden at ændre dens maps, visited eller kø. */
public class DijkstraTrace {
    public record QueuedEntry(String node, int distance, boolean stale, boolean visited) {}
    public record Step(String phase, String current, Integer currentDistance, String edge,
                       Map<String, Integer> distances, Map<String, String> previous,
                       List<String> visited, List<QueuedEntry> queue, List<String> path) {}

    private final Map<WeightedNode, Integer> dist;
    private final Map<WeightedNode, WeightedNode> prev;
    private final Set<WeightedNode> visited;
    private final PriorityQueue<Dijkstra.NodeWithDist> queue;
    private final Consumer<Step> observer;

    DijkstraTrace(Map<WeightedNode, Integer> dist, Map<WeightedNode, WeightedNode> prev,
                  Set<WeightedNode> visited, PriorityQueue<Dijkstra.NodeWithDist> queue,
                  Consumer<Step> observer) {
        this.dist = dist;
        this.prev = prev;
        this.visited = visited;
        this.queue = queue;
        this.observer = observer;
    }

    void save(String phase, Dijkstra.NodeWithDist current, WeightedNode next) {
        save(phase, current, next, List.of());
    }

    void saveComplete(Dijkstra.NodeWithDist current, List<String> path) {
        save("complete", current, null, path);
    }

    private void save(String phase, Dijkstra.NodeWithDist current, WeightedNode next, List<String> path) {
        if (observer == null) return;
        Map<String, Integer> distances = new LinkedHashMap<>();
        dist.forEach((node, distance) -> distances.put(node.getName(), distance));
        Map<String, String> previous = new LinkedHashMap<>();
        prev.forEach((node, predecessor) -> previous.put(node.getName(), predecessor.getName()));

        // Iteration over PriorityQueue er IKKE sorteret. Poll en kopi for at vise udtagningsrækkefølgen.
        PriorityQueue<Dijkstra.NodeWithDist> copy = new PriorityQueue<>(queue);
        List<QueuedEntry> entries = new ArrayList<>();
        while (!copy.isEmpty()) {
            Dijkstra.NodeWithDist entry = copy.poll();
            entries.add(new QueuedEntry(entry.node.getName(), entry.dist,
                    entry.dist != dist.get(entry.node), visited.contains(entry.node)));
        }
        observer.accept(new Step(phase,
                current == null ? null : current.node.getName(),
                current == null ? null : current.dist,
                next == null ? null : current.node.getName() + "-" + next.getName(),
                Map.copyOf(distances), Map.copyOf(previous),
                visited.stream().map(WeightedNode::getName).toList(),
                List.copyOf(entries), List.copyOf(path)));
    }
}
