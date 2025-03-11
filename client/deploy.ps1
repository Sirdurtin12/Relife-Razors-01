Write-Host "Préparation du déploiement Vercel pour Relife Razor..." -ForegroundColor Green

# Vérifier si Vercel CLI est installé
$vercelInstalled = $null
try {
    $vercelInstalled = Get-Command "vercel" -ErrorAction SilentlyContinue
} catch {
    # Ne rien faire
}

if (-not $vercelInstalled) {
    Write-Host "Installation de Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Créer un fichier .vercelignore
Write-Host "Configuration des fichiers pour Vercel..." -ForegroundColor Yellow
@"
.git
node_modules
.env.local
README.md
"@ | Out-File -FilePath ".vercelignore" -Encoding utf8 -Force

# Créer un fichier vercel.json
@"
{
  "name": "relife-razor",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://iiflwzoslnekvkbciyht.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZmx3em9zbG5la3ZrYmNpeWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDQ3NzAsImV4cCI6MjA1NjIyMDc3MH0.LAQXtRwrRXI0J4QU41osqVhoyRh0jPSoko208uDupIA",
    "NEXT_PUBLIC_TINYMCE_API_KEY": "nyy2sbtsis60l8iggczgjx9ocmtkjs2i1kjd0ehnrmolq0co",
    "NEXT_PUBLIC_SITE_URL": "https://relife-razor.vercel.app"
  }
}
"@ | Out-File -FilePath "vercel.json" -Encoding utf8 -Force

# Déployer l'application
Write-Host "Déploiement de l'application sur Vercel..." -ForegroundColor Yellow
Write-Host "Note: Vous allez être invité à vous connecter à Vercel si ce n'est pas déjà fait." -ForegroundColor Cyan

$deployResult = $null
$deployCommand = "vercel --prod"
Write-Host "Exécution de: $deployCommand" -ForegroundColor Cyan

# Exécuter la commande de déploiement
& vercel --prod

# Vérifier le résultat
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDéploiement réussi !" -ForegroundColor Green
    Write-Host "Votre application est maintenant disponible sur: https://relife-razor.vercel.app" -ForegroundColor Green
} else {
    Write-Host "`nLe déploiement a rencontré des problèmes." -ForegroundColor Red
    Write-Host "Essayez de déployer manuellement avec: vercel --prod" -ForegroundColor Yellow
}

Write-Host "`nÉtapes supplémentaires:" -ForegroundColor Cyan
Write-Host "1. N'oubliez pas de pousser vos modifications SQL vers Supabase" -ForegroundColor Cyan
Write-Host "2. Vérifiez que votre application fonctionne correctement sur l'URL Vercel" -ForegroundColor Cyan
