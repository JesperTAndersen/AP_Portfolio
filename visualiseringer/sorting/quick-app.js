(() => {
  const { datasets, equalPriceGroups } = SortingData;
  const { createSteps, selectSteps } = QuickSortDemo;
  const get = id => document.getElementById(id);
  let input, rawSteps, steps, index = 0, timer = null;
  const slots = new Map();
  let rangeBar, iPointer, jPointer;

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  const slotWidth = () => 100 / input.length;
  const leftOf = position => `${position * slotWidth()}%`;
  const priceOf = name => input.find(item => item.name === name).price;
  const rule = () => get('pivot-rule').value;

  function drawBars() {
    const bars = get('bars');
    bars.replaceChildren();
    get('indexes').replaceChildren();
    get('range').replaceChildren();
    slots.clear();
    const maxPrice = Math.max(...input.map(item => item.price));
    const ranks = new Map();
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
    // i og j har hver sin række og flytter sig med en overgang, så man kan se hvem der rykker.
    get('pointers').replaceChildren();
    iPointer = element('span', 'i-pointer', 'i');
    jPointer = element('span', 'j-pointer', 'j');
    for (const pointer of [iPointer, jPointer]) {
      pointer.style.width = `${slotWidth()}%`;
      get('pointers').append(pointer);
    }
    rangeBar = element('div', 'range-bar');
    rangeBar.append(element('span'));
    get('range').append(rangeBar);
  }

  // Linjerne fra QuickSort.java. on() afgør om linjen kører i trinnet, note() giver konkrete værdier.
  const call = step => `${step.range[0]}, ${step.range[1]}`;
  const frame = step => step.stack.at(-1);
  const isCall = (step, side) => step.phase === 'call' && step.side === side;
  const quickSortLines = name => [
    { text: `private static void ${name}(Product[] products, int low, int high)`, on: s => s.phase === 'call' || s.phase === 'base', note: s => `// ${name}(${call(s)})` },
    { text: '    if (low >= high) return;', on: s => s.phase === 'base', note: s => `// ${s.range[0]} >= ${s.range[1]}: base case` },
    ...(name === 'quickSortMedianOfThree'
      ? [{ text: '    moveMedianToEnd(products, low, high);', on: s => s.phase.startsWith('median'), note: () => '' }]
      : []),
    { text: '    int pivotIndex = partition(products, low, high);', on: s => s.phase === 'place-pivot', note: s => `// pivotIndex = ${s.pivotIndex}` },
    { text: `    ${name}(products, low, pivotIndex - 1);`, on: s => isCall(s, 'left') || (s.phase === 'base' && s.side === 'left'), note: s => `// ${name}(${call(s)})` },
    { text: `    ${name}(products, pivotIndex + 1, high);`, on: s => isCall(s, 'right') || (s.phase === 'base' && s.side === 'right'), note: s => `// ${name}(${call(s)})` }
  ];
  const medianLines = [
    { text: '', on: () => false },
    { text: 'private static void moveMedianToEnd(Product[] products, int low, int high)', on: s => s.phase.startsWith('median'), note: () => '' },
    { text: '    int middle = low + (high - low) / 2;', on: s => s.phase === 'median-start', note: s => `// middle = ${s.candidates[1]}` },
    { text: '    if (products[middle] < products[low]) swap(products, low, middle);', on: s => s.phase === 'median-compare' && s.which === 0, note: s => medianNote(s) },
    { text: '    if (products[high] < products[low]) swap(products, low, high);', on: s => s.phase === 'median-compare' && s.which === 1, note: s => medianNote(s) },
    { text: '    if (products[high] < products[middle]) swap(products, middle, high);', on: s => s.phase === 'median-compare' && s.which === 2, note: s => medianNote(s) },
    { text: '    swap(products, middle, high);', on: s => s.phase === 'median-move', note: s => `// pivot = ${s.order[s.range[1]]}` }
  ];
  const partitionLines = [
    { text: '', on: () => false },
    { text: 'private static int partition(Product[] products, int low, int high)', on: s => ['pivot', 'compare', 'swap', 'place-pivot'].includes(s.phase), note: s => `// low = ${s.range[0]}, high = ${s.range[1]}` },
    { text: '    int pivotPrice = products[high].getPrice();', on: s => s.phase === 'pivot', note: s => `// ${s.order[s.pivotIndex]}: ${priceOf(s.order[s.pivotIndex])}` },
    { text: '    int i = low - 1;', on: s => s.phase === 'pivot', note: s => `// i = ${s.i}` },
    { text: '    for (int j = low; j < high; j++)', on: s => s.phase === 'compare', note: s => `// j = ${s.j} (j rykker altid frem)` },
    { text: '        comparisons++;', on: s => s.phase === 'compare', note: s => `// = ${s.comparisons}` },
    { text: '        if (products[j].getPrice() <= pivotPrice)', on: s => s.phase === 'compare', note: s => `// ${priceOf(s.order[s.j])} <= ${priceOf(s.order[s.pivotIndex])}? ${s.result ? 'ja' : 'nej'}` },
    { text: '            i++;', on: s => s.phase === 'advance-i', note: s => `// i = ${s.i - 1} → ${s.i}` },
    { text: '            swap(products, i, j);', on: s => s.phase === 'swap', note: s => s.i === s.j ? '// samme plads: byt med sig selv' : `// byt ${s.i} og ${s.j}` },
    { text: '    swap(products, i + 1, high);', on: s => s.phase === 'place-pivot', note: s => `// pivot til plads ${s.pivotIndex}` },
    { text: '    return i + 1;', on: s => s.phase === 'place-pivot', note: s => `// = ${s.pivotIndex}` }
  ];
  function medianNote(step) {
    const [low, middle, high] = step.candidates;
    const [a, b] = [[low, middle], [low, high], [middle, high]][step.which];
    // Ved et byt står de allerede byttet, så den der nu står på a var den mindste.
    const [first, second] = step.result ? [step.order[b], step.order[a]] : [step.order[a], step.order[b]];
    return `// ${priceOf(second)} < ${priceOf(first)}? ${step.result ? 'ja, byt' : 'nej'}`;
  }

  let codeElements = [];
  function drawCode() {
    const lines = rule() === 'median'
      ? [...quickSortLines('quickSortMedianOfThree'), ...medianLines, ...partitionLines]
      : [...quickSortLines('quickSort'), ...partitionLines];
    get('code').replaceChildren();
    codeElements = lines.map(line => {
      const item = element('li');
      const note = element('span', 'note');
      item.append(element('span', '', line.text || ' '), note);
      get('code').append(item);
      return { item, note, line };
    });
  }

  function renderCode(step) {
    for (const { item, note, line } of codeElements) {
      const current = line.on(step);
      item.classList.toggle('is-current', current);
      note.textContent = current && line.note ? line.note(step) : '';
    }
    get('explanation').textContent = step.message;
  }

  const PARTITIONING = ['pivot', 'compare', 'advance-i', 'swap'];

  // Farven på hver plads kommer fra de fire områder i partition: [low..i] <= pivot, [i+1..j-1] > pivot, [j..high-1] ikke undersøgt, high = pivot.
  function stateOf(step, position) {
    const finals = new Set(step.finals);
    const inPair = step.pair && step.pair.includes(position);
    if (step.phase === 'done' || (finals.has(position) && step.phase !== 'place-pivot')) return 'final';
    if (!step.range) return '';
    const [low, high] = step.range;
    if (position < low || position > high) return 'outside';
    if (step.phase === 'place-pivot') return position === step.pivotIndex ? 'final' : position < step.pivotIndex ? 'small' : 'large';
    if (step.phase.startsWith('median')) return inPair ? 'swap' : step.candidates && step.candidates.includes(position) ? 'candidate' : 'untested';
    if (PARTITIONING.includes(step.phase)) {
      if (position === step.pivotIndex) return 'pivot';
      if (step.phase === 'swap' && inPair && step.pair[0] !== step.pair[1]) return 'swap';
      if (step.phase === 'advance-i') {
        // i er lige rykket ind på den første "> pivot"-vare, som nu skal byttes ud.
        if (position === step.j) return 'compare';
        if (position === step.i) return 'large target';
        if (position < step.i) return 'small';
        return position < step.j ? 'large' : 'untested';
      }
      if (position <= step.i) return 'small';
      if (step.phase === 'compare' && position === step.j) return 'compare';
      const examinedUpTo = step.phase === 'swap' ? step.j : (step.j ?? step.range[0]) - 1;
      if (position <= examinedUpTo) return 'large';
      return 'untested';
    }
    return 'untested';
  }

  function renderBars(step) {
    step.order.forEach((name, position) => {
      const slot = slots.get(name);
      slot.style.left = leftOf(position);
      slot.className = `bar-slot ${stateOf(step, position)}`;
    });

    const partitioning = PARTITIONING.includes(step.phase);
    iPointer.hidden = !partitioning;
    if (partitioning) {
      // i = low - 1 betyder "<= pivot"-området er tomt: vis i lige før low.
      const before = step.i < step.range[0];
      iPointer.style.left = leftOf(before ? step.range[0] : step.i);
      iPointer.textContent = before ? `i = ${step.i}` : 'i';
      iPointer.classList.toggle('before', before);
      iPointer.classList.toggle('moved', step.phase === 'advance-i');
    }
    jPointer.hidden = step.j === null;
    if (step.j !== null) jPointer.style.left = leftOf(step.j);

    rangeBar.hidden = !step.range || step.range[0] > step.range[1];
    if (!rangeBar.hidden) {
      const [low, high] = step.range;
      rangeBar.style.left = leftOf(low);
      rangeBar.style.width = `${(high - low + 1) * slotWidth()}%`;
      rangeBar.firstChild.textContent = `low = ${low} · high = ${high}`;
    }
  }

  function renderStack(step) {
    get('stack').replaceChildren();
    const name = rule() === 'median' ? 'quickSortMedianOfThree' : 'quickSort';
    [...step.stack].reverse().forEach((frame, k) => {
      const item = element('li', k === 0 ? 'current' : '');
      item.append(element('code', '', `${name}(${frame.low}, ${frame.high})`), element('span', '', frame.doing + (frame.pivot !== null ? ` · pivot på ${frame.pivot}` : '')));
      get('stack').append(item);
    });
    if (!step.stack.length) get('stack').append(element('li', 'empty', step.phase === 'done' ? 'Alle kald er færdige' : 'Intet kald endnu'));
  }

  function renderPartitions(step) {
    get('partitions').replaceChildren();
    step.partitions.forEach((part, k) => {
      const row = element('tr');
      if (k === step.partitions.length - 1 && step.phase === 'place-pivot') row.className = 'is-active';
      const verdict = part.verdict;
      row.append(element('td', '', `${part.low}–${part.high}`), element('td', '', `${part.pivot} ${part.price}`),
        element('td', '', `${part.left} · ${part.right}`), element('td', `verdict ${verdict}`, verdict));
      get('partitions').append(row);
    });
    if (!step.partitions.length) {
      const row = element('tr');
      const cell = element('td', 'muted', 'Ingen partitioner endnu');
      cell.colSpan = 4;
      row.append(cell);
      get('partitions').append(row);
    }
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
    for (const key of Object.keys(datasets)) {
      const row = element('tr');
      row.dataset.key = key;
      row.append(element('td', '', datasets[key].label.replace(/ \(.*/, '')));
      for (const pivotRule of ['last', 'median']) {
        const last = createSteps(datasets[key].products, pivotRule).at(-1);
        const cell = element('td', '', last.comparisons);
        cell.dataset.rule = pivotRule;
        cell.append(element('span', 'depth', ` · dybde ${last.maxDepth}`));
        row.append(cell);
      }
      get('cases').append(row);
    }
  }

  const phases = {
    start: 'start', call: 'kald', base: 'base case', 'median-start': 'median af tre', 'median-compare': 'median: sammenlign',
    'median-move': 'median → high', pivot: 'vælg pivot', compare: 'compare', 'advance-i': 'i++', swap: 'swap', 'place-pivot': 'pivot på plads', done: 'færdig'
  };

  function pause() {
    clearInterval(timer);
    timer = null;
    get('play').textContent = 'Afspil';
  }

  function render() {
    const step = steps[index];
    renderBars(step);
    renderCode(step);
    renderStack(step);
    renderPartitions(step);
    renderStability(step);
    for (const row of get('cases').children) {
      row.classList.toggle('is-current-case', row.dataset.key === get('dataset').value);
      for (const cell of row.querySelectorAll('[data-rule]')) cell.classList.toggle('is-rule', row.dataset.key === get('dataset').value && cell.dataset.rule === rule());
    }
    const partitioning = PARTITIONING.includes(step.phase);
    get('phase').textContent = phases[step.phase];
    get('call').textContent = step.range ? `(${call(step)})` : '—';
    get('pivot').textContent = step.pivotIndex !== null && step.phase !== 'done' ? step.order[step.pivotIndex] : '—';
    get('i').textContent = partitioning ? step.i : '—';
    get('j').textContent = step.j ?? '—';
    get('comparisons').textContent = step.comparisons;
    get('swaps').textContent = step.swaps;
    get('depth').textContent = step.stack.length;
    get('result').hidden = step.phase !== 'done';
    get('result').textContent = step.phase === 'done' ? `Sorteret · ${step.comparisons} sammenligninger · ${step.swaps} ombytninger · største dybde ${step.maxDepth}` : '';
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
    rawSteps = createSteps(input, rule());
    drawBars();
    drawCode();
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
  get('pivot-rule').addEventListener('change', reset);
  get('mode').addEventListener('change', () => { pause(); setStepMode(steps[index].rawIndex); });
  get('reset').addEventListener('click', reset);
  get('next').addEventListener('click', () => { pause(); index = Math.min(index + 1, steps.length - 1); render(); });
  get('back').addEventListener('click', () => { pause(); index = Math.max(0, index - 1); render(); });
  get('play').addEventListener('click', play);
  get('timeline').addEventListener('input', event => { pause(); index = Number(event.target.value); render(); });
  get('speed').addEventListener('change', () => { setSpeed(); if (timer) { pause(); play(); } });
  // #trin=12, #sorted, #median i adressen åbner direkte på et datasæt, pivotvalg eller trin.
  for (const key of Object.keys(datasets)) if (location.hash.includes(key)) get('dataset').value = key;
  if (location.hash.includes('median')) get('pivot-rule').value = 'median';
  setSpeed(); drawCases(); reset();
  const linked = /trin=(\d+)/.exec(location.hash);
  if (linked) { index = Math.min(Math.max(Number(linked[1]) - 1, 0), steps.length - 1); render(); }
})();
