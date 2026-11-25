const { test } = require('node:test');
const assert = require('node:assert/strict');
const { datasets, equalPriceGroups } = require('./products.js');
const { createSteps, selectSteps } = require('./bubble.js');

const priceOf = (products, name) => products.find(item => item.name === name).price;

test('tællingerne er de samme som SortingMain.java (BubbleSort)', () => {
  const expected = { random: [39, 21], sorted: [9, 0], reversed: [45, 43], small: [10, 7] };
  for (const [key, [comparisons, swaps]] of Object.entries(expected)) {
    const last = createSteps(datasets[key].products).at(-1);
    assert.equal(last.comparisons, comparisons, `${key}: sammenligninger`);
    assert.equal(last.swaps, swaps, `${key}: ombytninger`);
  }
});

test('resultatet er sorteret og stabilt for alle datasæt', () => {
  for (const { products } of Object.values(datasets)) {
    const last = createSteps(products).at(-1);
    const prices = last.order.map(name => priceOf(products, name));
    for (let k = 0; k < prices.length - 1; k++) assert.ok(prices[k] <= prices[k + 1]);
    for (const group of equalPriceGroups(products)) {
      const now = last.order.filter(name => group.names.includes(name));
      assert.deepEqual(now, group.names, `samme pris ${group.price} skal stå i input-rækkefølge`);
    }
    assert.equal(last.finalFrom, 0);
  }
});

test('sammenligner kun naboer, og kun inden for j < n - 1 - i', () => {
  for (const { products } of Object.values(datasets)) {
    const n = products.length;
    for (const step of createSteps(products)) {
      if (step.phase !== 'compare') continue;
      assert.deepEqual(step.pair, [step.j, step.j + 1]);
      assert.ok(step.j < n - 1 - step.i);
    }
  }
});

test('early exit sker kun efter et gennemløb uden ombytninger', () => {
  const sorted = createSteps(datasets.sorted.products);
  assert.equal(sorted.at(-1).phase, 'early-exit');
  assert.equal(sorted.at(-1).passes.length, 1);
  for (const { products } of Object.values(datasets)) {
    const last = createSteps(products).at(-1);
    if (last.phase === 'early-exit') assert.equal(last.passes.at(-1).swaps, 0);
  }
  // Omvendt: hvert gennemløb bytter, så løkken kører helt til ende.
  assert.equal(createSteps(datasets.reversed.products).at(-1).phase, 'done');
});

test('lille eksempel følger cheatsheetets gennemløb', () => {
  const ends = createSteps(datasets.small.products)
    .filter(step => step.phase === 'pass-end' || step.phase === 'done');
  assert.deepEqual(ends.map(step => step.order), [
    ['Hoodie', 'T-shirt', 'Sweater', 'Kasket', 'Jakke'],
    ['T-shirt', 'Hoodie', 'Kasket', 'Sweater', 'Jakke'],
    ['T-shirt', 'Kasket', 'Hoodie', 'Sweater', 'Jakke'],
    ['Kasket', 'T-shirt', 'Hoodie', 'Sweater', 'Jakke'],
    ['Kasket', 'T-shirt', 'Hoodie', 'Sweater', 'Jakke']
  ]);
});

test('"kun gennemløb" viser start, ét trin pr. gennemløb og slut', () => {
  const raw = createSteps(datasets.random.products);
  const shown = selectSteps(raw, 'passes');
  assert.equal(shown[0].phase, 'start');
  assert.ok(['early-exit', 'done'].includes(shown.at(-1).phase));
  assert.equal(shown.length, raw.at(-1).passes.length + 1);
  for (const step of shown) assert.ok(!['pass-start', 'compare', 'swap'].includes(step.phase));
  assert.equal(selectSteps(raw, 'all').length, raw.length);
});
