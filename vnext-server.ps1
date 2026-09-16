$ErrorActionPreference = 'Stop'
$script:AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:WwwRoot = Join-Path $script:AppRoot 'www'
$script:Port = 8877
$script:Prefix = "http://127.0.0.1:$($script:Port)/"

function Send-Bytes([System.Net.HttpListenerResponse]$Response,[byte[]]$Bytes,[string]$ContentType,[int]$StatusCode=200){
  $Response.StatusCode=$StatusCode; $Response.ContentType=$ContentType; $Response.ContentLength64=$Bytes.Length
  $Response.OutputStream.Write($Bytes,0,$Bytes.Length); $Response.OutputStream.Close()
}
function Send-Text([System.Net.HttpListenerResponse]$Response,[string]$Text,[string]$ContentType='text/plain; charset=utf-8',[int]$StatusCode=200){
  $enc=New-Object System.Text.UTF8Encoding($false); Send-Bytes $Response ($enc.GetBytes($Text)) $ContentType $StatusCode
}
function Send-Json([System.Net.HttpListenerResponse]$Response,$Object,[int]$StatusCode=200){ Send-Text $Response ($Object|ConvertTo-Json -Depth 8 -Compress) 'application/json; charset=utf-8' $StatusCode }
function Get-ContentType([string]$Path){
  switch([IO.Path]::GetExtension($Path).ToLowerInvariant()){'.html'{'text/html; charset=utf-8'}'.js'{'application/javascript; charset=utf-8'}'.css'{'text/css; charset=utf-8'}default{'application/octet-stream'}}
}

$listener=New-Object System.Net.HttpListener; $listener.Prefixes.Add($script:Prefix)
try{$listener.Start()}catch{Write-Host '';Write-Host 'TOSMC Admin vNext konnte den lokalen Server nicht starten.' -ForegroundColor Red;Write-Host ('Adresse: '+$script:Prefix);Write-Host ('Fehler: '+$_.Exception.Message) -ForegroundColor Red;Write-Host 'Pruefe, ob Port 8877 bereits verwendet wird.';exit 20}
Write-Host '==============================================================' -ForegroundColor DarkCyan
Write-Host ' TOSMC Admin vNext 2.0.0 - Repo Bootstrap SAFE' -ForegroundColor Cyan
Write-Host '==============================================================' -ForegroundColor DarkCyan
Write-Host ('Lokale Adresse: '+$script:Prefix)
Write-Host 'Betriebsart: REPO-BOOTSTRAP / HISTORISCHE REGRESSION / READ ONLY.' -ForegroundColor Yellow
Write-Host 'LiveAdmin, TestAdmin, Live-Repo und Test2v2 werden ausschliesslich als READ-ONLY-Referenzen behandelt.' -ForegroundColor Green
Write-Host 'Diese Bootstrap-Version besitzt keinen Schreibpfad fuer operative Referenzbestaende.' -ForegroundColor Yellow
Write-Host 'Live-Ziel und Export sind gesperrt.' -ForegroundColor Green
Write-Host 'Dieses Fenster geoeffnet lassen. Beenden mit Strg+C.'
Start-Process $script:Prefix | Out-Null
try{
 while($listener.IsListening){
  $context=$listener.GetContext(); $request=$context.Request; $response=$context.Response
  try{
   $path=$request.Url.AbsolutePath; $method=$request.HttpMethod.ToUpperInvariant()
   if($path -eq '/api/status' -and $method -eq 'GET'){Send-Json $response @{version='2.0.0-repo-bootstrap';mode='historical-regression-read-only';port=$script:Port;writeScope='none';export=$false;live=$false;protectedRefs=@('LiveAdmin','TestAdmin','LiveRepo','Test2v2')};continue}
   if($method -ne 'GET' -and $method -ne 'HEAD'){Send-Json $response @{error='Nicht unterstuetzte Methode oder Route.'} 405;continue}
   $relative=$path.TrimStart('/');if([string]::IsNullOrWhiteSpace($relative)){$relative='index.html'}
   $relative=$relative.Replace('/',[IO.Path]::DirectorySeparatorChar);$candidate=[IO.Path]::GetFullPath((Join-Path $script:WwwRoot $relative));$prefix=$script:WwwRoot.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
   if(-not $candidate.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)-or -not(Test-Path -LiteralPath $candidate -PathType Leaf)){Send-Text $response 'Not found' 'text/plain; charset=utf-8' 404;continue}
   $bytes=[IO.File]::ReadAllBytes($candidate);Send-Bytes $response $bytes (Get-ContentType $candidate) 200
  }catch{try{Send-Json $response @{error=$_.Exception.Message} 400}catch{}}
 }
}finally{if($listener.IsListening){$listener.Stop()};$listener.Close()}
