# Guide de déploiement de Relife Razor

Ce guide vous aidera à déployer votre application Relife Razor sur Vercel.

## Prérequis

- Un compte [Vercel](https://vercel.com)
- [Node.js](https://nodejs.org/) installé sur votre machine

## Méthode 1 : Déploiement via script PowerShell

1. Ouvrez PowerShell en mode administrateur
2. Naviguez jusqu'au répertoire du client :
   ```powershell
   cd "e:\Atelier Durdan\Programmation\Relife Razor Claude 3.7\client"
   ```
3. Exécutez le script de déploiement :
   ```powershell
   .\deploy.ps1
   ```
4. Suivez les instructions à l'écran pour vous connecter à Vercel et confirmer le déploiement

## Méthode 2 : Déploiement manuel via l'interface Vercel

1. Créez un compte sur [Vercel](https://vercel.com) si vous n'en avez pas déjà un
2. Installez git sur votre machine si ce n'est pas déjà fait
3. Initialisez un dépôt git pour votre projet :
   ```bash
   cd "e:\Atelier Durdan\Programmation\Relife Razor Claude 3.7"
   git init
   git add .
   git commit -m "Initial commit"
   ```
4. Créez un nouveau projet sur GitHub
5. Connectez votre dépôt GitHub à Vercel
6. Configurez les variables d'environnement dans l'interface Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL` : `https://iiflwzoslnekvkbciyht.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZmx3em9zbG5la3ZrYmNpeWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDQ3NzAsImV4cCI6MjA1NjIyMDc3MH0.LAQXtRwrRXI0J4QU41osqVhoyRh0jPSoko208uDupIA`
   - `NEXT_PUBLIC_TINYMCE_API_KEY` : `nyy2sbtsis60l8iggczgjx9ocmtkjs2i1kjd0ehnrmolq0co`
   - `NEXT_PUBLIC_SITE_URL` : `https://relife-razor.vercel.app`
7. Lancez le déploiement depuis l'interface

## Après le déploiement

1. Testez votre application déployée en accédant à l'URL fournie par Vercel
2. Vérifiez que toutes les fonctionnalités (évaluations de douceur, commentaires, etc.) fonctionnent correctement
3. Si nécessaire, mettez à jour les variables d'environnement via le tableau de bord Vercel

## Maintenance et mises à jour

Pour déployer des mises à jour :
1. Apportez vos modifications au code
2. Si vous utilisez GitHub, poussez vos modifications ; Vercel redéploiera automatiquement
3. Si vous utilisez le déploiement en ligne de commande, exécutez simplement `vercel` à nouveau

## Support

En cas de problème lors du déploiement, consultez :
- [Documentation Vercel pour Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Documentation Supabase](https://supabase.io/docs)
