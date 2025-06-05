// Middleware simple con x-doctor-id desde headers

module.exports = (req, res, next) => {
    const doctorId = req.header("x-doctor-id");
    if (!doctorId) {
      return res.status(401).json({ error: "Doctor no autenticado" });
    }
    req.doctorId = parseInt(doctorId);
    next();
  };
  