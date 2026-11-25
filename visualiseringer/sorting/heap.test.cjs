const { test } = require('node:test');
const assert = require('node:assert/strict');
const { datasets } = require('./products.js');
const { createSteps, selectSteps } = require('./heap.js');

const priceOf = (products, name) => products.find(item => item.name === name).price;

// Kørt i Java med HeapSort.sort().
const javaResults = {
  random: [38, 25, ['Sokker', 'Kasket', 'Bælte', 'T-shirt', 'Skjorte', 'Sweater', 'Hoodie', 'Bukser', 'Jakke', 'Sko']],
  sorted: [41, 31, ['Sokker', 'Kasket', 'T-shirt', 'Bælte', 'Skjorte', 'Sweater', 'Hoodie', 'Bukser', 'Jakke', 'Sko']],
  reversed: [35, 21, ['Sokker', 'Kasket', 'T-shirt', 'Bælte', 'Skjorte', 'Hoodie', 'Sweater', 'Bukser', 'Jakke', 'Sko']],
  small: [12, 8, ['Kasket', 'T-shirt', 'Sweater', 'Hoodie', 'Jakke']]
};

test('tællinger og slutrækkefølge er de samme som HeapSort.java', () => {
  for (const [key, [comparisons, swaps, order]] of Object.entries(javaResults)) {
    const last = createSteps(datasets[key].products).at(-1);
    assert.equal(last.comparisons, comparisons, `${key}: sammenligninger`);
    assert.equal(last.swaps, swaps, `${key}: ombytninger`);
    assert.deepEqual(last.order, order, `${key}: rækkefølge`);
  }
});

test('max-heap-reglen gælder, når heapen er bygget og efter hvert udtag', () => {
  for (const { products } of Object.values(datasets)) {
    for (const step of createSteps(products)) {
      if (!['heap-built', 'heap-restored'].includes(step.phase)) continue;
      for (let child = 1; child < step.heapSize; child++) {
        const parent = Math.floor((child - 1) / 2);
        assert.ok(priceOf(products, step.order[parent]) >= priceOf(products, step.order[child]));
      }
    }
  }
});

test('hvert udtag lægger den dyreste tilbageværende på sin endelige plads', () => {
  for (const { products } of Object.values(datasets)) {
    for (const step of createSteps(products)) {
      if (step.phase !== 'extract') continue;
      const placed = priceOf(products, step.order[step.end]);
      for (let k = 0; k < step.end; k++) assert.ok(priceOf(products, step.order[k]) <= placed);
    }
  }
});

test('fase 1 starter ved n / 2 - 1 og går ned til 0', () => {
  const steps = createSteps(datasets.random.products);
  const built = steps.findIndex(s => s.phase === 'heap-built');
  const roots = [];
  steps.slice(0, built).forEach((s, k, all) => {
    if (s.phase === 'heapify' && !(k > 0 && all[k - 1].phase === 'sink')) roots.push(s.i);
  });
  assert.deepEqual(roots, [4, 3, 2, 1, 0]);
});

test('ikke stabil: Bælte ender før T-shirt på det tilfældige datasæt', () => {
  const order = createSteps(datasets.random.products).at(-1).order;
  assert.ok(order.indexOf('Bælte') < order.indexOf('T-shirt'));
});

test('lille eksempel følger cheatsheetets trace', () => {
  const steps = createSteps(datasets.small.products);
  assert.deepEqual(steps.find(s => s.phase === 'heap-built').order, ['Jakke', 'Hoodie', 'T-shirt', 'Sweater', 'Kasket']);
  assert.deepEqual(steps.filter(s => s.phase === 'heap-restored').map(s => s.order), [
    ['Hoodie', 'Sweater', 'T-shirt', 'Kasket', 'Jakke'],
    ['Sweater', 'Kasket', 'T-shirt', 'Hoodie', 'Jakke'],
    ['T-shirt', 'Kasket', 'Sweater', 'Hoodie', 'Jakke'],
    ['Kasket', 'T-shirt', 'Sweater', 'Hoodie', 'Jakke']
  ]);
});

test('"kun store skridt" viser start, heap bygget, hvert udtag og slut', () => {
  const raw = createSteps(datasets.random.products);
  const shown = selectSteps(raw, 'overview');
  assert.equal(shown.filter(s => s.phase === 'extract').length, 9);
  assert.equal(shown.length, 1 + 1 + 9 * 2 + 1);
});
