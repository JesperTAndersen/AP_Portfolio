/* Ingen DOM her: Merge Sort som i MergeSort.java, der gemmer et øjebliksbillede for hvert trin.
   Java laver nye arrays left/right i hvert kald. Her vises hvert kald som det område [lo, hi) af den
   oprindelige liste, som dets array svarer til: left er altid første halvdel, right anden. */
const MergeSortDemo = (() => {
  const format = item => `${item.name} (${item.price})`;
  const names = items => `[${items.map(item => item.name).join(', ')}]`;

  function createSteps(input) {
    const products = input.map(item => ({ ...item }));
    const n = products.length;
    const steps = [];
    const stack = [];
    // Færdige kald: område → den sorterede rækkefølge da kaldet returnerede.
    const done = new Map();
    let comparisons = 0;
    // merge = { lo, mid, hi, left, right, leftIndex, rightIndex, resultIndex } mens der flettes.
    let merge = null;

    const key = (lo, hi) => `${lo}-${hi}`;
    // Hele opdelingstræet kendes på forhånd: det afhænger kun af længden, ikke af værdierne.
    const nodes = [];
    (function build(lo, hi, depth) {
      nodes.push({ lo, hi, depth, key: key(lo, hi) });
      if (hi - lo < 2) return;
      const mid = lo + Math.floor((hi - lo) / 2);
      build(lo, mid, depth + 1);
      build(mid, hi, depth + 1);
    })(0, n, 0);

    function snapshotOrder() {
      const order = products.map(item => item.name);
      // Under fletning er pladserne fra resultIndex og frem endnu ikke skrevet: varerne ligger i left/right.
      if (merge) for (let k = merge.lo + merge.resultIndex; k < merge.hi; k++) order[k] = null;
      return order;
    }

    function save(phase, message, extra = {}) {
      steps.push({
        phase, message, side: null, take: null, result: null, ...extra,
        order: snapshotOrder(), comparisons,
        stack: stack.map(frame => ({ ...frame })),
        done: Object.fromEntries(done),
        merge: merge && {
          ...merge,
          left: merge.left.map(item => item.name),
          right: merge.right.map(item => item.name)
        }
      });
    }

    function mergeSort(lo, hi, side) {
      const range = products.slice(lo, hi);
      stack.push({ lo, hi, doing: hi - lo < 2 ? 'base case' : 'del' });

      if (hi - lo < 2) {
        done.set(key(lo, hi), range.map(item => item.name));
        save('base', `mergeSort(${names(range)}): ${hi - lo} vare. Base case: 0 eller 1 vare er allerede sorteret, return.`, { side });
        stack.pop();
        return;
      }

      const sideText = side === 'left' ? 'venstre halvdel' : side === 'right' ? 'højre halvdel' : 'hele listen';
      save('call', `mergeSort(${names(range)}): ${hi - lo} varer (${sideText}).`, { side });

      // 1. DEL
      const mid = lo + Math.floor((hi - lo) / 2);
      save('split', `1. DEL: middle = ${hi - lo} / 2 = ${mid - lo}. ${names(products.slice(lo, mid))} kopieres til left og ${names(products.slice(mid, hi))} til right.`, { mid });

      // 2. LØS REKURSIVT: venstre gøres helt færdig, før højre overhovedet bliver kaldt.
      const frame = stack.at(-1);
      frame.doing = 'venter på left';
      mergeSort(lo, mid, 'left');
      frame.doing = 'venter på right';
      mergeSort(mid, hi, 'right');

      // 3. KOMBINÉR (FLET)
      frame.doing = 'fletter';
      merge = { lo, mid, hi, left: products.slice(lo, mid), right: products.slice(mid, hi), leftIndex: 0, rightIndex: 0, resultIndex: 0 };
      save('merge-start', `3. KOMBINÉR: begge halvdele er sorteret: left ${names(merge.left)} og right ${names(merge.right)}. Flet dem ved altid at sammenligne de to forreste.`);

      while (merge.leftIndex < merge.left.length && merge.rightIndex < merge.right.length) {
        comparisons++;
        const a = merge.left[merge.leftIndex], b = merge.right[merge.rightIndex];
        const takeLeft = a.price <= b.price;
        const chosen = takeLeft ? a : b;
        products[lo + merge.resultIndex] = chosen;
        if (takeLeft) merge.leftIndex++; else merge.rightIndex++;
        merge.resultIndex++;
        const why = takeLeft
          ? a.price === b.price
            ? `Ja, samme pris: <= tager den fra left, ${a.name}, som stod først. Det er det, der gør Merge Sort stabil.`
            : `Ja: ${a.name} fra left er billigst.`
          : `Nej: ${b.name} fra right er billigst.`;
        save('merge-compare', `${format(a)} <= ${format(b)}? ${why} ${chosen.name} skrives på næste plads i result.`, { take: takeLeft ? 'left' : 'right', result: takeLeft });
      }

      // Den ene halvdel er tom: resten af den anden er allerede sorteret og kopieres uden sammenligning.
      const restSide = merge.leftIndex < merge.left.length ? 'left' : 'right';
      while (merge.leftIndex < merge.left.length || merge.rightIndex < merge.right.length) {
        const fromLeft = merge.leftIndex < merge.left.length;
        const item = fromLeft ? merge.left[merge.leftIndex] : merge.right[merge.rightIndex];
        products[lo + merge.resultIndex] = item;
        if (fromLeft) merge.leftIndex++; else merge.rightIndex++;
        merge.resultIndex++;
        const empty = restSide === 'left' ? 'right' : 'left';
        save('merge-rest', `${empty} er tom, så ${item.name} kopieres fra ${restSide} uden sammenligning. Resten af ${restSide} er allerede sorteret.`, { take: restSide });
      }

      const merged = products.slice(lo, hi);
      merge = null;
      done.set(key(lo, hi), merged.map(item => item.name));
      frame.doing = 'færdig';
      save('merge-done', `Flettet: ${names(merged)} er sorteret.${hi - lo === n ? '' : ' Kaldet returnerer til det kald, der venter.'}`);
      stack.pop();
    }

    save('start', `${n} varer. Merge Sort deler listen i to, sorterer hver halvdel rekursivt og fletter de to sorterede halvdele sammen.`);
    mergeSort(0, n, 'root');
    save('done', `Færdig. I alt ${comparisons} sammenligninger, alle i fletningerne. Delingen sammenligner ingenting.`);
    return Object.assign(steps, { nodes });
  }

  // "overview" viser kun kald og færdige fletninger, så rækkefølgen (venstre før højre) står tydeligt.
  function selectSteps(rawSteps, mode = 'all') {
    return rawSteps.flatMap((step, rawIndex) => {
      if (mode === 'overview' && !['start', 'call', 'base', 'merge-done', 'done'].includes(step.phase)) return [];
      return [{ ...step, rawIndex }];
    });
  }

  return { createSteps, selectSteps };
})();

if (typeof module !== 'undefined') module.exports = MergeSortDemo;
