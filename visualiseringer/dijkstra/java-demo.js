/* Adapter til Java-eksporten. Beregner ingen ruter og bruger ikke dijkstra.js. */
const DijkstraDemo = (() => {
  const data = globalThis.DijkstraJavaData;
  if (!data) return null;
  const positions = {
    A: [90, 240], B: [270, 95], C: [270, 385], D: [460, 95],
    E: [460, 385], F: [650, 95], G: [650, 385], H: [830, 240],
    I: [170, 535], J: [360, 535]
  };
  const nodes = data.nodes.map((id, index) => {
    const angle = 2 * Math.PI * index / data.nodes.length;
    const [x, y] = positions[id] ?? [460 + 340 * Math.cos(angle), 240 + 170 * Math.sin(angle)];
    return { id, x, y };
  });
  function createSteps(source, target) {
    const run = data.runs[`${source}-${target}`];
    if (!run) throw new Error('Start/mål findes ikke i Java-eksporten');
    return run.map(step => {
      const distances = Object.fromEntries(data.nodes.map(id => [id, step.distances[id] ?? Infinity]));
      const previous = Object.fromEntries(data.nodes.map(id => [id, step.previous[id] ?? null]));
      const frontier = [...new Set(step.queue.filter(entry => !entry.stale && !entry.visited).map(entry => entry.node))];
      return { ...step, distances, previous, frontier };
    });
  }
  return { nodes, edges: data.edges, createSteps, javaTrace: true };
})();
