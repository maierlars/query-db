'use strict';

const query = `
      FOR doc IN c
        FILTER doc.value == 5
        RETURN doc.value
    `;

exports["unique-query-identifier"] = {
  dataset: ["example-data-set", "example-data-set-2"],
  create: () => ({query}),
};
