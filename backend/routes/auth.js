// query para login
const result = await db.query('SELECT * FROM Users WHERE email = $1', [email]);

if (result.rows.length === 0) {
  return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
}

const user = result.rows[0];
const passwordMatch = await bcrypt.compare(password, user.password_hash);

if (!passwordMatch) {
  return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
}

// crear token con rol incluido
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '8h' }
);

res.json({ token });
