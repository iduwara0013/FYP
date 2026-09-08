$serviceAccountPath = Join-Path $PSScriptRoot "src\main\resources\firebase-service-account.json"

if (-not (Test-Path -LiteralPath $serviceAccountPath)) {
    throw "Firebase service-account file was not found at $serviceAccountPath"
}

$env:FIREBASE_ENABLED = "true"
$env:FIREBASE_CREDENTIALS_PATH = $serviceAccountPath

mvn spring-boot:run
