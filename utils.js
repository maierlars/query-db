"use string";


exports.fillCollection = function (c, n, g) {
  let docs = [];
  for (let k = 0; k < n; k++) {
    docs.push(g(k));
    if (docs.length >= 1000) {
      c.insert(docs);
      docs = [];
    }
  }

  if (docs.length > 0) {
    c.insert(docs);
  }
};
