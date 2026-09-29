# term-author-checker

**Kärcher TermCheck** – Google-Workspace-Add-on mit zwei Werkzeugen:
🔍 **Terminologiesuche** (Seitenleiste und Web-App) und ✍️ **Author Check**
(Grammatik-, Terminologie- und Stilprüfung in Docs, Sheets, Slides und für PDFs in Drive).

## Oberflächensprachen

Alle Texte gibt es in 15 Sprachen. HTML-Oberflächen: `I18n.html`.
Karten (Startkarte, Drive-PDF-Check) und vom Server erzeugte Texte: `CardI18n.gs`.
Neue Texte bitte in beiden Fällen für alle Sprachen ergänzen (Englisch ist Fallback).

## PDF-Prüfung in Drive (eigenes Fenster)

„PDF prüfen“ im Drive-Seitenbereich öffnet ein eigenes Fenster (Web-App,
`PdfCheck.html`), das alle Etappen automatisch abarbeitet – ohne Klicks auf
„Weiter“. Voraussetzungen:

- Web-App-Einstellungen im Manifest: *Ausführen als: Nutzer, der zugreift*,
  *Zugriff: Domain* (`appsscript.json`). Beim ersten Öffnen bestätigt jede
  Person einmal die Berechtigungen.
- Skripteigenschaft `WEBAPP_URL` = die `…/exec`-URL der Bereitstellung
  (Bereitstellen > Bereitstellungen verwalten > Web-App-URL).

Ohne gültige `WEBAPP_URL` (oder über den Link „Stattdessen schrittweise im
Seitenbereich prüfen“) läuft die Prüfung wie bisher im Seitenbereich mit „Weiter“.

## Skripteigenschaften (optional)

- `EXPORT_FOLDER_ID`: Zielordner für `exportProjectToTxt` (Quellcode-Export).
  Ohne diese Eigenschaft wird der Ordner „TermCheck Source Export“ angelegt.

## CI / CD

- **CI** (`.github/workflows/ci.yml`): bei jedem Push und Pull Request prüft
  `node ci/check.js` die Syntax aller `.gs`-Dateien, `appsscript.json`,
  doppelt definierte Funktionen und ob jede aus HTML (`google.script.run`),
  Cards (`setFunctionName`) oder dem Manifest (`runFunction`) aufgerufene
  Server-Funktion existiert. Lokal: `node ci/check.js`.
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
