# Gemini-Gem „Kärcher Regel-Importer“

Wandelt einen Redaktionsleitfaden (PDF) in eigene Regeln für den Author Check um.
Das Ergebnis ist eine JSON-Datei, die im Author Check über **Regeln → JSON-Import**
eingelesen wird.

## Gem einrichten (einmalig, ca. 5 Minuten)

1. <https://gemini.google.com> öffnen → **Gem-Manager** → **Neues Gem**.
2. **Name:** `Kärcher Regel-Importer`
3. **Beschreibung:** `Macht aus einem Redaktionsleitfaden (PDF) importierbare Regeln für den Kärcher Author Check (JSON).`
4. **Anweisungen:** den kompletten Inhalt von [`gem-anweisungen.md`](gem-anweisungen.md) einfügen.
5. **Wissen:** die Dateien [`standardregeln_de.md`](standardregeln_de.md) und
   [`standardregeln_en.md`](standardregeln_en.md) hochladen. Mit ihnen erkennt der Gem,
   was der Author Check schon als Standardregel kennt, und erzeugt keine Dubletten.
6. Speichern. Zum Teilen mit dem Team: Gem → **Teilen**.

Im Regel-Popup öffnen zwei 🤖-Buttons die Gems: „Regel mit Gemini vorbereiten“ (eine
einzelne Regel formulieren) und „JSON-Regelsatz aus Leitfaden (PDF)“ (dieser Gem). Die
Freigabe-Links stehen in `GEM_URLS` in `AuthorCheck.html`.

## Benutzen

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
- Beispiel mit beiden Arten: [`beispiel_RL2026_de.json`](beispiel_RL2026_de.json).

## Standardregeln aktualisieren

Die Wissensdateien werden aus `Rules.gs` erzeugt. Nach Änderungen an den Standardregeln
neu erzeugen und im Gem ersetzen:

```bash
node gemini-gem/generate-standardregeln.js
```
