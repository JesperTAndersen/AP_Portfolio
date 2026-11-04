const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { selectSteps } = require('./playback.js');
const exportPath = join(__dirname, 'java-data.js');
assert.ok(existsSync(exportPath), 'Kør visualiseringer/dijkstra/start-java.ps1 -NoOpen før Java-testene');
const context = vm.createContext({});
vm.runInContext(readFileSync(exportPath, 'utf8'), context);
const data = JSON.parse(JSON.stringify(context.DijkstraJavaData));
const key = entry => `${entry.node}:${entry.distance}`;
const queueKeys = queue => queue.map(key).sort();

test('alle Java-eksportens ruter stemmer med Floyd–Warshall', () => {
  const expected = Object.fromEntries(data.nodes.map(a => [a,
    Object.fromEntries(data.nodes.map(b => [b, a === b ? 0 : Infinity]))]));
  for (const edge of data.edges) expected[edge.from][edge.to] = edge.weight;
  for (const k of data.nodes) for (const a of data.nodes) for (const b of data.nodes) {
    expected[a][b] = Math.min(expected[a][b], expected[a][k] + expected[k][b]);
  }
  assert.equal(Object.keys(data.runs).length, data.nodes.length ** 2);
  for (const a of data.nodes) for (const b of data.nodes) {
    const run = data.runs[`${a}-${b}`];
    const result = run.at(-1);
    assert.equal(result.distances[b] ?? Infinity, expected[a][b], `${a} → ${b}`);
    if (expected[a][b] === Infinity) {
      assert.equal(result.phase, 'unreachable');
      assert.deepEqual(result.path, []);
    } else {
      assert.equal(result.phase, 'complete');
      assert.equal(result.path[0], a);
      assert.equal(result.path.at(-1), b);
      const length = result.path.slice(1).reduce((sum, node, index) => {
        const edge = data.edges.find(edge => edge.from === result.path[index] && edge.to === node);
        assert.ok(edge);
        return sum + edge.weight;
      }, 0);
      assert.equal(length, expected[a][b]);
    }
  }
});

test('køen ændres kun ved add og poll; poll tager det faktisk første element', () => {
  for (const [pair, run] of Object.entries(data.runs)) {
    assert.equal(run[0].queue.length, 1);
    assert.equal(run[0].queue[0].node, pair.split('-')[0]);
    for (let index = 0; index < run.length; index++) {
      const step = run[index];
      step.queue.forEach((entry, position) => {
        assert.equal(entry.stale, entry.distance !== step.distances[entry.node]);
        assert.equal(entry.visited, step.visited.includes(entry.node));
        if (position) assert.ok(entry.distance >= step.queue[position - 1].distance);
      });
      if (!index) continue;
      const before = run[index - 1];
      if (step.phase === 'select') {
        assert.equal(step.current, before.queue[0].node);
        assert.equal(step.currentDistance, before.queue[0].distance);
        assert.deepEqual(queueKeys(step.queue), queueKeys(before.queue.slice(1)));
      } else if (step.phase === 'relax') {
        const node = step.edge.split('-')[1];
        const expected = [...before.queue, { node, distance: step.distances[node] }];
        assert.deepEqual(queueKeys(step.queue), queueKeys(expected));
      } else {
        assert.deepEqual(queueKeys(step.queue), queueKeys(before.queue));
      }
      // Visited ændres i samme trin som noden bliver grøn, efter nabobehandlingen.
      assert.notEqual(step.phase, 'visit');
      const newlyVisited = step.visited.filter(node => !before.visited.includes(node));
      if (step.phase === 'settle' || step.phase === 'complete') {
        assert.deepEqual(newlyVisited, [step.current]);
      } else {
        assert.deepEqual(newlyVisited, []);
      }
      if (['inspect', 'relax', 'keep', 'skip-neighbor'].includes(step.phase)) {
        assert.ok(!step.visited.includes(step.current));
      }
      if (step.phase === 'skip') {
        assert.equal(before.phase, 'select');
        assert.ok(step.visited.includes(step.current));
      }
    }
  }
});

test('B med 5 og 8 km står samtidigt i køen, og B:8 springes senere over', () => {
  const run = data.runs['A-H'];
  const update = run.find(step => step.phase === 'relax' && step.edge === 'C-B');
  assert.deepEqual(update.queue.filter(entry => entry.node === 'B').map(entry => [entry.distance, entry.stale]), [[5, false], [8, true]]);
  assert.ok(run.some(step => step.phase === 'skip' && step.current === 'B' && step.currentDistance === 8));
  assert.equal(run[0].distances.B, undefined);
  assert.deepEqual(run[0].visited, []);
});

test('Java behandler I og J før H og beholder sidegrenen uden for ruten', () => {
  const run = data.runs['A-H'];
  const result = run.at(-1);
  assert.equal(result.distances.I, 4);
  assert.equal(result.distances.J, 6);
  for (const id of ['I', 'J']) {
    const visitIndex = run.findIndex(step => step.phase === 'settle' && step.current === id);
    const goalIndex = run.findIndex(step => step.phase === 'complete' && step.current === 'H');
    assert.ok(visitIndex >= 0 && visitIndex < goalIndex);
    assert.ok(result.visited.includes(id));
    assert.ok(!result.path.includes(id));
  }
  assert.equal(data.runs['J-H'].at(-1).phase, 'unreachable');
});

test('Java-adapteren læser eksporten uden at indlæse JavaScript-algoritmen', () => {
  vm.runInContext(readFileSync(join(__dirname, 'java-demo.js'), 'utf8'), context);
  assert.equal(vm.runInContext('DijkstraDemo.javaTrace', context), true);
  assert.equal(vm.runInContext('DijkstraDemo.createSteps("A", "H").at(-1).distances.H', context), 15);
  assert.equal(vm.runInContext('DijkstraDemo.createSteps("H", "A").at(-1).distances.A', context), Infinity);
  assert.equal(vm.runInContext('DijkstraDemo.createSteps("H", "H").at(-1).distances.H', context), 0);
});

test('kompakt Java-visning bevarer køændringer og samler udtagning af gamle poster', () => {
  for (const raw of Object.values(data.runs)) {
    const compact = selectSteps(raw);
    assert.deepEqual(compact.at(-1), selectSteps(raw, true).at(-1));
    raw.forEach((step, index) => {
      if (['start', 'relax', 'settle', 'complete', 'skip'].includes(step.phase)) {
        assert.ok(compact.some(visible => visible.rawIndex === index));
      }
    });
  }
  const raw = data.runs['A-H'];
  const compact = selectSteps(raw);
  const skippedIndex = raw.findIndex(step => step.phase === 'skip' && step.current === 'B');
  assert.ok(compact.some(step => step.rawIndex === skippedIndex));
  assert.ok(!compact.some(step => step.rawIndex === skippedIndex - 1));
  assert.ok(!compact.some(step => step.edge === 'B-E'));
});
