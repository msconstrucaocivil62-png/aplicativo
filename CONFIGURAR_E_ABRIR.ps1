$ErrorActionPreference = 'Stop'
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $AppDir
$Host.UI.RawUI.WindowTitle = 'O Profissional Certo - Configuração'

Write-Host '============================================================'
Write-Host '      O PROFISSIONAL CERTO - CONFIGURAR E ABRIR'
Write-Host '============================================================'
Write-Host ''

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js não foi encontrado.' -ForegroundColor Red
    Write-Host 'Instale a versão LTS em https://nodejs.org/ e execute novamente.'
    Read-Host 'Pressione Enter para sair'
    exit 1
}

$envFile = Join-Path $AppDir '.env.local'
if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Host 'Cole somente os dados PÚBLICOS do Supabase.' -ForegroundColor Yellow
    Write-Host 'Não use a chave Secret ou Service Role.' -ForegroundColor Yellow
    Write-Host ''
    $supabaseUrl = (Read-Host 'Project URL do Supabase').Trim()
    $supabaseUrl = $supabaseUrl -replace '/rest/v1/?$', ''
    $supabaseUrl = $supabaseUrl.TrimEnd('/')
    $supabaseKey = (Read-Host 'Publishable key do Supabase').Trim()

    if ($supabaseUrl -notmatch '^https://[a-z0-9-]+\.supabase\.co$') {
        Write-Host 'Project URL inválida. Use apenas https://SEU-PROJETO.supabase.co' -ForegroundColor Red
        Read-Host 'Pressione Enter para sair'
        exit 1
    }
    if (-not ($supabaseKey.StartsWith('sb_publishable_') -or $supabaseKey.StartsWith('eyJ'))) {
        Write-Host 'Publishable key inválida ou incompleta.' -ForegroundColor Red
        Read-Host 'Pressione Enter para sair'
        exit 1
    }

    Write-Host 'Validando a chave pública no Supabase...' -ForegroundColor Cyan
    try {
        Invoke-WebRequest -UseBasicParsing -Uri "$supabaseUrl/auth/v1/settings" -Headers @{ apikey = $supabaseKey } -TimeoutSec 15 | Out-Null
    } catch {
        Write-Host 'O Supabase recusou essa chave. Copie a Publishable key completa do mesmo projeto.' -ForegroundColor Red
        Read-Host 'Pressione Enter para sair'
        exit 1
    }

    $adminEmail = (Read-Host 'E-mail do administrador').Trim()
    @(
        "VITE_SUPABASE_URL=$supabaseUrl"
        "VITE_SUPABASE_PUBLISHABLE_KEY=$supabaseKey"
        "SUPABASE_URL=$supabaseUrl"
        "SUPABASE_PUBLISHABLE_KEY=$supabaseKey"
        "VITE_ADMIN_EMAIL=$adminEmail"
        'VITE_DEMO_MODE=false'
        'DEMO_MODE=false'
    ) | Set-Content -LiteralPath $envFile -Encoding UTF8
    Write-Host 'Configuração validada e salva em .env.local.' -ForegroundColor Green
}

# Encerra apenas o processo que estiver escutando a porta 3000.
$connections = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
foreach ($connection in $connections) {
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path -LiteralPath (Join-Path $AppDir 'node_modules'))) {
    Write-Host ''
    Write-Host 'Instalando dependências. Aguarde...' -ForegroundColor Cyan
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Falha ao instalar as dependências.' -ForegroundColor Red
        Read-Host 'Pressione Enter para sair'
        exit $LASTEXITCODE
    }
}

Write-Host ''
Write-Host 'Iniciando O Profissional Certo...' -ForegroundColor Cyan
$server = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/k', 'npm run dev' `
    -WorkingDirectory $AppDir `
    -WindowStyle Normal `
    -PassThru

$url = 'http://127.0.0.1:3000'
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
        if ($response.StatusCode -ge 200) {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($ready) {
    Start-Process $url
    Write-Host 'Aplicativo aberto com sucesso.' -ForegroundColor Green
    Write-Host 'Mantenha a janela do servidor aberta durante o uso.'
    Start-Sleep -Seconds 2
    exit 0
}

Write-Host 'O servidor não respondeu dentro do tempo esperado.' -ForegroundColor Red
Write-Host 'Veja a janela do servidor para identificar a mensagem de erro.'
Read-Host 'Pressione Enter para sair'
exit 1
