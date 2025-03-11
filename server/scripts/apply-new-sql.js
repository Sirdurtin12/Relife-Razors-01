const fs = require('fs');
const path = require('path');
const { supabaseAdmin, testConnection } = require('../lib/supabase-admin');

// Obtenez le chemin du fichier SQL depuis les arguments de la ligne de commande
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('Veuillez spécifier le chemin du fichier SQL à exécuter.');
  console.error('Exemple : node apply-new-sql.js "../sql_schema/10.4_add_user_stats.sql"');
  process.exit(1);
}

// Fonction pour lire un fichier SQL
const readSqlFile = (filePath) => {
  const fullPath = path.resolve(__dirname, filePath);
  console.log(`Lecture du fichier SQL : ${fullPath}`);
  return fs.readFileSync(fullPath, 'utf8');
};

// Fonction principale pour appliquer le script SQL
const applySqlScript = async () => {
  try {
    console.log('Vérification de la connexion à Supabase...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Impossible de se connecter à Supabase. Vérifiez vos identifiants.');
      process.exit(1);
    }
    
    console.log(`Exécution du script SQL : ${sqlFilePath}`);
    const sqlScript = readSqlFile(sqlFilePath);
    
    console.log('Contenu du script SQL :');
    console.log(sqlScript.substring(0, 500) + '...');
    
    // Utiliser directement l'API SQL pour exécuter le script
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: sqlScript 
    });
    
    if (error) {
      console.error('Erreur lors de l\'exécution du script SQL :', error);
      process.exit(1);
    }
    
    console.log('Script SQL exécuté avec succès !');
    console.log('Résultat :', data);
    
  } catch (err) {
    console.error('Erreur lors de l\'application du script SQL :', err);
    process.exit(1);
  }
};

// Exécution de la fonction principale
applySqlScript();
