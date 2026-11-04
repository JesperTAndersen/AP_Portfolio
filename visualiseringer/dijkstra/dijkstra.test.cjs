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

test('standardeksemplet viser en forbedring og giver 15 km', () => {
  const steps = createSteps('A', 'H');
  const values = steps.filter(step => step.phase === 'relax' && step.edge.endsWith('-B'));
  assert.deepEqual(values.map(step => step.distances.B), [8, 5]);
  assert.deepEqual(steps.at(-1).path, ['A', 'C', 'B', 'D', 'E', 'F', 'H']);
  assert.equal(steps.at(-1).distances.H, 15);
});

test('sidegrenen behandles før H, men indgår ikke i ruten', () => {
  const steps = createSteps('A', 'H');
  const result = steps.at(-1);
  assert.equal(result.distances.I, 4);
  assert.equal(result.distances.J, 6);
  for (const id of ['I', 'J']) {
    assert.ok(steps.findIndex(step => step.phase === 'settle' && step.current === id)
      < steps.findIndex(step => step.phase === 'select' && step.current === 'H'));
    assert.ok(result.visited.includes(id));
    assert.ok(!result.path.includes(id));
  }
  assert.equal(createSteps('J', 'H').at(-1).phase, 'unreachable');
});

test('tilstande er uafhængige, så tilbage og nulstil ikke ændrer historikken', () => {
  const firstRun = createSteps('A', 'H');
  const secondRun = createSteps('A', 'H');
  assert.equal(firstRun[0].distances.B, Infinity);
  assert.equal(firstRun[0].previous.B, null);
  firstRun.at(-1).distances.A = 999;
  firstRun.at(-1).visited.push('test');
  assert.equal(firstRun[0].distances.A, 0);
  assert.deepEqual(firstRun[0].visited, []);
  assert.equal(secondRun.at(-1).distances.A, 0);
});

test('ukendte byer afvises', () => {
  assert.throws(() => createSteps('X', 'H'), /Ukendt by/);
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
  const compact = selectSteps(createSteps('A', 'H'));
  assert.ok(!compact.some(step => step.edge === 'B-E'));
  assert.ok(compact.some(step => step.phase === 'settle' && step.current === 'B' && step.visited.includes('B')));
});
