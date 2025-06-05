const express = require("express");
const router = express.Router();
const db = require("../db");

//dob fecha de nacimiento
// create patient
router.post("/", async (req, res) => {
  const { first_name, last_name, dob, gender, phone, insurance_info } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO Patient (first_name, last_name, dob, gender, phone, insurance_info)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, dob, gender, phone, insurance_info]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando paciente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// get all patients
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM Patient ORDER BY last_name, first_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando pacientes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
