(() => {
  const { datasets, equalPriceGroups } = SortingData;
  const { createSteps, selectSteps } = MergeSortDemo;
  const get = id => document.getElementById(id);
  let input, rawSteps, steps, index = 0, timer = null;
  const slots = new Map();
  const nodeElements = new Map();
  let rangeBar, ranks;

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  const slotWidth = () => 100 / input.length;
  const leftOf = position => `${position * slotWidth()}%`;
  const priceOf = name => input.find(item => item.name === name).price;
  const list = namesList => `[${namesList.join(', ')}]`;

  function drawBars() {
    const bars = get('bars');
    bars.replaceChildren();
    get('indexes').replaceChildren();
    get('range').replaceChildren();
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
      if (rank) {
        const badge = element('span', `rank group-${rank.groupIndex}`, rank.rank);
        badge.title = `${item.name} er nr. ${rank.rank} af varerne til ${rank.price} kr i input`;
        bar.append(badge);
      }
      column.append(element('span', 'bar-price', item.price), bar);
      slot.append(column, element('span', 'bar-name', item.name));
      slot.title = `${item.name}: ${item.price} kr`;
      bars.append(slot);
      slots.set(item.name, slot);
    }
    for (let position = 0; position < input.length; position++) {
      const label = element('span', '', position);
      label.style.left = leftOf(position);
      label.style.width = `${slotWidth()}%`;
      get('indexes').append(label);
    }
    rangeBar = element('div', 'range-bar');
    rangeBar.append(element('span'));
    get('range').append(rangeBar);
  }

  // Træet tegnes som rækker af blokke: hver blok står præcis under de varer, dens kald arbejder på.
  function drawTree() {
    const tree = get('tree');
    tree.replaceChildren();
    nodeElements.clear();
    const depth = Math.max(...rawSteps.nodes.map(node => node.depth));
    tree.style.height = `${(depth + 1) * 48}px`;
    for (const node of rawSteps.nodes) {
      const block = element('div', 'node-block');
      block.style.left = leftOf(node.lo);
      block.style.width = `${(node.hi - node.lo) * slotWidth()}%`;
      block.style.top = `${node.depth * 48}px`;
      const label = element('span');
      block.append(label);
      tree.append(block);
      nodeElements.set(node.key, { block, label, node });
    }
  }

  // Linjerne fra MergeSort.java. on() afgør om linjen kører i trinnet, note() giver konkrete værdier.
  const top = step => step.stack.at(-1);
  const inMerge = step => step.phase.startsWith('merge-') && step.phase !== 'merge-done';
  const compared = step => {
    const m = step.merge;
    const leftIndex = m.leftIndex - (step.take === 'left' ? 1 : 0);
    const rightIndex = m.rightIndex - (step.take === 'right' ? 1 : 0);
    return [m.left[leftIndex], m.right[rightIndex]];
  };
  const codeLines = [
    { text: 'private static void mergeSort(Product[] products)', on: s => ['call', 'base', 'split'].includes(s.phase), note: s => `// ${top(s).hi - top(s).lo} varer` },
    { text: '    if (products.length < 2) return;', on: s => s.phase === 'base', note: s => `// length = ${top(s).hi - top(s).lo}: base case` },
    { text: '    // 1. DEL', comment: true },
    { text: '    int middle = products.length / 2;', on: s => s.phase === 'split', note: s => `// ${top(s).hi - top(s).lo} / 2 = ${s.mid - top(s).lo}` },
    { text: '    left = products[0 .. middle), right = products[middle .. length)', on: s => s.phase === 'split', note: () => '// de to for-løkker' },
    { text: '    // 2. LØS REKURSIVT', comment: true },
    { text: '    mergeSort(left);', on: s => ['call', 'base'].includes(s.phase) && s.side === 'left', note: s => `// ${top(s).hi - top(s).lo} varer` },
    { text: '    mergeSort(right);', on: s => ['call', 'base'].includes(s.phase) && s.side === 'right', note: s => `// ${top(s).hi - top(s).lo} varer` },
    { text: '    // 3. KOMBINÉR (FLET)', comment: true },
    { text: '    merge(products, left, right);', on: s => s.phase === 'merge-start' || s.phase === 'merge-done', note: s => s.phase === 'merge-done' ? '// færdig' : '' },
    { text: '', comment: true },
    { text: 'private static void merge(Product[] result, Product[] left, Product[] right)', on: inMerge, note: () => '' },
    { text: '    int resultIndex = 0, leftIndex = 0, rightIndex = 0;', on: s => s.phase === 'merge-start', note: () => '' },
    { text: '    while (leftIndex < left.length && rightIndex < right.length)', on: s => s.phase === 'merge-compare', note: () => '// begge har varer tilbage' },
    { text: '        comparisons++;', on: s => s.phase === 'merge-compare', note: s => `// = ${s.comparisons}` },
    { text: '        if (left[leftIndex].getPrice() <= right[rightIndex].getPrice())', on: s => s.phase === 'merge-compare', note: s => { const [a, b] = compared(s); return `// ${priceOf(a)} <= ${priceOf(b)}? ${s.result ? 'ja' : 'nej'}`; } },
    { text: '            result[resultIndex] = left[leftIndex]; leftIndex++;', on: s => s.phase === 'merge-compare' && s.take === 'left', note: s => `// ${compared(s)[0]}` },
    { text: '        else result[resultIndex] = right[rightIndex]; rightIndex++;', on: s => s.phase === 'merge-compare' && s.take === 'right', note: s => `// ${compared(s)[1]}` },
    { text: '        resultIndex++;', on: s => s.phase === 'merge-compare', note: s => `// = ${s.merge.resultIndex}` },
    { text: '    while (leftIndex < left.length) kopiér resten af left', on: s => s.phase === 'merge-rest' && s.take === 'left', note: s => `// ${s.merge.left[s.merge.leftIndex - 1]}` },
    { text: '    while (rightIndex < right.length) kopiér resten af right', on: s => s.phase === 'merge-rest' && s.take === 'right', note: s => `// ${s.merge.right[s.merge.rightIndex - 1]}` }
  ];
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

  // Den mindste færdige del, en plads hører til, bestemmer om den er "sorteret del".
  function sortedPart(step, position) {
    return Object.keys(step.done).some(key => {
      const [lo, hi] = key.split('-').map(Number);
      return hi - lo > 1 && position >= lo && position < hi;
    });
  }

  function renderBars(step) {
    const frame = top(step);
    const merge = step.merge;
    const placed = new Set();
    step.order.forEach((name, position) => {
      if (name === null) return;
      placed.add(name);
      const slot = slots.get(name);
      slot.style.left = leftOf(position);
      let state = '';
      if (step.phase === 'done') state = 'final';
      else if (merge && position >= merge.lo && position < merge.hi) {
        state = position === merge.lo + merge.resultIndex - 1 && step.phase !== 'merge-start' ? 'merged just' : 'merged';
      } else if (step.phase === 'split' && position >= frame.lo && position < frame.hi) state = position < step.mid ? 'left-half' : 'right-half';
      else if (sortedPart(step, position)) state = 'sorted-part';
      if (frame && (position < frame.lo || position >= frame.hi) && step.phase !== 'done') state += ' outside';
      slot.className = `bar-slot ${state}`;
    });
    // Varer, der ligger i left/right under fletning, har ingen plads i result endnu.
    for (const [name, slot] of slots) if (!placed.has(name)) slot.className = 'bar-slot away';

    rangeBar.hidden = !frame;
    if (frame) {
      rangeBar.style.left = leftOf(frame.lo);
      rangeBar.style.width = `${(frame.hi - frame.lo) * slotWidth()}%`;
      rangeBar.firstChild.textContent = `${frame.hi - frame.lo} ${frame.hi - frame.lo === 1 ? 'vare' : 'varer'}`;
    }
  }

  function renderTree(step) {
    const frame = top(step);
    const onStack = new Set(step.stack.map(f => `${f.lo}-${f.hi}`));
    for (const [key, { block, label, node }] of nodeElements) {
      let state = 'idle';
      if (step.done[key]) state = 'done';
      if (onStack.has(key)) state = frame && key === `${frame.lo}-${frame.hi}` ? 'current' : 'stack';
      if (step.phase === 'done') state = 'done';
      block.className = `node-block ${state}`;
      // Færdige blokke viser deres sorterede indhold. De andre viser det, der står i listen nu (· = under fletning).
      let content = step.done[key];
      if (!content || state === 'current') content = step.order.slice(node.lo, node.hi);
      label.textContent = content.map(name => name === null ? '·' : priceOf(name)).join('  ');
      block.title = `mergeSort over plads ${node.lo}–${node.hi - 1}`;
    }
  }

  function card(name, className) {
    const item = element('div', `card ${className}`);
    item.append(element('b', '', priceOf(name)), element('span', '', name));
    const rank = ranks.get(name);
    if (rank) item.append(element('i', `rank group-${rank.groupIndex}`, rank.rank));
    return item;
  }

  function renderMerge(step) {
    const view = get('merge');
    view.replaceChildren();
    const m = step.merge;
    if (!m) {
      view.append(element('p', 'merge-empty', step.phase === 'split'
        ? 'Arrayet deles. Fletningen sker først, når begge halvdele er sorteret.'
        : 'Ingen fletning lige nu. Den sker på vej op, når begge halvdele er færdige.'));
      return;
    }
    const row = (label, names, index, side) => {
      const line = element('div', 'merge-row');
      line.append(element('span', 'merge-label', label));
      const cards = element('div', 'cards');
      names.forEach((name, k) => {
        let state = k < index ? 'taken' : k === index ? 'front' : '';
        if (step.take === side && k === index - 1 && step.phase !== 'merge-start') state = 'taken just';
        cards.append(card(name, state));
      });
      line.append(cards);
      line.append(element('span', 'merge-index', `${side}Index = ${index}`));
      return line;
    };
    view.append(row('left', m.left, m.leftIndex, 'left'), row('right', m.right, m.rightIndex, 'right'));
    const resultLine = element('div', 'merge-row result');
    resultLine.append(element('span', 'merge-label', 'result'));
    const cards = element('div', 'cards');
    for (let k = 0; k < m.hi - m.lo; k++) {
      const name = step.order[m.lo + k];
      cards.append(name ? card(name, k === m.resultIndex - 1 && step.phase !== 'merge-start' ? 'just' : '') : element('div', 'card empty', '·'));
    }
    resultLine.append(cards, element('span', 'merge-index', `resultIndex = ${m.resultIndex}`));
    view.append(resultLine);
  }

  function renderStack(step) {
    get('stack').replaceChildren();
    [...step.stack].reverse().forEach((frame, k) => {
      const item = element('li', k === 0 ? 'current' : '');
      const content = step.order.slice(frame.lo, frame.hi).filter(Boolean).map(priceOf).join(' ');
      item.append(element('code', '', `mergeSort(${frame.hi - frame.lo} varer)`), element('span', '', `${frame.doing} · plads ${frame.lo}–${frame.hi - 1}`));
      item.title = content;
      get('stack').append(item);
    });
    if (!step.stack.length) get('stack').append(element('li', 'empty', step.phase === 'done' ? 'Alle kald er færdige' : 'Intet kald endnu'));
  }

  function renderStability(step) {
    get('stability').replaceChildren();
    for (const group of equalPriceGroups(input)) {
      const now = step.order.filter(name => name !== null && group.names.includes(name));
      const ok = now.every((name, k, all) => group.names.indexOf(name) >= (k ? group.names.indexOf(all[k - 1]) : -1));
      const item = element('li');
      item.append(element('div', '', `${group.price} kr · input: ${group.names.join(' før ')}`), element('div', '', `nu: ${now.length === group.names.length ? now.join(' før ') : 'under fletning'} `));
      if (now.length === group.names.length) item.lastChild.append(element('span', ok ? 'ok' : 'broken', ok ? '✓ samme rækkefølge' : '✗ byttet om'));
      get('stability').append(item);
    }
  }

  function drawCases() {
    const notes = { random: '', sorted: 'færrest: venstre side tømmes først, højre kopieres', reversed: 'højre side tømmes først' };
    get('cases').replaceChildren();
    for (const key of ['random', 'sorted', 'reversed']) {
      const row = element('tr');
      row.dataset.key = key;
      row.append(element('td', '', datasets[key].label.split(' ')[0]), element('td', '', createSteps(datasets[key].products).at(-1).comparisons), element('td', 'muted', notes[key]));
      get('cases').append(row);
    }
  }

  const phases = {
    start: 'start', call: 'kald', base: 'base case', split: '1. del', 'merge-start': '3. flet',
    'merge-compare': 'flet: compare', 'merge-rest': 'flet: kopiér rest', 'merge-done': 'flettet', done: 'færdig'
  };

  function pause() {
    clearInterval(timer);
    timer = null;
    get('play').textContent = 'Afspil';
  }

  function render() {
    const step = steps[index];
    renderBars(step);
    renderTree(step);
    renderCode(step);
    renderMerge(step);
    renderStack(step);
    renderStability(step);
    for (const row of get('cases').children) row.classList.toggle('is-current-case', row.dataset.key === get('dataset').value);
    const frame = top(step);
    get('phase').textContent = phases[step.phase];
    get('call').textContent = frame ? `${frame.hi - frame.lo} ${frame.hi - frame.lo === 1 ? 'vare' : 'varer'} (plads ${frame.lo}–${frame.hi - 1})` : '—';
    get('depth').textContent = step.stack.length;
    get('comparisons').textContent = step.comparisons;
    get('result').hidden = step.phase !== 'done';
    get('result').textContent = step.phase === 'done' ? `Sorteret · ${step.comparisons} sammenligninger · ${rawSteps.nodes.length} kald af mergeSort` : '';
    get('step-count').textContent = `Trin ${index + 1} / ${steps.length}`;
    get('timeline').value = index;
    get('back').disabled = index === 0;
    get('next').disabled = index === steps.length - 1;
    get('play').disabled = index === steps.length - 1;
    if (index === steps.length - 1) pause();
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
