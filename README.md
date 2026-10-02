# term-author-checker

**Kärcher TermCheck** – Google-Workspace-Add-on mit zwei Werkzeugen:
🔍 **Terminologiesuche** (Seitenleiste und Web-App) und ✍️ **Author Check**
(Grammatik-, Terminologie- und Stilprüfung in Docs, Sheets, Slides und für PDFs in Drive).

> 📚 **Dokumentation:** Fachliche Doku, Datenbanken, Abläufe in [`docs/DOKUMENTATION.md`](docs/DOKUMENTATION.md) · alle Phrase- und sonstigen Endpunkte in [`docs/ENDPOINTS.md`](docs/ENDPOINTS.md) · CI/CD in [`docs/CI-CD.md`](docs/CI-CD.md) · Gesamtübersicht aller zehn Kärcher-Translation-Repositories mit Systemlandkarte: [`kaerchertranslationservices/docs/gesamt`](https://github.com/MMario996/kaerchertranslationservices/tree/main/docs/gesamt).

## Oberflächensprachen

Alle Texte gibt es in 15 Sprachen. HTML-Oberflächen: `src/I18n.html`.
Karten (Startkarte, Drive-PDF-Check) und vom Server erzeugte Texte: `src/CardI18n.gs`.
Neue Texte bitte in beiden Fällen für alle Sprachen ergänzen (Englisch ist Fallback).

## PDF-Prüfung in Drive (eigenes Fenster)

„PDF prüfen“ im Drive-Seitenbereich öffnet ein eigenes Fenster (Web-App,
`src/PdfCheck.html`), das alle Etappen automatisch abarbeitet – ohne Klicks auf
„Weiter“. Voraussetzungen:

- Web-App-Einstellungen im Manifest: *Ausführen als: Nutzer, der zugreift*,
  *Zugriff: Domain* (`src/appsscript.json`). Beim ersten Öffnen bestätigt jede
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
- **Gesamtdokument**: Der Prompt geht unverändert zusammen mit dem kompletten Dokument in einer eigenen Anfrage an Gemini. Das Tool verlangt zusätzlich, jeden Befund pro betroffener Stelle mit wörtlichem Zitat und Seitenangabe zu liefern. Diese Befunde landen wie alle anderen Funde in der Liste (Typ = Regelname) und damit in der kommentierten PDF, im Sheet und als Kommentar/Notiz in Docs, Sheets und Slides. „Ersetzen“ gibt es nur, wenn der Vorschlag ein direkter Ersatztext ist. Die komplette Antwort im Format des Prompts wird zusätzlich als Google Doc gespeichert (siehe Ablage unten) und im Ergebnis verlinkt.

Umschalten lässt sich das im Formular „Neue Regel“ oder per Klick auf das Etikett „Pro Abschnitt“/„Gesamtdokument“ an der Regel, danach „Einstellungen speichern“. Bei PDFs laufen Gesamtdokument-Prompts nur im PDF-Fenster (nicht im 30-s-Seitenbereich).

- **Große PDFs:** Ist die (verkleinerte) PDF größer als 13 MB (Skripteigenschaft `DOC_PROMPT_PDF_MAX_MB`) oder lehnt Gemini bzw. der Proxy davor die Anfrage mit der PDF ab, läuft der Prompt mit dem vollständigen Text aller Seiten („=== Page N of M ===“, ohne Bilder). Das Ergebnis sagt das dazu. Früher fehlte der Prompt in diesem Fall im Ergebnis.
- **Redaktionsleitfaden als Referenz:** Ein Gesamtdokument-Prompt bekommt die übrigen aktiven eigenen Regeln derselben Regelsprache mit (z. B. den per JSON importierten Leitfaden). Verweise wie „laut Redaktionsleitfaden“ aus einem Gem-Prompt laufen so nicht ins Leere.
- **Hinweise statt Schweigen:** Läuft ein Gesamtdokument-Prompt nicht, steht der Grund im Ergebnis: Prüfsprache ohne Regelwerk (nur DE/EN), Prompt nur unter der anderen Regelsprache gespeichert, ausgeschaltet, mehr als 5 aktiv oder ein langer Prompt mit Geltungsbereich „Pro Abschnitt“.

## Ablage im eigenen Drive

Alles, was das Add-on anlegt, landet im Ordner **Kärcher TermCheck** (wird automatisch angelegt):

| Unterordner | Inhalt |
|---|---|
| `Rules` | aktive Regeldateien (`active_rules_….json`). Der frühere Ordner „TermCheck Rules“ wird beim ersten Zugriff automatisch hierher verschoben. |
| `JSON Export` | „JSON Export“ der Regeln (`rules_export_….json`) |
| `Checked PDFs` | Ergebnisse der PDF-Prüfung: kommentierte PDF, Sheet-Export, Gesamtdokument-Bericht |
| `Reports` | Audit-Sheets aus Docs/Sheets/Slides, Regelübersicht, Exporte der Terminologiesuche |
| `_Temp` | Zwischenstände und `.bin`-Dateien laufender Prüfungen. Sie werden nach der Prüfung endgültig gelöscht. Reste abgebrochener Prüfungen (älter als 6 h) räumt der Start der nächsten PDF-Prüfung auf, auch im alten Ordner „Terminology“. |

## Bereiche der Terminologie (General / Home and Garden / Professional)

Welche PHRASE-Termbase zu welchem Bereich gehört, wird am Namen erkannt, zum Beispiel „H&G TERMS ONLY“, „HNG“, „Home & Garden“, „PROF TERMS ONLY“, „Professional“, „[GENERAL]“ oder „General“. Fehlt ein Bereich, im Skript-Editor `checkTermbaseCategories()` ausführen: Das Protokoll zeigt jede Termbase mit erkanntem Bereich bzw. dem Grund, warum sie nicht verwendet wird. Abweichend benannte Termbases ordnest du in der Skripteigenschaft `TB_CATEGORY_OVERRIDES` von Hand zu, z. B. `uid1=HNG, uid2=PROF`.

## Skripteigenschaften (optional)

- `EXPORT_FOLDER_ID`: Zielordner für `exportProjectToTxt` (Quellcode-Export).
  Ohne diese Eigenschaft wird der Ordner „TermCheck Source Export“ angelegt.

## CI / CD

- **CI** (`.github/workflows/ci.yml`) bei jedem Push und Pull Request:
  - `node tests/check.js`: Syntax aller `.gs`-Dateien, `src/appsscript.json`, doppelt
    definierte Funktionen, jede aus HTML (`google.script.run`), Cards
    (`setFunctionName`) oder dem Manifest (`runFunction`) aufgerufene
    Server-Funktion existiert, jeder benutzte Text steht in `src/CardI18n.gs`.
  - `node tests/gem.test.js`: Die JSON-Dateien in `gemini-gem/` lassen sich mit dem
    echten Import aus `src/AuthorCheck.html` übernehmen, KI-Prompt-Regeln enthalten
    nichts, was zur Prüfzeit nicht funktioniert (Platzhalter, Gem-Wissensdateien,
    Logs, Basis-URLs), und `standardregeln_*.md` passen zu `src/Rules.gs`. Eine vom
    Gem erzeugte Datei vor dem Import prüfen: `node tests/gem.test.js meine_regeln_de.json`.
  - `node tests/doc-prompt.test.js`: End-to-End wie im Fachbereich, mit dem echten
    Server-Code (Drive und Gemini simuliert, Gemini mit Größenlimit): Gem-Prompt
    und Leitfaden importieren → PDF im PDF-Fenster prüfen → Bericht, Befunde in
    der Liste, kommentierte PDF. Dazu große PDFs (Bilder entfernt, Prompt über den
    Seitentext), ein Proxy, der die PDF ablehnt (400/413/502), gescannte PDFs,
    falsche Regelsprache, ausgeschaltete Prompts, Docs-Prüfung.
  - `node tests/ui-smoke.js`, `node tests/ui-pdfcheck.js`: Terminologiesuche und
    PDF-Fenster in Chromium (Playwright) mit dem echten Server-Code.
  - **Live-Check** (`node tests/live-check.js`): dieselbe PDF-Prüfung mit dem echten
    Gemini, bei Push auf `main` und manuell über „Run workflow“ (dort auch mit
    26-MB-Test-PDF oder einer eigenen PDF aus dem Repository). Braucht das Secret
    `GEMINI_API_KEY` (optional `GEMINI_API_URL`, Variable `AI_MODEL`), sonst wird
    er mit Warnung übersprungen. Bericht und Befunde als Artefakt „live-check“.
  - Alles lokal: `node tests/run-all.js` (Browser-Tests nur mit installiertem
    `playwright`, Live-Check nur mit `GEMINI_API_KEY`).
- **CD** (`.github/workflows/deploy.yml`): bei jedem Push auf `main` (oder
  manuell über "Run workflow") läuft zuerst die komplette CI (ohne Live-Check);
  nur wenn sie besteht, wird der Code per
  [clasp](https://github.com/google/clasp) ins Apps-Script-Projekt übertragen
  und eine neue Version angelegt. Übertragen werden nur `*.gs`, `*.html` und
  `src/appsscript.json` (siehe `.claspignore`).

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

## Repository-Standard

Alle Kärcher-Translation-Repositories sind gleich aufgebaut (Vorbild: Prompt Hub); `tools/check-structure.js` prüft das in der CI.

| Pfad | Inhalt |
|---|---|
| `src/` | Apps-Script-Code inkl. `appsscript.json` (clasp `rootDir`) |
| `tests/` | Node-Tests, Einstieg `tests/run-all.js`; `gas.syntax.test.js` prüft Syntax, Manifest und doppelte Namen |
| `tools/` | `check-structure.js`, `check-encoding.js`, Build-Skripte |
| `docs/` | `DOKUMENTATION.md`, `ENDPOINTS.md`, `CI-CD.md` |
| `.github/` | `ci.yml`, `deploy.yml`, `actions/clasp-deploy`, Dependabot, CODEOWNERS, PR-Vorlage |

```bash
npm ci
npm test        # Logik-Tests
npm run lint    # ESLint
npm run check   # Struktur, Zeichenkodierung, generierte Dateien
npm run ci      # alles zusammen
```

Lokal deployen: `.clasp.json` mit `{"scriptId":"…","rootDir":"src"}`, dann `clasp push`.
