param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$compiler = (Get-Command javac -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
$java = Join-Path (Split-Path -Parent $compiler) 'java.exe'
if (-not (Test-Path -LiteralPath $java)) { throw 'java.exe mangler ved siden af javac.exe i JDK-installationen.' }
$compilerVersion = (& $compiler -version 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $compilerVersion -notmatch 'javac\s+(\d+)') { throw 'Kunne ikke aflæse Java-compilerens version.' }
$compilerMajor = [int]$Matches[1]
if ($compilerMajor -lt 21) { throw 'Visualiseringen kræver JDK 21 eller nyere.' }

# På JDK 21 er platformen allerede Java 21. Undgå --release og dets ct.sym-arkiv,
# som giver en adgangsfejl ved lukning i den lokale Microsoft JDK 21-installation.
$compilerOptions = if ($compilerMajor -eq 21) { @('-source', '21', '-target', '21') } else { @('--release', '21') }
$classes = Join-Path $repoRoot 'target/classes'
$sources = @(Get-ChildItem -LiteralPath (Join-Path $repoRoot 'src/main/java/app/dijkstra') -Filter '*.java' -File | ForEach-Object { $_.FullName })
New-Item -ItemType Directory -Force -Path $classes | Out-Null
Write-Host "Kompilerer med $compilerVersion"
& $compiler @compilerOptions -encoding UTF-8 -d $classes @sources
if ($LASTEXITCODE -ne 0) { throw 'Java-kompileringen fejlede.' }
& $java -cp $classes app.dijkstra.DijkstraExport (Join-Path $PSScriptRoot 'java-data.js')
if ($LASTEXITCODE -ne 0) { throw 'Java-eksporten fejlede.' }
if (-not $NoOpen) { Start-Process (Join-Path $PSScriptRoot 'java.html') }
