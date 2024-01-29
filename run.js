"use strict";

const fs = require('fs');
const _ = require('lodash');
const ascii = require('ascii-table');

const scanDir = dir => fs.listTree(dir).filter(x => x.endsWith(".js"));

const datasetFiles = scanDir("dataset");
const queriesFiles = scanDir("query");

const queries = _.merge(...queriesFiles.map(f => require(`query/${f}`)));
const datasets = _.merge(...datasetFiles.map(f => require(`dataset/${f}`)));

// TODO check if queries reference datasets that don't exist
// TODO check if other datasets reference datasets that don't exist

// build a dataset to query table
const ds2query = Object.entries(queries).reduce(function (acc, [name, {dataset}]) {
  // TODO add the option to specify a regular expression to select multiple data sets
  const ds = Array.isArray(dataset) ? dataset : [dataset];
  for (const d of ds) {
    const arr = (acc[d] || []);
    arr.push(name);
    acc[d] = arr;
  }
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

const results = [];

const execute = function (list) {

  for (const ds of list) {
    print(`Setting up ${ds}`);
    datasets[ds].setUp();
    try {
      for (const qn of ds2query[ds] || []) {
        print(`Running query ${qn}`);
        const q = queries[qn];
        const opts = q.options || {};
        opts.profile = 4;

        let sum = 0;
        for (let k = 0; k < 5; k++) {
          const result = db._createStatement({
            query: q.query,
            bindVars: q.bindVars,
            options: opts
          }).execute().getExtra();
          sum = result.profile.executing;
        }
        results.push([qn, ds, sum / 5.]);
      }

      execute(ds2deps[ds] || []);
    } finally {
      print(`Tearing down ${ds}`);
      datasets[ds].tearDown();
    }
  }
};

execute(root);

const tbl = new ascii('Results');
tbl.setHeading('query', 'data set', 'time');
for (const x of _.sortBy(results, x => x[0])) {
  tbl.addRow(...x);
}
print(tbl.toString());
