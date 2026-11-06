/* Vælger visningstrin. Algoritmens beregninger og oprindelige snapshots bevares. */
const DijkstraPlayback = {
  selectSteps(rawSteps, showAll = false) {
    return rawSteps.flatMap((step, rawIndex) => {
      // Sammenligningen vises sammen med dens opdatering. Uændrede værdier springes over.
      if (!showAll && ['inspect', 'keep'].includes(step.phase)) return [];
      return [{ ...step, rawIndex }];
    });
  }
};

if (typeof module !== 'undefined') module.exports = DijkstraPlayback;
