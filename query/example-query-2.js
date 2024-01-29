'use strict';

exports["unique-query-identifier-2"] = {
  dataset: "example-data-set",
  query: `
      FOR doc IN c
        FILTER doc.value == 5
        RETURN doc.value
    `,
  bind: {},
  options: {}
};

exports["unique-query-identifier-3"] = {
  dataset: "example-data-set-2",
  query: `
      FOR doc IN c
        FILTER doc.value == 5
        RETURN doc.value
    `,
  bind: {},
  options: {}
};
