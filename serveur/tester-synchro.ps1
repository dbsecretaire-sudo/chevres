# Test du serveur de synchronisation depuis ton PC : connexion, envoi d'une fiche de test, réception.
# Les données de test partent dans l'établissement « test », jamais dans les données de la ferme.
# Usage : .\tester-synchro.ps1 -Identifiant prontabchevres
# Le mot de passe est demandé à l'invite, il n'est ni affiché ni enregistré.

param([Parameter(Mandatory)][string]$Identifiant)

$url = 'https://chevres.pronta.corsica/api/index.php'
$saisie = Read-Host 'Mot de passe' -AsSecureString
$motDePasse = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($saisie))

Write-Host '1. Connexion...'
$connexion = Invoke-RestMethod -Method Post -Uri "$url?r=connexion" -ContentType 'application/json' `
  -Body (@{ identifiant = $Identifiant; mot_de_passe = $motDePasse } | ConvertTo-Json)
$entetes = @{ Authorization = "Bearer $($connexion.jeton)" }
Write-Host "   Connecté en tant que $($connexion.identifiant)."

Write-Host '2. Envoi d une fiche de test...'
$envoi = @{
  etablissement = 'test'
  modifications = @(@{ zone = 'essai'; identifiant = 'fiche-1'; contenu = @{ heure = (Get-Date -Format 'o') } })
}
Invoke-RestMethod -Method Post -Uri "$url?r=pousser" -Headers $entetes -ContentType 'application/json' `
  -Body ($envoi | ConvertTo-Json -Depth 5) | ConvertTo-Json

Write-Host '3. Réception depuis le début du journal...'
Invoke-RestMethod -Uri "$url?r=tirer&etablissement=test&depuis=0" -Headers $entetes | ConvertTo-Json -Depth 5
