/**
 * Script pour exécuter un fichier SQL spécifique sur la base de données
 * Usage: node run-sql.js chemin/vers/fichier.sql
 */

const fs = require('fs');
const path = require('path');
const { supabaseAdmin, testConnection, executeSql } = require('../lib/supabase-admin');

// Vérifier les arguments
if (process.argv.length < 3) {
  console.error('Usage: node run-sql.js chemin/vers/fichier.sql');
  process.exit(1);
}

// Récupérer le chemin du fichier SQL
const sqlFilePath = process.argv[2];
const absolutePath = path.resolve(process.cwd(), sqlFilePath);

// Exécuter le fichier SQL
const runSqlFile = async () => {
  try {
    // Vérifier l'existence du fichier
    if (!fs.existsSync(absolutePath)) {
      console.error(`Le fichier ${absolutePath} n'existe pas.`);
      process.exit(1);
    }

    // Vérifier la connexion
    console.log('Vérification de la connexion à Supabase...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Impossible de se connecter à Supabase. Vérifiez vos identifiants.');
      process.exit(1);
    }
    
    // Lire le contenu du fichier SQL
    console.log(`Lecture du fichier ${sqlFilePath}...`);
    const sqlContent = fs.readFileSync(absolutePath, 'utf8');
    
    // Exécuter le script SQL
    console.log('Exécution du script SQL...');
    await executeSql(sqlContent);
    
    console.log('Script SQL exécuté avec succès!');
  } catch (err) {
    console.error('Erreur lors de l\'exécution du script SQL:', err.message);
    process.exit(1);
  }
};

// Exécuter la fonction principale
runSqlFile();
