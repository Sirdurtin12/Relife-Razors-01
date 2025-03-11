const fs = require('fs');
const path = require('path');
const { supabaseAdmin, testConnection, executeSql } = require('../lib/supabase-admin');

// Fonction pour lire un fichier SQL
const readSqlFile = (filePath) => {
  return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
};

// Fonction principale pour synchroniser le schéma
const syncSchema = async () => {
  try {
    console.log('Vérification de la connexion à Supabase...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Impossible de se connecter à Supabase. Vérifiez vos identifiants.');
      process.exit(1);
    }
    
    console.log('Démarrage de la synchronisation du schéma...');
    
    // Exécuter d'abord la fonction exec_sql si elle n'existe pas déjà
    console.log('Création/mise à jour de la fonction exec_sql...');
    const execSqlPath = '../../docs/migrations/create_exec_sql_function.sql';
    const execSqlScript = readSqlFile(execSqlPath);
    
    try {
      // Utiliser directement l'API Supabase pour SQL
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        sql_query: execSqlScript 
      });
      
      if (error) {
        // Si l'erreur indique que la fonction n'existe pas encore, c'est normal
        if (!error.message.includes('function exec_sql(text) does not exist')) {
          throw error;
        }
        console.log('La fonction exec_sql n\'existe pas encore, création en cours...');
        
        // On doit utiliser l'API SQL brute pour créer la fonction
        const { error: sqlError } = await supabaseAdmin.from('_postgres').rpc('execute_sql', {
          query: execSqlScript
        });
        
        if (sqlError) throw sqlError;
      }
    } catch (err) {
      console.warn('Note: La fonction exec_sql sera créée par l\'administrateur Supabase.');
      console.warn('Vous devrez exécuter le fichier docs/migrations/create_exec_sql_function.sql dans l\'éditeur SQL de Supabase');
    }
    
    // Lecture du fichier de schéma principal
    console.log('Application du schéma principal...');
    const schemaPath = '../../docs/supabase_schema.sql';
    const schemaSql = readSqlFile(schemaPath);
    
    // Exécution du script de schéma
    await executeSql(schemaSql);
    
    // Lecture et exécution des migrations
    console.log('Application des migrations...');
    const migrationsDir = '../../docs/migrations';
    const migrationFiles = fs.readdirSync(path.resolve(__dirname, migrationsDir))
      .filter(file => file.endsWith('.sql') && file !== 'create_exec_sql_function.sql')
      .sort(); // Pour s'assurer que les migrations sont exécutées dans l'ordre
    
    for (const migrationFile of migrationFiles) {
      console.log(`Exécution de la migration: ${migrationFile}`);
      const migrationSql = readSqlFile(`${migrationsDir}/${migrationFile}`);
      await executeSql(migrationSql);
    }
    
    console.log('Synchronisation du schéma terminée avec succès');
  } catch (err) {
    console.error('Erreur lors de la synchronisation du schéma:', err.message);
  }
};

// Exécution de la fonction principale
syncSchema();
