package app.algorithms.backtracking.maze;

public class MazeExercise
{
    static final int N = 6;
    static int[][] maze = {
            {1, 0, 1, 1, 1, 0},
            {1, 1, 1, 0, 1, 0},
            {0, 0, 1, 0, 1, 1},
            {0, 1, 1, 1, 0, 1},
            {0, 1, 0, 0, 0, 1},
            {0, 1, 1, 1, 1, 1}
    };
    static int[][] path = new int[N][N];
    private static final int[][] DIRECTIONS = {{1, 0}, {0, 1}, {-1, 0}, {0, -1}};

    public static void main(String[] args)
    {
        if (solveMaze(0, 0))
        {
            printPath();
        }
        else
        {
            System.out.println("Ingen løsning fundet.");
        }
    }

    static boolean solveMaze(int row, int col)
    {
        if (canMove(row, col))
        {
            path[row][col] = 1; //marker sti

            if (row == N - 1 && col == N - 1) return true; // mål tjek

            for (int[] direction : DIRECTIONS)
            {
                int neighborRow = row + direction[0];
                int neighborCol = col + direction[1];

                if (solveMaze(neighborRow, neighborCol)) return true;
            }

            path[row][col] = 0;
            return false;
        }

        return false;
    }

    static boolean canMove(int row, int col)
    {
        if (row < 0 || row >= N || col < 0 || col >= N) return false; //outOfBounds

        if (maze[row][col] == 0) return false; //mur

        if (path[row][col] != 0) return false; //er i path

        return true;
    }

    static void printPath()
    {
        for (int i = 0; i < N; i++)
        {
            for (int j = 0; j < N; j++)
            {
                System.out.print(path[i][j] + " ");
            }
            System.out.println();
        }
    }
}
