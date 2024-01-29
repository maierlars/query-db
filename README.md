
Executed using arangosh:
```
arangosh --javascript.execute run.js --javascript.startup-directory ../js
```
### Queries
If you want to add a query, create a new `.js` file somewhere in the `query` folder.
It should contain something like this
```js
exports["unique-query-identifier"] = {
  dataset: "example-data-set",
  query: `
      FOR doc IN c
        FILTER doc.value == 5
        RETURN doc.value
    `,
  bindVars: {},
  options: {}
};
```

### Datasets
If you want to add a new dataset, create a new `.js` file somewhere in the `dataset` folder.
It should contain something like this:
```js
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
```
