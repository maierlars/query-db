'use strict';

const {db} = require('@arangodb');
const {fillCollection} = require('utils');

const database = "MyMdiDatabase";
const indexName = "MyMdiIndex";
const numDocuments = 1000000;

function splitmix32(a) {
  return function () {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    var t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  };
}

const rng = splitmix32(647683213);

const constructMdi3d = function (range) {
  return {

    setUp: function () {
      db._createDatabase(database);
      db._useDatabase(database);
      const c = db._create("A");
      fillCollection(c, numDocuments, function () {
        return {
          x: rng() * range,
          y: rng() * range,
          z: rng() * range,
        };
      });
      c.ensureIndex({type: 'mdi', fields: ['x', 'y', 'z'], name: indexName, fieldValueTypes: 'double'});
    },

    tearDown: function () {
      db._useDatabase("_system");
      db._dropDatabase(database);
    },

    mdi: {range},
  };
};

exports["mdi-3d-dense"] = constructMdi3d(0.001);
exports["mdi-3d-normal"] = constructMdi3d(1);
exports["mdi-3d-wide"] = constructMdi3d(1000);
