'use strict';

const query = `
      FOR doc IN A
        FILTER doc.x >= @min_x AND doc.x <= @max_x
        FILTER doc.y >= @min_y AND doc.y <= @max_y
        RETURN doc.value
    `;

exports["mdi-query-all"] = {
  selectDatasets: ds => ds.filter(({name}) => name.includes('mdi')),
  create: (ds) => ({query, bindVars: {
      min_x: 0, max_x: ds.mdi.range,
      min_y: 0, max_y: ds.mdi.range,
    }}),
};

exports["mdi-query-half"] = {
  selectDatasets: ds => ds.filter(({name}) => name.includes('mdi')),
  create: (ds) => ({query, bindVars: {
      min_x: 0, max_x: 0.5 * ds.mdi.range,
      min_y: 0, max_y: ds.mdi.range,
    }}),
};

exports["mdi-query-other-half"] = {
  selectDatasets: ds => ds.filter(({name}) => name.includes('mdi')),
  create: (ds) => ({query, bindVars: {
      min_x: 0, max_x: ds.mdi.range,
      min_y: 0, max_y: 0.5 * ds.mdi.range,
    }}),
};

exports["mdi-query-quater"] = {
  selectDatasets: ds => ds.filter(({name}) => name.includes('mdi')),
  create: (ds) => ({query, bindVars: {
      min_x: 0, max_x: 0.5 * ds.mdi.range,
      min_y: 0, max_y: 0.5 * ds.mdi.range,
    }}),
};
