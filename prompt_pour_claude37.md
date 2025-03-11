# Prompt pour Claude 3.7 : Création de Relife Razor

## Contexte du projet

Développez une application web complète nommée "Relife Razor" dédiée aux passionnés de rasage traditionnel. Cette plateforme permettra aux utilisateurs de découvrir, comparer, et partager leurs expériences avec différents rasoirs. L'application doit être facile à maintenir via une IA pour les futures modifications.

## Technologies à utiliser

- **Frontend** : Next.js avec React
- **Styling** : Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage pour les images
- **Déploiement** : Vercel (ou plateforme équivalente)

## Structure générale de l'application

L'application sera organisée selon la structure suivante :
```
client/
  ├── components/      # Composants React réutilisables
  │   ├── auth/        # Composants liés à l'authentification
  │   ├── layout/      # Composants de mise en page
  │   ├── razors/      # Composants spécifiques aux rasoirs
  │   └── ui/          # Composants d'interface utilisateur génériques
  ├── lib/             # Bibliothèques et utilitaires (incluant client Supabase)
  ├── middleware.ts    # Middleware d'authentification et de routage
  ├── pages/           # Pages Next.js
  │   ├── api/         # Routes API
  ├── public/          # Fichiers statiques
  ├── styles/          # Styles globaux
  └── utils/           # Fonctions utilitaires
server/
  ├── lib/             # Code serveur pour les API routes
  └── migrations/      # Scripts de migration de base de données
```

## Fonctionnalités principales et modèle de données

### 1. Gestion des rasoirs

#### Modèle de données - Rasoirs (razors)
- `id` : ID unique du rasoir
- `manufacturer` : Fabricant du rasoir
- `model` : Modèle du rasoir
- `reference` : Référence du rasoir
- `blade_type` : Type de lame (DE, AC, GEM, autres)
- `image_url` : URL de l'image du rasoir
- `additional_info` : Informations supplémentaires
- `gentleness` : Douceur du rasoir (échelle 1-20)
- `created_by` : ID de l'utilisateur qui a créé la fiche
- `created_at` : Date de création
- `is_private` : Indique si la fiche est privée

#### Spécifications techniques
- `weight_grams` : Poids en grammes
- `gap_mm` : Distance entre lame et peigne (mm)
- `blade_exposure_mm` : Exposition de la lame (mm)
- `cutting_angle` : Angle de coupe (degrés)
- `price_range` : Fourchette de prix
- `base_material` : Matériau de base
- `material_variant` : Variantes de matériaux disponibles
- `available_finish` : Finitions disponibles
- `comb_type` : Type de peigne
- `release_year` : Année de sortie

#### Politiques RLS pour les rasoirs
- "Anyone can view non-private razors" : Permet à n'importe qui de voir les rasoirs non privés
- "Owners and admins can update razors" : Permet aux propriétaires et administrateurs de mettre à jour les rasoirs
- "Admins can delete any razor" : Permet aux administrateurs de supprimer n'importe quel rasoir

### 2. Gestion des collections et variantes

#### Modèle de données - Variantes (razor_variants)
- `id` : ID unique de la variante
- `parent_razor_id` : ID du rasoir parent
- `user_id` : ID de l'utilisateur propriétaire
- `selected_material` : Matériau sélectionné
- `selected_finish` : Finition sélectionnée
- `selected_comb_type` : Type de peigne sélectionné
- `notes` : Notes personnelles

#### Modèle de données - Collections (user_collections)
- `id` : ID unique de l'entrée dans la collection
- `user_id` : ID de l'utilisateur
- `razor_id` : ID du rasoir
- `in_collection` : Présence dans la collection
- `in_wishlist` : Présence dans la liste de souhaits
- `is_favorite` : Statut de favori
- `favorite_rating` : Note de l'utilisateur (1-5)
- `variant_material` : Matériau de la variante
- `variant_finish` : Finition de la variante
- `variant_comb_type` : Type de peigne de la variante
- `variant_notes` : Notes sur la variante
- `is_variant` : Indique s'il s'agit d'une variante

#### Politiques RLS pour les variantes et collections
- "Users can view their own variants" : Les utilisateurs peuvent voir leurs propres variantes
- "Users can insert their own variants" : Les utilisateurs peuvent ajouter leurs propres variantes
- "Users can update their own variants" : Les utilisateurs peuvent mettre à jour leurs propres variantes
- "Users can delete their own variants" : Les utilisateurs peuvent supprimer leurs propres variantes

### 3. Système d'évaluation

#### Modèle de données - Évaluations (user_ratings)
- `id` : ID unique de l'évaluation
- `user_id` : ID de l'utilisateur
- `razor_id` : ID du rasoir
- `gentleness_rating` : Note de douceur (échelle 1-20)
- `comment` : Commentaire de l'utilisateur

#### Politiques RLS pour les évaluations
- "Anyone can view ratings" : Permet à tous de voir les évaluations
- "Users can create their own ratings" : Les utilisateurs peuvent créer leurs propres évaluations
- "Users can update their own ratings" : Les utilisateurs peuvent mettre à jour leurs propres évaluations
- "Users can delete their own ratings" : Les utilisateurs peuvent supprimer leurs propres évaluations

### 4. Gestion des profils utilisateurs

#### Modèle de données - Profils (profiles)
- `id` : ID unique du profil (correspond à auth.users)
- `username` : Nom d'utilisateur
- `full_name` : Nom complet
- `avatar_url` : URL de l'avatar
- `is_admin` : Statut d'administrateur

#### Politiques RLS pour les profils
- "Public profiles are viewable by everyone" : Les profils publics sont visibles par tous
- "Users can update their own profile" : Les utilisateurs peuvent mettre à jour leur propre profil

## Étapes de développement

### Étape 1 : Configuration du projet
1. Créer un nouveau projet Next.js
2. Configurer Tailwind CSS
3. Configurer Supabase avec les paramètres existants
4. Créer le fichier `.env.local` avec les variables Supabase
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://iiflwzoslnekvkbciyht.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[obtenir dans la console Supabase]
   SUPABASE_URL=https://iiflwzoslnekvkbciyht.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZmx3em9zbG5la3ZrYmNpeWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY0NDc3MCwiZXhwIjoyMDU2MjIwNzcwfQ.ua1Lqso5Vtw9-wUkCDZs2rdyzrxX3yTPJrouWJ3lILQ
   ```

### Étape 2 : Création de la structure de la base de données
1. Créer les tables principales : razors, user_ratings, profiles, razor_variants, user_collections
2. Définir les relations entre ces tables
3. Configurer les politiques Row Level Security (RLS)
4. Créer les indexes pour optimiser les requêtes
5. Préparer des scripts de migration pour faciliter les évolutions du schéma

### Étape 3 : Développement de l'authentification
1. Créer les pages d'inscription et de connexion
2. Implémenter le processus d'authentification avec Supabase
3. Créer le système de gestion de profil utilisateur
4. Configurer le middleware d'authentification pour protéger les routes privées
5. Implémenter la redirection des utilisateurs non authentifiés

### Étape 4 : Développement des fonctionnalités des rasoirs
1. Créer la page d'accueil avec les rasoirs récents
2. Développer le formulaire d'ajout de rasoir
3. Développer la page de détail d'un rasoir
4. Implémenter le système d'édition des rasoirs
5. Ajouter la fonctionnalité de clonage de rasoir

### Étape 5 : Gestion des collections
1. Développer le système d'ajout à la collection
2. Créer le système de variantes de rasoirs
3. Implémenter la liste de souhaits
4. Ajouter le système de favoris

### Étape 6 : Système d'évaluation
1. Développer le composant d'échelle de douceur (1-20)
2. Créer le système de commentaires sur les rasoirs
3. Implémenter l'affichage des évaluations sur la page du rasoir

### Étape 7 : Fonctionnalités de recherche et comparaison
1. Développer la page de recherche avancée
2. Créer le système de filtrage par caractéristiques
3. Implémenter la fonctionnalité de comparaison de rasoirs

### Étape 8 : Pages utilisateur et administration
1. Développer la page de profil utilisateur
2. Créer la page de gestion de collection
3. Implémenter les fonctionnalités d'administration

### Étape 9 : Tests et optimisations
1. Mettre en place des tests unitaires pour les composants clés
2. Développer des tests d'intégration pour les fonctionnalités principales
3. Optimiser les performances de chargement des pages
4. Implémenter du lazy loading pour les images et composants lourds
5. Assurer la compatibilité mobile (responsive design)
6. Mettre en cache les requêtes fréquentes pour améliorer les performances

## Gestion des médias et stockage

1. Configurer Supabase Storage pour le stockage des images de rasoirs
2. Implémenter un système de redimensionnement et compression des images
3. Créer des règles de sécurité pour contrôler l'accès aux fichiers
4. Mettre en place un fallback pour les images non disponibles

## Gestion des erreurs et logging

1. Développer un système cohérent de gestion des erreurs API
2. Mettre en place des messages d'erreur utilisateur conviviaux
3. Configurer un système de logging pour suivre les erreurs en production
4. Implémenter des mécanismes de récupération après erreur

## Déploiement et CI/CD

1. Configurer un pipeline CI/CD avec GitHub Actions ou équivalent
2. Mettre en place des environnements de développement, staging et production
3. Automatiser les tests avant déploiement
4. Configurer le déploiement sur Vercel ou plateforme similaire

## Internationalisation (optionnel)

1. Configurer le système d'internationalisation avec next-i18next
2. Préparer les fichiers de traduction pour les langues cibles
3. Implémenter un sélecteur de langue dans l'interface utilisateur

## Contraintes de design et d'implémentation

1. Le code doit être bien documenté pour faciliter la maintenance par une IA
   - Commenter les fonctions complexes
   - Utiliser des noms de variables et fonctions descriptifs
   - Documenter le flux de données entre composants
2. Utiliser des composants modulaires et réutilisables
3. Implémenter une gestion robuste des erreurs
4. Sécuriser l'accès aux données avec des politiques RLS appropriées
5. Assurer une expérience utilisateur intuitive et réactive
6. Structurer le code pour faciliter les évolutions futures

## URLs de Supabase à conserver

- URL Supabase: `https://iiflwzoslnekvkbciyht.supabase.co`
- Clé service: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZmx3em9zbG5la3ZrYmNpeWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY0NDc3MCwiZXhwIjoyMDU2MjIwNzcwfQ.ua1Lqso5Vtw9-wUkCDZs2rdyzrxX3yTPJrouWJ3lILQ`

## Optimisation des performances

1. Implémenter SSR (Server-Side Rendering) pour les pages critiques
2. Utiliser ISR (Incremental Static Regeneration) pour les pages qui changent peu
3. Optimiser les requêtes à la base de données avec des indexes appropriés
4. Mettre en place des stratégies de mise en cache:
   - Cache côté client avec SWR ou React Query
   - Cache côté serveur pour les requêtes fréquentes
5. Optimiser le bundle JavaScript avec code splitting
6. Implémenter la pagination pour les listes longues

## Livrables attendus

1. Code source complet de l'application
2. Documentation sur la structure et le fonctionnement
3. Scripts de migration de base de données
4. Instructions de déploiement
5. Guide de maintenance et d'évolution
6. Documentation des API pour intégrations futures
