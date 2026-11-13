package app.astar;

import java.util.HashSet;
import java.util.Set;

public class MazeNode
{
    private final int row;
    private final int col;
    private final Set<MazeNode> neighbors;

    public MazeNode(int row, int col)
    {
        this.row = row;
        this.col = col;
        this.neighbors = new HashSet<>();
    }

    public int getRow()
    {
        return row;
    }

    public int getCol()
    {
        return col;
    }

    public Set<MazeNode> getNeighbors()
    {
        return neighbors;
    }

    public void addNeighbor(MazeNode neighbor)
    {
        neighbors.add(neighbor);
    }

    @Override
    public String toString()
    {
        return "(" + row + "," + col + ")";
    }
}
