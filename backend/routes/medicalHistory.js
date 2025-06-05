const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// create medical history
router.post("/", async (req, res) => {
  const { patient_id, record_date, description, doctor_notes } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO MedicalHistory (patient_id, record_date, description, doctor_notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, record_date, description, doctor_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando historia clínica:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// get medical history use authmiddleware to verify doctor header
router.get("/:patientId", authMiddleware, async (req, res) => {
  const { doctorId } = req;
  const patientId = parseInt(req.params.patientId);

  try {
    const result = await db.query(
      `
      SELECT 1 FROM Appointment
      WHERE doctor_id = $1
        AND patient_id = $2
        AND appointment_date BETWEEN NOW() - INTERVAL '1 hour' AND NOW() + INTERVAL '4 hour'
      LIMIT 1
      `,
      [doctorId, patientId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: "Acceso denegado: No hay cita activa con este paciente" });
    }

    const historyResult = await db.query(
      `SELECT * FROM MedicalHistory WHERE patient_id = $1 ORDER BY record_date DESC`,
      [patientId]
    );

    res.json(historyResult.rows);
  } catch (error) {
    console.error("Error obteniendo historia clínica:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
