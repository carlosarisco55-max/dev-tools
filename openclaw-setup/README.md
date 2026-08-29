# OpenClaw — guía de instalación y uso (WSL2 + Windows)

Guía paso a paso para instalar OpenClaw (agente personal de IA, self-hosted) en Windows vía WSL2, configurarlo con Anthropic, y acceder tanto por terminal como por el dashboard web.

> ⚠️ **Ninguna clave real aparece en este documento.** Todo lo sensible (API keys, tokens de Gateway) se indica con placeholders `<...>`. Nunca commitees `~/.openclaw/openclaw.json`, archivos `apikey.txt` temporales, ni cualquier fichero con una clave real — ver la sección "Seguridad" al final.

## Requisitos previos

- Windows 10/11.
- WSL2 con la distro **Ubuntu-24.04** — usa siempre esta misma distro para todo lo de esta guía (ver "Errores comunes" más abajo sobre qué pasa si abres la equivocada).
- **Tu propia cuenta** en [console.anthropic.com](https://console.anthropic.com) (email + método de pago — tarjeta o saldo prepago; sin eso la clave no funciona). **No se comparte ni se reutiliza la cuenta/clave de otra persona** — cada quien crea la suya. Es un producto **distinto** de una suscripción Claude Pro/Max (facturación separada, aunque tengas Pro/Max no sirve aquí).

### 0. Si todavía no tienes WSL2 / Ubuntu-24.04 instalado

En **PowerShell como administrador**:
```powershell
wsl --install -d Ubuntu-24.04
```
Esto instala WSL2 (si no lo tenías) y la distro en un solo paso. Reinicia si te lo pide, y la primera vez que abras Ubuntu-24.04 te pedirá crear un usuario/contraseña de Linux (independiente de tu cuenta de Windows).

Si ya tenías WSL2 con otra distro, no la borres — puedes tener varias instaladas a la vez, solo asegúrate de abrir siempre **Ubuntu-24.04** específicamente (no "Ubuntu" genérico) para todo lo de esta guía.

## 1. Instalar Node.js dentro de WSL (no el de Windows)

Abre la terminal WSL de **Ubuntu-24.04** (no otra distro) y verifica primero que estás en la correcta:
```bash
lsb_release -a
# debe decir: Description: Ubuntu 24.04.x LTS
```

Luego:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install --lts
node --version
which node   # debe apuntar a ~/.nvm/versions/node/..., NUNCA a /mnt/c/...
```

Si usas el `npm`/`node` de Windows desde WSL (rutas `/mnt/c/...`), los paquetes globales que instales no funcionarán correctamente dentro de Linux — por eso instalamos un Node nativo de Linux con `nvm`.

## 2. Instalar OpenClaw

```bash
npm install -g openclaw
```

npm puede bloquear los scripts de instalación de algunas dependencias por seguridad (protección contra ataques de cadena de suministro). Si eso ocurre, revisa qué paquetes lo piden y, si son de confianza, apruébalos explícitamente:

```bash
npm install -g --allow-scripts=openclaw,@google/genai,protobufjs,tree-sitter-bash openclaw
```

Verifica:
```bash
which openclaw
openclaw --version
```

## 3. Onboarding inicial

```bash
openclaw onboard
```

Sigue el asistente interactivo: crea el workspace (`~/.openclaw/workspace`), instala el servicio del Gateway (corre en local, `ws://127.0.0.1:18789`, no expuesto a internet por defecto), y te preguntará si quieres configurar un proveedor de modelo.

## 4. Configurar el proveedor de modelo (Anthropic)

1. Crea una API key en console.anthropic.com → **API Keys** → "Continuar con una clave de API" (no federación de identidades, esa es para entornos cloud/CI).
2. Configura un **límite de gasto mensual** en la consola (Billing → Límites de gasto) — recomendado dejar la clave sin caducidad corta pero con tope de gasto bajo, en vez de una expiración de horas (una automatización desatendida necesita que la clave siga viva).
3. Guarda la clave de forma **persistente** (no como variable de entorno temporal, que se pierde al cerrar la terminal). **Sustituye `<TU_API_KEY_AQUI>` por tu clave real antes de ejecutar** — si copias la línea tal cual, guardará literalmente ese texto como si fuera la clave, sin avisarte de error hasta que intentes usarlo:

```bash
echo "<TU_API_KEY_AQUI>" | openclaw models auth paste-api-key --provider anthropic --profile-id anthropic:manual
```

4. Verifica que quedó guardada (debe mostrar el prefijo, nunca la clave completa):
```bash
openclaw models status
# busca: anthropic:manual=sk-ant-a...XXXX
```

## 5. Uso diario — dos formas de hablar con el agente

### A) Terminal (más rápido)
```bash
openclaw
```
Te mete directo en un chat interactivo (TUI) con tu agente.

### B) Dashboard web (más visual)
El comando estándar es:
```bash
openclaw dashboard
```
Si no detecta entorno gráfico (típico en WSL) o el auto-copiado al portapapeles falla, construye la URL con el token manualmente:

```bash
# 1. Extrae el token del Gateway desde el config (nunca lo imprimas/commitees)
node -e "console.log(require('/home/<usuario>/.openclaw/openclaw.json').gateway.auth.token)"

# 2. Con ese token, la URL de acceso es:
# http://127.0.0.1:18789/?token=<TOKEN>
```
Abre esa URL en el navegador de Windows (WSL2 expone `localhost`/`127.0.0.1` directamente a Windows, no hace falta configuración extra de red).

## 6. Personalizar la identidad del agente

La primera vez que hables con él (`openclaw`), te preguntará nombre, naturaleza, tono/vibe y emoji. Puedes cambiarlo luego con (verificado, requiere al menos un flag, si lo dejas en blanco no hace nada):
```bash
openclaw agents set-identity --agent main --name "TuNombre" --emoji "🦆"
```

## Errores comunes (y ya nos pasaron todos)

| Síntoma | Causa | Solución |
|---|---|---|
| `exec: node: not found` al ejecutar `openclaw` | Está usando el npm/node de **Windows** (`/mnt/c/Users/.../npm/openclaw`), no el de Linux | Revisa `which node` y `which openclaw` — deben apuntar a `~/.nvm/...` |
| Los comandos fallan como si nada estuviera instalado | Abriste una **distro WSL distinta** a la que usaste para instalar (ej. "Ubuntu" genérico en vez de "Ubuntu-24.04") | `lsb_release -a` para confirmar la distro antes de nada; abre siempre la distro correcta explícitamente |
| `run error: No API key found for provider "anthropic"` | La clave se puso solo como variable de entorno de esa sesión de terminal, no persistida | Usa `openclaw models auth paste-api-key` (paso 4) en vez de `export ANTHROPIC_API_KEY=...` |
| Pegar (`Ctrl+V`) no funciona dentro de la terminal WSL | Integración de portapapeles Windows↔WSL rota en algunas configuraciones | Truco: copia en Windows → PowerShell `Get-Clipboard \| Out-File -FilePath 'C:\ruta\archivo.txt' -Encoding utf8 -NoNewline` → en WSL, `cat /mnt/c/ruta/archivo.txt` → borra el archivo temporal al terminar |
| El dashboard web da "No se pudo conectar" | Entraste a `http://127.0.0.1:18789/` sin el token | Usa la URL completa con `?token=<TOKEN>` (paso 5B), no la URL pelada |

## Seguridad

- **Nunca subas a git/GitHub**: `~/.openclaw/openclaw.json` (contiene el token del Gateway), cualquier archivo `apikey.txt`/`token.txt` temporal, ni el contenido de `~/.openclaw/agents/*/agent/` (auth store).
- La API key de Anthropic es un producto **separado** de una suscripción Claude Pro/Max — no la compartas, no la subas a ningún repo aunque sea privado.
- Revisa `docs.openclaw.ai/gateway/security` antes de habilitar herramientas de ejecución (`exec`, `browser`) o abrir la política de DMs a desconocidos — por defecto vienen denegadas, que es lo seguro.
- Este proyecto instala software con capacidad de ejecutar comandos en tu máquina — antes de aprobar scripts de instalación (`--allow-scripts`), revisa qué paquetes los piden.
