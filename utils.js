"use strict";

const {arango} = require('internal');
const _ = require('lodash');
const fs = require('fs');
const ascii = require('ascii-table');

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

exports.waitForEstimatorSync = function () {
  return arango.POST("/_admin/execute", "require('internal').waitForEstimatorSync();"); // make sure estimates are consistent
};

const scanDir = dir => fs.listTree(dir).filter(x => x.endsWith(".js")).map(x => fs.join(dir, x));

exports.collectObjects = function (root) {
  let datasets = {};

  for (const filename of scanDir(root)) {
    try {
      const isDisabled = filename.toLowerCase().includes('disabled');
      const content = require(filename);

      for (const [name, properties] of Object.entries(content)) {
        const lowerName = name.toLowerCase();
        if (datasets[lowerName] !== undefined) {
          throw new Error(`object ${name} already defined in file ${datasets[lowerName].filename}`);
        }
        datasets[lowerName] = _.merge(properties, {name, filename, isDisabled});
      }

    } catch (e) {
      throw new Error(`failed to load objects in ${filename}: ${e}`);
    }
  }

  return datasets;
};

exports.matchDatasetsAndQueries = function (queries, datasets) {
  // Compute which queries want to use which datasets
  for (let query of Object.values(queries)) {
    query.selectedDatasets = query.dataset;
    if (!query.selectedDatasets) {
      if (!query.selectDatasets) {
        throw new Error(`query ${query.name} (${query.filename}) neither provides attribute "dataset" nor function "selectDatasets".`);
      }
      query.selectedDatasets = query.selectDatasets(Object.values(datasets));
    }
    if (!Array.isArray(query.selectedDatasets)) {
      query.selectedDatasets = [query.selectedDatasets];
    }
    query.selectedDatasets = query.selectedDatasets.map(x => typeof (x) === "object" ? x : datasets[x]);

    for (const dataset of query.selectedDatasets) {
      if (!dataset.queriesUsedBy) {
        dataset.queriesUsedBy = [];
      }
      dataset.queriesUsedBy.push(query.name);
    }

    if (!query.isDisabled && query.selectedDatasets.every(ds => ds.isDisabled)) {
      console.warn(`all datasets of query ${query.name} (${query.filename}) are disabled. Query will not be executed.`);
      query.isDisabled = true;
    }
  }
};

exports.createExecutionPlan = function (datasets) {

  const handleExecution = function (keys) {
    let result = [];

    for (const key of keys) {
      const dataset = datasets[key];

      // handle all children
      const children = dataset.children ? handleExecution(Object.keys(dataset.children)) : [];

      // check if all children are disabled
      if (children.length === 0 && dataset.queriesUsedBy.length === 0) {
        console.warn(`dataset ${dataset.name} has no dependencies and no queries, implicitly disabled`);
        continue;
      }

      let isDisabled = datasets[key].isDisabled;
      if (isDisabled && children.length !== 0) {
        console.warn(`dataset ${dataset.name} has dependencies, but is disabled, implicitly enabled`);
      } else if (isDisabled) {
        continue;
      }

      result.push({name: dataset.name, children, queries: dataset.queriesUsedBy || []});
    }
    return result;
  };


  const roots = Object.keys(datasets).filter(n => !datasets[n].extend);
  return handleExecution(roots);
};

exports.constructDependencyTree = function (datasets) {
  for (let ds of Object.values(datasets)) {
    if (ds.extend === undefined) {
      continue;
    }

    const parent = datasets[ds.extend];
    if (parent === undefined) {
      throw new Error(`dataset ${ds.name} extends unknown dataset ${ds.extend}`);
    }

    if (!parent.children) {
      parent.children = {};
    }
    parent.children[ds.name] = ds;
  }
};

exports.linearizeExecutionPlan = function (plan) {

  const recurse = function (plan, active) {
    return plan.map(function (e) {
      active.push(e.name);
      let result = (e.queries || []).map(q => [[...active], q]);
      result = _.concat(result, recurse(e.children, active));
      active.pop();
      return result;
    }).flat();
  };

  return recurse(plan, []).sort();
};

const findCommonPrefix = function (a, b) {
  let i = 0;
  while (i < a.length && i < b.length) {
    if (a[i] !== b[i]) {
      break;
    }
    i++;
  }
  return i;
};

exports.executeLinearPlan = function (datasets, queries, plan, handler, options = {}) {
  const activeDatasets = [];

  let result = [];
  try {
    for (const entry of plan) {
      const [usedDatasets, queryname] = entry;
      let commonIndex = findCommonPrefix(activeDatasets, usedDatasets);

      // tear down datasets that are no longer used
      while (activeDatasets.length > commonIndex) {
        const name = activeDatasets.pop();
        console.info(`tearing down dataset ${name}`);
        if (!options.dryRun) {
          datasets[name].tearDown();
        }
      }
      // set up new datasets

      while (usedDatasets.length > commonIndex) {
        const ds = datasets[usedDatasets[commonIndex]];
        console.info(`setting up dataset ${ds.name}`);
        activeDatasets.push(usedDatasets[commonIndex]);
        commonIndex += 1;
        if (!options.dryRun) {
          ds.setUp();
        }
      }

      // run all the queries
      console.info(`executing query ${queryname}`);
      if (!options.dryRun) {
        const combinedDataset = _.omit(_.merge({}, ...activeDatasets.map(n => datasets[n])), ['children', 'queriesUsedBy']);
        const res = handler(combinedDataset, queries[queryname]);
        result.push([[...activeDatasets], queryname, ...res]);
      }
    }

  } finally {
    // tear down all datasets
    while (activeDatasets.length > 0) {
      const name = activeDatasets.pop();
      console.info(`tearing down dataset ${name}`);
      datasets[name].tearDown();
    }
  }
  return result;
};

exports.displayResults = function (results) {
  const tbl = new ascii('Results');
  tbl.setHeading('query', 'data set', 'time')
      .setAlign(2, ascii.RIGHT);
  for (const x of results) {
    tbl.addRow(_.last(x[0]), x[1], x[3].toFixed(4));
  }
  print(tbl.toString());
};
