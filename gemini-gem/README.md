# Gemini-Gem „Kärcher Regel-Importer“

Wandelt einen Redaktionsleitfaden (PDF) in eigene Regeln für den Author Check um
(**Modus L**) oder macht aus einem fertigen Prüf-Prompt eine einzelne KI-Prompt-Regel
(**Modus P**), z. B. einen Cross-Check auf Widersprüche und Prozesslogik über das ganze
Dokument. Das Ergebnis ist eine JSON-Datei, die im Author Check über
**Regeln → JSON-Import** eingelesen wird.

## Gem einrichten (einmalig, ca. 5 Minuten)

1. <https://gemini.google.com> öffnen → **Gem-Manager** → **Neues Gem**.
2. **Name:** `Kärcher Regel-Importer`
3. **Beschreibung:** den Text aus [Beschreibung im Gem](#beschreibung-im-gem) einfügen.
4. **Anweisungen:** den kompletten Inhalt von [`gem-anweisungen.md`](gem-anweisungen.md) einfügen.
5. **Wissen:** die Dateien [`standardregeln_de.md`](standardregeln_de.md) und
   [`standardregeln_en.md`](standardregeln_en.md) hochladen. Mit ihnen erkennt der Gem,
   was der Author Check schon als Standardregel kennt, und erzeugt keine Dubletten.
6. Speichern. Zum Teilen mit dem Team: Gem → **Teilen**.

Im Regel-Popup öffnen zwei 🤖-Buttons die Gems: „Regel mit Gemini vorbereiten“ (eine
einzelne Regel formulieren) und „JSON-Regelsatz aus Leitfaden (PDF)“ (dieser Gem). Die
Freigabe-Links stehen in `GEM_URLS` in `AuthorCheck.html`.

## Beschreibung im Gem

```text
Turns an editorial style guide (PDF) or a finished check prompt into rules you can import into Kärcher Author Check 🗂️

Style guide (PDF):
1) Upload the PDF and state the rule language (DE or EN).
2) Round 1 – the Gem reads the whole guide point by point and replies without JSON:
   ⚠️ Rules that already exist as standard rules – include them in the new category? (A all / B none / C pick)
   📊 Overview of new rules per chapter
   ❓ Open questions
   🚫 What is not taken over (with reasons)
3) Answer these questions.
4) Round 2 – you get one JSON code block (max. 40 rules per part).

Check prompt (e.g. cross-check for contradictions across pages):
1) Paste the prompt (or upload it as a file). Optionally add the style guide PDF if the prompt refers to it.
2) Round 1 – the Gem summarises the prompt, proposes the scope ("Whole document" or "Per passage") and lists what will not work at check time (knowledge files, logs, placeholders, links) with a fix for each.
3) Answer the questions.
4) Round 2 – you get one JSON code block with exactly one AI prompt rule containing your complete prompt.

Then: save the code block as a .json file. In Author Check go to Rules → select rule language → JSON Import → Save Settings.
New rules appear under "Custom: …". Check PDFs with a "Whole document" rule in the PDF window.
```

## Benutzen: Leitfaden (Modus L)

1. Den Gem öffnen, den Leitfaden als PDF hochladen, z. B. mit
   „Bitte in Regeln umwandeln, Regelsprache Deutsch.“
2. **Runde 1:** Der Gem liest den ganzen Leitfaden Punkt für Punkt und antwortet
   noch ohne JSON, in dieser Reihenfolge:
   1. ⚠️ **bereits vorhandene Standardregeln**, mit der Frage, ob sie in die neue
      Kategorie übernommen werden sollen (A alle / B keine / C einzeln). Übernommene
      Standardregeln werden verschoben und eingeschaltet, nicht doppelt angelegt.
   2. **Übersicht** der neuen Regeln pro Kapitel, dazu die Bilanz (alle Vorgaben =
      neu + Standard + nicht übernommen + Fragen)
   3. **offene Fragen**
   4. **nicht übernommen** (mit Grund)
3. Frage 1 und die offenen Fragen beantworten.
4. **Runde 2:** Erst jetzt liefert der Gem den JSON-Codeblock, bei großen Leitfäden in
   Teilen mit je höchstens 40 Einträgen.
5. Den Inhalt des Codeblocks (nur das `[ … ]`) als `.json` speichern, z. B. `KFT_de.json`.
6. Im Author Check (Docs, Sheets oder Slides): **Regeln** → **Regelsprache** wählen →
   **JSON-Import** → Datei wählen → **Einstellungen speichern**.

Nach dem Import meldet der Author Check, wie viele Standardregeln angepasst und wie
viele eigene Regeln übernommen wurden. Alle eigenen Regeln stehen unter **„Custom: …“**.

## Benutzen: fertiger Prompt (Modus P)

1. Den Gem öffnen und den Prompt einfügen, z. B. „Mach daraus eine KI-Prompt-Regel:
   <Prompt>“. Bezieht sich der Prompt auf einen Leitfaden, das Leitfaden-PDF mit
   hochladen.
2. **Runde 1:** Der Gem antwortet ohne JSON:
   1. **Zusammenfassung**, was der Prompt prüft
   2. **Geltungsbereich** mit Begründung: „Gesamtdokument“ (Prompt geht mit dem ganzen
      Dokument in einer eigenen Anfrage an Gemini, eigener Bericht und Kommentare an den
      Fundstellen) oder „Pro Abschnitt“ (wie alle anderen Regeln)
   3. **Was zur Prüfzeit nicht funktioniert**, mit Vorschlag: Wissensdateien („in diesem
      Gem hinterlegt“), vorgelagerte Logs, Platzhalter wie „[FÜGE HIER … EIN]“,
      Basis-URLs, Rückfragen. Leitfaden-Vorgaben, die der Prompt braucht, kann der Gem
      wörtlich in den Prompt übernehmen.
   4. **Offene Fragen**: Titel, Kategorie, Regelsprache, Änderungen aus 3 übernehmen
      (A alle / B keine / C einzeln)
3. Antworten.
4. **Runde 2:** ein JSON-Codeblock mit **genau einer** Regel. Der ganze Prompt steht
   ungekürzt in `CustomPrompt` (bis 50.000 Zeichen).
5. Speichern und importieren wie oben. PDFs mit einer „Gesamtdokument“-Regel im
   **PDF-Fenster** prüfen (nicht im Drive-Seitenbereich).

Zur Prüfzeit bekommt eine „Gesamtdokument“-Regel die übrigen aktiven eigenen Regeln
derselben Regelsprache als Referenz mit, z. B. den mit Modus L importierten
Redaktionsleitfaden. Prompt und Leitfaden deshalb in **derselben Regelsprache**
importieren. Ist die PDF für eine Anfrage zu groß, läuft der Prompt mit dem Text aller
Seiten (ohne Bilder); das Ergebnis weist darauf hin.

Vor dem Import prüfen (wie die CI): `node tests/gem.test.js meine_regeln_de.json`. Das
meldet z. B. Namen ohne `CUSTOM_`, fehlenden Geltungsbereich oder Stellen im Prompt, die
zur Prüfzeit nicht funktionieren (Platzhalter, Gem-Wissensdatei, Log, Basis-URL).

Beispiel: [`beispiel_prompt_crosscheck_de.json`](beispiel_prompt_crosscheck_de.json) ist
der Cross-Check-Prompt für Betriebstechnische Anleitungen, schon für den Author Check
angepasst: ohne Gem-Wissensdatei und Log, mit Seiten „X von Y“ statt Links und mit
lückenloser Zuordnung aller Seiten zu Clustern.

## Regeln verwalten

- **Papierkorb an einer eigenen Regel:** löscht diese Regel.
- **Papierkorb an einer Kategorie:** löscht alle eigenen Regeln darin. Dorthin
  übernommene Standardregeln (Kennzeichen „Standard“) kommen in ihre ursprüngliche
  Kategorie zurück.
- **Standard wiederherstellen:** setzt die gewählte Regelsprache auf den
  Auslieferungszustand zurück, ohne eigene Regeln. Vorher am besten „JSON-Export“.

## Was das Format voraussetzt (geprüft gegen den Code)

- Neue Regeln: `Name` beginnt mit `CUSTOM_` und enthält nur `A–Z 0–9 _`. Nur solche
  Regeln lädt `apiGetRulesConfig` nach dem Speichern wieder. Der Import ergänzt ein
  fehlendes `CUSTOM_` automatisch und legt Regeln ohne Custom-Kategorie unter
  „Custom: …“ ab.
- Einträge mit dem `Name` einer Standardregel ändern nur deren An/Aus, Wert und
  Kategorie. Es entsteht keine Dublette.
- Regelsätze gibt es nur für **Deutsch** und **Englisch**. Die Prüfung verwendet eigene
  Regeln nur in diesen Sprachen.
- `RuleKind: "RULE"` mit leerem `CustomPrompt` geht als `- [Typ] Beschreibung` an die KI.
  `RuleKind: "PROMPT"` geht als „SPECIFIC CHECK“ mit dem `CustomPrompt` an die KI.
- `"PromptScope": "DOCUMENT"` (nur bei `PROMPT`): Der `CustomPrompt` läuft als eigene
  Anfrage mit dem ganzen Dokument (siehe `DocPrompts.gs`). Ohne das Feld gilt
  „Pro Abschnitt“. Im Popup lässt sich das an der Regel umschalten.
- Beispiel mit beiden Arten: [`beispiel_RL2026_de.json`](beispiel_RL2026_de.json).

## Standardregeln aktualisieren

Die Wissensdateien werden aus `Rules.gs` erzeugt. Nach Änderungen an den Standardregeln
neu erzeugen und im Gem ersetzen:

```bash
node gemini-gem/generate-standardregeln.js
```
