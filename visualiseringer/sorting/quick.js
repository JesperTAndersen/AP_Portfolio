/* Ingen DOM her: Quick Sort (Lomuto) som i QuickSort.java, der gemmer et øjebliksbillede for hvert trin. */
const QuickSortDemo = (() => {
  const format = item => `${item.name} (${item.price})`;

  // God = så lige som muligt (højst 1 i forskel). Tjekkes først: 2 varer kan kun deles 1 · 0, og det er perfekt.
  // Dårlig = den ene side er tom, selvom en bedre deling var mulig.
  function rateSplit(left, right) {
    if (Math.abs(left - right) <= 1) return 'god';
    if (left === 0 || right === 0) return 'dårlig';
    return 'ok';
  }

  // pivotRule: 'last' = QuickSort.sort(), 'median' = QuickSort.sortMedianOfThree().
  function createSteps(input, pivotRule = 'last') {
    const products = input.map(item => ({ ...item }));
    const n = products.length;
    const steps = [];
    const stack = [];
    const partitions = [];
    const finals = new Set();
    let comparisons = 0, swaps = 0, maxDepth = 0;
    let range = null, i = null, j = null, pivotIndex = null, candidates = null;

    function save(phase, message, extra = {}) {
      steps.push({
        phase, message, pair: null, result: null, which: null, ...extra,
        order: products.map(item => item.name),
        range: range && [...range], i, j, pivotIndex, candidates: candidates && [...candidates],
        finals: [...finals].sort((a, b) => a - b), comparisons, swaps, maxDepth,
        stack: stack.map(frame => ({ ...frame })),
        partitions: partitions.map(part => ({ ...part }))
      });
    }
    // Et byt over lang afstand kan sende en vare forbi en anden med samme pris. Det nævnes kun, når de
    // derefter står i modsat rækkefølge af input: det er det, der gør Quick Sort ustabil.
    const inputIndex = new Map(input.map((item, k) => [item.name, k]));
    function jumpNote(a, b) {
      const [from, to] = a < b ? [a, b] : [b, a];
      const goesRight = products[from], goesLeft = products[to];
      const between = products.slice(from + 1, to);
      const note = (moved, other) => ` Langt hop: ${moved.name} springer forbi ${other.name}, som har samme pris, og nu står de i modsat rækkefølge af input. Derfor er Quick Sort ikke stabil.`;
      for (const other of [...between, goesLeft]) {
        if (other.price === goesRight.price && inputIndex.get(goesRight.name) < inputIndex.get(other.name)) return note(goesRight, other);
      }
      for (const other of between) {
        if (other.price === goesLeft.price && inputIndex.get(goesLeft.name) > inputIndex.get(other.name)) return note(goesLeft, other);
      }
      return '';
    }

    function swap(a, b) {
      const temp = products[a];
      products[a] = products[b];
      products[b] = temp;
      swaps++;
    }

    function moveMedianToEnd(low, high) {
      const middle = low + Math.floor((high - low) / 2);
      candidates = [low, middle, high];
      save('median-start', `Median af tre: kig på første ${format(products[low])}, midterste ${format(products[middle])} (plads ${middle}) og sidste ${format(products[high])}.`);

      const checks = [[low, middle, 'low <= middle'], [low, high, 'low er den mindste'], [middle, high, 'middle <= high']];
      checks.forEach(([a, b, goal], which) => {
        comparisons++;
        const smaller = products[b].price < products[a].price;
        const question = `${format(products[b])} < ${format(products[a])}?`;
        const note = smaller ? jumpNote(a, b) : '';
        if (smaller) swap(a, b);
        save('median-compare', smaller
          ? `${question} Ja: byt plads ${a} og ${b}. Nu gælder ${goal}.${note}`
          : `${question} Nej: intet byt. ${goal[0].toUpperCase() + goal.slice(1)} i forvejen.`, { pair: smaller ? [a, b] : null, result: smaller, which });
      });

      const median = products[middle];
      const note = jumpNote(middle, high);
      swap(middle, high);
      save('median-move', `De tre står nu sorteret, så medianen ${format(median)} står i midten. Den byttes ud på plads ${high}, hvor partition() forventer pivot.${note}`, { pair: [middle, high] });
      candidates = null;
    }

    function partition(low, high) {
      pivotIndex = high;
      const pivot = products[high];
      i = low - 1;
      j = null;
      save('pivot', `Pivot = ${format(pivot)} på plads ${high}. i = low - 1 = ${i}: "<= pivot"-området er tomt endnu.`);

      for (j = low; j < high; j++) {
        comparisons++;
        const item = products[j];
        const small = item.price <= pivot.price;
        save('compare', small
          ? `${format(item)} <= ${pivot.price}? Ja: den skal ind i "<= pivot"-området. Først rykker i én frem, så byttes der.`
          : `${format(item)} <= ${pivot.price}? Nej: i bliver stående på ${i}, kun j rykker videre. ${item.name} bliver i "> pivot"-området.`, { result: small });
        if (small) {
          // i rykker KUN frem, når j har fundet en vare <= pivot. Den nye plads i er der, varen skal hen.
          i++;
          const self = i === j;
          save('advance-i', self
            ? `i++: i rykker én frem til plads ${i}. i og j står samme sted, fordi der endnu ikke er nogen vare > pivot imellem dem.`
            : `i++: i rykker én frem til plads ${i}. Der står ${format(products[i])}, den første vare i "> pivot"-området. Den byttes ud, så ${item.name} kan komme ind.`);
          const outName = products[i].name;
          const note = jumpNote(i, j);
          swap(i, j);
          save('swap', self
            ? `swap(${i}, ${j}): samme plads, så ${item.name} byttes med sig selv. Lomuto tæller det som en ombytning. "<= pivot"-området er nu plads ${low}–${i}.`
            : `swap(${i}, ${j}): ${item.name} ind i "<= pivot"-området, ${outName} ud bagerst i "> pivot"-området.${note}`, { pair: [i, j] });
        }
      }

      j = null;
      const place = i + 1;
      const note = jumpNote(place, high);
      swap(place, high);
      pivotIndex = place;
      finals.add(place);
      const left = place - low, right = high - place;
      const verdict = rateSplit(left, right);
      partitions.push({ low, high, pivot: pivot.name, price: pivot.price, left, right, verdict });
      const verdictText = {
        god: ' God pivot: området er delt så lige som muligt.',
        dårlig: ' Dårlig pivot: den ene side er tom, så kun pivot blev løst.',
        ok: ''
      }[verdict];
      save('place-pivot', `Pivot ${pivot.name} byttes ind på plads ${place} (i + 1) og står nu på sin endelige plads. ${left} til venstre (billigere eller lige), ${right} til højre (dyrere).${verdictText}${note}`, { pair: [place, high] });
      return place;
    }

    function quickSort(low, high, side) {
      stack.push({ low, high, pivot: null, doing: low >= high ? 'base case' : 'partition' });
      maxDepth = Math.max(maxDepth, stack.length);
      range = [low, high];
      i = j = pivotIndex = null;

      if (low >= high) {
        if (low === high) finals.add(low);
        save('base', low === high
          ? `quickSort(${low}, ${high}): kun én vare, ${format(products[low])}. Base case: den står allerede rigtigt.`
          : `quickSort(${low}, ${high}): tomt område (low > high). Base case: return med det samme.`, { side });
        stack.pop();
        return;
      }

      const sideText = side === 'left' ? 'venstre side af forrige pivot' : side === 'right' ? 'højre side af forrige pivot' : 'hele listen';
      save('call', `quickSort(${low}, ${high}): ${high - low + 1} varer (${sideText}) skal sorteres.`, { side });
      if (pivotRule === 'median') moveMedianToEnd(low, high);
      const place = partition(low, high);

      const frame = stack.at(-1);
      frame.pivot = place;
      frame.doing = 'venter på venstre side';
      quickSort(low, place - 1, 'left');
      frame.doing = 'venter på højre side';
      quickSort(place + 1, high, 'right');
      stack.pop();
    }

    range = null;
    save('start', `${n} varer. Quick Sort vælger en pivot, flytter billigere varer til venstre og dyrere til højre, og sorterer så hver side for sig.`);
    quickSort(0, n - 1, 'root');
    range = null; i = j = pivotIndex = null;
    for (let k = 0; k < n; k++) finals.add(k);
    save('done', `Alle kald er færdige. I alt ${comparisons} sammenligninger, ${swaps} ombytninger og ${partitions.length} partitioner. Største rekursionsdybde: ${maxDepth}.`);
    return steps;
  }

  // "partitions" viser kun resultatet af hver partition, så man ser pivotvalgene på få trin.
  function selectSteps(rawSteps, mode = 'all') {
    return rawSteps.flatMap((step, rawIndex) => {
      if (mode === 'partitions' && !['start', 'place-pivot', 'done'].includes(step.phase)) return [];
      return [{ ...step, rawIndex }];
    });
  }

  return { createSteps, selectSteps };
})();

if (typeof module !== 'undefined') module.exports = QuickSortDemo;
