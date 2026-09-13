# dsh-9router — 9Router als natives DSH-Desktop-Plugin

**Kompletter [9Router](https://github.com/decolua/9router) (v0.5.75) verdrahtet als Plugin für [DSH Desktop](https://github.com/dataelement/dsh-desktop). Kein zweiter Server, kein separates Browser-Tab — das Gateway, alle Provider und alle Einstellungen leben im Harness-Prozess und die UI in einem eigenen Fenster in DSH Desktop.**

---

## Was dieses Plugin tut

| Feature | Status | Wo |
|---|---|---|
| **Alle 122 Provider + 743 Modelle + 4 Default-Combos aus 9Router** im DSH-Modelpicker | ✅ | Picker `9Router` |
| **Combos sind Harness-native Models** (`auto`, `reasoning`, `speed`, `code` + eigene) — wählen wie jedes andere Modell | ✅ | Picker |
| **Gateway** OpenAI-kompatibel (`/api/9router/v1`, `/v1`) mit Fallback/Failover | ✅ | Harness origin |
| **Dashboard als eigenes DSH-Fenster** | ✅ | `Einstellungen → 9Router` |
| **Provider-Keys, Combos, Gateway-Keys, Usage, Logs** komplett einstellbar | ✅ | Dashboard |
| **CLI-Tools** (Claude CLI, Codex, Gemini CLI, Grok CLI …) via `OPENAI_BASE_URL`/`ANTHROPIC_BASE_URL` auf Harness origin | ✅ | Endpoint-Tab |
| **Persistenz portabel JSON** unter `~/.dsh/dsh-9router/` — kein native `better-sqlite3` | ✅ | Host |

---

## Installation im DSH Desktop

### Option A — dshmarket (empfohlen, sobald publiziert)

1. DSH Desktop → `dshmarket` öffnen (oder direkt per Plugin-Gallery).
2. Nach **`dsh-9router`** suchen → **Installieren**.
3. Harness startet neu — `Einstellungen → 9Router` erscheint, `9Router` erscheint im Modelpicker.

### Option B — lokal aus Quelle

```bash
git clone https://github.com/dataelement/dsh-desktop
cd dsh-desktop

# dieses Repo hier als eingebautes Paket (oder als npm-Package)
pnpm --filter dsh-desktop add /pfad/zu/dsh-9router

# DSH Desktopt bündelt das Plugin über cordis.patch.yml:
# In build/dsh-desktop.patch.yml einen Block ergänzen:
# - insert:
#     - id: dsh-9router
#       name: dsh-9router
#       config:
#         isolatedGateway: true

pnpm dev      # Dev-App: DSH Desktop Dev (+ separates Profil)
pnpm build    # Production build / packaging: siehe docs/development.md
```

Plugin-Manifest siehe [`package.json`](./package.json) + [`cordis.patch.yml`](./cordis.patch.yml).

---

## Dashboard — eigenes Fenster in DSH Desktop (nicht im Browser)

Nach dem Start Harness öffnen → **Einstellungen** → **9Router**. Der Eintrag liegt ganz oben (`order: 5`), damit er sofort sichtbar ist. Ein zusätzlicher `9R`-Button im Sidebar-Footer öffnet dieselbe Seite (Fallback, öffnet erst Settings und wählt den Tab). **Es öffnet sich kein Browser-Tab.**

Tabs im Dashboard:

- **Providers** — alle 122 Provider mit Farbe, alias, Typ (`apikey`/`oauth`/`local`/`freeTier`). Pro Provider: `Add key / endpoint`, `Test`, Liste aktiver Connections. Schlagworte-Suche.
- **Combos** — `New combo` (Name = Modell-ID, gilt sofort im Picker) + Liste + `Delete`.
- **Endpoint** — OpenAI-URLs (`/api/9router/v1` bevorzugt, `/v1` fallback) + `curl`-Beispiel + Gateway-Keys (`Add`/`Delete`, leer = open gateway).
- **Usage** — letzte Requests (letzte 5k persistent), Tokens, TTFT, Provider-Zähler.
- **Settings** — `comboStrategy`/`comboStickyRoundRobinLimit` + Data-Verzeichnis + Gateway-Zusammenfassung.

Alle Änderungen sind sofort im Picker sichtbar — kein Neustart.

---

## Modelpicker

`Neues Gespräch` → Modelpicker → Provider **`9Router`**:

- **Combos** wie `auto`, `reasoning`, `speed`, `code` (und alle selbst erstellten) stehen ganz oben.
- **Qualifizierte Modelle** wie `openai/gpt-4o`, `anthropic/claude-opus-4-6`, `gemini/gemini-2.5-flash`, `kimi/kimi-k3`, `xai/grok-4.5`, usw. folgen.
- **Bare IDs** (z. B. `claude-sonnet-4-6` ohne Präfix) werden ebenfalls geroutet — der Resolver ordnet sie dem passenden Provider zu.

Funktion: Kombos laufen mit Failover (`429`/`5xx` → nächster Kandidat), Capacity-Adapter für Vision-Bilder, Modell-Auflösung mit ≥128k Kontext — alles über eine einzige Adapter-Registrierung `9router`. Per-Provider-Slots (`9router-openai`, `9router-anthropic`, …) existieren zusätzlich als deklarierte `settings`-Einträge, sind aber nicht erforderlich.

---

## Provider verbinden

1. **Dashboard → Providers** → Provider suchen (z. B. `openai`, `kimi`, `azure`, `ollama-local`).
2. **Add key / endpoint** → `API key` (oder `baseUrl` Override für Self-Host) → `Label` optional → **Save**.
3. Optional **Test** (kleiner Chat-Request gegen echten Endpoint).
4. Fertig — Modell sofort im Picker wählen.

### Azure

Azure hat keinen festen `baseUrl`. Beim Anlegen der Connection `baseUrl`/`providerSpecificData.baseUrl` auf deinen Azure-Endpoint setzen (z. B. `https://<resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-02-15-preview`). Der Platzhalter `{endpoint}`/`{deployment}` wird automatisch interpoliert.

### Ollama (lokal)

`ollama-local` (`http://localhost:11434/v1/chat/completions`) — läuft ohne Key (`local`). Stelle sicher, dass `ollama serve` läuft; dann im Dashboard eine lokale Connection mit leerem Key anlegen.

### OAuth-Provider (Codex, Antigravity, Grok CLI, Cline …)

Diese Provider nutzen OAuth statt API-Key. Der Upstream-9Router macht Token-Refresh serverseitig; dieses Plugin speichert `apiKey`/`accessToken`/`refreshToken`/`providerSpecificData` generisch im JSON-Store. Für einen echten OAuth-Flow (Device-Code) über Harness kannst du zusätzlich einen `providerSpecificData.headers`-Eintrag hinterlegen; einfache API-Key-Emulation funktioniert sofort.

---

## Combos

```bash
# via API
curl -H 'content-type: application/json' \
  -d '{"name":"myAuto","kind":"llm","models":["openai/gpt-5","anthropic/claude-sonnet-4-6"]}' \
  http://127.0.0.1:<harness-port>/api/9router/combos
```

Oder im Dashboard **Combos → New combo**. Modelle werden als `provider/model` notiert, per Komma oder Zeilenumbruch getrennt. Die Combo-ID ist exakt der Modell-Name aus dem Picker.

Router-Verhalten (wie 9Router):

- `fallback` (Default) — sequentiell, bei retryable Fehlern (`429`/`502`/`503`/`529`, `rate/overloaded/unavailable`) zum nächsten Kandidaten.
- `roundRobin` / `fusion` — über `Settings.comboStrategy`.
- Vision-Bilder: wenn `settings.capacityAdapter.vision` gesetzt ist, werden dessen Modelle einer bildhaltigen Anfrage vorangestellt.
- Jede Anfrage schreibt `usageHistory.json` (bis 5k Einträge, ring buffer).

---

## Gateway & CLI-Tools

Der Gateway lauscht **auf dem Harness-Origin selbst** — kein Nebenport.

```bash
HARNESS_ORIGIN=http://127.0.0.1:<harness-port>   # im Dashboard unter Settings → Data directory sichtbar
BASE="$HARNESS_ORIGIN/api/9router/v1"           # bevorzugt
# oder direkt:
# BASE="$HARNESS_ORIGIN/v1"

# Modelle listen
curl "$BASE/models" -H "Authorization: Bearer <9router-key>"

# Chat (stream = true gibt SSE)
curl -s "$BASE/chat/completions" \
  -H "Authorization: Bearer <9router-key>" \
  -H "content-type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"hello"}]}'
```

Wenn kein Gateway-Key existiert (`/api/9router/keys` leer) ist der Gateway **open** — `Authorization` wird ignoriert (wie frischer 9Router). Sobald ein Key angelegt wird, ist `Bearer` Pflicht.

### CLI-Tools auf den Harness umbiegen

Im Dashboard **Endpoint** stehen alle URLs copy-ready:

```bash
# Claude Code
export ANTHROPIC_BASE_URL=http://127.0.0.1:<harness-port>/api/9router/v1
export ANTHROPIC_API_KEY=<9router-key>

# Codex / OpenAI-kompatibel
export OPENAI_BASE_URL=http://127.0.0.1:<harness-port>/api/9router/v1
export OPENAI_API_KEY=<9router-key>

# Gemini CLI (OAuth via providerSpecificData), Grok CLI, etc. analog
```

Tools sehen ein natives OpenAI-Endpoint — kein 9Router-Standalone muss laufen.

---

## HTTP-API (alle Pfade auch unter `/dsh-9router`/`/9router` gemirrored)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/9router/status` | Gateway-Verzeichnis, Counts |
| `GET` | `/api/9router/providers` | 122 Provider + Connections |
| `POST` | `/api/9router/providers/test` | `{provider}` → echter Ping |
| `GET` | `/api/9router/models` | Picker-Modelle + Directory |
| `GET` | `/api/9router/combos` | Combos listen |
| `POST` | `/api/9router/combos` | `{name,kind,models}` |
| `PUT` | `/api/9router/combos/:id` | Update |
| `DELETE` | `/api/9router/combos/:id` | Delete |
| `GET` | `/api/9router/connections` | Connections listen |
| `POST` | `/api/9router/connections` | `{provider,authType,apiKey,baseUrl,name,priority}` |
| `PUT` | `/api/9router/connections/:id` | Update |
| `DELETE` | `/api/9router/connections/:id` | Delete |
| `GET` | `/api/9router/keys` | Gateway-Keys |
| `POST` | `/api/9router/keys` | `{key,name}` |
| `DELETE` | `/api/9router/keys/:id` | Delete key |
| `GET`/`PUT` | `/api/9router/settings` | `settings.json` |
| `GET` | `/api/9router/usage` | letzte 200 Requests |
| `GET` | `/api/9router/logs` | gekürzte Logs |
| `GET`/`POST` | `/api/9router/validate-key` | `?key=` |
| `GET` | `…/v1/models` | OpenAI `list models` |
| `POST` | `…/v1/chat/completions` | OpenAI proxy (stream & non-stream) |

Alle Routen sind doppelt gebunden: einmal über `connection.fetch` (typert-auth, bevorzugt) und einmal über `webServer` Prefix-Handler (Fallback für externe CLI-Tools). CORS ist offen, `OPTIONS` beantwortet.

---

## Persistenz

Alles liegt unter `$DSH_HOME/dsh-9router/` (Default `~/.dsh/dsh-9router/`):

- `connections.json` — alle Provider-Verbindungen (Keys/`providerSpecificData`/`priority`)
- `combos.json` — Combos (initial 4 defaults)
- `apiKeys.json` — Gateway-Keys
- `settings.json` — `comboStrategy`, Capacity-Adapter, Theme
- `aliases.json` / `disabled.json` — optional
- `usageHistory.json` — ring buffer bis 5k

Dateien sind reines JSON — portabel, versionierbar, löschbar zum Reset.

---

## Architektur — warum ein natives Plugin, kein Next-Frontend?

DSH Desktop kapselt Harness (Electron, lokale Node, eigenes Profil + Plugins). Der Next-Stack von 9Router (`better-sqlite3`, eigener HTTP-Server, `.next`) läuft dort nicht sinnvoll:

- **Host (`lib/index.js`)** — `LlmRuntime.registerAdapter(["9router"], NineRouterAdapter)` + `registerConfigurableProviders` (123 Einträge) + `connection.fetch`/`webServer` Routen + JSON-Persistenz + Streaming-Engine (`OpenAI SSE → Harness StreamChunk`, Anthropic/Gemini Fallbacks, `fetchWithFallback`, Token-Refresh-Marker, Capacity-Adapter, Latenz/TTFT-Tracking).
- **Client (`lib/client.js`)** — `window.__ModuleLoader__.load({id:'dsh-9router'})`, injiziert über `dsh-client-ui-settings`/`sidebar`/`locale`/`slots`. Styles sind DSH-Token-basiert (`--dsw-alias-*`). Dashboard = `settings.section` (`order: 5`) + `settings.9router.dashboard` + Sidebar-Footer-Action als Einstieg. **Kein iframe, kein Browserfenster.**
- **Kein Nebenport** — `custom-server.js --port 20127` gibt es in diesem Plugin nicht; das Harness selbst ist der Server.

Transport-Hinweis: Für OAuth-Provider mit speziellem Format (`antigravity` IDE fingerprint, `grok-cli`/`openai-responses`) verhält sich der Proxy zunächst OpenAI-kompatibel; vollständige `antigravity`-Auth-Flows benötigen ggf. ergänzende `providerSpecificData.headers`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `9Router` taucht nicht im Picker auf | Settings → 9Router öffnen → Refresh. Harness-Log prüfen: `[9router] LLM adapter registered: 9router` muss erscheinen. |
| `No active credential for provider …` beim Chat | In Providers eine Connection für den Provider anlegen. |
| Azure `No endpoint` | Connection mit `baseUrl` auf deinen Azure-Deployment-Endpoint anlegen. |
| `Invalid API key` bei `curl …/v1/chat/completions` | Wenn `apiKeys.json` nicht leer ist, ist `Authorization: Bearer <gateway-key>` Pflicht. |
| Änderungen nach Replug nicht sichtbar | `load()` im Dashboard, oder Harness neu starten. JSON-Dateien liegen unter `~/.dsh/dsh-9router/`. |

---

## Lizenz

MIT — Upstream: [decolua/9router](https://github.com/decolua/9router), Harness/DSH Desktop: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) / [dataelement/dsh-desktop](https://github.com/dataelement/dsh-desktop).
