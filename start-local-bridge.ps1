$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Net.Http
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8765/')
$espClient = [System.Net.Http.HttpClient]::new()
$espClient.Timeout = [TimeSpan]::FromSeconds(5)
$esp32BaseUrl = 'http://192.168.4.1'
$allowedOrigin = 'https://johannejumamoy11-rgb.github.io'
$routes = @{
    '/bridge/status'   = '/api/status'
    '/bridge/readings' = '/api/readings'
    '/bridge/time'     = '/api/time'
    '/bridge/location' = '/api/location'
    '/bridge/sample'   = '/api/sample'
}

function Send-Response {
    param(
        [System.Net.HttpListenerContext]$Context,
        [int]$StatusCode,
        [string]$Body
    )

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $Context.Response.StatusCode = $StatusCode
    $Context.Response.ContentType = 'application/json; charset=utf-8'
    $Context.Response.ContentLength64 = $bytes.Length
    $Context.Response.Headers['Access-Control-Allow-Origin'] = $allowedOrigin
    $Context.Response.Headers['Vary'] = 'Origin'
    $Context.Response.Headers['Cache-Control'] = 'no-store'
    $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $Context.Response.Close()
}

try {
    $listener.Start()
} catch {
    Write-Error "Could not start the localhost bridge on port 8765: $($_.Exception.Message)"
    Write-Error 'Close any other bridge using port 8765, then try again.'
    exit 1
}

Write-Host 'SchoolHeat ESP32 bridge is running at http://localhost:8765'
Write-Host 'This bridge is only for ESP32 Wi-Fi sync; Semaphore SMS uses the hosted Worker.'
Write-Host 'Keep this PowerShell window open while Auto-Read ESP32 is active.'
Write-Host 'Press Ctrl+C to stop the bridge.'

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $origin = $request.Headers['Origin']

        if ($origin -ne $allowedOrigin) {
            Send-Response $context 403 '{"error":"This origin is not allowed to use the SchoolHeat bridge."}'
            continue
        }

        if ($request.HttpMethod -eq 'OPTIONS') {
            $context.Response.StatusCode = 204
            $context.Response.Headers['Access-Control-Allow-Origin'] = $allowedOrigin
            $context.Response.Headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            $context.Response.Headers['Access-Control-Allow-Headers'] = 'Content-Type'
            $context.Response.Headers['Access-Control-Max-Age'] = '600'
            $context.Response.Headers['Vary'] = 'Origin'
            $context.Response.Close()
            continue
        }

        $route = $request.Url.AbsolutePath
        if (-not $routes.ContainsKey($route)) {
            Send-Response $context 404 '{"error":"Unknown SchoolHeat bridge endpoint."}'
            continue
        }

        $expectedMethod = if ($route -in @('/bridge/status', '/bridge/readings')) { 'GET' } else { 'POST' }
        if ($request.HttpMethod -ne $expectedMethod) {
            Send-Response $context 405 '{"error":"Method not allowed for this bridge endpoint."}'
            continue
        }

        $targetUrl = "$esp32BaseUrl$($routes[$route])"
        if ($route -eq '/bridge/readings' -and $request.Url.Query) {
            $targetUrl += $request.Url.Query
        }

        $proxyRequest = $null
        $proxyResponse = $null
        try {
            $method = [System.Net.Http.HttpMethod]::new($request.HttpMethod)
            $proxyRequest = [System.Net.Http.HttpRequestMessage]::new($method, $targetUrl)
            if ($request.HttpMethod -eq 'POST') {
                $reader = [System.IO.StreamReader]::new($request.InputStream, $request.ContentEncoding)
                try {
                    $body = $reader.ReadToEnd()
                } finally {
                    $reader.Dispose()
                }
                $proxyRequest.Content = [System.Net.Http.StringContent]::new(
                    $body,
                    [System.Text.Encoding]::UTF8,
                    'application/json'
                )
            }

            $proxyResponse = $espClient.SendAsync($proxyRequest).GetAwaiter().GetResult()
            $responseBody = $proxyResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            Send-Response $context ([int]$proxyResponse.StatusCode) $responseBody
        } catch {
            Write-Warning "ESP32 bridge request failed: $($_.Exception.Message)"
            Send-Response $context 502 '{"error":"Could not reach the ESP32 at 192.168.4.1."}'
        } finally {
            if ($proxyResponse) { $proxyResponse.Dispose() }
            if ($proxyRequest) { $proxyRequest.Dispose() }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
    $espClient.Dispose()
}
