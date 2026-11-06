/* Ingen DOM eller animation her: algoritmen leverer selvstændige øjebliksbilleder. */
const DijkstraDemo = (() => {
  const nodes = [
    { id: 'S', x: 80, y: 310 },
    { id: 'A', x: 260, y: 110 }, { id: 'B', x: 460, y: 110 }, { id: 'C', x: 660, y: 110 },
    { id: 'D', x: 300, y: 310 }, { id: 'E', x: 520, y: 310 },
    { id: 'F', x: 260, y: 510 }, { id: 'G', x: 460, y: 510 }, { id: 'H', x: 660, y: 510 },
    { id: 'M', x: 840, y: 310 }
  ];
  // Samme vejnet og rækkefølge som createGraph() i Dijkstra.java.
  const edges = [
    // Øverste rute – fælden: de lokalt billigste kanter, men C → M koster 12. I alt 15 km.
    ['S', 'A', 1], ['A', 'B', 1], ['B', 'C', 1], ['C', 'M', 12],
    // Midterste rute – blindgyde: udforskes helt, fordi den er tættere på S end M er.
    ['S', 'D', 5], ['D', 'E', 4],
    // Nederste rute – starter dyrere (S → F = 4), men er den korteste vej: 10 km.
    ['S', 'F', 4], ['F', 'G', 2], ['G', 'H', 2], ['H', 'M', 2],
    // Direkte vej: giver G en foreløbig afstand på 7, som senere forbedres til 6 via F.
    ['S', 'G', 7]
  ].map(([from, to, weight]) => ({ id: `${from}-${to}`, from, to, weight }));

  // previous peger baglæns, så vi går fra mål til start og indsætter forrest.
  function buildPath(previous, target) {
    const path = [];
    for (let city = target; city !== null; city = previous[city]) path.unshift(city);
    return path;
  }

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
      save('select', `Grådigt valg: ${current} er den uafsluttede by med lavest samlet afstand fra start (${distances[current]} km). Afstanden er nu endelig.`, current);
      visited.add(current);
      if (current === target) {
        const path = buildPath(previous, target);
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
          const note = edge.to === target ? ` Målet har nu en foreløbig rute, men den er ikke nødvendigvis den korteste – ${target} er først endelig, når den selv vælges.` : '';
          save('relax', `Opdater ${edge.to}: ${format(oldDistance)} → ${candidate} km. Forgængeren er nu ${current}.${note}`, current, edge.id);
        } else {
          save('keep', `Behold ${edge.to}: ${candidate} km er ikke kortere end ${distances[edge.to]} km.`, current, edge.id);
        }
      }
      save('settle', `Alle veje ud af ${current} er undersøgt. Næste by vælges.`, current);
    }
    save('unreachable', `Ingen rettet vej fra ${source} til ${target}. Der er ingen kandidater tilbage.`);
    return steps;
  }
  return { nodes, edges, createSteps };
})();

// Gør den samme browserkode testbar med Node uden pakker eller build.
if (typeof module !== 'undefined') module.exports = DijkstraDemo;
