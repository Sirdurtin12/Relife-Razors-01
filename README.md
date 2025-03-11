# Relife Razor - Plateforme Collaborative de Comparaison de Rasoirs

## Description
Relife Razor est une plateforme web permettant aux passionnés de rasage traditionnel de découvrir, comparer et partager leurs expériences avec différents rasoirs. Le site propose une base de données complète de rasoirs ainsi qu'un espace personnel pour partager ses collections et avis.

## Fonctionnalités Principales
1. Base de données de rasoirs
   - Fiches de rasoirs détaillées
   - Système de recherche et filtrage
   - Système de notation de douceur (échelle de 1 à 20)
   - Visualisation comparative des niveaux d'agressivité
   - Types de rasoirs supportés : DE (Double Edge), AC (Artist Club), GEM, autres

2. Espace utilisateur
   - Gestion de collection personnelle
   - Liste de souhaits
   - Favoris
   - Notation personnelle des rasoirs
   - Avis et commentaires

## Technologies utilisées
- Frontend: Next.js avec React
- Styling: Tailwind CSS
- Base de données: Supabase (PostgreSQL)
- Authentification: Supabase Auth

## Installation et démarrage

### Prérequis
- Node.js (v14 ou plus)
- npm ou yarn

### Installation
1. Cloner le dépôt
```bash
git clone [URL_DU_DEPOT]
cd relife-razor
```

2. Installer les dépendances
```bash
cd client
npm install
# ou
yarn install
```

3. Configuration des variables d'environnement
Créer un fichier `.env.local` dans le dossier client et ajouter les variables suivantes:
```
NEXT_PUBLIC_SUPABASE_URL=https://iiflwzoslnekvkbciyht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZmx3em9zbG5la3ZrYmNpeWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDQ3NzAsImV4cCI6MjA1NjIyMDc3MH0.LAQXtRwrRXI0J4QU41osqVhoyRh0jPSoko208uDupIA
```

4. Démarrer l'application en mode développement
```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible à l'adresse `http://localhost:3000`

## Structure du projet
```
client/
  ├── components/      # Composants React réutilisables
  │   ├── auth/        # Composants liés à l'authentification
  │   ├── layout/      # Composants de mise en page
  │   ├── razors/      # Composants spécifiques aux rasoirs
  │   └── ui/          # Composants d'interface utilisateur génériques
  ├── lib/             # Bibliothèques et utilitaires
  ├── pages/           # Pages Next.js
  ├── public/          # Fichiers statiques
  ├── styles/          # Styles globaux
  └── utils/           # Fonctions utilitaires
```

## Lien vers le site de l'Atelier Durdan
[Atelier Durdan](https://atelierdurdan.com/en)
