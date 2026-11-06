const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nodes, edges, createSteps } = require('./dijkstra.js');
const { selectSteps } = require('./playback.js');
const ids = nodes.map(node => node.id);

test('alle start/mål-par stemmer med Floyd–Warshall', () => {
  const expected = Object.fromEntries(ids.map(a => [a,
    Object.fromEntries(ids.map(b => [b, a === b ? 0 : Infinity]))]));
  for (const { from, to, weight } of edges) expected[from][to] = weight;
  for (const k of ids) for (const a of ids) for (const b of ids) {
    expected[a][b] = Math.min(expected[a][b], expected[a][k] + expected[k][b]);
  }
  for (const source of ids) for (const target of ids) {
    const steps = createSteps(source, target);
    const last = steps.at(-1);
    assert.equal(last.distances[target], expected[source][target], `${source} → ${target}`);
    if (expected[source][target] === Infinity) {
      assert.equal(last.phase, 'unreachable');
      assert.deepEqual(last.path, []);
    } else {
      assert.equal(last.phase, 'complete');
      assert.equal(last.path[0], source);
      assert.equal(last.path.at(-1), target);
      const sum = last.path.slice(1).reduce((sum, city, i) => {
        const edge = edges.find(edge => edge.from === last.path[i] && edge.to === city);
        assert.ok(edge, 'ruten må kun bruge eksisterende rettede veje');
        return sum + edge.weight;
      }, 0);
      assert.equal(sum, expected[source][target]);
    }
    let selectedDistance = -1;
    for (const step of steps) {
      if (step.phase === 'select') {
        assert.equal(step.current, step.frontier[0]);
        assert.ok(step.distances[step.current] >= selectedDistance);
        selectedDistance = step.distances[step.current];
      }
      assert.equal(new Set(step.frontier).size, step.frontier.length);
      for (const id of step.frontier) assert.ok(!step.visited.includes(id));
    }
  }
});

test('standardeksemplet: fælde, blindgyde og korteste rute (10 km)', () => {
  const steps = createSteps('S', 'M');
  const result = steps.at(-1);
  assert.deepEqual(result.path, ['S', 'F', 'G', 'H', 'M']);
  assert.equal(result.distances.M, 10);
  const order = steps.filter(step => step.phase === 'select').map(step => step.current);
  assert.deepEqual(order, ['S', 'A', 'B', 'C', 'F', 'D', 'G', 'H', 'E', 'M']);
  const updates = to => steps.filter(step => step.phase === 'relax' && step.edge.endsWith(`-${to}`))
    .map(step => [step.edge, step.distances[to]]);
  assert.deepEqual(updates('M'), [['C-M', 15], ['H-M', 10]]);
  assert.deepEqual(updates('G'), [['S-G', 7], ['F-G', 6]]);
});

test('blindgyden udforskes helt før målet, men indgår ikke i ruten', () => {
  const steps = createSteps('S', 'M');
  const result = steps.at(-1);
  assert.equal(result.distances.D, 5);
  assert.equal(result.distances.E, 9);
  for (const id of ['D', 'E']) {
    assert.ok(result.visited.includes(id));
    assert.ok(!result.path.includes(id));
  }
  assert.equal(createSteps('E', 'M').at(-1).phase, 'unreachable');
});

test('en node er visited fra det øjeblik, den vælges', () => {
  const steps = createSteps('S', 'M');
  steps.forEach((step, i) => {
    if (step.phase !== 'select') return;
    assert.ok(!step.visited.includes(step.current));
    assert.ok(steps[i + 1].visited.includes(step.current));
  });
});

test('en naiv grådig "billigste næste kant"-vandring ender i fælden', () => {
  let city = 'S', total = 0;
  const walk = [city];
  while (city !== 'M') {
    const cheapest = edges.filter(edge => edge.from === city).sort((a, b) => a.weight - b.weight)[0];
    total += cheapest.weight; city = cheapest.to; walk.push(city);
  }
  assert.deepEqual(walk, ['S', 'A', 'B', 'C', 'M']);
  assert.equal(total, 15);
  assert.ok(total > createSteps('S', 'M').at(-1).distances.M);
  assert.equal(createSteps('M', 'S').at(-1).phase, 'unreachable');
});

test('tilstande er uafhængige, så tilbage og nulstil ikke ændrer historikken', () => {
  const firstRun = createSteps('S', 'M');
  const secondRun = createSteps('S', 'M');
  assert.equal(firstRun[0].distances.B, Infinity);
  assert.equal(firstRun[0].previous.B, null);
  firstRun.at(-1).distances.S = 999;
  firstRun.at(-1).visited.push('test');
  assert.equal(firstRun[0].distances.S, 0);
  assert.deepEqual(firstRun[0].visited, []);
  assert.equal(secondRun.at(-1).distances.S, 0);
});

test('ukendte byer afvises', () => {
  assert.throws(() => createSteps('X', 'M'), /Ukendt by/);
});

test('visningen springer sammenligninger over og bevarer alle slutresultater', () => {
  for (const source of ids) for (const target of ids) {
    const raw = createSteps(source, target);
    const compact = selectSteps(raw);
    const detailed = selectSteps(raw, true);
    assert.equal(detailed.length, raw.length);
    assert.deepEqual(compact.at(-1), detailed.at(-1));
    assert.deepEqual(compact[0], detailed[0]);
    assert.ok(!compact.some(step => ['inspect', 'keep'].includes(step.phase)));
  }
  const compact = selectSteps(createSteps('S', 'M'));
  assert.ok(compact.some(step => step.phase === 'settle' && step.current === 'B' && step.visited.includes('B')));
});
