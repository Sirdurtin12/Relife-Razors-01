const { Pool } = require('pg');
require('dotenv').config({ path: '../.env.local' });

// Récupération de la chaîne de connexion depuis les variables d'environnement
// Format attendu: postgresql://postgres:[PASSWORD]@db.iiflwzoslnekvkbciyht.supabase.co:5432/postgres
const connectionString = process.env.POSTGRES_CONNECTION_STRING;

if (!connectionString) {
  throw new Error('La chaîne de connexion PostgreSQL est manquante. Veuillez configurer POSTGRES_CONNECTION_STRING dans .env.local');
}

// Création du pool de connexions PostgreSQL
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Requis pour la connexion à Supabase
  }
});

// Fonction pour exécuter une requête
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Requête exécutée', { text, duration, rows: res.rowCount });
  return res;
};

// Test de la connexion au démarrage
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erreur de connexion à PostgreSQL:', err);
  } else {
    console.log('Connexion PostgreSQL établie:', res.rows[0]);
  }
});

module.exports = {
  query,
  pool
};
