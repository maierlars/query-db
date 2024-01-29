/*jshint strict: true */
'use strict';

const {db} = require('@arangodb');

exports["example-data-set-2"] = {
  extend: "example-data-set",
  setUp: function () {
    db.c.ensureIndex({type: "persistent", fields: ["value"], name: "MyIndexName"});
  },

  tearDown: function () {
    db.c.dropIndex("MyIndexName");
  },
};
