# Hermes Agent — guía de instalación y uso (Windows nativo)

Guía paso a paso para instalar Hermes Agent (Nous Research) en Windows de forma nativa, configurarlo con Anthropic, y acceder por terminal y por dashboard web.

> ⚠️ **Ninguna clave real aparece en este documento.** Todo lo sensible (API keys) se indica con placeholders `<...>`. Nunca commitees `.env`, `config.yaml`, `auth.json`, ni cualquier archivo dentro de la carpeta de instalación de Hermes que pueda contener credenciales — ver "Seguridad" al final.

> Fuentes oficiales verificadas: [github.com/NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent), [hermes-agent.nousresearch.com/docs](https://hermes-agent.nousresearch.com/docs/).

## Qué es (para contexto)

Agente personal de IA open-source (Python, Nous Research), alternativa a OpenClaw — no una capa jerárquica sobre él, son dos plataformas independientes que resuelven lo mismo con enfoques distintos. Su diferenciador: un *learning loop* que escribe sus propias skills a partir de lo que hace.

## 1. Instalación (Windows nativo)

**Requisitos previos:** Windows 10 u 11, sin necesidad de permisos de administrador. No hace falta tener Python ni Node.js instalados de antemano — el instalador los trae.

Abre PowerShell y ejecuta:
```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

Esto hace, en orden (automático, sin intervención):
1. Instala `uv` (gestor de Python de Astral) en `%USERPROFILE%\.local\bin`
2. Instala Python 3.11 vía `uv`
3. Instala Node.js 26 (por winget, o como binario portable en `%LOCALAPPDATA%\hermes\node`)
4. Instala PortableGit si no tienes git ya en el PATH
5. Clona el repo en `%LOCALAPPDATA%\hermes\hermes-agent` con su propio virtualenv
6. Instala dependencias Python
7. Añade `%LOCALAPPDATA%\hermes\bin` a tu PATH de usuario
8. Lanza el asistente `hermes setup`

**Alternativa:** también existe un instalador de escritorio (GUI) descargable desde hermes-agent.nousresearch.com, que hace lo mismo por debajo — CLI y app de escritorio comparten instalación y datos.

Verifica que quedó bien instalado (abre una terminal **nueva** para que el PATH se actualice):
```powershell
hermes --version
```

## 2. Configurar el proveedor de modelo (Anthropic)

El camino oficial rápido es `hermes setup --portal` (usa una suscripción de Nous Portal) o el asistente interactivo `hermes model`. **Nosotros configuramos Anthropic directamente con clave propia**, así:

1. Crea una API key en console.anthropic.com → API Keys → "Continuar con una clave de API" (recuerda: es un producto separado de una suscripción Claude Pro/Max).
2. Añade la credencial. Evita pegarla literal en el comando (queda visible en tu historial de terminal) — mejor mételo primero en una variable, así solo tú ves el valor real:
```bash
# Bash (WSL/Linux/macOS)
read -s -p "Pega tu API key: " KEY
hermes auth add anthropic --type api-key --api-key "$KEY" --label mi-anthropic
unset KEY
```
```powershell
# PowerShell (Windows nativo)
$KEY = Read-Host -AsSecureString "Pega tu API key"
$PlainKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($KEY))
hermes auth add anthropic --type api-key --api-key "$PlainKey" --label mi-anthropic
Remove-Variable KEY, PlainKey
```
3. Verifica: `hermes auth status anthropic` → debe decir `anthropic: logged in`.
4. **Paso importante que no es obvio:** añadir la credencial no basta — hay que decirle al modelo que la use:
```bash
hermes config set model.provider anthropic
hermes config unset model.base_url
```
   (Por defecto, `model.base_url` apunta a `openrouter.ai`, así que aunque tengas la clave de Anthropic guardada, seguirá intentando usar OpenRouter y fallará con "No inference provider configured" hasta que quites esa URL o la sobrescribas.)
5. Prueba:
```bash
hermes -z "confirma que estas activo"
```

## 3. Uso diario — formas de interactuar

### A) Terminal — un mensaje suelto (rápido, para probar)
```bash
hermes -z "tu mensaje aquí"
```

### B) Terminal — chat interactivo
```bash
hermes chat
```
o simplemente `hermes` a secas para el flujo interactivo estándar.

### C) Dashboard web
```bash
hermes dashboard
```
**La primera vez tarda ~40 segundos** porque compila su interfaz web (Vite + React) — es normal, solo pasa una vez. Si falla con "Web UI npm install failed", ver "Errores comunes" abajo.

Una vez listo, verás `HERMES_DASHBOARD_READY port=9119` — abre en el navegador:
```
http://127.0.0.1:9119
```
Entra directo, **sin pedir login, contraseña ni token** (confirmado en esta instalación) — ver nota de seguridad abajo.

## Errores comunes (ya nos pasaron)

| Síntoma | Causa | Solución |
|---|---|---|
| `No inference provider configured` tras añadir la clave | `model.base_url` sigue apuntando a OpenRouter por defecto | `hermes config set model.provider anthropic` + `hermes config unset model.base_url` |
| El prompt de `hermes auth add` (sin `--api-key`) se queda colgado si le haces pipe con `\|` | No lee bien un stdin no interactivo en este entorno | Usa el flag `--api-key "$VARIABLE"` en vez de pipe |
| `Web UI npm install failed` al correr `hermes dashboard` | La versión de npm de Windows caía en un rango que Hermes bloquea a propósito (`>=11.10.0 <11.17.0`) | `npm install -g npm@latest` y reintenta |
| `config set provider anthropic` avisa "not a recognized config key" | La clave correcta es anidada: `model.provider`, no `provider` a secas | Usa `hermes config set model.provider anthropic` |

## Seguridad

- **El dashboard web NO pide autenticación en loopback por defecto** (confirmado: entra directo, sin login/token) — a diferencia de OpenClaw, que sí exige token. Mientras esté en `127.0.0.1` (no accesible desde fuera de tu máquina) el riesgo es bajo, pero **nunca cambies `--host` a `0.0.0.0` o a tu IP de red sin activar algún tipo de autenticación** — cualquiera en tu misma red podría entrar directo a tu agente, ver tus sesiones y usar tus herramientas.
- **Nunca subas a git/GitHub:** `.env` (contiene claves), `config.yaml` (puede acumular tokens/ajustes sensibles), `auth.json`, ni las carpetas `sessions/`, `memories/`, `pairing/` de tu instalación.
- La API key de Anthropic es un producto separado de una suscripción Claude Pro/Max — no la compartas ni la subas a ningún repo aunque sea privado.
- Revisa qué herramientas/skills tienen acceso a shell/navegador antes de darle tareas autónomas — mismo criterio que con OpenClaw.
- El `npm audit` durante la instalación del dashboard reportó "2 high severity vulnerabilities" en dependencias propias del proyecto (no nuestras) — si te preocupa, ejecuta `npm audit` dentro de `%LOCALAPPDATA%\hermes\hermes-agent` para ver el detalle, pero no bloquea el uso normal.
