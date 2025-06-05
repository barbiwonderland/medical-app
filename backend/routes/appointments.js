const express = require("express");
const router = express.Router();
const db = require("../db");

// create appoinment
router.post("/", async (req, res) => {
  const { doctor_id, patient_id, appointment_date, status, modality } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO Appointment (doctor_id, patient_id, appointment_date, status, modality)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [doctor_id, patient_id, appointment_date, status, modality]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando cita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


module.exports = router;
