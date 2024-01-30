"use strict";

const {arango} = require('internal');

exports.fillCollection = function (c, n, g) {
  let docs = [];
  let jobs = [];
  for (let k = 0; k < n; k++) {
    docs.push(g(k));
    if (docs.length >= 1000) {
      jobs.push(arango.POST_RAW(`/_db/${encodeURIComponent(c._dbName)}/_api/document/${encodeURIComponent(c.name())}`,
          docs, {"x-arango-async": "store"})
          .headers["x-arango-async-id"]);
      docs = [];
    }
  }

  if (docs.length > 0) {
    c.insert(docs);
  }
};

exports.waitForEstimatorSync = function() {
  return arango.POST("/_admin/execute", "require('internal').waitForEstimatorSync();"); // make sure estimates are consistent
};
