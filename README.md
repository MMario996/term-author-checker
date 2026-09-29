# term-author-checker
## CI / CD

- **CI** (`.github/workflows/ci.yml`): bei jedem Push und Pull Request prüft
  `node ci/check.js` die Syntax aller `.gs`-Dateien, `appsscript.json` und
  doppelt definierte Funktionen. Lokal: `node ci/check.js`.
- **CD** (`.github/workflows/deploy.yml`): bei jedem Push auf `main` (oder
  manuell über "Run workflow") wird der Code per
  [clasp](https://github.com/google/clasp) ins Apps-Script-Projekt übertragen
  und eine neue Version angelegt. Übertragen werden nur `*.gs`, `*.html` und
  `appsscript.json` (siehe `.claspignore`).

### Einrichtung (einmalig)

1. Lokal `npm install -g @google/clasp@2.4.2` und `clasp login` mit einem
   Konto, das das Skript bearbeiten darf. Unter
   https://script.google.com/home/usersettings die Apps Script API aktivieren.
2. Im GitHub-Repo unter *Settings > Secrets and variables > Actions* anlegen:
   - `CLASPRC_JSON`: Inhalt der Datei `~/.clasprc.json`
   - `SCRIPT_ID`: Skript-ID (Apps-Script-Editor > Projekteinstellungen)
   - `DEPLOYMENT_ID` (optional): ID des Deployments, das automatisch auf die
     neue Version umgestellt werden soll (Bereitstellen > Bereitstellungen
     verwalten). Ohne diese ID wird nur die Version angelegt.

Achtung: `clasp push` ersetzt den kompletten Code im Apps-Script-Projekt. Was
nur im Online-Editor geändert wurde und nicht in GitHub liegt, geht verloren.
Fehlen die Secrets, wird der Deploy-Schritt mit einer Warnung übersprungen.
