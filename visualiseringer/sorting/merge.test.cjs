const { test } = require('node:test');
const assert = require('node:assert/strict');
const { datasets, equalPriceGroups } = require('./products.js');
const { createSteps, selectSteps } = require('./merge.js');

const priceOf = (products, name) => products.find(item => item.name === name).price;

test('sammenligninger er de samme som MergeSort.java (SortingMain)', () => {
  const expected = { random: 25, sorted: 15, reversed: 20, small: 8 };
  for (const [key, comparisons] of Object.entries(expected)) {
    assert.equal(createSteps(datasets[key].products).at(-1).comparisons, comparisons, key);
  }
});

test('resultatet er sorteret og stabilt for alle datasæt', () => {
  for (const { products } of Object.values(datasets)) {
    const order = createSteps(products).at(-1).order;
    for (let k = 0; k < order.length - 1; k++) assert.ok(priceOf(products, order[k]) <= priceOf(products, order[k + 1]));
    for (const group of equalPriceGroups(products)) {
      assert.deepEqual(order.filter(name => group.names.includes(name)), group.names);
    }
  }
});

test('venstre halvdel er helt færdig, før højre halvdel bliver kaldt (depth first)', () => {
  for (const { products } of Object.values(datasets)) {
    const steps = createSteps(products);
    const n = products.length, mid = Math.floor(n / 2);
    const leftDone = steps.findIndex(s => s.phase === 'merge-done' && s.stack.at(-1).lo === 0 && s.stack.at(-1).hi === mid);
    const rightCalled = steps.findIndex(s => ['call', 'base'].includes(s.phase) && s.stack.at(-1).lo >= mid);
    assert.ok(leftDone >= 0 && leftDone < rightCalled);
  }
});

test('en fletning af m varer bruger højst m - 1 sammenligninger, og hver vare skrives én gang', () => {
  for (const { products } of Object.values(datasets)) {
    const steps = createSteps(products);
    steps.forEach((step, k) => {
      if (step.phase !== 'merge-start') return;
      const m = step.merge.hi - step.merge.lo;
      const end = steps.findIndex((s, j) => j > k && s.phase === 'merge-done');
      const between = steps.slice(k + 1, end);
      assert.ok(between.filter(s => s.phase === 'merge-compare').length <= m - 1);
      assert.equal(between.length, m);
    });
  }
});

test('lille eksempel følger cheatsheetets fletninger', () => {
  const steps = createSteps(datasets.small.products);
  const merged = steps.filter(s => s.phase === 'merge-done').map(s => {
    const { lo, hi } = s.stack.at(-1);
    return s.order.slice(lo, hi);
  });
  assert.deepEqual(merged, [
    ['Hoodie', 'Jakke'],
    ['Kasket', 'Sweater'],
    ['Kasket', 'T-shirt', 'Sweater'],
    ['Kasket', 'T-shirt', 'Hoodie', 'Sweater', 'Jakke']
  ]);
  assert.equal(steps.at(-1).comparisons, 8);
});

test('opdelingstræet har 2n - 1 kald, og "overblik" viser kun kald og fletninger', () => {
  const steps = createSteps(datasets.random.products);
  assert.equal(steps.nodes.length, 2 * 10 - 1);
  const shown = selectSteps(steps, 'overview');
  assert.ok(shown.every(s => ['start', 'call', 'base', 'merge-done', 'done'].includes(s.phase)));
  assert.equal(shown.filter(s => s.phase === 'merge-done').length, 9);
});
