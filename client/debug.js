// Ce fichier est destiné à vérifier si le déploiement Next.js fonctionne correctement
console.log('Configuration de débogage pour Next.js');

module.exports = () => {
  console.log('Environnement:', process.env.NODE_ENV);
  console.log('URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('URL du site:', process.env.NEXT_PUBLIC_SITE_URL);
};
