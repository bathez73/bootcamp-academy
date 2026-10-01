$ErrorActionPreference = 'Stop'
$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.env.local'
if (-not (Test-Path -LiteralPath $envPath)) { throw 'Fichier .env.local introuvable.' }

Write-Host 'Configuration Kkiapay / Brevo pour Novenetech Campus'
Write-Host 'Entree sans valeur conserve la configuration existante.'
Write-Host 'Les secrets saisis sont masques et ne seront pas affiches.'

$fields = @(
    @{ Name = 'NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY'; Label = 'Cle PUBLIQUE Kkiapay SANDBOX'; Secret = $false },
    @{ Name = 'KKIAPAY_WEBHOOK_SECRET'; Label = 'Secret hash du webhook Kkiapay SANDBOX'; Secret = $true },
    @{ Name = 'BREVO_API_KEY'; Label = 'Cle API Brevo (pas la cle SMTP)'; Secret = $true },
    @{ Name = 'SENDER_EMAIL'; Label = 'Adresse expediteur validee dans Brevo'; Secret = $false },
    @{ Name = 'SITE_URL'; Label = 'Adresse HTTPS publique de Campus, si disponible'; Secret = $false }
)
$updates = @{}
foreach ($field in $fields) {
    if ($field.Secret) {
        $secure = Read-Host $field.Label -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        try { $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr); $secure.Dispose() }
    } else { $value = Read-Host $field.Label }
    $value = $value.Trim()
    if (-not $value) { continue }
    if ($value -match '[\s#"''`$]') { throw 'Valeur invalide : espaces ou caracteres reserves.' }
    if ($field.Name -eq 'SENDER_EMAIL' -and $value -notmatch '^[^@]+@[^@]+\.[^@]+$') { throw 'Email invalide.' }
    if ($field.Name -eq 'SITE_URL') {
        $uri = $null
        if (-not [Uri]::TryCreate($value, [UriKind]::Absolute, [ref]$uri) -or $uri.Scheme -ne 'https' -or $uri.AbsolutePath -ne '/' -or $uri.Query -or $uri.Fragment -or $uri.UserInfo) {
            throw 'Indiquer uniquement une origine HTTPS, par exemple https://campus.exemple.com.'
        }
        $value = $value.TrimEnd('/')
    }
    $updates[$field.Name] = $value
}

# Relire au dernier moment pour conserver toute autre modification du fichier.
$content = [IO.File]::ReadAllText($envPath)
foreach ($name in $updates.Keys) {
    $line = $name + '=' + $updates[$name]
    $pattern = '(?m)^' + [regex]::Escape($name) + '=[^\r\n]*'
    if ([regex]::IsMatch($content, $pattern)) {
        $content = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($match) $line })
    } else { $content += "`r`n$line`r`n" }
}
[IO.File]::WriteAllText($envPath, $content, [Text.UTF8Encoding]::new($false))
Write-Host 'Configuration enregistree localement. Redemarrer Campus pour appliquer les valeurs.'
Write-Host 'Le mode de paiement existant est conserve. Aucun paiement effectue.'
Write-Host 'Si SITE_URL a change, faire aussi mettre a jour les redirections Supabase.'
