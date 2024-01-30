'use strict';

exports["simple-join"] = {
  dataset: ["join-data-set-1-1-unique-index", "join-data-set-1-1-normal-index"],
  create: () => ({
    query: `
      FOR doc1 IN A
        FOR doc2 IN B
          FILTER doc1.x == doc2.x
          RETURN [doc1.x, doc2.x]
    `,
  }),
};
