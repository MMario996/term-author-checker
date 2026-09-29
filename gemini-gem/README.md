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

Optional: Den Link im Regel-Popup („Regel mit Gemini vorbereiten“, `AuthorCheck.html`)
auf den Freigabe-Link des neuen Gems umstellen.

## Benutzen

1. Den Gem öffnen, den Leitfaden als PDF hochladen, z. B. mit
   „Bitte in Regeln umwandeln, Regelsprache Deutsch.“
2. Der Gem fragt fehlende Angaben nach (Regelsprache DE/EN, Kurzname, Sektion) und
   liefert einen **Kurzbericht** sowie einen **JSON-Codeblock**.
3. Den Inhalt des Codeblocks (nur das `[ … ]`) in eine Textdatei kopieren und als
   `.json` speichern, z. B. `RL2026_de.json`.
4. Im Author Check (Docs, Sheets oder Slides): **Regeln** → oben die passende
   **Regelsprache** wählen → **JSON-Import** → Datei wählen → **Einstellungen speichern**.
   Die Regeln erscheinen in der Sektion „Leitfaden: …“ und lassen sich dort einzeln
   ein- und ausschalten.

Bei großen Leitfäden liefert der Gem mehrere Teile mit je höchstens 40 Regeln. Jeden Teil
als eigene Datei speichern und nacheinander importieren, dann einmal speichern.

## Was das Format voraussetzt (geprüft gegen den Code)

- `Name` beginnt mit `CUSTOM_` und enthält nur `A–Z 0–9 _`. Nur solche Regeln lädt
  `apiGetRulesConfig` nach dem Speichern wieder. Andere Namen werden vom Import zwar
  angenommen, sind nach dem Speichern aber weg.
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
