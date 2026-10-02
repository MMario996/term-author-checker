# Schnittstellen: Kärcher TermCheck

> Alle Endpunkte, die diese Anwendung aufruft oder anbietet, aus dem Code abgeleitet (Stand 2026-10-02).
> Gesamtübersicht aller Anwendungen: [`ENDPOINTS-GESAMT.md`](https://github.com/MMario996/kaerchertranslationservices/blob/main/docs/gesamt/ENDPOINTS-GESAMT.md) (Ordner `docs/gesamt/` im Repository kaerchertranslationservices).

## 1. Phrase TMS (REST)

| | |
|---|---|
| Basis | `https://cloud.memsource.com/web/api2/<version>` |
| Token | PHRASE_API_TOKEN (Präfix `ApiToken`/`Bearer` wird entfernt) |
| Aufruf-Helfer | `_phraseFetch_` in `src/Code.gs` |

| Methode | Version | Pfad | Zweck | Datei (`src/`) |
|---|---|---|---|---|
| GET | v1 | `/termBases?pageNumber=…&pageSize=50` | Termbanken (Liste, Verbindungstest mit pageSize=1) | Code.gs |
| POST | v1 | `/termBases/{termBaseUid}/browse` | Terminologiesuche, Author Check (Termtreffer) | Code.gs, Authorcheck.gs |
| GET | v1 | `/projectTemplates/{templateUid}` | Sprachen der Vorlagen „Terminology check LLM/ALG“ | Code.gs |

Web-Links (keine API): Projekt `https://cloud.memsource.com/web/project2/show/{projectUid}` bzw. `/web/project/show/{projectUid}`, Job `https://cloud.memsource.com/web/job/{jobUid}/translate`.

## 2. Weitere ausgehende Schnittstellen

| Dienst | Endpunkt | Zweck | Authentifizierung |
|---|---|---|---|
| Gemini (Apigee-Proxy) | POST https://34-111-99-134.nip.io/gemini/v1beta/models/{model}:generateContent (Header `x-api-key: GEMINI_API_KEY`) (URL aus `GEMINI_API_URL`) | KI-Suche, Author Check, PDF-Prüfung (`AI_MODEL`, Standard `gemini-3.6-flash`) | GEMINI_API_KEY |
| Google Drive REST | POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart\|resumable&supportsAllDrives=true · GET/DELETE …/drive/v3/files/{id} | Berichte und kommentierte PDFs ablegen, große PDFs | Nutzer |
| Apps Script API | GET https://script.googleapis.com/v1/projects/{scriptId}/content | `exportProjectToTxt` (Quellcode als Text) | Nutzer |
| Google Sheets | SpreadsheetApp.openById(`CUSTOM_RULES_LOG_SHEET_ID`) | Custom Rules Log | Nutzer |
| MailApp | – | Hinweise an Admins | Nutzer |
| Gemini Gems | https://gemini.google.com/gem/1U9keOE3XPTPG3QEq63ZCYZ-5EOTruqgC · …/1bgoe1LSjDPZMId5lf98dBbVQp1KMH2CO | Links: Regel vorbereiten, Regel-Importer | – |

## 3. Eingehende Einstiege

| Einstieg | Aufrufer | Beschreibung |
|---|---|---|
| Workspace-Add-on | Docs, Sheets, Slides, Drive | Terminologiesuche, Author Check, PDF-Prüfung in Drive |
| GET <Web-App-URL> (`doGet`) | Browser (Domain) | Terminologiesuche; `?page=pdfcheck` PDF-Prüffenster aus dem Drive-Add-on |
| `google.script.run.api…` | Sidebars/Web-App | Server-Funktionen (`tests/check.js` prüft, dass alle aufgerufenen existieren) |
