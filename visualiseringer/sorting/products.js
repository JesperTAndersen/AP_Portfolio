/* Samme varer og samme rækkefølger som SortingMain.java, så Java og visualisering giver samme tal.
   Skjorte (249) står bagerst i den tilfældige, så Quick Sorts første pivot deler 4 · 5. */
const SortingData = (() => {
  const product = (name, price) => ({ name, price });

  const datasets = {
    random: {
      label: 'Tilfældig (10 varer)',
      products: [
        product('Hoodie', 299), product('T-shirt', 149), product('Jakke', 499), product('Kasket', 99),
        product('Sokker', 49), product('Bukser', 349), product('Sweater', 299), product('Sko', 599),
        product('Bælte', 149), product('Skjorte', 249)
      ]
    },
    sorted: {
      label: 'Sorteret (10 varer)',
      products: [
        product('Sokker', 49), product('Kasket', 99), product('T-shirt', 149), product('Bælte', 149),
        product('Skjorte', 249), product('Hoodie', 299), product('Sweater', 299), product('Bukser', 349),
        product('Jakke', 499), product('Sko', 599)
      ]
    },
    reversed: {
      label: 'Omvendt (10 varer)',
      products: [
        product('Sko', 599), product('Jakke', 499), product('Bukser', 349), product('Sweater', 299),
        product('Hoodie', 299), product('Skjorte', 249), product('Bælte', 149), product('T-shirt', 149),
        product('Kasket', 99), product('Sokker', 49)
      ]
    },
    // Håndeksemplet fra cheatsheetet.
    small: {
      label: 'Lille eksempel (5 varer)',
      products: [
        product('Hoodie', 299), product('Jakke', 499), product('T-shirt', 149), product('Sweater', 299),
        product('Kasket', 99)
      ]
    }
  };

  // Varer med samme pris får et nummer efter deres plads i input. Stabil = numrene står stadig i orden.
  function equalPriceGroups(products) {
    const byPrice = new Map();
    for (const item of products) {
      if (!byPrice.has(item.price)) byPrice.set(item.price, []);
      byPrice.get(item.price).push(item.name);
    }
    return [...byPrice.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([price, names]) => ({ price, names }));
  }

  return { datasets, equalPriceGroups };
})();

if (typeof module !== 'undefined') module.exports = SortingData;
