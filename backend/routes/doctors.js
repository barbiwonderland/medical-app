const express = require("express");
const router = express.Router();
const db = require("../db");

// Create doctor
router.post("/", async (req, res) => {
  const { first_name, last_name, specialization } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO Doctor (first_name, last_name, specialization) VALUES ($1, $2, $3) RETURNING *`,
      [first_name, last_name, specialization]
    );
    res.status(201).json(result.rows[0]);
    console.error(`Doctor ${first_name} creado correctamente`);
  } catch (err) {
    console.error("Error creando doctor:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// get all doctors
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM Doctor ORDER BY last_name, first_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando doctores:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//get doctor appointments
router.get("/:doctorId/appointments", async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  try {
    const result = await db.query(
      `SELECT * FROM Appointment WHERE doctor_id = $1 ORDER BY appointment_date`,
      [doctorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error consultando citas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
