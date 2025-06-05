const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { pool } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM Doctor WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });

    const doctor = result.rows[0];
    const match = await bcrypt.compare(password, doctor.password_hash);
    if (!match) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign({ doctor_id: doctor.doctor_id, email: doctor.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
