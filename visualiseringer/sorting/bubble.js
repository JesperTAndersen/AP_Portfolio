/* Ingen DOM her: Bubble Sort som i BubbleSort.java, der gemmer et øjebliksbillede for hvert trin. */
const BubbleSortDemo = (() => {
  const format = item => `${item.name} (${item.price})`;

  function createSteps(input) {
    const products = input.map(item => ({ ...item }));
    const n = products.length;
    const steps = [];
    const passes = [];
    let comparisons = 0, swaps = 0, swapped = false;
    let i = null, j = null;
    // Pladser fra finalFrom og bagud står på deres endelige plads.
    let finalFrom = n;

    function save(phase, message, pair = null, result = null) {
      steps.push({
        phase, message, pair, result, i, j, comparisons, swaps, swapped, finalFrom,
        order: products.map(item => item.name),
        passes: passes.map(pass => ({ ...pass }))
      });
    }

    save('start', `${n} varer. Bubble Sort sammenligner to naboer ad gangen og bytter dem, hvis den venstre er dyrest.`);

    for (i = 0; i < n - 1; i++) {
      swapped = false;
      j = null;
      const pass = { number: i + 1, comparisons: 0, swaps: 0, placed: null };
      passes.push(pass);
      const done = i === 0 ? 'Ingen pladser er færdige endnu' : `De sidste ${i} pladser er allerede færdige`;
      save('pass-start', `Gennemløb ${i + 1} (i = ${i}): swapped = false. ${done}, så j går fra 0 til ${n - 2 - i}: ${n - 1 - i} sammenligninger.`);

      for (j = 0; j < n - 1 - i; j++) {
        comparisons++;
        pass.comparisons++;
        const left = products[j], right = products[j + 1];
        const bigger = left.price > right.price;
        const message = bigger
          ? `${format(left)} > ${format(right)}? Ja: den venstre er dyrest, så de bytter plads.`
          : left.price === right.price
            ? `${format(left)} > ${format(right)}? Nej: samme pris. Testen er > og ikke >=, så de byttes aldrig. Derfor er Bubble Sort stabil.`
            : `${format(left)} > ${format(right)}? Nej: de står rigtigt, intet byt.`;
        save('compare', message, [j, j + 1], bigger);

        if (bigger) {
          products[j] = right;
          products[j + 1] = left;
          swaps++;
          pass.swaps++;
          swapped = true;
          save('swap', `${left.name} og ${right.name} har byttet plads med temp. swapped = true. ${left.name} fortsætter mod højre, så længe den møder billigere varer.`, [j, j + 1], true);
        }
      }

      j = null;
      if (!swapped) {
        finalFrom = 0;
        pass.placed = 'alle';
        save('early-exit', `Gennemløb ${i + 1} byttede intet: alle naboer står i rigtig rækkefølge, så listen er sorteret. break (early exit). I alt ${comparisons} sammenligninger og ${swaps} ombytninger.`);
        return steps;
      }

      finalFrom = n - 1 - i;
      pass.placed = products[finalFrom].name;
      save('pass-end', `Gennemløb ${i + 1} færdigt: ${format(products[finalFrom])} er den dyreste af de ufærdige og er boblet op på plads ${finalFrom}, sin endelige plads. ${pass.swaps} ombytninger, så swapped = true: der skal et gennemløb til.`);
    }

    // Den ydre løkke sluttede uden early exit. Den sidste vare på plads 0 står automatisk rigtigt.
    finalFrom = 0;
    save('done', `Den ydre løkke er færdig (i = ${n - 1}). Den sidste vare på plads 0 står automatisk rigtigt. I alt ${comparisons} sammenligninger og ${swaps} ombytninger.`);
    return steps;
  }

  // "passes" viser kun ét billede pr. gennemløb, så hele forløbet kan ses i få trin.
  function selectSteps(rawSteps, mode = 'all') {
    return rawSteps.flatMap((step, rawIndex) => {
      if (mode === 'passes' && ['pass-start', 'compare', 'swap'].includes(step.phase)) return [];
      return [{ ...step, rawIndex }];
    });
  }

  return { createSteps, selectSteps };
})();

if (typeof module !== 'undefined') module.exports = BubbleSortDemo;
