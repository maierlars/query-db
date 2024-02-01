"use strict";

const _ = require('lodash');
const util = require('utils');


const datasets = util.collectObjects("dataset");
const queries = util.collectObjects("query");

util.matchDatasetsAndQueries(queries, datasets);

util.constructDependencyTree(datasets);

const plan = util.createExecutionPlan(datasets);


const linearPlan = util.linearizeExecutionPlan(plan);

// TODO split plan into multiple buckets for bucketized execution


const executeQueryProfiler = function (dataset, query) {
  const q = query.create(dataset);
  const opts = q.options || {};
  opts.profile = 4;

  let runs = [];
  for (let k = 0; k < 5; k++) {
    const result = db._createStatement({
      query: q.query,
      bindVars: q.bindVars,
      options: opts
    }).execute().getExtra();
    runs.push(result.profile.executing);
  }

  return [runs, _.sum(runs)];
};


const result = util.executeLinearPlan(datasets, queries, linearPlan, executeQueryProfiler, {dryRun: false});



util.displayResults(result);
