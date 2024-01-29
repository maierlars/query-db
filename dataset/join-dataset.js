'use strict';

const {db} = require('@arangodb');
const {fillCollection} = require('utils');

const database = "MyJoinDatabase";
const indexName = "MyIndex";
const numDocuments = 1000000;

exports["join-data-set-1-1-base"] = {
  setUp: function () {
    db._createDatabase(database);
    db._useDatabase(database);
    const c = db._create("A");
    fillCollection(c, numDocuments, (k) => ({x: k}));
    const d = db._create("B");
    fillCollection(d, numDocuments, (k) => ({x: k}));
  },

  tearDown: function () {
    db._useDatabase("_system");
    db._dropDatabase(database);
  },
};

exports["join-data-set-1-1-normal-index"] = {
  extend: "join-data-set-1-1-base",
  setUp: function () {
    db.A.ensureIndex({type: 'persistent', name: indexName, fields: ["x"]});
    db.B.ensureIndex({type: 'persistent', name: indexName, fields: ["x"]});
  },

  tearDown: function () {
    db.A.dropIndex(indexName);
    db.B.dropIndex(indexName);
  },
};

exports["join-data-set-1-1-unique-index"] = {
  extend: "join-data-set-1-1-base",
  setUp: function () {
    db.A.ensureIndex({type: 'persistent', name: indexName, fields: ["x"], unique: true});
    db.B.ensureIndex({type: 'persistent', name: indexName, fields: ["x"], unique: true});
  },

  tearDown: function () {
    db.A.dropIndex(indexName);
    db.B.dropIndex(indexName);
  },
};
