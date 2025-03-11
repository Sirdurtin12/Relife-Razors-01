const { supabaseAdmin } = require('../lib/supabase-admin');

const checkTableSchema = async (tableName) => {
  try {
    console.log(`Vérification du schéma de la table ${tableName}...`);
    
    // Récupérer les données de la table
    const { data, error } = await supabaseAdmin.from(tableName).select('*').limit(1);
    
    if (error) {
      console.error('Erreur lors de la récupération des données:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`La table ${tableName} est vide. Impossible d'obtenir le schéma.`);
      
      // Essayons d'obtenir le schéma directement
      console.log('Tentative de récupération du schéma via la RPC...');
      
      const { data: schemaData, error: schemaError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}';`
      });
      
      if (schemaError) {
        console.error('Erreur lors de la récupération du schéma:', schemaError);
        return;
      }
      
      console.log('Colonnes dans la table:');
      console.log(schemaData);
      
      return;
    }
    
    // Afficher les noms des colonnes
    console.log('Colonnes disponibles:', Object.keys(data[0]));
    
    // Afficher un exemple de données
    console.log('Exemple de données:');
    console.log(data[0]);
    
  } catch (err) {
    console.error('Erreur dans checkTableSchema:', err);
  }
};

// Nom de la table à vérifier
const tableName = process.argv[2] || 'user_collections';

checkTableSchema(tableName)
  .then(() => {
    console.log('Terminé.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur non gérée:', err);
    process.exit(1);
  });
