# Structure de la base de données Relife Razor

Ce répertoire contient la structure complète et mise à jour de la base de données Relife Razor, organisée en plusieurs fichiers SQL pour faciliter la compréhension et la maintenance.

## Organisation des fichiers

1. `01_schema_setup.sql` - Configuration initiale du schéma et des extensions
2. `02_tables_creation.sql` - Création des tables principales
3. `03_indexes_and_views.sql` - Index et vues
4. `04_security_policies.sql` - Politiques de sécurité Row Level Security (RLS)
5. `05_functions_and_procedures.sql` - Fonctions et procédures stockées
6. `06_triggers_and_automation.sql` - Déclencheurs et automatisations

## Diagramme des relations

```
razors
  |
  ├─── user_ratings
  |
  ├─── user_collections
  |
  └─── razor_variants
```

## Principales tables

### razors
Table principale contenant les fiches des rasoirs avec leurs caractéristiques.

### razor_variants
Variantes spécifiques de rasoirs sélectionnées par les utilisateurs pour leur collection.

### user_ratings
Évaluations des rasoirs par les utilisateurs, incluant une note de douceur et des commentaires.

### user_collections
Collections des utilisateurs, incluant les rasoirs possédés, souhaités et favoris.

### profiles
Profils étendus des utilisateurs liés à la table auth.users de Supabase.

## Politiques de sécurité

Chaque table est protégée par des politiques Row Level Security (RLS) qui définissent précisément quelles opérations (SELECT, INSERT, UPDATE, DELETE) chaque utilisateur peut effectuer sur chaque enregistrement.

Par exemple:
- Les rasoirs non privés sont visibles par tous
- Les rasoirs privés ne sont visibles que par leur créateur
- Les utilisateurs ne peuvent voir que leurs propres variantes dans leur collection
- Les administrateurs peuvent supprimer n'importe quel rasoir

## Instructions d'utilisation

Pour initialiser ou mettre à jour la base de données, exécutez les fichiers SQL dans l'ordre numérique:

```bash
psql -h votre_hote -U votre_utilisateur -d votre_base -f 01_schema_setup.sql
psql -h votre_hote -U votre_utilisateur -d votre_base -f 02_tables_creation.sql
# etc.
```

Avec Supabase, vous pouvez exécuter ces scripts directement dans l'éditeur SQL de l'interface d'administration.

## Notes importantes

- Les relations entre les tables incluent des contraintes de clé étrangère avec suppression en cascade.
- Des déclencheurs automatisent plusieurs aspects, comme la création de profils utilisateur et la synchronisation des collections avec les variantes.
- Les index optimisent les requêtes fréquentes, notamment les recherches par fabricant, modèle et caractéristiques.
