const fs = require('fs');
const path = require('path');
const { pool } = require('../lib/postgres');

// Fonction pour lire un fichier SQL
const readSqlFile = (filePath) => {
  return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
};

// Fonction pour exécuter un script SQL
const executeSqlScript = async (sql) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Script SQL exécuté avec succès');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\'exécution du script SQL:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erreur de connexion:', err);
    throw err;
  }
};

// Fonction principale pour synchroniser le schéma
const syncSchema = async () => {
  try {
    console.log('Démarrage de la synchronisation du schéma...');
    
    // Lecture du fichier de schéma principal
    const schemaPath = '../../docs/supabase_schema.sql';
    const schemaSql = readSqlFile(schemaPath);
    
    // Exécution du script de schéma
    await executeSqlScript(schemaSql);
    
    // Lecture et exécution des migrations
    const migrationsDir = '../../docs/migrations';
    const migrationFiles = fs.readdirSync(path.resolve(__dirname, migrationsDir))
      .filter(file => file.endsWith('.sql'))
      .sort(); // Pour s'assurer que les migrations sont exécutées dans l'ordre
    
    for (const migrationFile of migrationFiles) {
      console.log(`Exécution de la migration: ${migrationFile}`);
      const migrationSql = readSqlFile(`${migrationsDir}/${migrationFile}`);
      await executeSqlScript(migrationSql);
    }
    
    console.log('Synchronisation du schéma terminée avec succès');
  } catch (err) {
    console.error('Erreur lors de la synchronisation du schéma:', err);
  } finally {
    // Fermeture du pool de connexions
    await pool.end();
  }
};

// Exécution de la fonction principale
syncSchema();
