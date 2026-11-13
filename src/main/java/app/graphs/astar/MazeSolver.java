package app.astar;

import java.util.*;

public class MazeSolver
{
    private static final int ROAD = 0;
    private static final int[][] GRID = {
            {0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0},
            {1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0},
            {0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0},
            {0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0},
            {0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0},
            {0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0},
            {0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0},
            {0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0},
            {0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0},
            {0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0},
            {0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0},
    };
    private static final int ROWS = GRID.length;
    private static final int COLS = GRID[0].length;
    private static final int[][] DIRECTIONS = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
    private static final int STEP_COST = 1;

    public static void main(String[] args)
    {
        Map<String, MazeNode> cities = createCities(createGraph());
        MazeNode source = cities.get("Vestby");
        MazeNode destination = cities.get("Østby");

        System.out.println("A* med Manhattan:");
        findShortestPath(source, destination, MazeSolver::manhattan);

        System.out.println("Samme kode med h = 0 (= Dijkstra):");
        findShortestPath(source, destination, MazeSolver::noEstimate);
    }

    public static void findShortestPath(MazeNode source, MazeNode destination, Heuristic heuristic)
    {
        Map<MazeNode, Integer> distances = new HashMap<>();
        Map<MazeNode, MazeNode> prev = new HashMap<>();
        Set<MazeNode> visited = new HashSet<>();
        PriorityQueue<NodeWithCost> queue = new PriorityQueue<>();

        distances.put(source, 0);
        queue.add(new NodeWithCost(source, 0, heuristic.estimate(source, destination)));

        while (!queue.isEmpty())
        {
            NodeWithCost current = queue.poll();

            if (visited.contains(current.node))
            {
                continue;
            }
            visited.add(current.node);

            if (current.node.equals(destination))
            {
                break;
            }

            for (MazeNode next : current.node.getNeighbors())
            {
                if (visited.contains(next))
                {
                    continue;
                }
                int newDistance = current.distance + STEP_COST;

                if (newDistance < distances.getOrDefault(next, Integer.MAX_VALUE))
                {
                    distances.put(next, newDistance);
                    prev.put(next, current.node);
                    int estimate = heuristic.estimate(next, destination);
                    queue.add(new NodeWithCost(next, newDistance, estimate));
                }
            }
        }

        if (!visited.contains(destination))
        {
            System.out.println("Ingen vej fra " + source + " til " + destination);
            return;
        }

        List<MazeNode> path = buildPath(prev, destination);
        System.out.println("Korteste vej: " + path);
        System.out.println("Antal skridt: " + distances.get(destination));
        System.out.println("Udforskede felter: " + visited.size());
    }

    private static List<MazeNode> buildPath(Map<MazeNode, MazeNode> prev, MazeNode destination)
    {
        List<MazeNode> path = new ArrayList<>();
        MazeNode step = destination;
        while (step != null)
        {
            path.add(0, step);
            step = prev.get(step);
        }
        return path;
    }

    // Heuristikken sendes ind, så den samme A* kan køre med forskellige skøn.
    @FunctionalInterface
    interface Heuristic
    {
        int estimate(MazeNode node, MazeNode destination);
    }

    private static int manhattan(MazeNode node, MazeNode destination)
    {
        return Math.abs(destination.getRow() - node.getRow())
                + Math.abs(destination.getCol() - node.getCol());
    }

    // Uden skøn bestemmer g alene rækkefølgen – så er A* præcis Dijkstra.
    private static int noEstimate(MazeNode node, MazeNode destination)
    {
        return 0;
    }

    // Gemmer g, h og f (distance, estimate, total) på indsættelsestidspunktet,
    // så PriorityQueue kan sortere efter f.
    static class NodeWithCost implements Comparable<NodeWithCost>
    {
        MazeNode node;
        int distance;
        int estimate;
        int total;

        public NodeWithCost(MazeNode node, int distance, int estimate)
        {
            this.node = node;
            this.distance = distance;
            this.estimate = estimate;
            this.total = distance + estimate;
        }

        // I et grid har mange felter samme f(total). Lavest h(skøn) først (tættest på målet),
        // derefter række og kolonne, så rækkefølgen er fast og den samme som i JS.
        @Override
        public int compareTo(NodeWithCost other)
        {
            if (total != other.total)
            {
                return Integer.compare(total, other.total);
            }
            if (estimate != other.estimate)
            {
                return Integer.compare(estimate, other.estimate);
            }
            if (node.getRow() != other.node.getRow())
            {
                return Integer.compare(node.getRow(), other.node.getRow());
            }
            return Integer.compare(node.getCol(), other.node.getCol());
        }
    }

    public static MazeNode[][] createGraph()
    {
        MazeNode[][] nodes = new MazeNode[ROWS][COLS];
        for (int row = 0; row < ROWS; row++)
        {
            for (int col = 0; col < COLS; col++)
            {
                if (isRoad(row, col))
                {
                    nodes[row][col] = new MazeNode(row, col);
                }
            }
        }

        // Urettede veje: hver vej-celle forbindes med de vej-celler, den grænser op til.
        for (int row = 0; row < ROWS; row++)
        {
            for (int col = 0; col < COLS; col++)
            {
                if (!isRoad(row, col))
                {
                    continue;
                }

                for (int[] direction : DIRECTIONS)
                {
                    int neighborRow = row + direction[0];
                    int neighborCol = col + direction[1];

                    if (isRoad(neighborRow, neighborCol))
                    {
                        nodes[row][col].addNeighbor(nodes[neighborRow][neighborCol]);
                    }
                }
            }
        }
        return nodes;
    }

    private static boolean isRoad(int row, int col)
    {
        return row >= 0 && row < ROWS && col >= 0 && col < COLS && GRID[row][col] == ROAD;
    }

    public static Map<String, MazeNode> createCities(MazeNode[][] nodes)
    {
        Map<String, MazeNode> cities = new HashMap<>();
        cities.put("Nordby", nodes[0][6]);
        cities.put("Østby", nodes[6][10]);
        cities.put("Vestby", nodes[4][0]);
        cities.put("Sydby", nodes[10][4]);
        return cities;
    }
}
