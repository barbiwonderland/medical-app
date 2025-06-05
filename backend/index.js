const express = require("express");
const db = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());


const JWT_SECRET = 'tu_clave_secreta_aqui'; // Cambiar por algo seguro y guardarlo en variables de entorno

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM Doctor WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const doctor = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, doctor.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar token JWT con datos mínimos
    const token = jwt.sign(
      { doctor_id: doctor.doctor_id, email: doctor.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

//crear doctor
app.post("/doctors", async (req, res) => {
  const { first_name, last_name, specialization } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO Doctor (first_name, last_name, specialization)
         VALUES ($1, $2, $3) RETURNING *`,
      [first_name, last_name, specialization]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando doctor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//crear paciente
app.post("/patients", async (req, res) => {
  const { first_name, last_name, dob, gender, phone, insurance_info } =
    req.body;

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

//crear cita
app.post("/appointments", async (req, res) => {
  const { doctor_id, patient_id, appointment_date, status, modality } =
    req.body;

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

//crear registro historia clinica
app.post("/medical-history", async (req, res) => {
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

//consulta agenda medica
app.get("/doctors/:doctorId/appointments", async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);

  try {
    const result = await db.query(
      `SELECT * FROM Appointment WHERE doctor_id = $1 ORDER BY appointment_date`,
      [doctorId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando citas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//obtener pacientes

app.get("/patients", async (req, res) => {
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

//filtrar turnos

const day = "Monday"; // viene del frontend o fijo
const modality = "presencial"; // o null para cualquiera

const query = `
  SELECT d.doctor_id, d.first_name, d.last_name, d.specialization
  FROM Doctor d
  JOIN DoctorSchedule ds ON d.doctor_id = ds.doctor_id
  WHERE ds.day_of_week = $1
  ${modality ? "AND ds.modality = $2" : ""}
`;

const params = modality ? [day, modality] : [day];

const result = await db.query(query, params);

// Middleware simplificado para "autenticación" del doctor (por ejemplo, doctor_id en header)
app.use((req, res, next) => {
  const doctorId = req.header("x-doctor-id");
  if (!doctorId) {
    return res.status(401).json({ error: "Doctor no autenticado" });
  }
  req.doctorId = parseInt(doctorId);
  next();
});

// Endpoint para obtener historia clínica de un paciente
app.get("/medical-history/:patientId", async (req, res) => {
  const { doctorId } = req;
  const patientId = parseInt(req.params.patientId);

  try {
    // Verificar cita activa o próxima (ajustar según definición)
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
      return res
        .status(403)
        .json({
          error: "Acceso denegado: No hay cita activa con este paciente",
        });
    }

    // Obtener toda la historia clínica
    const historyResult = await db.query(
      `
      SELECT * FROM MedicalHistory WHERE patient_id = $1 ORDER BY record_date DESC
    `,
      [patientId]
    );

    res.json(historyResult.rows);
  } catch (error) {
    console.error("Error al obtener historia clínica:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
