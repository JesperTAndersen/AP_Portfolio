/* Ingen DOM eller animation her: algoritmen leverer selvstændige øjebliksbilleder. */
const AStarDemo = (() => {
  // Samme grid som GRID i MazeSolver.java: 0 = vej, 1 = mur.
  const grid = [
    [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    [1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
  ];
  const ROAD = 0;
  const ROWS = grid.length, COLS = grid[0].length;
  // Samme retninger som DIRECTIONS i Java.
  const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const STEP_COST = 1;

  // Samme byer som createCities() i Java. side = hvor navnet tegnes uden for gridet.
  const cities = [
    { name: 'Nordby', row: 0, col: 6, side: 'top' },
    { name: 'Østby', row: 6, col: 10, side: 'right' },
    { name: 'Vestby', row: 4, col: 0, side: 'left' },
    { name: 'Sydby', row: 10, col: 4, side: 'bottom' }
  ];

  const heuristics = {
    manhattan: {
      label: 'Manhattan',
      estimate: (row, col, goal) => Math.abs(goal.row - row) + Math.abs(goal.col - col),
      formula: (row, col, goal) => `|${goal.row}-${row}| + |${goal.col}-${col}|`
    },
    none: {
      label: 'Ingen (h = 0) = Dijkstra',
      estimate: () => 0,
      formula: () => '0'
    }
  };

  const key = (row, col) => `${row},${col}`;
  const isRoad = (row, col) => row >= 0 && row < ROWS && col >= 0 && col < COLS && grid[row][col] === ROAD;
  const neighbors = (row, col) => DIRECTIONS
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => isRoad(r, c));

  // Samme rækkefølge som NodeWithCost.compareTo(): f, så h, så række, så kolonne.
  const compare = (a, b) => a.f - b.f || a.h - b.h || a.row - b.row || a.col - b.col;

  // prev peger baglæns, så vi går fra mål til start og indsætter forrest.
  function buildPath(previous, target) {
    const path = [];
    for (let cell = target; cell !== null && cell !== undefined; cell = previous[cell]) path.unshift(cell);
    return path;
  }

  function createSteps(sourceName, targetName, heuristicName = 'manhattan') {
    const source = cities.find(city => city.name === sourceName);
    const goal = cities.find(city => city.name === targetName);
    const heuristic = heuristics[heuristicName];
    if (!source || !goal) throw new Error('Ukendt by');
    if (!heuristic) throw new Error('Ukendt heuristik');
    const h = (row, col) => heuristic.estimate(row, col, goal);
    const label = cell => {
      const city = cities.find(city => key(city.row, city.col) === cell);
      return city ? `${city.name} (${cell})` : `(${cell})`;
    };
    const target = key(goal.row, goal.col);
    const gCosts = {};
    const previous = {};
    const visited = new Set();
    const queue = [];
    const steps = [];
    let lastF = null;
    const entry = (row, col, g) => ({ cell: key(row, col), row, col, g, h: h(row, col), f: g + h(row, col) });

    function save(phase, message, extra = {}) {
      steps.push({
        phase, message, current: null, polled: null, neighbor: null, path: [],
        ...extra,
        gCosts: { ...gCosts }, previous: { ...previous },
        visited: [...visited], queue: [...queue].sort(compare).map(item => ({ ...item }))
      });
    }

    const first = entry(source.row, source.col, 0);
    gCosts[first.cell] = 0;
    queue.push(first);
    save('start', `Start i ${label(first.cell)}. g = 0 og h = ${first.h}, så f = ${first.f}. Køen har én post. Tallet i hvert felt er h: skønnet afstand til målet, som kan beregnes på forhånd.`);

    while (queue.length) {
      queue.sort(compare);
      const polled = queue[0];
      const current = polled.cell;

      if (visited.has(current)) {
        save('skip', `${label(current)} med g = ${polled.g} er en forældet post: feltet er allerede visited med g = ${gCosts[current]}. Den springes over.`, { current, polled });
        queue.shift();
        continue;
      }

      const rival = queue[1];
      let tie = '';
      if (rival && rival.f === polled.f) {
        const reason = rival.h !== polled.h ? `lavere h (${polled.h} < ${rival.h})` : rival.row !== polled.row ? 'lavere række' : 'lavere kolonne';
        tie = ` Uafgjort med ${label(rival.cell)} på f = ${polled.f}; ${reason} afgør det.`;
      }
      // f stiger kun, når alle poster på det gamle niveau er brugt op.
      let rise = '';
      if (lastF !== null && polled.f > lastF) {
        rise = heuristicName === 'none'
          ? `f stiger fra ${lastF} til ${polled.f}: alle felter med g = ${lastF} er brugt op, så søgningen går ét skridt længere ud. `
          : `f stiger fra ${lastF} til ${polled.f}: alle felter med f = ${lastF} er brugt op, så skønnet var for optimistisk. `;
      }
      lastF = polled.f;
      save('select', `${rise}Tag ${label(current)} ud af køen: lavest f = g + h = ${polled.g} + ${polled.h} = ${polled.f}.${tie}`, { current, polled });
      queue.shift();
      visited.add(current);

      if (current === target) {
        const path = buildPath(previous, target);
        save('complete', `Målet ${label(target)} er valgt med g = ${gCosts[target]}. Ruten er endelig: ${gCosts[target]} skridt, ${visited.size} felter udforsket.`, { current, polled, path });
        return steps;
      }

      for (const [row, col] of neighbors(polled.row, polled.col)) {
        const next = key(row, col);
        if (visited.has(next)) continue;
        const newG = polled.g + STEP_COST;
        const known = gCosts[next] ?? Infinity;
        const knownText = known === Infinity ? '∞' : known;
        save('inspect', `Undersøg nabo ${label(next)}: g = ${polled.g} + ${STEP_COST} = ${newG}. Kendt g: ${knownText}.`, { current, polled, neighbor: next });
        if (newG < known) {
          gCosts[next] = newG;
          previous[next] = current;
          const added = entry(row, col, newG);
          queue.push(added);
          const goalNote = next === target ? ` Målet er fundet, men først endeligt, når det selv tages ud af køen.` : '';
          save('relax', `Opdater ${label(next)}: g ${knownText} → ${newG}, h = ${heuristic.formula(row, col, goal)} = ${added.h}, f = ${added.f}. Forgænger: ${label(current)}.${goalNote}`, { current, polled, neighbor: next });
        } else {
          save('keep', `Behold ${label(next)}: ${newG} er ikke mindre end ${knownText}.`, { current, polled, neighbor: next });
        }
      }
      save('settle', `Alle naboer til ${label(current)} er undersøgt. Næste post tages ud af køen.`, { current, polled });
    }
    save('unreachable', `Ingen vej fra ${sourceName} til ${targetName}. Køen er tom.`);
    return steps;
  }

  return { grid, ROWS, COLS, cities, heuristics, key, isRoad, neighbors, compare, createSteps };
})();

// Gør den samme browserkode testbar med Node uden pakker eller build.
if (typeof module !== 'undefined') module.exports = AStarDemo;
