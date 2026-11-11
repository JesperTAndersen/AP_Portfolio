const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cities, key, isRoad, neighbors, createSteps } = require('./astar.js');
const { selectSteps } = require('./playback.js');
const names = cities.map(city => city.name);
const cellOf = name => { const city = cities.find(c => c.name === name); return key(city.row, city.col); };

// Bredde-først-søgning giver det korrekte antal skridt, når alle skridt koster 1.
function bfs(from, to) {
  const dist = { [from]: 0 };
  const queue = [from];
  while (queue.length) {
    const cell = queue.shift();
    const [row, col] = cell.split(',').map(Number);
    for (const [r, c] of neighbors(row, col)) {
      if (dist[key(r, c)] === undefined) { dist[key(r, c)] = dist[cell] + 1; queue.push(key(r, c)); }
    }
  }
  return dist[to] ?? Infinity;
}

test('alle by-par og begge heuristikker giver den korteste rute', () => {
  for (const from of names) for (const to of names) for (const h of ['manhattan', 'none']) {
    const last = createSteps(from, to, h).at(-1);
    assert.equal(last.phase, 'complete', `${from} → ${to}`);
    assert.equal(last.gCosts[cellOf(to)], bfs(cellOf(from), cellOf(to)), `${from} → ${to} (${h})`);
    assert.equal(last.path[0], cellOf(from));
    assert.equal(last.path.at(-1), cellOf(to));
    assert.equal(last.path.length - 1, last.gCosts[cellOf(to)]);
    last.path.slice(1).forEach((cell, i) => {
      const [r1, c1] = last.path[i].split(',').map(Number);
      const [r2, c2] = cell.split(',').map(Number);
      assert.ok(isRoad(r2, c2), 'ruten går kun gennem vej-felter');
      assert.equal(Math.abs(r1 - r2) + Math.abs(c1 - c2), 1, 'ét skridt ad gangen, ingen diagonaler');
    });
  }
});

test('standardeksemplet Vestby → Østby: blindgyden koster, og A* udforsker færre felter', () => {
  const steps = createSteps('Vestby', 'Østby');
  const last = steps.at(-1);
  assert.equal(last.gCosts['6,10'], 20);
  assert.equal(last.visited.length, 28);
  assert.ok(last.visited.includes('4,8'), 'A* går ind i blindgyden tæt på målet');
  assert.ok(!last.path.includes('4,8'));
  assert.equal(createSteps('Vestby', 'Østby', 'none').at(-1).visited.length, 64);
  const levels = [...new Set(steps.filter(step => step.phase === 'select').map(step => step.polled.f))];
  assert.deepEqual(levels, [12, 14, 16, 18, 20]);
});

test('forklaringen nævner det, hver gang f stiger', () => {
  const rises = heuristic => createSteps('Vestby', 'Østby', heuristic)
    .filter(step => step.phase === 'select' && step.message.startsWith('f stiger'));
  assert.deepEqual(rises('manhattan').map(step => step.polled.f), [14, 16, 18, 20]);
  assert.ok(rises('manhattan').every(step => step.message.includes('for optimistisk')));
  assert.ok(rises('none').length > 0);
  assert.ok(rises('none').every(step => !step.message.includes('for optimistisk')));
});

test('Nordby → Sydby viser en forældet køpost', () => {
  assert.equal(createSteps('Nordby', 'Sydby').filter(step => step.phase === 'skip').length, 1);
});

test('Manhattan udforsker aldrig flere felter end h = 0 (Dijkstra)', () => {
  for (const from of names) for (const to of names) {
    const astar = createSteps(from, to, 'manhattan').at(-1);
    const dijkstra = createSteps(from, to, 'none').at(-1);
    assert.ok(astar.visited.length <= dijkstra.visited.length, `${from} → ${to}`);
  }
});

test('det valgte felt er altid forrest i køen, og f falder aldrig', () => {
  for (const from of names) for (const to of names) for (const h of ['manhattan', 'none']) {
    let lastF = -1;
    for (const step of createSteps(from, to, h)) {
      if (step.phase !== 'select') continue;
      assert.equal(step.queue[0].cell, step.current);
      // Manhattan er konsistent, så f for valgte felter vokser aldrig.
      assert.ok(step.polled.f >= lastF);
      lastF = step.polled.f;
    }
  }
});

test('uafgjort f afgøres fast: lavere h, så række, så kolonne', () => {
  const steps = createSteps('Vestby', 'Østby');
  const ties = steps.filter(step => step.phase === 'select' && step.queue[1] && step.queue[1].f === step.polled.f);
  assert.ok(ties.length > 0, 'eksemplet skal faktisk have uafgjorte valg');
  for (const step of ties) {
    const [first, second] = step.queue;
    assert.ok(first.h < second.h || (first.h === second.h && (first.row < second.row || (first.row === second.row && first.col < second.col))));
  }
});

test('en node er visited fra det øjeblik, den vælges', () => {
  const steps = createSteps('Nordby', 'Sydby');
  steps.forEach((step, i) => {
    if (step.phase !== 'select') return;
    assert.ok(!step.visited.includes(step.current));
    assert.ok(steps[i + 1].visited.includes(step.current));
  });
});

test('forældede køposter springes over i stedet for at blive valgt igen', () => {
  let skips = 0;
  for (const from of names) for (const to of names) for (const h of ['manhattan', 'none']) {
    for (const step of createSteps(from, to, h)) {
      if (step.phase !== 'skip') continue;
      skips++;
      assert.ok(step.visited.includes(step.current));
      assert.ok(step.gCosts[step.current] <= step.polled.g);
    }
  }
  assert.ok(skips > 0, 'mindst ét by-par skal vise en forældet post');
});

test('tilstande er uafhængige, så tilbage og nulstil ikke ændrer historikken', () => {
  const run = createSteps('Nordby', 'Sydby');
  run.at(-1).gCosts['0,6'] = 999;
  run.at(-1).visited.push('test');
  run.at(-1).queue.push({ cell: 'test' });
  assert.equal(run[0].gCosts['0,6'], 0);
  assert.deepEqual(run[0].visited, []);
  assert.equal(run[0].queue.length, 1);
});

test('ukendte byer og heuristikker afvises', () => {
  assert.throws(() => createSteps('X', 'Sydby'), /Ukendt by/);
  assert.throws(() => createSteps('Nordby', 'Sydby', 'x'), /Ukendt heuristik/);
});

test('visningen springer sammenligninger over og bevarer alle slutresultater', () => {
  for (const from of names) for (const to of names) {
    const raw = createSteps(from, to);
    const compact = selectSteps(raw);
    const detailed = selectSteps(raw, true);
    assert.equal(detailed.length, raw.length);
    assert.deepEqual(compact.at(-1), detailed.at(-1));
    assert.deepEqual(compact[0], detailed[0]);
    assert.ok(!compact.some(step => ['inspect', 'keep'].includes(step.phase)));
  }
});
