/* Ingen DOM her: Heap Sort som i HeapSort.java, der gemmer et øjebliksbillede for hvert trin.
   Træet findes kun i indeksformlerne: children af i er 2i + 1 og 2i + 2, parent er (i - 1) / 2. */
const HeapSortDemo = (() => {
  const format = item => `${item.name} (${item.price})`;

  function createSteps(input) {
    const products = input.map(item => ({ ...item }));
    const n = products.length;
    const steps = [];
    let comparisons = 0, swaps = 0, heapSize = n, phase = 0, end = null;

    function save(kind, message, extra = {}) {
      steps.push({
        phase: kind, message, i: null, compareWith: null, largest: null, pair: null, result: null, ...extra,
        stage: phase, heapSize, end, comparisons, swaps,
        order: products.map(item => item.name)
      });
    }
    // Et byt over lang afstand kan sende en vare forbi en anden med samme pris. Det nævnes kun, når de
    // derefter står i modsat rækkefølge af input: det er det, der gør Heap Sort ustabil.
    const inputIndex = new Map(input.map((item, k) => [item.name, k]));
    function jumpNote(a, b) {
      const [from, to] = a < b ? [a, b] : [b, a];
      const goesRight = products[from], goesLeft = products[to];
      const between = products.slice(from + 1, to);
      const note = (moved, other) => ` Langt hop: ${moved.name} springer forbi ${other.name}, som har samme pris, og nu står de i modsat rækkefølge af input. Derfor er Heap Sort ikke stabil.`;
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

    // recursive = kaldt fra heapify selv (varen synker videre), ikke fra en af de to løkker.
    function heapify(size, i, recursive = false) {
      const leftChild = 2 * i + 1, rightChild = 2 * i + 2;
      const children = [leftChild, rightChild].filter(child => child < size);
      const childText = children.length
        ? `children: ${children.map(child => `${format(products[child])} på ${child}`).join(' og ')}`
        : 'ingen children inden for heapen (en leaf)';
      save('heapify', `heapify(i = ${i}): ${format(products[i])}. leftChild = 2·${i} + 1 = ${leftChild}, rightChild = 2·${i} + 2 = ${rightChild}. ${childText}.`, { i, largest: i, recursive });

      let largest = i;
      for (const child of children) {
        comparisons++;
        const bigger = products[child].price > products[largest].price;
        const side = child === leftChild ? 'leftChild' : 'rightChild';
        const before = largest;
        if (bigger) largest = child;
        save('compare', `${side} ${format(products[child])} > ${format(products[before])}? ${bigger ? `Ja: largest = ${child}.` : `Nej: largest bliver ${before}.`}`, { i, compareWith: child, against: before, largest, result: bigger });
      }

      if (largest !== i) {
        const sinking = products[i], rising = products[largest];
        const note = jumpNote(i, largest);
        swap(i, largest);
        save('sink', `${rising.name} er dyrere end ${sinking.name}: byt plads ${i} og ${largest}. ${sinking.name} synker ét niveau ned og fortsætter fra plads ${largest}.${note}`, { i, largest, pair: [i, largest] });
        heapify(size, largest, true);
      } else {
        save('settled', children.length
          ? `${format(products[i])} er dyrere end (eller lig med) sine children: den står rigtigt, heapify stopper.`
          : `${format(products[i])} har ingen children: heapify stopper.`, { i, largest: i });
      }
    }

    save('start', `${n} varer. Heap Sort bygger først en max-heap i arrayet (parent >= children), og tager så den dyreste (root) ud bagerst igen og igen.`);

    // FASE 1: byg max-heapen nedefra og op.
    phase = 1;
    const lastParent = Math.floor(n / 2) - 1;
    save('build-start', `FASE 1: byg max-heapen. Start ved den sidste node med children, i = n / 2 - 1 = ${lastParent}. Pladserne ${lastParent + 1}–${n - 1} er leaves og er allerede små heaps.`);
    for (let i = lastParent; i >= 0; i--) heapify(n, i);
    save('heap-built', `Max-heapen er bygget: hver parent er dyrere end eller lig med sine children, så root ${format(products[0])} er den dyreste. Resten er IKKE sorteret, kun heap-ordnet.`);

    // FASE 2: byt root med sidste, genopret heapen.
    phase = 2;
    for (end = n - 1; end > 0; end--) {
      const root = products[0], last = products[end];
      const note = jumpNote(0, end);
      swap(0, end);
      heapSize = end;
      save('extract', `FASE 2: root ${format(root)} er den dyreste tilbage. Byt den med sidste vare i heapen, ${last.name} på plads ${end}. ${root.name} står nu på sin endelige plads, og heapen er én kortere (0–${end - 1}).${note}`, { pair: [0, end] });
      heapify(end, 0);
      save('heap-restored', `Heapen er genoprettet: ${end === 1 ? 'kun én vare tilbage' : `root er nu ${format(products[0])}, den dyreste af de ${end} der er tilbage`}.`);
    }
    heapSize = 0;
    end = 0;
    save('done', `Færdig. Den sidste vare på plads 0 står automatisk rigtigt. I alt ${comparisons} sammenligninger og ${swaps} ombytninger.`);
    return steps;
  }

  // "overview" viser kun de store skridt: heap bygget, og heapen efter hvert udtag.
  function selectSteps(rawSteps, mode = 'all') {
    return rawSteps.flatMap((step, rawIndex) => {
      if (mode === 'overview' && !['start', 'heap-built', 'extract', 'heap-restored', 'done'].includes(step.phase)) return [];
      return [{ ...step, rawIndex }];
    });
  }

  return { createSteps, selectSteps };
})();

if (typeof module !== 'undefined') module.exports = HeapSortDemo;
