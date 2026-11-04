/* Ingen DOM eller animation her: algoritmen leverer selvstændige øjebliksbilleder. */
const DijkstraDemo = (() => {
  const nodes = [
    { id: 'A', x: 90, y: 240 }, { id: 'B', x: 270, y: 95 },
    { id: 'C', x: 270, y: 385 }, { id: 'D', x: 460, y: 95 },
    { id: 'E', x: 460, y: 385 }, { id: 'F', x: 650, y: 95 },
    { id: 'G', x: 650, y: 385 }, { id: 'H', x: 830, y: 240 },
    { id: 'I', x: 170, y: 535 }, { id: 'J', x: 360, y: 535 }
  ];
  const edges = [
    ['A', 'B', 8], ['A', 'C', 2], ['C', 'B', 3], ['B', 'D', 2],
    ['C', 'E', 9], ['B', 'E', 6], ['D', 'E', 1], ['D', 'F', 6],
    ['E', 'F', 3], ['E', 'G', 5], ['F', 'H', 4], ['G', 'H', 3],
    ['C', 'I', 2], ['I', 'J', 2]
  ].map(([from, to, weight]) => ({ id: `${from}-${to}`, from, to, weight }));

  function createSteps(source, target) {
    const ids = nodes.map(node => node.id);
    if (!ids.includes(source) || !ids.includes(target)) throw new Error('Ukendt by');
    const distances = Object.fromEntries(ids.map(id => [id, Infinity]));
    const previous = Object.fromEntries(ids.map(id => [id, null]));
    const visited = new Set();
    const steps = [];
    distances[source] = 0;
    const format = distance => distance === Infinity ? '∞' : distance;

    // En sorteret liste er rigeligt til denne graf. Kun bedste kendte afstand vises.
    const frontier = () => ids
      .filter(id => !visited.has(id) && distances[id] < Infinity)
      .sort((a, b) => distances[a] - distances[b] || a.localeCompare(b));

    function save(phase, message, current = null, edge = null, path = []) {
      steps.push({
        phase, message, current, edge, path: [...path],
        distances: { ...distances }, previous: { ...previous },
        visited: [...visited], frontier: frontier()
      });
    }

    save('start', `Start i ${source}. Afstanden er 0 km; alle andre afstande er ukendte (∞).`);
    while (frontier().length) {
      const current = frontier()[0];
      save('select', `Vælg ${current}: den uafsluttede by med lavest kendte afstand (${distances[current]} km).`, current);
      if (current === target) {
        visited.add(current);
        const path = [];
        for (let city = target; city !== null; city = previous[city]) path.unshift(city);
        save('complete', `Målet ${target} er valgt med ${distances[target]} km. Den korteste rute er ${path.join(' → ')}.`, current, null, path);
        return steps;
      }

      for (const edge of edges.filter(edge => edge.from === current)) {
        if (visited.has(edge.to)) continue;
        const candidate = distances[current] + edge.weight;
        save('inspect', `Undersøg ${edge.from} → ${edge.to}: ${distances[current]} + ${edge.weight} = ${candidate} km. Kendt afstand til ${edge.to}: ${format(distances[edge.to])}.`, current, edge.id);
        if (candidate < distances[edge.to]) {
          const oldDistance = distances[edge.to];
          distances[edge.to] = candidate;
          previous[edge.to] = current;
          save('relax', `Opdater ${edge.to}: ${format(oldDistance)} → ${candidate} km. Forgængeren er nu ${current}.`, current, edge.id);
        } else {
          save('keep', `Behold ${edge.to}: ${candidate} km er ikke kortere end ${distances[edge.to]} km.`, current, edge.id);
        }
      }
      visited.add(current);
      save('settle', `${current} er færdigbehandlet. Afstanden ${distances[current]} km er endelig.`, current);
    }
    save('unreachable', `Ingen rettet vej fra ${source} til ${target}. Der er ingen kandidater tilbage.`);
    return steps;
  }
  return { nodes, edges, createSteps };
})();

// Gør den samme browserkode testbar med Node uden pakker eller build.
if (typeof module !== 'undefined') module.exports = DijkstraDemo;
