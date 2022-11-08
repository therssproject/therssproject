const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

app.use((req, res, _next) => {
  console.log({ path: req.path, data: req.body });
  res.send("Ok");
});

const port = process.env.port || 9999;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
