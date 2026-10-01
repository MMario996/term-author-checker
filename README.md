# term-author-checker

**Kärcher TermCheck** – Google-Workspace-Add-on mit zwei Werkzeugen:
🔍 **Terminologiesuche** (Seitenleiste und Web-App) und ✍️ **Author Check**
(Grammatik-, Terminologie- und Stilprüfung in Docs, Sheets, Slides und für PDFs in Drive).

> 📚 **Dokumentation:** Datenbanken, Script Properties, Abläufe und Diagramme in [`docs/DOKUMENTATION.md`](docs/DOKUMENTATION.md). Gesamtdokumentation aller acht Kärcher-Translation-Repositories (Systemlandkarte, alle Datenbanken, FAQ, Paket für Gemini Gem / NotebookLM): [`kaerchertranslationservices/wissensbasis`](https://github.com/MMario996/kaerchertranslationservices/tree/main/wissensbasis).

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
- Skripteigenschaft `WEBAPP_URL` = die `…/exec`-URL einer Bereitstellung vom
  Typ **Web-App** (Bereitstellen > Neue Bereitstellung > Typ „Web-App“,
  Ausführen als „Nutzer, der auf die Web-App zugreift“, Zugriff „Jeder in
  karcher.com“). Die Add-on-Bereitstellung (`DEPLOYMENT_ID` im Workflow) hat
  keinen Web-App-Zugang – deren Adresse liefert Googles 404-Seite. Nach dem
  Setzen im Editor `checkPdfWindowSetup` ausführen und die dort genannte
  Adresse im Browser testen.

Ohne gültige `WEBAPP_URL` (oder über den Link „Stattdessen schrittweise im
Seitenbereich prüfen“) läuft die Prüfung wie bisher im Seitenbereich mit „Weiter“.

## KI-Prompts über das Gesamtdokument

Eine eigene Regel vom Typ „KI-Prompt“ hat einen Geltungsbereich:

- **Pro Abschnitt** (Standard): Der Prompt wird als zusätzliche Prüfanweisung in die normale Prüfung eingebaut. Diese läuft abschnittsweise (PDF: je 4 Seiten), die Funde erscheinen in der Liste (Original → Vorschlag).
- **Gesamtdokument**: Der Prompt geht unverändert zusammen mit dem kompletten Dokument in einer eigenen Anfrage an Gemini. Das Tool verlangt zusätzlich, jeden Befund pro betroffener Stelle mit wörtlichem Zitat und Seitenangabe zu liefern. Diese Befunde landen wie alle anderen Funde in der Liste (Typ = Regelname) und damit in der kommentierten PDF, im Sheet und als Kommentar/Notiz in Docs, Sheets und Slides. „Ersetzen“ gibt es nur, wenn der Vorschlag ein direkter Ersatztext ist. Die komplette Antwort im Format des Prompts wird zusätzlich als Google Doc im Ordner „Terminology“ gespeichert und im Ergebnis verlinkt.

Umschalten lässt sich das im Formular „Neue Regel“ oder per Klick auf das Etikett „Pro Abschnitt“/„Gesamtdokument“ an der Regel, danach „Einstellungen speichern“. Bei PDFs laufen Gesamtdokument-Prompts nur im PDF-Fenster (nicht im 30-s-Seitenbereich), und die verkleinerte PDF darf höchstens 15 MB groß sein.

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
