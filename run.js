"use strict";

const fs = require('fs');
const _ = require('lodash');

const scanDir = dir => fs.listTree(dir).filter(x => x.endsWith(".js"));

const datasetFiles = scanDir("dataset");
const queriesFiles = scanDir("query");

const queries = _.merge(...queriesFiles.map(f => require(`query/${f}`)));
const datasets = _.merge(...datasetFiles.map(f => require(`dataset/${f}`)));


// build a dataset to query table
const ds2query = Object.entries(queries).reduce(function (acc, [name, {dataset}]) {
  const arr = (acc[dataset] || []);
  arr.push(name);
  acc[dataset] = arr;
  return acc;
}, {});

const ds2deps = Object.entries(datasets).reduce(function (acc, [name, {extend}]) {
  if (extend === undefined) {
    return acc;
  }
  const arr = (acc[extend] || []);
  arr.push(name);
  acc[extend] = arr;
  return acc;
}, {});

const root = Object.entries(datasets).filter(([name, ds]) => (ds.extend === undefined)).map(x => x[0]);

const execute = function (list) {

  for (const ds of list) {
    print(`Setting up ${ds}`);
    datasets[ds].setUp();
    try {
      for (const qn of ds2query[ds]) {
        print(`Running query ${qn}`);
        const q = queries[qn];
        db._profileQuery(q);
      }

      execute(ds2deps[ds] || []);
    } finally {
      print(`Tearing down ${ds}`);
      datasets[ds].tearDown();
    }
  }
};

execute(root);
