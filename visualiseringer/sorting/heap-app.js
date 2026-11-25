(() => {
  const { datasets, equalPriceGroups } = SortingData;
  const { createSteps, selectSteps } = HeapSortDemo;
  const get = id => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  let input, rawSteps, steps, index = 0, timer = null;
  const slots = new Map();
  const treeNodes = new Map();
  const treeEdges = [];
  let ranks, finalLine, iPointer, largestPointer;

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function svg(tag, attributes, parent, text) {
    const item = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, value);
    if (text !== undefined) item.textContent = text;
    parent.append(item);
    return item;
  }

  const slotWidth = () => 100 / input.length;
  const leftOf = position => `${position * slotWidth()}%`;
  const priceOf = name => input.find(item => item.name === name).price;

  // Plads k i arrayet tegnes som node k i træet: niveau = antal gange man kan gå til parent.
  function treePosition(k) {
    const level = Math.floor(Math.log2(k + 1));
    const first = 2 ** level - 1;
    const count = 2 ** level;
    // 40 px margen i hver side, så pladsnumrene på de yderste nodes kan ses.
    return { x: 40 + ((k - first + 0.5) / count) * 820, y: 42 + level * 96 };
  }

  function drawBars() {
    const bars = get('bars');
    bars.replaceChildren();
    get('indexes').replaceChildren();
    get('pointers').replaceChildren();
    slots.clear();
    const maxPrice = Math.max(...input.map(item => item.price));
    ranks = new Map();
    equalPriceGroups(input).forEach((group, groupIndex) => {
      group.names.forEach((name, rank) => ranks.set(name, { rank: rank + 1, groupIndex, price: group.price }));
    });
    for (const item of input) {
      const slot = element('div', 'bar-slot');
      slot.style.width = `${slotWidth()}%`;
      const column = element('div', 'bar-column');
      const bar = element('div', 'bar');
      bar.style.height = `${8 + 82 * item.price / maxPrice}%`;
      const rank = ranks.get(item.name);
      if (rank) bar.append(element('span', `rank group-${rank.groupIndex}`, rank.rank));
      column.append(element('span', 'bar-price', item.price), bar);
      slot.append(column, element('span', 'bar-name', item.name));
      slot.title = `${item.name}: ${item.price} kr`;
      bars.append(slot);
      slots.set(item.name, slot);
    }
    finalLine = element('div', 'final-line');
    finalLine.append(element('span', '', 'sorteret →'));
    bars.append(finalLine);
    for (let position = 0; position < input.length; position++) {
      const label = element('span', '', position);
      label.style.left = leftOf(position);
      label.style.width = `${slotWidth()}%`;
      get('indexes').append(label);
    }
    iPointer = element('span', '', 'i');
    largestPointer = element('span', '', 'largest');
    for (const pointer of [iPointer, largestPointer]) {
      pointer.style.width = `${slotWidth()}%`;
      get('pointers').append(pointer);
    }
  }

  function drawTree() {
    const tree = get('heap-tree');
    tree.replaceChildren();
    treeNodes.clear();
    treeEdges.length = 0;
    const n = input.length;
    const edgeLayer = svg('g', {}, tree);
    for (let child = 1; child < n; child++) {
      const parent = Math.floor((child - 1) / 2);
      const a = treePosition(parent), b = treePosition(child);
      treeEdges.push({ child, line: svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'heap-edge' }, edgeLayer) });
    }
    // Pladsnumrene står fast; varerne (grupperne herunder) flytter sig mellem dem.
    for (let k = 0; k < n; k++) {
      const { x, y } = treePosition(k);
      svg('text', { x: x - 40, y: y - 26, class: 'heap-index' }, tree, `[${k}]`);
    }
    for (const item of input) {
      const group = svg('g', { class: 'heap-node' }, tree);
      svg('circle', { r: 28 }, group);
      svg('text', { y: 1, class: 'heap-price' }, group, item.price);
      svg('text', { y: 45, class: 'heap-name' }, group, item.name);
      const rank = ranks.get(item.name);
      if (rank) {
        svg('circle', { cx: 22, cy: -20, r: 9, class: `heap-rank group-${rank.groupIndex}` }, group);
        svg('text', { x: 22, y: -19, class: 'heap-rank-text' }, group, rank.rank);
      }
      treeNodes.set(item.name, group);
    }
  }

  // Linjerne fra HeapSort.java. on() afgør om linjen kører i trinnet, note() giver konkrete værdier.
  const top1 = s => s.phase === 'heapify' && !s.recursive && s.stage === 1;
  const top2 = s => s.phase === 'heapify' && !s.recursive && s.stage === 2;
  const childName = s => s.compareWith === 2 * s.i + 1 ? 'left' : 'right';
  const codeLines = [
    { text: '// FASE 1: BYG MAX-HEAPEN', comment: true },
    { text: 'for (int i = n / 2 - 1; i >= 0; i--)', on: s => s.phase === 'build-start' || top1(s), note: s => s.phase === 'build-start' ? `// start: ${input.length} / 2 - 1 = ${Math.floor(input.length / 2) - 1}` : `// i = ${s.i}` },
    { text: '    heapify(products, n, i);', on: top1, note: s => `// heapify(i = ${s.i})` },
    { text: '// FASE 2: BYT ROOT MED SIDSTE, GENOPRET HEAPEN', comment: true },
    { text: 'for (int end = n - 1; end > 0; end--)', on: s => s.phase === 'extract', note: s => `// end = ${s.end}` },
    { text: '    swap(products, 0, end);', on: s => s.phase === 'extract', note: s => `// ${s.order[s.end]} til plads ${s.end}` },
    { text: '    heapify(products, end, 0);', on: top2, note: s => `// heapSize = ${s.heapSize}` },
    { text: '', comment: true },
    { text: 'private static void heapify(Product[] products, int heapSize, int i)', on: s => ['heapify', 'compare', 'sink', 'settled'].includes(s.phase), note: s => `// i = ${s.i}, heapSize = ${s.heapSize}` },
    { text: '    int largest = i;', on: s => s.phase === 'heapify', note: s => `// = ${s.i}` },
    { text: '    int leftChild = 2 * i + 1;', on: s => s.phase === 'heapify', note: s => `// = ${2 * s.i + 1}${2 * s.i + 1 < s.heapSize ? '' : ' (uden for heapen)'}` },
    { text: '    int rightChild = 2 * i + 2;', on: s => s.phase === 'heapify', note: s => `// = ${2 * s.i + 2}${2 * s.i + 2 < s.heapSize ? '' : ' (uden for heapen)'}` },
    { text: '    if (leftChild < heapSize && products[leftChild] > products[largest]) largest = leftChild;', on: s => s.phase === 'compare' && childName(s) === 'left', note: s => compareNote(s) },
    { text: '    if (rightChild < heapSize && products[rightChild] > products[largest]) largest = rightChild;', on: s => s.phase === 'compare' && childName(s) === 'right', note: s => compareNote(s) },
    { text: '    if (largest != i)', on: s => s.phase === 'sink' || s.phase === 'settled', note: s => `// ${s.largest} != ${s.i}? ${s.phase === 'sink' ? 'ja' : 'nej, stop'}` },
    { text: '        swap(products, i, largest);', on: s => s.phase === 'sink', note: s => `// byt ${s.i} og ${s.largest}` },
    { text: '        heapify(products, heapSize, largest);', on: s => s.phase === 'sink' || (s.phase === 'heapify' && s.recursive), note: s => s.phase === 'sink' ? `// fortsæt fra ${s.largest}` : `// i = ${s.i}` }
  ];
  function compareNote(step) {
    return `// ${priceOf(step.order[step.compareWith])} > ${priceOf(step.order[step.against])}? ${step.result ? `ja, largest = ${step.compareWith}` : 'nej'}`;
  }
  const codeElements = [];
  function drawCode() {
    for (const line of codeLines) {
      const item = element('li', line.comment ? 'comment' : '');
      const note = element('span', 'note');
      item.append(element('span', '', line.text || ' '), note);
      get('code').append(item);
      codeElements.push({ item, note, line });
    }
  }
  function renderCode(step) {
    for (const { item, note, line } of codeElements) {
      const current = !line.comment && line.on(step);
      item.classList.toggle('is-current', current);
      note.textContent = current ? line.note(step) : '';
    }
    get('explanation').textContent = step.message;
  }

  // Samme tilstand bruges til søjlen og til noden, så en vare lyser op begge steder.
  function stateOf(step, position) {
    if (step.phase === 'done' || (step.stage === 2 && position >= step.heapSize)) {
      return step.phase === 'extract' && step.pair && step.pair.includes(position) ? 'swap final' : 'final';
    }
    if (step.pair && step.pair.includes(position)) return 'swap';
    if (step.i === null) return '';
    if (step.phase === 'compare' && (position === step.compareWith || position === step.against)) return 'compare';
    if (position === step.i) return 'compare';
    const children = [2 * step.i + 1, 2 * step.i + 2].filter(child => child < step.heapSize);
    if (step.phase === 'heapify' && children.includes(position)) return 'small';
    return '';
  }

  function render() {
    const step = steps[index];
    const n = input.length;
    step.order.forEach((name, position) => {
      const state = stateOf(step, position);
      const slot = slots.get(name);
      slot.style.left = leftOf(position);
      slot.className = `bar-slot ${state}`;
      const { x, y } = treePosition(position);
      const node = treeNodes.get(name);
      node.style.transform = `translate(${x}px, ${y}px)`;
      node.setAttribute('class', `heap-node ${state}`);
    });
    for (const { child, line } of treeEdges) line.setAttribute('class', `heap-edge${child >= step.heapSize || step.phase === 'done' ? ' cut' : ''}`);

    const showLine = step.stage === 2 && step.heapSize > 0 && step.heapSize < n && step.phase !== 'done';
    finalLine.hidden = !showLine;
    if (showLine) finalLine.style.left = leftOf(step.heapSize);
    iPointer.hidden = step.i === null;
    if (step.i !== null) iPointer.style.left = leftOf(step.i);
    largestPointer.hidden = step.largest === null || step.largest === step.i;
    if (!largestPointer.hidden) largestPointer.style.left = leftOf(step.largest);

    renderCode(step);
    renderFormulas(step);
    renderExtracted(step);
    renderStability(step);
    for (const row of get('cases').children) row.classList.toggle('is-current-case', row.dataset.key === get('dataset').value);

    const phases = { start: 'start', 'build-start': 'fase 1', heapify: 'heapify', compare: 'compare', sink: 'synk · swap', settled: 'stop', 'heap-built': 'heap bygget', extract: 'fase 2 · swap root', 'heap-restored': 'heap genoprettet', done: 'færdig' };
    get('phase').textContent = phases[step.phase];
    get('stage').textContent = step.stage === 1 ? '1 · byg heap' : step.stage === 2 ? '2 · tag ud' : '—';
    get('heap-size').textContent = step.stage ? step.heapSize : '—';
    get('i').textContent = step.i ?? '—';
    get('largest').textContent = step.largest ?? '—';
    get('comparisons').textContent = step.comparisons;
    get('swaps').textContent = step.swaps;
    get('result').hidden = step.phase !== 'done';
    get('result').textContent = step.phase === 'done' ? `Sorteret · ${step.comparisons} sammenligninger · ${step.swaps} ombytninger` : '';
    get('step-count').textContent = `Trin ${index + 1} / ${steps.length}`;
    get('timeline').value = index;
    get('back').disabled = index === 0;
    get('next').disabled = index === steps.length - 1;
    get('play').disabled = index === steps.length - 1;
    if (index === steps.length - 1) pause();
  }

  function renderFormulas(step) {
    const box = get('formulas');
    box.replaceChildren();
    if (step.i === null) {
      box.append(element('p', 'merge-empty', 'Vælg et trin med en node i, så regnes children og parent ud her. Træet er ikke gemt nogen steder: det er kun de her formler.'));
      return;
    }
    const i = step.i;
    const describe = k => k < step.heapSize ? `${step.order[k]} ${priceOf(step.order[k])}` : 'uden for heapen';
    const rows = [
      ['i', `${i}`, describe(i)],
      ['leftChild', `2 · ${i} + 1 = ${2 * i + 1}`, describe(2 * i + 1)],
      ['rightChild', `2 · ${i} + 2 = ${2 * i + 2}`, describe(2 * i + 2)],
      ['parent', i === 0 ? 'root har ingen parent' : `(${i} - 1) / 2 = ${Math.floor((i - 1) / 2)}`, i === 0 ? '' : describe(Math.floor((i - 1) / 2))]
    ];
    for (const [label, formula, value] of rows) {
      const row = element('div', 'formula-row');
      row.append(element('code', '', label), element('span', '', formula), element('b', '', value));
      box.append(row);
    }
  }

  function renderExtracted(step) {
    get('extracted').replaceChildren();
    const n = input.length;
    const from = step.phase === 'done' ? 0 : step.stage === 2 ? step.heapSize : n;
    for (let k = n - 1; k >= from; k--) {
      const item = element('li', k === step.end && step.phase === 'extract' ? 'current' : '');
      item.append(element('code', '', `plads ${k}`), element('span', '', `${step.order[k]} ${priceOf(step.order[k])}`));
      get('extracted').append(item);
    }
    if (from === n) get('extracted').append(element('li', 'empty', step.stage === 1 ? 'Fase 1: heapen bygges først. Intet er taget ud endnu.' : 'Intet taget ud endnu.'));
  }

  function renderStability(step) {
    get('stability').replaceChildren();
    for (const group of equalPriceGroups(input)) {
      const now = step.order.filter(name => group.names.includes(name));
      const ok = now.every((name, k) => name === group.names[k]);
      const item = element('li');
      item.append(element('div', '', `${group.price} kr · input: ${group.names.join(' før ')}`), element('div', '', `nu: ${now.join(' før ')} `));
      item.lastChild.append(element('span', ok ? 'ok' : 'broken', ok ? '✓ samme rækkefølge' : '✗ byttet om'));
      get('stability').append(item);
    }
  }

  function drawCases() {
    get('cases').replaceChildren();
    for (const key of ['random', 'sorted', 'reversed']) {
      const last = createSteps(datasets[key].products).at(-1);
      const row = element('tr');
      row.dataset.key = key;
      row.append(element('td', '', datasets[key].label.split(' ')[0]), element('td', '', last.comparisons), element('td', '', last.swaps));
      get('cases').append(row);
    }
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    get('play').textContent = 'Afspil';
  }

  function reset() {
    pause();
    input = datasets[get('dataset').value].products;
    rawSteps = createSteps(input);
    drawBars();
    drawTree();
    setStepMode(0);
  }

  function setStepMode(rawIndex) {
    steps = selectSteps(rawSteps, get('mode').value);
    index = steps.findIndex(step => step.rawIndex >= rawIndex);
    if (index < 0) index = steps.length - 1;
    get('timeline').max = steps.length - 1;
    render();
  }

  function setSpeed() {
    document.documentElement.style.setProperty('--move', `${Math.min(350, Number(get('speed').value) * 0.6)}ms`);
  }

  function play() {
    if (timer) { pause(); return; }
    get('play').textContent = 'Pause';
    timer = setInterval(() => { index = Math.min(index + 1, steps.length - 1); render(); }, Number(get('speed').value));
  }

  for (const [key, { label }] of Object.entries(datasets)) get('dataset').add(new Option(label, key));
  get('dataset').value = 'random';
  get('dataset').addEventListener('change', reset);
  get('mode').addEventListener('change', () => { pause(); setStepMode(steps[index].rawIndex); });
  get('reset').addEventListener('click', reset);
  get('next').addEventListener('click', () => { pause(); index = Math.min(index + 1, steps.length - 1); render(); });
  get('back').addEventListener('click', () => { pause(); index = Math.max(0, index - 1); render(); });
  get('play').addEventListener('click', play);
  get('timeline').addEventListener('input', event => { pause(); index = Number(event.target.value); render(); });
  get('speed').addEventListener('change', () => { setSpeed(); if (timer) { pause(); play(); } });
  // #small, #sorted, #trin=12 i adressen åbner direkte på et datasæt eller trin.
  for (const key of Object.keys(datasets)) if (location.hash.includes(key)) get('dataset').value = key;
  setSpeed(); drawCode(); drawCases(); reset();
  const linked = /trin=(\d+)/.exec(location.hash);
  if (linked) { index = Math.min(Math.max(Number(linked[1]) - 1, 0), steps.length - 1); render(); }
})();
