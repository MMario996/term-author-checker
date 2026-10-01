# Kärcher TermCheck (Repo `term-author-checker`)

> Kurz: Google-Workspace-Add-on (Docs, Sheets, Slides, Drive) und Web-App mit zwei Werkzeugen: 🔍 **Terminologiesuche** in den Phrase-Termbanken (mit KI-gestützter Freitext- und Bildsuche) und ✍️ **Author Check** – Grammatik-, Terminologie- und Stilprüfung mit Gemini nach einstellbaren Regeln, auch für **PDFs in Google Drive**. Oberfläche in 15 Sprachen.

---

## 1. Steckbrief

| Eigenschaft | Wert |
|---|---|
| Typ | Workspace-Add-on „Kärcher TermCheck“ (Farbe `#FFED00`/`#3A3A3A`) + Web-App (`executeAs: USER_ACCESSING`, `access: DOMAIN`) |
| Einstiege | `onHomepage` (Docs/Sheets/Slides: Wahl Terminologiesuche oder Author Check), `onDriveHomepage`, `onDriveItemsSelected` (PDF), Web-App `doGet` → `TermSearch.html`; `?page=pdfcheck` → PDF-Prüffenster |
| Phrase | `PHRASE_API_TOKEN`, API v1 (Termbanken, Projektvorlagen) |
| Gemini | `GEMINI_API_URL` (Standard Proxy `https://34-111-99-134.nip.io/gemini/v1beta/models/`), `AI_MODEL` (`gemini-3.6-flash`), `AI_TEMPERATURE` (0.2), Retry bei 429/5xx |
| Datenbank | optional „Custom Rules Log“-Sheet (`CUSTOM_RULES_LOG_SHEET_ID`, Tab `Custom`); Nutzerregeln in User Properties + JSON-Datei in Drive |
| Erweiterte Dienste | Drive v3, Sheets v4 |
| Rollen | `ADMIN` (in `ADMIN_EMAILS`), sonst `GUEST`; leere Admin-Liste → niemand ist Admin |
| CI/CD | `ci.yml` (`node ci/check.js`, UI-Smoke), `deploy.yml` (`main` → `clasp push` + Version; Secrets `CLASPRC_JSON`, `SCRIPT_ID`, `DEPLOYMENT_ID`) |

## 2. Aufbau

```mermaid
flowchart LR
  subgraph Add-on
    H[Startkarte] --> TS[Terminologiesuche<br/>Sidebar.html]
    H --> AC[Author Check<br/>AuthorCheck.html]
    D[Drive: PDF wählen] --> PDF[PDF-Check<br/>Karten oder eigenes Fenster]
  end
  W[Web-App TermSearch.html] --> TS2[Terminologiesuche Vollbild]
  TS & TS2 --> PH[(Phrase Termbanken)]
  TS & TS2 --> G[Gemini: KI-Suche,<br/>Text oder Bild]
  AC --> G
  AC --> R[Regeln Rules.gs<br/>+ eigene Regeln]
  PDF --> G
  PDF --> OUT[Ergebnis: Sheet-Export<br/>oder kommentierte PDF-Kopie]
```

## 3. Terminologiesuche

- Durchsucht die erlaubten Termbanken (`ALLOWED_TB_UIDS`, leer = alle) in Phrase, zeigt Benennungen je Sprache mit Flaggen.
- **KI-Suche:** Freitext oder Bild → Gemini schlägt 1–3 Fachbegriffe vor (Prompt `AI_PROMPT`), dann Termbank-Suche.
- **Browse:** Termbank seitenweise durchblättern, sortieren, filtern; Export ins Sheet.
- Sprachen der Suche aus den Projektvorlagen `TEMPLATE_LLM` (`pNoERiZ1YTileyUe4Za1j6`, „[AKW] Terminology check [MT+Review LLM]“) und `TEMPLATE_ALG` (`arpmvYCEAqGl0OmKV9f3s3`, „[AKW] Terminology check [MT+Review ALG]“).
- Teilbare Links: Web-App-URL + `?q=<suchbegriff>`.

## 4. Author Check

- Prüft das ganze Dokument oder nur die Auswahl (Docs, Sheets, Slides), max. 60.000 Zeichen, bis 5 parallele KI-Anfragen.
- Prompt: `AUTHORCHECK_PROMPT` (Admin-pflegbar) mit Glossar aus der Termbank, aktiven Standardregeln und eigenen Regeln (`SPECIFIC CHECK`).
- Ergebnisse: Fehlerliste mit Vorschlag; **Ersetzen**, **Zur Stelle springen**, **als Kommentar einfügen**; Export als Audit-Report oder Regelübersicht.
- **Regeln:** Standardregeln für Deutsch und Englisch (`Rules.gs`, Typen Grammar, Spelling, Style, Terminology …), je Nutzer ein-/ausschaltbar mit Parametern. Nur Abweichungen werden gespeichert (User Properties, gestückelt). Eigene Regeln (`CUSTOM_…`) liegen in einer JSON-Datei im Drive des Nutzers; neue eigene Regeln werden ins Custom-Rules-Log geschrieben.
- **JSON-Import/-Export** von Regelsätzen; „Standard wiederherstellen“.
- **Zwei Gemini-Gems** (Buttons 🤖 im Regel-Popup):
  - „Regel mit Gemini vorbereiten“: `https://gemini.google.com/gem/1U9keOE3XPTPG3QEq63ZCYZ-5EOTruqgC`
  - „Kärcher Regel-Importer“ (Leitfaden-PDF → JSON): `https://gemini.google.com/gem/1bgoe1LSjDPZMId5lf98dBbVQp1KMH2CO` – Einrichtung und Anweisungen in `gemini-gem/` (`gem-anweisungen.md`, Wissen `standardregeln_de.md`, `standardregeln_en.md`, Beispiel `beispiel_RL2026_de.json`).

## 5. PDF-Prüfung in Drive

- PDF in Drive markieren → Seitenbereich → „PDF prüfen“ mit Sprachwahl (31 Sprachen).
- Ablauf in Etappen: PDF laden (≤ 15 MB direkt; bis 300 MB wird es vorher ohne große Bilder neu aufgebaut, `PdfShrink.gs`), Text mit Positionen extrahieren (`PdfTextPosition.gs`, `PdfInflate.gs`), Gemini prüfen, Ergebnis.
- Ausgabe: Ergebnis-Karte (max. 25 Befunde), **Export ins Sheet** oder **kommentierte PDF-Kopie** (Anmerkungen an den Fundstellen, `PdfAnnotate.gs`; große Dateien stückweise hochgeladen).
- **Eigenes Fenster:** Mit gesetzter Script Property `WEBAPP_URL` (…/exec einer Web-App-Bereitstellung, „Ausführen als Nutzer“, Zugriff Domain) öffnet „PDF prüfen“ das Fenster `PdfCheck.html`, das alle Etappen automatisch abarbeitet (6 min statt 30 s pro Aufruf). Prüfen mit `checkPdfWindowSetup()`.

## 6. Script Properties (Admin-Einstellungen)

| Property | Zweck |
|---|---|
| `PHRASE_API_TOKEN` | Phrase |
| `ADMIN_EMAILS` | Admins |
| `TEMPLATE_LLM`, `TEMPLATE_ALG` | Projektvorlagen für Sprachen |
| `ALLOWED_TB_UIDS` | erlaubte Termbanken |
| `CUSTOM_RULES_LOG_SHEET_ID` | Log neuer eigener Regeln |
| `GEMINI_API_KEY`, `GEMINI_API_URL`, `AI_MODEL`, `AI_TEMPERATURE` | KI |
| `AI_PROMPT` | Prompt der KI-Suche |
| `AUTHORCHECK_PROMPT` | Prompt des Author Check |
| `WEBAPP_URL` | PDF-Fenster |
| `EXPORT_FOLDER_ID` | Ziel für `exportProjectToTxt` (Quellcode-Export) |

User Properties: `UI_LANG` (15 Sprachen: en, de, fr, es, it, pt, zh, ja, no, sv, fi, tr, hu, hr, el), `AUTHORCHECK_RULES_HELP_SEEN`, `DRIVE_PDF_LAST_LANGUAGE`, Regel-Overrides.

## 7. Phrase-Workflows (Ordner `workflows/`)

Exporte von **Phrase-Orchestrator**-Workflows „Brand Review Assignment“ (v6 Schritt 2, v6 Schritt 3, v7 Schritt 2+3): lesen die Custom Fields eines Projekts und weisen je nach Review-Schlüssel eine Vorlage pro Workflow-Schritt zu. Die Zuordnung steht in `mapping-value.txt`, z. B. `reviewakw` → Schritt 2 → Vorlage `fEp3QVEveabMf91OcwP418`, `reviewkft` → `89QZMp1Zd4TrgOPVjLBCC2`, Campus-DSGVO-/Produkt-/Sales-Trainings je Schritt 2 und 3. Dazu eine Postman-Collection „Phrase TMS - Project Templates“.

## 8. Dateien

| Datei | Inhalt |
|---|---|
| `Code.gs` | Web-App, Kontext, Einstellungen, Termbanken, Suche, KI-Suche, Sheet-Export, Sidebar |
| `Authorcheck.gs`, `AuthorCheck.html` | Author Check |
| `Rules.gs` | Standardregeln DE/EN, Regel-API, Custom-Rules-Log |
| `DriveAddon.gs`, `DrivePdfPrep.gs`, `DrivePdfWeb.gs`, `PdfCheck.html` | PDF-Prüfung |
| `PdfAnnotate.gs`, `PdfInflate.gs`, `PdfShrink.gs`, `PdfTextPosition.gs` | PDF-Verarbeitung ohne externe Bibliotheken |
| `Homepage.gs`, `HomeChooser.html`, `Sidebar.html`, `TermSearch.html` | Oberflächen |
| `I18n.html`, `CardI18n.gs` | Texte in 15 Sprachen |
| `GeminiTest.gs` | `apiDebugGeminiConnection` |
| `exportProjectToTxt.gs` | Quellcode als Text exportieren |
| `ci/` | Syntax- und Aufrufprüfung, UI-Smoke |
| `gemini-gem/` | Gem „Kärcher Regel-Importer“ |
| `workflows/` | Phrase-Orchestrator-Workflows |

---

Gesamtdokumentation aller acht Repositories (Systemlandkarte, alle Datenbanken, FAQ, Gemini-Gem/NotebookLM-Paket): [`MMario996/kaerchertranslationservices` → `wissensbasis/`](https://github.com/MMario996/kaerchertranslationservices/tree/main/wissensbasis).
