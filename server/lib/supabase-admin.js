const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// Récupération des informations d'authentification
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key must be defined in .env.local');
}

// Création du client Supabase avec la clé de service (accès complet à la base de données)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test de la connexion
const testConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('razors')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('Connexion Supabase établie avec succès!');
    return true;
  } catch (error) {
    console.error('Erreur de connexion à Supabase:', error.message);
    return false;
  }
};

// Fonction pour exécuter un fichier SQL
const executeSql = async (sql) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    
    if (error) throw error;
    
    console.log('Script SQL exécuté avec succès');
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script SQL:', error.message);
    throw error;
  }
};

module.exports = {
  supabaseAdmin,
  testConnection,
  executeSql
};
