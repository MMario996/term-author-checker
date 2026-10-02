# CI/CD

Gleicher Aufbau wie in allen Kärcher-Translation-Repositories (Vorbild: Prompt Hub). Der Apps-Script-Code liegt unter `src/` und wird per `clasp` (rootDir `src`) hochgeladen.

```
Pull Request ─────────► CI
nachts ───────────────► CI
push auf main ────────► CI ──► Deploy (clasp push + Version)
manuell (Actions) ────► CI (optional Live-Check)
```

| Workflow | Datei | Auslöser |
|---|---|---|
| CI | `.github/workflows/ci.yml` | Pull Requests, nachts, manuell, von CD aufgerufen |
| CD | `.github/workflows/deploy.yml` | Push auf `main`, manuell |
| Deploy-Aktion | `.github/actions/clasp-deploy/` | `clasp push --force`, optional `clasp deploy --deploymentId` |
| Dependabot | `.github/dependabot.yml` | wöchentliche Updates für npm und Actions |

## Was CI prüft

| Job | Befehl | Prüft |
|---|---|---|
| Prüfung und Tests | `node tests/check.js`, `node tests/gas.syntax.test.js`, `node tools/check-structure.js`, `node tests/gem.test.js`, `node tests/doc-prompt.test.js` | Syntax, Manifest, doppelte Funktionen, Server-Aufrufe, Texte, Struktur, Gem-Dateien, Gesamtdokument-Prompts End-to-End |
| Oberflächen im Browser | `node tests/ui-smoke.js`, `node tests/ui-pdfcheck.js` | Terminologiesuche und PDF-Fenster (Chromium) |
| Live-Check | `node tests/live-check.js` | optional mit echtem Gemini, blockiert das Deployment nicht |

Lokal vor jedem Push:

```bash
npm ci
npm run ci
```

## Einrichtung (einmalig)

1. **Apps Script API einschalten** für das Deploy-Konto: <https://script.google.com/home/usersettings>.
2. **clasp-Anmeldung** lokal: `npx @google/clasp@2.4.2 login`, Inhalt von `~/.clasprc.json` als Secret `CLASPRC_JSON`.
3. **Secrets:**

   | Secret | Wo | Inhalt |
   |---|---|---|
   | `CLASPRC_JSON` | Repository | Inhalt von `~/.clasprc.json` |
   | `SCRIPT_ID` | Repository | Script-ID |
   | `DEPLOYMENT_ID` | Repository (optional) | Bereitstellung, die auf die neue Version zeigen soll |
   | `GEMINI_API_KEY`, `GEMINI_API_URL` | Repository (optional) | nur für den Live-Check |

Fehlen die Secrets, wird der Deploy mit einem Hinweis übersprungen statt fehlzuschlagen.

> **Achtung:** `clasp push` ersetzt den kompletten Code im Apps-Script-Projekt. Änderungen, die nur im Online-Editor gemacht wurden, gehen verloren. Ein Sync „Apps Script → GitHub“, der Dateien in den Wurzelordner schreibt, passt nicht mehr zur Struktur mit `src/`; `tools/check-structure.js` schlägt dann an.
