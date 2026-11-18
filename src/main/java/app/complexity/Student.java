package app.complexity;

import java.util.Objects;

public class Student implements Comparable<Student>
{
    // Tæller kaldene, så vi kan se hvilke metoder TreeSet og HashSet faktisk bruger.
    static int compareToCalls = 0;
    static int equalsCalls = 0;
    static int hashCodeCalls = 0;

    private final int id;
    private final String name;

    public Student(int id, String name)
    {
        this.id = id;
        this.name = name;
    }

    public int getId()
    {
        return id;
    }

    public String getName()
    {
        return name;
    }

    // Alle tre metoder bygger på id, så de er enige om hvornår to studerende er "den samme".
    // Ellers kan TreeSet og HashSet være uenige om, hvorvidt et objekt findes.
    @Override
    public int compareTo(Student other)
    {
        compareToCalls++;
        return Integer.compare(id, other.id);
    }

    @Override
    public boolean equals(Object o)
    {
        equalsCalls++;
        if (this == o)
        {
            return true;
        }
        if (!(o instanceof Student other))
        {
            return false;
        }
        return id == other.id;
    }

    // Lige objekter skal give samme hashCode, ellers leder HashSet i den forkerte bucket.
    @Override
    public int hashCode()
    {
        hashCodeCalls++;
        return Objects.hash(id);
    }

    static void resetCounters()
    {
        compareToCalls = 0;
        equalsCalls = 0;
        hashCodeCalls = 0;
    }

    static String counters()
    {
        return "compareTo: " + compareToCalls + ", equals: " + equalsCalls + ", hashCode: " + hashCodeCalls;
    }

    @Override
    public String toString()
    {
        return id + " " + name;
    }
}
