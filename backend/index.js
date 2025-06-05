const express = require("express");
const dotenv = require("dotenv");
const app = express();

dotenv.config();
app.use(express.json());

// Rutas
app.use("/login", require("./routes/auth"));
app.use("/doctors", require("./routes/doctors"));
app.use("/patients", require("./routes/patients"));
app.use("/appointments", require("./routes/appointments"));
app.use("/medical-history", require("./routes/medicalHistory"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});