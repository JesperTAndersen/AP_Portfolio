(() => {
  const { grid, ROWS, COLS, cities, heuristics, key, isRoad, neighbors, createSteps } = AStarDemo;
  const get = id => document.getElementById(id);
  const source = get('source');
  const target = get('target');
  const heuristic = get('heuristic');
  const graph = get('graph');
  const svgNS = 'http://www.w3.org/2000/svg';
  const CELL = 52, MARGIN_X = 112, MARGIN_Y = 58, QUEUE_ROWS = 10;
  let rawSteps, steps, index = 0, timer = null;
  const cellElements = new Map();
  const rowLabels = [], colLabels = [];
  let onlyDijkstra = new Set();
  const format = value => value === undefined || value === Infinity ? '∞' : String(value);
  const cityAt = cell => cities.find(city => key(city.row, city.col) === cell);
  const label = cell => cityAt(cell) ? `${cityAt(cell).name} (${cell})` : `(${cell})`;
  const goal = () => cities.find(city => city.name === target.value);
  const estimate = (row, col) => heuristics[heuristic.value].estimate(row, col, goal());

  function svg(tag, attributes, parent, text) {
    const element = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    if (text !== undefined) element.textContent = text;
    parent.append(element);
    return element;
  }

  function drawGrid() {
    graph.setAttribute('viewBox', `0 0 ${MARGIN_X * 2 + COLS * CELL} ${MARGIN_Y * 2 + ROWS * CELL}`);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = MARGIN_X + col * CELL, y = MARGIN_Y + row * CELL;
        const group = svg('g', { class: isRoad(row, col) ? 'cell' : 'cell wall', transform: `translate(${x} ${y})` }, graph);
        svg('rect', { width: CELL, height: CELL }, group);
        svg('title', {}, group, isRoad(row, col) ? `(${row},${col})` : `(${row},${col}) mur`);
        if (!isRoad(row, col)) continue;
        const g = svg('text', { x: 10, y: 11, class: 'cell-g' }, group);
        const h = svg('text', { x: CELL - 10, y: 11, class: 'cell-h' }, group);
        const f = svg('text', { x: CELL / 2, y: CELL / 2 + 2, class: 'cell-f' }, group);
        const prev = svg('text', { x: CELL / 2, y: CELL - 9, class: 'cell-prev' }, group);
        cellElements.set(key(row, col), { group, g, h, f, prev });
      }
    }
    // Numrene er det, Manhattan regner med: rækkeforskel + kolonneforskel.
    for (let row = 0; row < ROWS; row++) {
      rowLabels.push(svg('text', { x: MARGIN_X - 12, y: MARGIN_Y + row * CELL + CELL / 2, class: 'axis row-axis' }, graph, row));
    }
    for (let col = 0; col < COLS; col++) {
      colLabels.push(svg('text', { x: MARGIN_X + col * CELL + CELL / 2, y: MARGIN_Y - 12, class: 'axis' }, graph, col));
    }
    for (const city of cities) {
      const x = MARGIN_X + city.col * CELL, y = MARGIN_Y + city.row * CELL;
      svg('rect', { x: x + 2, y: y + 2, width: CELL - 4, height: CELL - 4, class: 'city-ring' }, graph);
      const place = {
        top: [x + CELL / 2, y - 36, 'middle'], bottom: [x + CELL / 2, y + CELL + 18, 'middle'],
        left: [x - 34, y + CELL / 2, 'end'], right: [x + CELL + 10, y + CELL / 2, 'start']
      }[city.side];
      svg('text', { x: place[0], y: place[1], 'text-anchor': place[2], class: 'city-name' }, graph, city.name);
    }
  }

  // Linjerne fra MazeSolver.findShortestPath(). Hvert trin markerer de linjer, der udføres.
  const codeLines = [
    { text: 'distances.put(source, 0);', phases: ['start'], id: 'start-g' },
    { text: 'queue.add(new NodeWithCost(source, 0, heuristic.estimate(source, destination)));', phases: ['start'], id: 'start-add' },
    { text: 'while (!queue.isEmpty()) {', phases: ['settle'] },
    { text: '    NodeWithCost current = queue.poll();', phases: ['select', 'skip'], id: 'poll' },
    { text: '    if (visited.contains(current.node)) continue;', phases: ['skip'], id: 'stale' },
    { text: '    visited.add(current.node);', phases: ['select'] },
    { text: '    if (current.node.equals(destination)) break;', phases: ['complete'] },
    { text: '    for (MazeNode next : current.node.getNeighbors()) {', phases: ['inspect', 'keep', 'relax'], id: 'for' },
    { text: '        int newDistance = current.distance + STEP_COST;', phases: ['inspect', 'keep', 'relax'], id: 'new-g' },
    { text: '        if (newDistance < distances.getOrDefault(next, ∞)) {', phases: ['inspect', 'keep', 'relax'], id: 'compare' },
    { text: '            distances.put(next, newDistance);', phases: ['relax'], id: 'put-g' },
    { text: '            prev.put(next, current.node);', phases: ['relax'], id: 'put-prev' },
    { text: '            int estimate = heuristic.estimate(next, destination);', phases: ['relax'], id: 'h' },
    { text: '            queue.add(new NodeWithCost(next, newDistance, estimate));', phases: ['relax'], id: 'add' },
    { text: '        }', phases: [] },
    { text: '    }', phases: [] },
    { text: '}', phases: [] },
    { text: 'if (!visited.contains(destination)) → ingen vej', phases: ['unreachable'] },
    { text: 'List<MazeNode> path = buildPath(prev, destination);', phases: ['complete'], id: 'path' }
  ];
  const codeElements = [];

  function drawCode() {
    for (const line of codeLines) {
      const item = document.createElement('li');
      const code = document.createElement('span');
      code.textContent = line.text;
      const note = document.createElement('span');
      note.className = 'note';
      item.append(code, note);
      get('code').append(item);
      codeElements.push({ item, note, line });
    }
  }

  // Konkrete værdier ved den markerede linje, så koden kan læses sammen med gridet.
  function codeNote(step, previousStep, id) {
    const polled = step.polled;
    if (step.phase === 'start') {
      const first = step.queue[0];
      return id === 'start-g' ? `// ${label(first.cell)} = 0` : `// g = 0, h = ${first.h}, f = ${first.f}`;
    }
    if (id === 'poll') return `// → (${polled.cell}): f = ${polled.g} + ${polled.h} = ${polled.f}`;
    if (id === 'stale') return `// ja: forældet post med g = ${polled.g}`;
    if (id === 'path') return `// ${step.gCosts[step.current]} skridt`;
    if (!step.neighbor) return '';
    const [row, col] = step.neighbor.split(',').map(Number);
    const newG = polled.g + 1;
    // Ved relax er gCosts allerede opdateret, så sammenlign med værdien før.
    const known = step.phase === 'relax' ? previousStep.gCosts[step.neighbor] : step.gCosts[step.neighbor];
    const h = estimate(row, col);
    if (id === 'for') return `// (${polled.cell}) → (${step.neighbor})`;
    if (id === 'new-g') return `// ${polled.g} + 1 = ${newG}`;
    if (id === 'compare') return `// ${newG} < ${format(known)}? ${newG < (known ?? Infinity) ? 'ja' : 'nej'}`;
    if (id === 'put-g') return `// (${step.neighbor}): ${format(known)} → ${newG}`;
    if (id === 'put-prev') return `// prev[(${step.neighbor})] = (${polled.cell})`;
    if (id === 'h') return `// ${heuristics[heuristic.value].formula(row, col, goal())} = ${h}`;
    if (id === 'add') return `// f = ${newG} + ${h} = ${newG + h}`;
    return '';
  }

  function renderCode(step, previousStep) {
    for (const { item, note, line } of codeElements) {
      const current = line.phases.includes(step.phase);
      item.classList.toggle('is-current', current);
      note.textContent = current && line.id ? codeNote(step, previousStep, line.id) : '';
    }
    get('explanation').textContent = step.message;
  }

  // Pilen peger fra feltet mod forgængeren, ligesom prev gør.
  function arrowTo(cell, prevCell) {
    if (!prevCell) return '';
    const [r, c] = cell.split(',').map(Number);
    const [pr, pc] = prevCell.split(',').map(Number);
    return pr < r ? '↑' : pr > r ? '↓' : pc < c ? '←' : '→';
  }

  // Viser h for current med de samme række- og kolonnenumre, som står langs labyrinten.
  function renderAxes(step) {
    const first = cities.find(city => city.name === source.value);
    const [row, col] = step.current ? step.current.split(',').map(Number) : [first.row, first.col];
    const end = goal();
    rowLabels.forEach((element, i) => element.setAttribute('class', `axis row-axis${i === end.row ? ' is-goal' : i === row ? ' is-current' : ''}`));
    colLabels.forEach((element, i) => element.setAttribute('class', `axis${i === end.col ? ' is-goal' : i === col ? ' is-current' : ''}`));
    const value = estimate(row, col);
    get('h-formula').textContent = heuristic.value === 'manhattan'
      ? `h(${row},${col}) = |${end.row}-${row}| + |${end.col}-${col}| = ${value}`
      : 'h = 0';
  }

  function renderQueue(step) {
    const body = get('queue');
    body.replaceChildren();
    const visible = step.queue.slice(0, QUEUE_ROWS);
    // Ved select/skip er current stadig forrest i køen; den tages ud lige efter.
    const polledNow = ['select', 'skip'].includes(step.phase);
    visible.forEach((item, i) => {
      const row = document.createElement('tr');
      const stale = step.visited.includes(item.cell) || step.gCosts[item.cell] < item.g;
      const next = i === 0 && polledNow;
      row.className = next ? 'is-next' : stale ? 'is-stale' : '';
      const note = next ? 'poll()' : stale ? 'forældet' : '';
      for (const value of [label(item.cell), item.g, item.h, item.f, note]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    });
    if (!step.queue.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5; cell.textContent = '∅';
      row.append(cell); body.append(row);
    }
    const hidden = step.queue.length - visible.length;
    get('queue-more').hidden = hidden <= 0;
    get('queue-more').textContent = `… og ${hidden} poster mere i køen`;
  }

  function renderComparison() {
    const body = get('compare');
    body.replaceChildren();
    const explored = name => createSteps(source.value, target.value, name).at(-1).visited;
    const astarCells = new Set(explored('manhattan'));
    onlyDijkstra = new Set(explored('none').filter(cell => !astarCells.has(cell)));
    get('compare-diff').textContent = `${onlyDijkstra.size} felter udforskes kun af Dijkstra. De markeres på gridet, når ruten er fundet.`;
    get('compare-route').textContent = `${source.value} → ${target.value}`;
    for (const [name, { label: text }] of Object.entries(heuristics)) {
      const last = createSteps(source.value, target.value, name).at(-1);
      const end = key(goal().row, goal().col);
      const row = document.createElement('tr');
      if (name === heuristic.value) row.className = 'is-selected';
      for (const value of [text, `${last.visited.length} felter`, format(last.gCosts[end])]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    }
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    get('play').textContent = 'Afspil';
  }

  function render() {
    const step = steps[index];
    const previousStep = steps[Math.max(0, index - 1)];
    const queued = new Set(step.queue.map(item => item.cell));
    // Fuld g/h kun ved current og naboer; ellers drukner gridet i tal.
    const focus = new Set();
    if (step.current && step.phase !== 'complete') {
      const [currentRow, currentCol] = step.current.split(',').map(Number);
      focus.add(step.current);
      for (const [r, c] of neighbors(currentRow, currentCol)) focus.add(key(r, c));
    }
    const showDifference = step.phase === 'complete';
    for (const [cell, { group, g, h, f, prev }] of cellElements) {
      const [row, col] = cell.split(',').map(Number);
      const known = step.gCosts[cell] !== undefined;
      const active = step.current === cell && step.phase !== 'settle';
      const state = step.path.includes(cell) ? 'route'
        : active ? 'active'
        : step.visited.includes(cell) ? 'visited'
        : queued.has(cell) ? 'discovered' : 'unknown';
      const difference = showDifference && state !== 'route' && onlyDijkstra.has(cell) ? ' only-dijkstra' : '';
      const estimateOnly = step.phase === 'start' ? ' estimate' : '';
      group.setAttribute('class', `cell ${state}${difference}${estimateOnly}${step.neighbor === cell ? ' inspect' : ''}`);
      const hValue = estimate(row, col);
      // h er kendt på forhånd og vises på alle felter i første trin; f først, når feltet er fundet.
      h.textContent = focus.has(cell) ? hValue : '';
      g.textContent = focus.has(cell) && known ? step.gCosts[cell] : '';
      f.textContent = step.phase === 'start' ? hValue : known ? step.gCosts[cell] + hValue : '';
      prev.textContent = arrowTo(cell, step.previous[cell]);
    }
    renderAxes(step);
    renderQueue(step);
    renderCode(step, previousStep);
    const phases = { start: 'initialize', select: 'poll · visited', skip: 'stale entry', inspect: 'compare', relax: 'relax', keep: 'no update', settle: 'neighbors done', complete: 'done', unreachable: 'unreachable' };
    get('phase').textContent = phases[step.phase];
    get('current-node').textContent = step.current ? label(step.current) : '—';
    get('current-cost').textContent = step.polled ? `${step.polled.g} + ${step.polled.h} = ${step.polled.f}` : '—';
    get('explored').textContent = step.visited.length;
    // f stiger, når skønnet viser sig at være for optimistisk, fx ved en mur.
    const levels = [...new Set(steps.slice(0, index + 1).filter(s => s.phase === 'select').map(s => s.polled.f))];
    get('f-levels').textContent = levels.length ? `${levels.length > 5 ? '… → ' : ''}${levels.slice(-5).join(' → ')}` : '—';
    const end = key(goal().row, goal().col);
    get('result').hidden = step.phase !== 'complete' && step.phase !== 'unreachable';
    get('result').textContent = step.phase === 'complete'
      ? `${source.value} → ${target.value} · ${step.gCosts[end]} skridt · ${step.visited.length} felter udforsket`
      : step.phase === 'unreachable' ? `${source.value} → ${target.value} · ∞` : '';
    get('step-count').textContent = `Trin ${index + 1} / ${steps.length}`;
    get('timeline').value = index;
    get('back').disabled = index === 0;
    get('next').disabled = index === steps.length - 1;
    get('play').disabled = index === steps.length - 1;
    if (index === steps.length - 1) pause();
  }

  function reset() {
    pause();
    rawSteps = createSteps(source.value, target.value, heuristic.value);
    renderComparison();
    setStepMode(0);
  }
  function setStepMode(rawIndex) {
    steps = AStarPlayback.selectSteps(rawSteps, get('show-all-steps').checked);
    index = steps.findIndex(step => step.rawIndex >= rawIndex);
    if (index < 0) index = steps.length - 1;
    get('timeline').max = steps.length - 1;
    render();
  }
  function play() {
    if (timer) { pause(); return; }
    get('play').textContent = 'Pause';
    timer = setInterval(() => { index = Math.min(index + 1, steps.length - 1); render(); }, Number(get('speed').value));
  }

  for (const city of cities) {
    source.add(new Option(city.name, city.name));
    target.add(new Option(city.name, city.name));
  }
  for (const [name, { label: text }] of Object.entries(heuristics)) heuristic.add(new Option(text, name));
  source.value = 'Vestby'; target.value = 'Østby'; heuristic.value = 'manhattan';
  for (const select of [source, target, heuristic]) select.addEventListener('change', reset);
  get('reset').addEventListener('click', reset);
  get('next').addEventListener('click', () => { pause(); index = Math.min(index + 1, steps.length - 1); render(); });
  get('back').addEventListener('click', () => { pause(); index = Math.max(0, index - 1); render(); });
  get('play').addEventListener('click', play);
  get('timeline').addEventListener('input', event => { pause(); index = Number(event.target.value); render(); });
  get('speed').addEventListener('change', () => { if (timer) { pause(); play(); } });
  get('show-all-steps').addEventListener('change', () => { pause(); setStepMode(steps[index].rawIndex); });
  const roads = grid.flat().filter(value => value === 0).length;
  get('graph-summary').textContent = `${ROWS} × ${COLS} felter · ${roads} vej-felter · ${cities.length} byer · hvert skridt koster 1`;
  drawGrid(); drawCode(); reset();
})();
