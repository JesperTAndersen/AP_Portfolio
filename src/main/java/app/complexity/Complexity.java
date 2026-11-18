package app.complexity;

import java.util.*;

public class Complexity
{
    private static final int SIZE = 500_000;
    private static final int MIDDLE = 250_000;
    private static final int STUDENTS = 100_000;
    private static final int RUNS = 5;

    public static void main(String[] args)
    {
        compareLists();
        compareSearch();
        compareSets();
        compareQueues();
    }

    // ---------- ArrayList vs LinkedList ----------

    private static void compareLists()
    {
        System.out.println("- ArrayList vs LinkedList (" + SIZE + " elementer, tid i ms pr. kørsel) - ");
        List<Integer> arrayList = new ArrayList<>();
        List<Integer> linkedList = new LinkedList<>();
        fill(arrayList);
        fill(linkedList);

        // Samme metode til begge, fordi begge implementerer List.
        testList("ArrayList", arrayList);
        testList("LinkedList", linkedList);
        System.out.println();
    }

    private static void testList(String name, List<Integer> list)
    {
        System.out.println(name);
        for (int run = 1; run <= RUNS; run++)
        {
            // ArrayList hopper direkte til index: O(1). LinkedList går node for node: O(n).
            long start = System.nanoTime();
            list.get(MIDDLE);
            long getTime = System.nanoTime() - start;

            // ArrayList rykker alle efterfølgende elementer: O(n).
            // LinkedList sætter bare pointere om, men skal først finde pladsen: O(n).
            start = System.nanoTime();
            list.add(MIDDLE, 99);
            long addTime = System.nanoTime() - start;

            start = System.nanoTime();
            list.remove(MIDDLE);
            long removeTime = System.nanoTime() - start;

            // LinkedList kender head, så forrest er O(1). ArrayList rykker hele listen: O(n) hver gang.
            start = System.nanoTime();
            for (int i = 0; i < 10_000; i++)
            {
                list.add(0, 99);
            }
            long addFrontTime = System.nanoTime() - start;

            System.out.printf("  kørsel %d:  get %.3f   add %.3f   remove %.3f   add(0) x 10.000 %.3f%n",
                    run, ms(getTime), ms(addTime), ms(removeTime), ms(addFrontTime));
        }
    }

    // ---------- Søgning: List vs HashSet ----------

    private static void compareSearch()
    {
        System.out.println("- Contains: ArrayList vs HashSet (" + SIZE + " elementer, 100 kald, tid i ms) -");
        List<Integer> list = new ArrayList<>();
        Set<Integer> set = new HashSet<>();
        fill(list);
        fill(set);

        // Samme metode til begge, fordi både List og Set er en Collection med contains().
        testContains("ArrayList", list);
        testContains("HashSet", set);
        System.out.println();
    }

    private static void testContains(String name, Collection<Integer> data)
    {
        int first = 0;
        int last = SIZE - 1;
        int missing = -1;

        System.out.println(name);
        for (int run = 1; run <= RUNS; run++)
        {
            // ArrayList itererer fra starten: O(n), og et element der ikke findes er worst case.
            // HashSet regner bucketen ud med hashCode(): O(1) uanset hvor elementet "ligger".
            long start = System.nanoTime();
            for (int i = 0; i < 100; i++)
            {
                data.contains(first);
            }
            long firstTime = System.nanoTime() - start;

            start = System.nanoTime();
            for (int i = 0; i < 100; i++)
            {
                data.contains(last);
            }
            long lastTime = System.nanoTime() - start;

            start = System.nanoTime();
            for (int i = 0; i < 100; i++)
            {
                data.contains(missing);
            }
            long missingTime = System.nanoTime() - start;

            System.out.printf("  kørsel %d:  forrest %.3f   bagerst %.3f   findes ikke %.3f%n",
                    run, ms(firstTime), ms(lastTime), ms(missingTime));
        }
    }

    // ---------- TreeSet vs HashSet med egen entitetsklasse ----------

    private static void compareSets()
    {
        System.out.println("- TreeSet vs HashSet med Student -");
        countCalls("TreeSet", new TreeSet<>());
        countCalls("HashSet", new HashSet<>());
        System.out.println();

        System.out.println(STUDENTS + " studerende, tid i ms pr. kørsel");
        testSet("TreeSet", new TreeSet<>());
        testSet("HashSet", new HashSet<>());
        System.out.println();
    }

    // TreeSet: compareTo() én gang pr. skridt ned gennem træet, og hvert skridt halverer resten: O(log n).
    // HashSet: hashCode() finder bucketen, equals() finder objektet i den: O(1) i gennemsnit.
    // Viser hvilke metoder hver struktur kalder - og hvor mange gange - for ét add, contains og remove.
    private static void countCalls(String name, Set<Student> set)
    {
        for (int id = 0; id < STUDENTS; id++)
        {
            set.add(new Student(id, "Student " + id));
        }
        System.out.println(name + " med " + set.size() + " studerende:");

        Student.resetCounters();
        set.add(new Student(STUDENTS, "Ny"));
        System.out.println("  add       -> " + Student.counters());

        // Et nyt objekt med samme id: det skal findes via compareTo eller hashCode + equals.
        Student.resetCounters();
        boolean found = set.contains(new Student(42, "Kopi"));
        System.out.println("  contains  -> " + Student.counters() + "  (fundet: " + found + ")");

        Student.resetCounters();
        set.remove(new Student(42, "Kopi"));
        System.out.println("  remove    -> " + Student.counters());
    }

    private static void testSet(String name, Set<Student> set)
    {
        System.out.println(name);
        for (int run = 1; run <= RUNS; run++)
        {
            long start = System.nanoTime();
            for (int id = 0; id < STUDENTS; id++)
            {
                set.add(new Student(id, "Student " + id));
            }
            long addTime = System.nanoTime() - start;

            // Nye objekter med samme id, så sættet skal bruge compareTo eller hashCode + equals.
            start = System.nanoTime();
            for (int id = 0; id < STUDENTS; id++)
            {
                set.contains(new Student(id, "Kopi"));
            }
            long containsTime = System.nanoTime() - start;

            // Bagefter er sættet tomt igen, klar til næste kørsel.
            start = System.nanoTime();
            for (int id = 0; id < STUDENTS; id++)
            {
                set.remove(new Student(id, "Kopi"));
            }
            long removeTime = System.nanoTime() - start;

            System.out.printf("  kørsel %d:  add %.3f   contains %.3f   remove %.3f%n",
                    run, ms(addTime), ms(containsTime), ms(removeTime));
        }
    }

    // ---------- PriorityQueue og ArrayDeque ----------

    private static void compareQueues()
    {
        System.out.println("- PriorityQueue og ArrayDeque -");
        int[] numbers = {5, 1, 4, 2, 3};
        System.out.println("Sætter ind i rækkefølgen " + Arrays.toString(numbers));

        PriorityQueue<Integer> priorityQueue = new PriorityQueue<>();

        Queue<Integer> queue = new ArrayDeque<>();// som Queue kan den offer/poll (FIFO)
        Deque<Integer> stack = new ArrayDeque<>();// som Deque kan den push/pop (LIFO)

        for (int number : numbers)
        {
            priorityQueue.offer(number);
            queue.offer(number);   // ind bagerst
            stack.push(number);    // ind forrest
        }

        // PriorityQueue: mindste først (heap). Kø: ældste først (FIFO). Stak: nyeste først (LIFO).
        System.out.print("  PriorityQueue poll(): ");
        while (!priorityQueue.isEmpty())
        {
            System.out.print(priorityQueue.poll() + " ");
        }

        System.out.print("\n  ArrayDeque    poll(): ");
        while (!queue.isEmpty())
        {
            System.out.print(queue.poll() + " ");
        }

        System.out.print("\n  ArrayDeque    pop():  ");
        while (!stack.isEmpty())
        {
            System.out.print(stack.pop() + " ");
        }
        System.out.println();
    }

    // ---------- Hjælpemetoder ----------

    private static void fill(Collection<Integer> collection)
    {
        for (int i = 0; i < SIZE; i++)
        {
            collection.add(i);
        }
    }

    private static double ms(long nanos)
    {
        return nanos / 1_000_000.0;
    }
}
