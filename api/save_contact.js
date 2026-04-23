// api/save_contact.js — Vercel Serverless Function (Node.js CommonJS)
// Variables de entorno requeridas en Vercel:
// PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT (opcional)

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.PGHOST,
  port:     parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'maindb',
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl:      { rejectUnauthorized: false },
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido.' });
  }

  const { nombres, apellidos, correo, telefono, mensaje } = req.body || {};

  const errors = [];
  if (!nombres)                         errors.push('Nombre requerido.');
  if (!apellidos)                       errors.push('Apellido requerido.');
  if (!correo || !correo.includes('@')) errors.push('Correo inválido.');
  if (!telefono)                        errors.push('Teléfono requerido.');
  if (!mensaje)                         errors.push('Mensaje requerido.');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS Clientes_web (
        id         SERIAL PRIMARY KEY,
        nombres    VARCHAR(100) NOT NULL,
        apellidos  VARCHAR(100) NOT NULL,
        correo     VARCHAR(150) NOT NULL,
        telefono   VARCHAR(30)  NOT NULL UNIQUE,
        mensaje    TEXT         NOT NULL,
        created_at TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    const dup = await client.query('SELECT id FROM Clientes_web WHERE telefono = $1', [telefono]);
    if (dup.rows.length) {
      return res.status(409).json({ success: false, message: 'Ya existe un registro con ese número de teléfono.' });
    }

    await client.query(
      'INSERT INTO Clientes_web (nombres, apellidos, correo, telefono, mensaje) VALUES ($1,$2,$3,$4,$5)',
      [nombres.toUpperCase(), apellidos.toUpperCase(), correo, telefono, mensaje]
    );

    return res.status(200).json({ success: true, message: '¡Mensaje enviado correctamente! Te contactaremos pronto.' });

  } catch (err) {
    console.error('DB Error:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Ya existe un registro con ese número de teléfono.' });
    }
    return res.status(500).json({ success: false, message: 'Error del servidor: ' + err.message });
  } finally {
    client.release();
  }
};
