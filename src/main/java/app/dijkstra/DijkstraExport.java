package app.dijkstra;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/** Eksporterer Java-beregninger til browseren. Ingen JavaScript-algoritme bruges her. */
public class DijkstraExport {
    public static void main(String[] args) throws IOException {
        Map<String, WeightedNode> cities = Dijkstra.createGraph();
        List<Map<String, Object>> edges = new ArrayList<>();
        for (WeightedNode node : cities.values()) {
            node.getNeighbors().forEach((next, weight) -> edges.add(Map.of(
                    "id", node.getName() + "-" + next.getName(),
                    "from", node.getName(), "to", next.getName(), "weight", weight)));
        }

        // Alle start/mål-par gør dropdowns brugbare uden en server.
        Map<String, Object> runs = new LinkedHashMap<>();
        for (var source : cities.entrySet()) {
            for (var target : cities.entrySet()) {
                List<Object> steps = new ArrayList<>();
                Dijkstra.findShortestPath(source.getValue(), target.getValue(), step -> steps.add(toData(step)));
                runs.put(source.getKey() + "-" + target.getKey(), steps);
            }
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("nodes", new ArrayList<>(cities.keySet()));
        data.put("edges", edges);
        data.put("runs", runs);
        Path output = Path.of(args.length > 0 ? args[0] : "visualiseringer/dijkstra/java-data.js");
        if (output.toAbsolutePath().getParent() != null) Files.createDirectories(output.toAbsolutePath().getParent());
        Files.writeString(output, "globalThis.DijkstraJavaData = " + json(data) + ";\n", StandardCharsets.UTF_8);
        System.out.println("Eksporteret " + runs.size() + " Java-forløb til " + output);
    }

    private static Map<String, Object> toData(DijkstraTrace.Step step) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("phase", step.phase());
        data.put("current", step.current());
        data.put("currentDistance", step.currentDistance());
        data.put("edge", step.edge());
        data.put("distances", step.distances());
        data.put("previous", step.previous());
        data.put("visited", step.visited());
        data.put("path", step.path());
        data.put("queue", step.queue().stream().map(entry -> Map.of(
                "node", entry.node(), "distance", entry.distance(),
                "stale", entry.stale(), "visited", entry.visited())).toList());
        return data;
    }

    // Lille JSON-skriver til eksportens maps/lister, så der ikke kræves ekstra biblioteker.
    private static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof String text) return quote(text);
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        if (value instanceof Map<?, ?> map) {
            StringJoiner result = new StringJoiner(",", "{", "}");
            map.forEach((key, item) -> result.add(quote(key.toString()) + ":" + json(item)));
            return result.toString();
        }
        if (value instanceof Iterable<?> items) {
            StringJoiner result = new StringJoiner(",", "[", "]");
            items.forEach(item -> result.add(json(item)));
            return result.toString();
        }
        throw new IllegalArgumentException("Ukendt JSON-type: " + value.getClass());
    }

    private static String quote(String text) {
        StringBuilder result = new StringBuilder("\"");
        for (char character : text.toCharArray()) {
            switch (character) {
                case '"' -> result.append("\\\"");
                case '\\' -> result.append("\\\\");
                default -> {
                    if (character < 32 || character == '<' || character == '\u2028' || character == '\u2029') {
                        result.append(String.format("\\u%04x", (int) character));
                    } else result.append(character);
                }
            }
        }
        return result.append('"').toString();
    }
}
