$sourceFolder = "E:\Atelier Durdan\Programmation\Relife Razor Claude 3.7\client"
$destinationZip = "E:\Atelier Durdan\Programmation\Relife Razor Claude 3.7\relife-razor.zip"

# Supprimer le zip existant s'il existe
if (Test-Path $destinationZip) {
    Remove-Item -Path $destinationZip -Force
}

# Créer un dossier temporaire
$tempDir = "E:\Atelier Durdan\Programmation\Relife Razor Claude 3.7\temp-client"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copier les fichiers importants seulement
$foldersAndFilesToCopy = @(
    "components",
    "lib",
    "pages",
    "public",
    "styles",
    "utils",
    ".env.production",
    ".gitignore",
    "next.config.js",
    "package.json",
    "postcss.config.js",
    "tailwind.config.js",
    "tsconfig.json",
    "vercel.json"
)

foreach ($item in $foldersAndFilesToCopy) {
    $sourcePath = Join-Path $sourceFolder $item
    $destinationPath = Join-Path $tempDir $item
    
    if (Test-Path $sourcePath) {
        if ((Get-Item $sourcePath) -is [System.IO.DirectoryInfo]) {
            # C'est un dossier
            Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse -Force
        } else {
            # C'est un fichier
            Copy-Item -Path $sourcePath -Destination $destinationPath -Force
        }
    }
}

# Créer le zip à partir du dossier temporaire
Compress-Archive -Path "$tempDir\*" -DestinationPath $destinationZip -Force

# Nettoyer le dossier temporaire
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Archive créée avec succès : $destinationZip"
