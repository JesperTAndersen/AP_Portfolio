(() => {
  const { datasets, equalPriceGroups } = SortingData;
  const { createSteps, selectSteps } = BubbleSortDemo;
  const get = id => document.getElementById(id);
  let input, rawSteps, steps, index = 0, timer = null;
  const slots = new Map();
  let finalLine, pointerJ, pointerJ1;

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  const slotWidth = () => 100 / input.length;
  const leftOf = position => `${position * slotWidth()}%`;

  function drawBars() {
    const bars = get('bars');
    bars.replaceChildren();
    get('indexes').replaceChildren();
    get('pointers').replaceChildren();
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

    finalLine = element('div', 'final-line');
    finalLine.append(element('span', '', 'endelig plads →'));
    bars.append(finalLine);

    for (let position = 0; position < input.length; position++) {
      const label = element('span', '', position);
      label.style.left = leftOf(position);
      label.style.width = `${slotWidth()}%`;
      get('indexes').append(label);
    }
    pointerJ = element('span', '', 'j');
    pointerJ1 = element('span', '', 'j + 1');
    for (const pointer of [pointerJ, pointerJ1]) {
      pointer.style.width = `${slotWidth()}%`;
      get('pointers').append(pointer);
    }
  }

  // Linjerne fra BubbleSort.java. Hvert trin markerer de linjer, der udføres.
  const codeLines = [
    { text: 'int n = products.length;', phases: ['start'] },
    { text: '', phases: [] },
    { text: 'for (int i = 0; i < n - 1; i++)', phases: ['pass-start', 'done'] },
    { text: '{', phases: [] },
    { text: '    boolean swapped = false;', phases: ['pass-start'] },
    { text: '', phases: [] },
    { text: '    for (int j = 0; j < n - 1 - i; j++)', phases: ['compare'] },
    { text: '    {', phases: [] },
    { text: '        comparisons++;', phases: ['compare'] },
    { text: '        if (products[j].getPrice() > products[j + 1].getPrice())', phases: ['compare'] },
    { text: '        {', phases: [] },
    { text: '            Product temp = products[j];', phases: ['swap'] },
    { text: '            products[j] = products[j + 1];', phases: ['swap'] },
    { text: '            products[j + 1] = temp;', phases: ['swap'] },
    { text: '            swaps++;', phases: ['swap'] },
    { text: '            swapped = true;', phases: ['swap'] },
    { text: '        }', phases: [] },
    { text: '    }', phases: [] },
    { text: '', phases: [] },
    { text: '    if (!swapped)', phases: ['pass-end', 'early-exit'] },
    { text: '    {', phases: [] },
    { text: '        break;', phases: ['early-exit'] },
    { text: '    }', phases: [] },
    { text: '}', phases: [] }
  ];
  const codeElements = [];

  function drawCode() {
    for (const line of codeLines) {
      const item = element('li');
      const code = element('span', '', line.text || ' ');
      const note = element('span', 'note');
      item.append(code, note);
      get('code').append(item);
      codeElements.push({ item, note, line });
    }
  }

  const priceOf = name => input.find(item => item.name === name).price;

  // Konkrete værdier ved den markerede linje, så koden kan læses sammen med søjlerne.
  function codeNote(step, text) {
    const n = input.length;
    if (text.startsWith('int n')) return `// n = ${n}`;
    if (text.startsWith('for (int i')) {
      return step.phase === 'done' ? `// i = ${step.i}: ${step.i} < ${n - 1} er falsk, løkken slutter` : `// i = ${step.i}, gennemløb ${step.i + 1}`;
    }
    if (text.includes('for (int j')) return `// j = ${step.j}, j < ${n - 1 - step.i}`;
    if (text.includes('comparisons++')) return `// = ${step.comparisons}`;
    if (text.includes('if (products[j]')) {
      const [left, right] = step.pair.map(position => step.order[position]);
      return `// ${priceOf(left)} > ${priceOf(right)}? ${step.result ? 'ja' : 'nej'}`;
    }
    // Ved swap er arrayet allerede byttet, så den der nu står på j + 1 var den, der lå i temp.
    if (text.includes('temp = products[j]')) return `// temp = ${step.order[step.pair[1]]}`;
    if (text.includes('swaps++')) return `// = ${step.swaps}`;
    if (text.includes('if (!swapped)')) return step.phase === 'early-exit' ? '// swapped = false → break' : '// swapped = true → næste gennemløb';
    return '';
  }

  function renderCode(step) {
    for (const { item, note, line } of codeElements) {
      const current = line.phases.includes(step.phase);
      item.classList.toggle('is-current', current);
      note.textContent = current ? codeNote(step, line.text) : '';
    }
    get('explanation').textContent = step.message;
  }

  function renderBars(step) {
    step.order.forEach((name, position) => {
      const slot = slots.get(name);
      slot.style.left = leftOf(position);
      const inPair = step.pair && step.pair.includes(position);
      const state = position >= step.finalFrom ? 'final' : inPair ? (step.phase === 'swap' ? 'swap' : 'compare') : '';
      slot.className = `bar-slot ${state}`;
    });
    const showLine = step.finalFrom > 0 && step.finalFrom < input.length;
    finalLine.hidden = !showLine;
    if (showLine) finalLine.style.left = leftOf(step.finalFrom);
    pointerJ.hidden = pointerJ1.hidden = !step.pair;
    if (step.pair) {
      pointerJ.style.left = leftOf(step.pair[0]);
      pointerJ1.style.left = leftOf(step.pair[1]);
    }
  }

  function renderPasses(step) {
    get('passes').replaceChildren();
    for (const pass of step.passes) {
      const row = element('tr');
      const running = pass.placed === null;
      if (running) row.className = 'is-active';
      const placed = running ? '…' : pass.placed === 'alle' ? 'alle (early exit)' : pass.placed;
      for (const value of [pass.number, pass.comparisons, pass.swaps, placed]) row.append(element('td', '', value));
      get('passes').append(row);
    }
    if (!step.passes.length) {
      const row = element('tr');
      const cell = element('td', 'muted', 'Ingen gennemløb endnu');
      cell.colSpan = 4;
      row.append(cell);
      get('passes').append(row);
    }
  }

  function renderStability(step) {
    get('stability').replaceChildren();
    for (const group of equalPriceGroups(input)) {
      const now = step.order.filter(name => group.names.includes(name));
      const ok = now.every((name, k) => name === group.names[k]);
      const item = element('li');
      item.append(
        element('div', '', `${group.price} kr · input: ${group.names.join(' før ')}`),
        element('div', '', `nu: ${now.join(' før ')} `)
      );
      item.lastChild.append(element('span', ok ? 'ok' : 'broken', ok ? '✓ samme rækkefølge' : '✗ byttet om'));
      get('stability').append(item);
    }
    if (!get('stability').children.length) get('stability').append(element('li', '', 'Ingen varer med samme pris i dette input.'));
  }

  function drawCases() {
    const notes = { random: '', sorted: 'best case: O(n)', reversed: 'worst case: n(n−1)/2' };
    get('cases').replaceChildren();
    for (const key of ['random', 'sorted', 'reversed']) {
      const last = createSteps(datasets[key].products).at(-1);
      const row = element('tr');
      row.dataset.key = key;
      for (const value of [datasets[key].label.split(' ')[0], last.comparisons, last.swaps]) row.append(element('td', '', value));
      row.append(element('td', 'muted', notes[key]));
      get('cases').append(row);
    }
  }

  const phases = {
    start: 'start', 'pass-start': 'nyt gennemløb', compare: 'compare', swap: 'swap',
    'pass-end': 'gennemløb færdigt', 'early-exit': 'early exit · break', done: 'færdig'
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
    renderPasses(step);
    renderStability(step);
    for (const row of get('cases').children) row.classList.toggle('is-current-case', row.dataset.key === get('dataset').value);
    get('phase').textContent = phases[step.phase];
    get('pass').textContent = step.i === null || step.phase === 'done' ? '—' : `${step.i + 1} (i = ${step.i})`;
    get('j').textContent = step.j ?? '—';
    get('swapped').textContent = step.i === null || step.phase === 'done' ? '—' : String(step.swapped);
    get('comparisons').textContent = step.comparisons;
    get('swaps').textContent = step.swaps;
    const finished = step.phase === 'early-exit' || step.phase === 'done';
    get('result').hidden = !finished;
    get('result').textContent = finished ? `Sorteret · ${step.comparisons} sammenligninger · ${step.swaps} ombytninger · ${step.passes.length} gennemløb` : '';
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
    const ms = Number(get('speed').value);
    document.documentElement.style.setProperty('--move', `${Math.min(350, ms * 0.6)}ms`);
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
  setSpeed(); drawCode(); drawCases(); reset();
  // #trin=12 i adressen åbner direkte på et bestemt trin.
  const linked = /trin=(\d+)/.exec(location.hash);
  if (linked) { index = Math.min(Math.max(Number(linked[1]) - 1, 0), steps.length - 1); render(); }
})();
