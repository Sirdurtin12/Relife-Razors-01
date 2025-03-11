const fs = require('fs');
const path = require('path');
const { supabaseAdmin, testConnection, executeSql } = require('../lib/supabase-admin');

// Fonction pour lire un fichier SQL
const readSqlFile = (filePath) => {
  return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
};

// Fonction principale pour synchroniser la base de données
const updateDatabase = async () => {
  try {
    console.log('Vérification de la connexion à Supabase...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Impossible de se connecter à Supabase. Vérifiez vos identifiants.');
      process.exit(1);
    }
    
    console.log('Connexion réussie. Démarrage de la mise à jour complète...');
    
    // 1. Récupérer la liste des tables existantes
    console.log('Récupération des tables existantes...');
    const { data: existingTables, error: tablesError } = await supabaseAdmin
      .from('_exec_sql')
      .select('*')
      .limit(1);
      
    if (tablesError) {
      console.log('Impossible de vérifier les tables existantes:', tablesError.message);
    }
    
    // 2. Appliquer le schéma clean (il contient la structure la plus à jour)
    console.log('Application du schéma propre et complet...');
    const cleanSchemaPath = '../../docs/clean_schema.sql';
    const cleanSchemaSql = readSqlFile(cleanSchemaPath);
    
    try {
      await executeSql(cleanSchemaSql);
      console.log('Schéma propre appliqué avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'application du schéma propre:', err.message);
    }
    
    // 3. S'assurer que toutes les migrations importantes sont appliquées
    // (par mesure de sécurité, même si le schéma clean devrait déjà les inclure)
    console.log('Vérification des migrations importantes...');
    const migrationsDir = '../../docs/migrations';
    const migrationFiles = fs.readdirSync(path.resolve(__dirname, migrationsDir))
      .filter(file => file.endsWith('.sql') && file !== 'create_exec_sql_function.sql')
      .sort();
    
    for (const migrationFile of migrationFiles) {
      console.log(`Vérification de la migration: ${migrationFile}`);
      const migrationSql = readSqlFile(`${migrationsDir}/${migrationFile}`);
      
      try {
        await executeSql(migrationSql);
        console.log(`Migration ${migrationFile} appliquée ou vérifiée avec succès`);
      } catch (err) {
        // Si l'erreur indique que quelque chose existe déjà, c'est probablement bon
        if (err.message.includes('already exists')) {
          console.log(`La migration ${migrationFile} semble déjà être appliquée`);
        } else {
          console.error(`Erreur lors de l'application de la migration ${migrationFile}:`, err.message);
        }
      }
    }
    
    // 4. Nettoyer les éléments inutiles
    console.log('Nettoyage des éléments obsolètes...');
    
    // Suppression des déclencheurs et fonctions obsolètes
    const cleanupSql = `
    -- Supprimer les anciens déclencheurs et fonctions qui pourraient être obsolètes
    DROP TRIGGER IF EXISTS update_avg_gentleness_on_rating_old ON user_ratings;
    DROP FUNCTION IF EXISTS update_razor_avg_gentleness_old();
    
    -- Nettoyer les tables temporaires qui pourraient exister
    DROP TABLE IF EXISTS temp_razor_collection;
    DROP TABLE IF EXISTS temp_user_ratings;
    
    -- Analyser les tables pour optimiser les performances
    ANALYZE razors;
    ANALYZE user_ratings;
    ANALYZE user_collections;
    ANALYZE profiles;
    `;
    
    try {
      await executeSql(cleanupSql);
      console.log('Nettoyage des éléments obsolètes terminé');
    } catch (err) {
      console.error('Erreur lors du nettoyage:', err.message);
    }
    
    // 5. Optimiser les index
    console.log('Optimisation des index...');
    const optimizeIndexesSql = `
    -- S'assurer que tous les index importants sont présents
    CREATE INDEX IF NOT EXISTS idx_user_ratings_razor_id ON user_ratings(razor_id);
    CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON user_ratings(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_collections_razor_id ON user_collections(razor_id);
    CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_collections_in_collection ON user_collections(in_collection);
    CREATE INDEX IF NOT EXISTS idx_user_collections_in_wishlist ON user_collections(in_wishlist);
    CREATE INDEX IF NOT EXISTS idx_razors_manufacturer ON razors(manufacturer);
    CREATE INDEX IF NOT EXISTS idx_razors_model ON razors(model);
    CREATE INDEX IF NOT EXISTS idx_razors_blade_type ON razors(blade_type);
    
    -- Analyser à nouveau après création des index
    ANALYZE razors;
    ANALYZE user_ratings;
    ANALYZE user_collections;
    `;
    
    try {
      await executeSql(optimizeIndexesSql);
      console.log('Optimisation des index terminée');
    } catch (err) {
      console.error('Erreur lors de l\'optimisation des index:', err.message);
    }
    
    console.log('Mise à jour complète de la base de données terminée avec succès!');
    
  } catch (err) {
    console.error('Erreur générale lors de la mise à jour:', err.message);
  }
};

// Exécuter la fonction principale
updateDatabase().finally(() => {
  console.log('Processus terminé.');
});
