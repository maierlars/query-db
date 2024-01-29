/*jshint strict: true */
'use strict';

const {db} = require('@arangodb');
const {fillCollection} = require('utils');

const database = "MyDatabase";

exports["example-data-set"] = {
  setUp: function () {
    db._createDatabase(database);
    db._useDatabase(database);
    const c = db._create("c");
    fillCollection(c, 10000, (k) => ({value: k}));
  },

  tearDown: function () {
    db._useDatabase("_system");
    db._dropDatabase(database);
  },
};
