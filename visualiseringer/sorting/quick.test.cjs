const { test } = require('node:test');
const assert = require('node:assert/strict');
const { datasets, equalPriceGroups } = require('./products.js');
const { createSteps, selectSteps } = require('./quick.js');

const priceOf = (products, name) => products.find(item => item.name === name).price;

// Tallene og rækkefølgerne er kørt i Java med QuickSort.sort() og QuickSort.sortMedianOfThree().
const javaResults = {
  last: {
    random: [21, 18, ['Sokker', 'Kasket', 'T-shirt', 'Bælte', 'Skjorte', 'Sweater', 'Hoodie', 'Bukser', 'Jakke', 'Sko']],
    sorted: [45, 54, ['Sokker', 'Kasket', 'T-shirt', 'Bælte', 'Skjorte', 'Hoodie', 'Sweater', 'Bukser', 'Jakke', 'Sko']],
    reversed: [39, 24, ['Sokker', 'Kasket', 'Bælte', 'T-shirt', 'Skjorte', 'Hoodie', 'Sweater', 'Bukser', 'Jakke', 'Sko']],
    small: [8, 6, ['Kasket', 'T-shirt', 'Sweater', 'Hoodie', 'Jakke']]
  },
  median: {
    random: [38, 28, ['Sokker', 'Kasket', 'Bælte', 'T-shirt', 'Skjorte', 'Sweater', 'Hoodie', 'Bukser', 'Jakke', 'Sko']],
    sorted: [37, 21, ['Sokker', 'Kasket', 'Bælte', 'T-shirt', 'Skjorte', 'Sweater', 'Hoodie', 'Bukser', 'Jakke', 'Sko']],
    reversed: [35, 28, ['Sokker', 'Kasket', 'T-shirt', 'Bælte', 'Skjorte', 'Sweater', 'Hoodie', 'Bukser', 'Jakke', 'Sko']],
    small: [12, 9, ['Kasket', 'T-shirt', 'Hoodie', 'Sweater', 'Jakke']]
  }
};

test('tællinger og slutrækkefølge er de samme som QuickSort.java', () => {
  for (const [rule, results] of Object.entries(javaResults)) {
    for (const [key, [comparisons, swaps, order]] of Object.entries(results)) {
      const last = createSteps(datasets[key].products, rule).at(-1);
      assert.equal(last.comparisons, comparisons, `${rule} ${key}: sammenligninger`);
      assert.equal(last.swaps, swaps, `${rule} ${key}: ombytninger`);
      assert.deepEqual(last.order, order, `${rule} ${key}: rækkefølge`);
    }
  }
});

test('efter hver partition står pivot rigtigt: billigere eller lige til venstre, dyrere til højre', () => {
  for (const rule of ['last', 'median']) {
    for (const { products } of Object.values(datasets)) {
      for (const step of createSteps(products, rule)) {
        if (step.phase !== 'place-pivot') continue;
        const [low, high] = step.range;
        const pivot = priceOf(products, step.order[step.pivotIndex]);
        for (let k = low; k < step.pivotIndex; k++) assert.ok(priceOf(products, step.order[k]) <= pivot);
        for (let k = step.pivotIndex + 1; k <= high; k++) assert.ok(priceOf(products, step.order[k]) > pivot);
      }
    }
  }
});

test('pivot = sidste element giver den dårligste deling på sorteret input', () => {
  const parts = createSteps(datasets.sorted.products, 'last').at(-1).partitions;
  for (const part of parts) assert.equal(part.right, 0, 'pivot er altid den dyreste');
  assert.equal(parts.length, 9);
  const median = createSteps(datasets.sorted.products, 'median').at(-1);
  assert.deepEqual([median.partitions[0].left, median.partitions[0].right], [4, 5]);
  assert.ok(median.maxDepth < createSteps(datasets.sorted.products, 'last').at(-1).maxDepth);
});

test('i rykker kun én frem efter et ja, og ellers står i stille mens j går videre', () => {
  for (const rule of ['last', 'median']) {
    for (const { products } of Object.values(datasets)) {
      const steps = createSteps(products, rule);
      steps.forEach((step, k) => {
        if (step.phase !== 'compare') return;
        const next = steps[k + 1];
        if (step.result) {
          assert.equal(next.phase, 'advance-i');
          assert.equal(next.i, step.i + 1);
          assert.equal(steps[k + 2].phase, 'swap');
          assert.deepEqual(steps[k + 2].pair, [next.i, step.j]);
        } else {
          assert.notEqual(next.phase, 'advance-i');
          if (next.phase === 'compare') assert.equal(next.i, step.i);
        }
      });
    }
  }
});

test('vurdering: så lige som muligt er god, også 1 · 0 for to varer; tom side ellers dårlig', () => {
  for (const rule of ['last', 'median']) {
    for (const { products } of Object.values(datasets)) {
      for (const part of createSteps(products, rule).at(-1).partitions) {
        const expected = Math.abs(part.left - part.right) <= 1 ? 'god'
          : part.left === 0 || part.right === 0 ? 'dårlig' : 'ok';
        assert.equal(part.verdict, expected, `${part.low}–${part.high}: ${part.left} · ${part.right}`);
      }
    }
  }
  const sorted = createSteps(datasets.sorted.products, 'last').at(-1).partitions;
  assert.equal(sorted.at(-1).verdict, 'god', 'sidste kald har 2 varer: 1 · 0 er bedst mulige');
  assert.equal(sorted[0].verdict, 'dårlig', 'første kald: 9 · 0');
});

test('tilfældig: første pivot er Skjorte, som deler 4 · 5', () => {
  const first = createSteps(datasets.random.products, 'last').at(-1).partitions[0];
  assert.deepEqual([first.pivot, first.left, first.right], ['Skjorte', 4, 5]);
});

test('ikke stabil: Sweater ender før Hoodie på det tilfældige datasæt', () => {
  const order = createSteps(datasets.random.products, 'last').at(-1).order;
  const group = equalPriceGroups(datasets.random.products).find(g => g.price === 299);
  assert.deepEqual(group.names, ['Hoodie', 'Sweater']);
  assert.ok(order.indexOf('Sweater') < order.indexOf('Hoodie'));
});

test('lille eksempel følger cheatsheetets partitioner', () => {
  const parts = createSteps(datasets.small.products, 'last').at(-1).partitions;
  assert.deepEqual(parts.map(p => [p.low, p.high, p.pivot, p.left, p.right]), [
    [0, 4, 'Kasket', 0, 4],
    [1, 4, 'Hoodie', 2, 1],
    [1, 2, 'Sweater', 1, 0]
  ]);
});

test('"kun partitioner" viser start, én pr. partition og slut', () => {
  const raw = createSteps(datasets.random.products);
  const shown = selectSteps(raw, 'partitions');
  assert.equal(shown.length, raw.at(-1).partitions.length + 2);
  assert.equal(selectSteps(raw, 'all').length, raw.length);
});
