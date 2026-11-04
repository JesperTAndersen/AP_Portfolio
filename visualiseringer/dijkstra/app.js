(() => {
  if (!DijkstraDemo) {
    document.getElementById('missing-data').hidden = false;
    document.querySelector('.toolbar').hidden = true;
    document.querySelector('.workspace').hidden = true;
    return;
  }
  const { nodes, edges, createSteps } = DijkstraDemo;
  const get = id => document.getElementById(id);
  const source = get('source');
  const target = get('target');
  const graph = get('graph');
  const svgNS = 'http://www.w3.org/2000/svg';
  let rawSteps, steps, index = 0, timer = null;
  const nodeElements = new Map();
  const edgeElements = new Map();
  const format = value => value === Infinity ? '∞' : String(value);

  function svg(tag, attributes, parent, text) {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (text !== undefined) element.textContent = text;
    parent.append(element);
    return element;
  }

  function drawGraph() {
    const defs = svg('defs', {}, graph);
    for (const [name, color] of [['default', '#a5b3a8'], ['inspect', '#b67922'], ['route', '#236749']]) {
      const marker = svg('marker', { id: `arrow-${name}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, defs);
      svg('path', { d: 'M 0 0 L 10 5 L 0 10 Z', fill: color }, marker);
    }
    const roadLayer = svg('g', {}, graph);
    const labelLayer = svg('g', {}, graph);
    for (const edge of edges) {
      const from = nodes.find(node => node.id === edge.from);
      const to = nodes.find(node => node.id === edge.to);
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      const dx = (to.x - from.x) / length, dy = (to.y - from.y) / length;
      const group = svg('g', { class: 'edge' }, roadLayer);
      const line = svg('line', { x1: from.x + dx * 29, y1: from.y + dy * 29, x2: to.x - dx * 34, y2: to.y - dy * 34, class: 'edge-line', 'marker-end': 'url(#arrow-default)' }, group);
      const label = svg('g', { class: 'edge' }, labelLayer);
      const x = (from.x + to.x) / 2, y = (from.y + to.y) / 2;
      svg('rect', { x: x - 15, y: y - 14, width: 30, height: 28, rx: 6, class: 'edge-label-bg' }, label);
      svg('text', { x, y, class: 'edge-weight' }, label, edge.weight);
      svg('title', {}, group, `${edge.from} → ${edge.to}: ${edge.weight} km`);
      edgeElements.set(edge.id, { group, label, line });
    }
    for (const node of nodes) {
      const group = svg('g', { transform: `translate(${node.x} ${node.y})`, class: 'node' }, graph);
      svg('circle', { r: 27 }, group);
      svg('text', { class: 'node-name', y: 1 }, group, node.id);
      const distance = svg('text', { class: 'node-distance', y: 49 }, group);
      const role = svg('text', { class: 'node-role', y: -42 }, group);
      nodeElements.set(node.id, { group, distance, role });
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
    const routeEdges = step.path.slice(1).map((id, i) => `${step.path[i]}-${id}`);
    for (const edge of edges) {
      const { group, label, line } = edgeElements.get(edge.id);
      const state = routeEdges.includes(edge.id) ? 'route' : step.edge === edge.id ? 'inspect' : 'default';
      group.setAttribute('class', `edge ${state}`);
      label.setAttribute('class', `edge ${state}`);
      line.setAttribute('marker-end', `url(#arrow-${state})`);
    }
    get('distances').replaceChildren();
    for (const node of nodes) {
      const id = node.id;
      const visited = step.visited.includes(id);
      const active = step.current === id && !visited;
      const onRoute = step.path.includes(id);
      const state = onRoute ? 'route' : active ? 'active' : visited ? 'visited' : step.distances[id] < Infinity ? 'discovered' : 'unknown';
      const { group, distance, role } = nodeElements.get(id);
      group.setAttribute('class', `node ${state}`);
      distance.textContent = `${format(step.distances[id])}${step.distances[id] < Infinity ? ' km' : ''}`;
      role.textContent = id === source.value && id === target.value ? 'START / MÅL' : id === source.value ? 'START' : id === target.value ? 'MÅL' : '';
      const row = document.createElement('tr');
      row.className = onRoute ? 'is-route' : active ? 'is-active' : '';
      const status = active ? 'current' : visited ? 'visited' : step.distances[id] < Infinity ? 'kandidat' : 'unknown';
      for (const value of [id, format(step.distances[id]), step.previous[id] ?? '—', status]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      if (step.distances[id] !== previousStep.distances[id]) row.cells[1].style.fontWeight = '800';
      get('distances').append(row);
    }
    get('frontier').replaceChildren();
    for (const id of step.frontier) {
      const item = document.createElement('li');
      item.textContent = `${id} · ${step.distances[id]} km`;
      if (step.current === id) item.className = 'current';
      get('frontier').append(item);
    }
    if (!step.frontier.length) {
      const empty = document.createElement('li');
      empty.className = 'empty'; empty.textContent = '∅';
      get('frontier').append(empty);
    }
    const phases = { start: 'initialize', select: 'extract-min', inspect: 'compare', relax: 'relax', keep: 'no update', settle: 'visited', complete: 'done', unreachable: 'unreachable' };
    if (DijkstraDemo.javaTrace) Object.assign(phases, {
      start: 'queue.add()', select: 'queue.poll()',
      relax: 'relax / queue.add()', skip: 'continue · visited',
      'skip-neighbor': 'continue · nabo visited', settle: 'visited.add()'
    });
    get('phase').textContent = phases[step.phase];
    get('current-node').textContent = step.current ?? '—';
    get('current-edge').textContent = step.edge ? step.edge.replace('-', ' → ') : '—';
    if (DijkstraDemo.javaTrace) renderQueue(step, previousStep);
    get('result').hidden = step.phase !== 'complete' && step.phase !== 'unreachable';
    get('result').textContent = step.phase === 'complete'
      ? `${step.path.join(' → ')} · ${step.distances[target.value]} km`
      : step.phase === 'unreachable' ? `${source.value} → ${target.value} · ∞` : '';
    get('source-label').textContent = source.value;
    get('step-count').textContent = `Trin ${index + 1} / ${steps.length}`;
    get('timeline').value = index;
    get('back').disabled = index === 0;
    get('next').disabled = index === steps.length - 1;
    get('play').disabled = index === steps.length - 1;
    if (index === steps.length - 1) pause();
  }

  function renderQueue(step, previousStep) {
    get('current-distance').textContent = step.currentDistance ?? '—';
    const body = get('priority-queue');
    body.replaceChildren();
    step.queue.forEach((entry, position) => {
      const row = document.createElement('tr');
      const inserted = index === 0 || !previousStep.queue.some(old => old.node === entry.node && old.distance === entry.distance);
      row.className = inserted ? 'queue-added' : entry.stale || entry.visited ? 'queue-stale' : position === 0 ? 'queue-next' : '';
      const status = [entry.visited ? 'visited' : '', entry.stale ? 'gammel' : ''].filter(Boolean).join(' · ') || 'kandidat';
      for (const value of [position + 1, entry.node, entry.distance, status]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    });
    if (!step.queue.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4; cell.textContent = '∅'; row.append(cell); body.append(row);
    }
    get('queue-size').textContent = `size: ${step.queue.length}`;
    let operation = '—';
    if (step.phase === 'select' || step.phase === 'skip') {
      operation = `${step.phase === 'select' ? 'poll() →' : 'skip →'} ${step.current}, ${step.currentDistance} km`;
    } else if (step.phase === 'start' || step.phase === 'relax') {
      const node = step.phase === 'start' ? source.value : step.edge.split('-')[1];
      operation = `add(${node}, ${step.distances[node]})`;
    }
    get('queue-operation').textContent = operation;
  }

  function reset() {
    pause();
    rawSteps = createSteps(source.value, target.value);
    setStepMode(0);
  }
  function setStepMode(rawIndex) {
    steps = DijkstraPlayback.selectSteps(rawSteps, get('show-all-steps').checked);
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
  for (const node of nodes) {
    source.add(new Option(node.id, node.id));
    target.add(new Option(node.id, node.id));
  }
  source.value = 'A'; target.value = 'H';
  source.addEventListener('change', reset);
  target.addEventListener('change', reset);
  get('reset').addEventListener('click', reset);
  get('next').addEventListener('click', () => { pause(); index = Math.min(index + 1, steps.length - 1); render(); });
  get('back').addEventListener('click', () => { pause(); index = Math.max(0, index - 1); render(); });
  get('play').addEventListener('click', play);
  get('timeline').addEventListener('input', event => { pause(); index = Number(event.target.value); render(); });
  get('speed').addEventListener('change', () => { if (timer) { pause(); play(); } });
  get('show-all-steps').addEventListener('change', () => {
    pause();
    setStepMode(steps[index].rawIndex);
  });
  get('graph-summary').textContent = `${nodes.length} byer · ${edges.length} rettede veje · km`;
  drawGraph(); reset();
})();
