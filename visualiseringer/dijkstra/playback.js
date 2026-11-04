/* Vælger visningstrin. Algoritmens beregninger og oprindelige snapshots bevares. */
const DijkstraPlayback = {
  selectSteps(rawSteps, showAll = false) {
    return rawSteps.flatMap((step, rawIndex) => {
      if (!showAll) {
        // Sammenligningen vises sammen med dens opdatering. Uændrede værdier springes over.
        if (['inspect', 'keep', 'skip-neighbor'].includes(step.phase)) return [];
        // Udtagning og afvisning af en visited post vises som én køændring.
        if (step.phase === 'select' && rawSteps[rawIndex + 1]?.phase === 'skip') return [];
      }
      return [{ ...step, rawIndex }];
    });
  }
};

if (typeof module !== 'undefined') module.exports = DijkstraPlayback;
