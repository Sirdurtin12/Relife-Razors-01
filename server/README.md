# Relife Razor - Synchronisation avec Supabase

Ce dossier contient les outils nécessaires pour synchroniser automatiquement vos schémas SQL avec votre base de données Supabase.

## Configuration

Il existe deux méthodes de connexion à Supabase pour la synchronisation des schémas :

### Méthode 1 : Via l'API Supabase (recommandée)

1. Assurez-vous que le fichier `.env.local` à la racine du projet contient les variables d'environnement suivantes :
   ```
   SUPABASE_URL=https://iiflwzoslnekvkbciyht.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_supabase
   ```

   Pour obtenir votre `SUPABASE_SERVICE_ROLE_KEY` :
   - Connectez-vous à Supabase
   - Allez dans "Paramètres du projet" > "API" 
   - Dans la section "Project API keys", copiez la clé "service_role" (gardez cette clé secrète !)

2. Pour la première utilisation, vous devez créer la fonction `exec_sql` dans Supabase :
   - Allez dans l'éditeur SQL de Supabase
   - Copiez et exécutez le contenu du fichier `docs/migrations/create_exec_sql_function.sql`

### Méthode 2 : Via PostgreSQL direct (alternative)

1. Assurez-vous que le fichier `.env.local` à la racine du projet contient la variable d'environnement suivante :
   ```
   POSTGRES_CONNECTION_STRING=postgresql://postgres:password@db.iiflwzoslnekvkbciyht.supabase.co:5432/postgres
   ```
   
   Remplacez l'URL et le mot de passe par ceux fournis par Supabase dans "Paramètres du projet" > "Base de données" > "Connection string".

## Installation

Installez les dépendances :
```
cd server
npm install
```

## Utilisation

### Synchroniser avec l'API Supabase (recommandé)

```
npm run sync-supabase
```

ou

```
npm run migrate
```

Cette commande :
1. Crée/vérifie la fonction `exec_sql` dans Supabase
2. Applique le schéma principal depuis `docs/supabase_schema.sql`
3. Exécute toutes les migrations dans le dossier `docs/migrations` dans l'ordre alphabétique

### Synchroniser avec PostgreSQL direct (alternative)

```
npm run sync-schema
```

## Structure des fichiers

- `lib/supabase-admin.js`: Module de connexion à l'API Supabase avec des privilèges administrateur
- `lib/postgres.js`: Module de connexion directe à PostgreSQL (alternative)
- `scripts/sync-schema-supabase.js`: Script de synchronisation via l'API Supabase
- `scripts/sync-schema.js`: Script de synchronisation via connexion PostgreSQL
- `docs/migrations/create_exec_sql_function.sql`: Fonction SQL pour permettre l'exécution de SQL dynamique

## Notes importantes

- La clé de service (service_role_key) donne un accès complet à votre base de données. Ne la partagez jamais et ne l'incluez pas dans votre code source public.
- Les transactions SQL sont utilisées pour garantir l'intégrité de la base de données (rollback en cas d'erreur).
- Les migrations sont exécutées dans l'ordre alphabétique des noms de fichiers. Il est recommandé de préfixer les noms de fichiers avec une date (par exemple, `20230501_add_new_table.sql`).
