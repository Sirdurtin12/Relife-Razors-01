Write-Host "Deploiement de Relife Razor sur Vercel..." -ForegroundColor Green

# Vérifier si Vercel CLI est installé
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "Installation de Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Déployer l'application
Write-Host "Lancement du deploiement..." -ForegroundColor Yellow
Write-Host "Suivez les instructions à l'écran pour vous connecter à Vercel si necessaire."

# Exécuter la commande de déploiement
vercel --prod

Write-Host "`nN'oubliez pas de deployer vos modifications SQL vers Supabase !" -ForegroundColor Cyan
