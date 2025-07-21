const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 10000;

// Importera din e-postfunktion
const sendOrderConfirmationHandler = require("./api/send-order-confirmation");

// Denna rad är VIKTIG. Den ser till att servern kan läsa JSON-datan
// som Sanity skickar med i anropet.
app.use(express.json());

// --- DIN NYA API-ROUTE ---
// När ett POST-anrop kommer till denna URL, kör e-postfunktionen.
app.post("/api/send-order-confirmation", sendOrderConfirmationHandler);

// Denna del serverar din React-app
app.use(express.static(path.join(__dirname, "build")));

// Denna regel skickar alla andra anrop till din React-app
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
