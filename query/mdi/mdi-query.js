'use strict';

const query = `
      FOR doc IN c
        FILTER doc.value == 5
        RETURN doc.value
    `;

exports["mdi-query-all"] = {
  selectDatasets: ds => ds.filter(({name}) => name.includes('mdi')),
  create: () => ({query}),
};
