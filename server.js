const express = require("express");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const rootDir = __dirname;

app.use(
  express.static(rootDir, {
    index: "index.html",
    extensions: ["html"],
  })
);

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Where is my trip server listening on http://${HOST}:${PORT}`);
});
