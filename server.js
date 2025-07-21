const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 10000; // Render använder port 10000

// Serverar din färdigbyggda React-app från 'build'-mappen
app.use(express.static(path.join(__dirname, "build")));

// Denna regel ser till att alla anrop som INTE är till /api/...
// skickar din React-app, så att React Router kan ta över.
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
