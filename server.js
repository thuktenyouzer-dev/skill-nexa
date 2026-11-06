const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Skill Nexa demo running at http://localhost:${PORT}`);
});
