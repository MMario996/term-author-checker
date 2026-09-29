# Standard rules (rule language English)

These rules are already built into Author Check. Do not create custom rules that check the same thing – instead mention the standard rule (Name) in the report so it can be enabled in the popup.

Format: `Name` | Typ | Unterabschnitt | Beschreibung (Name | Type | Subsection | Description)

## Inclusive Language / Corporate Policy

- `950001de` | Style | Non-Discriminatory Language | Avoid discriminatory language in general
- `950002de` | Style | Non-Discriminatory Language | Avoid relativizing phrases
- `950003de` | Style | Non-Discriminatory Language | Avoid generalizations
- `950004de` | Style | Non-Discriminatory Language | Avoid unfriendly and derogatory expressions
- `951000de` | Style | Non-Discriminatory Language | Use inclusive language
- `952101de` | Style | Non-Discriminatory Language | Strongly discriminatory terms for people based on origin
- `952102de` | Style | Non-Discriminatory Language | Avoid racist terms for people
- `952103de` | Style | Non-Discriminatory Language | Check terms that discriminate based on origin
- `952302de` | Style | Non-Discriminatory Language | Avoid discriminatory geographic terms
- `952303de` | Style | Non-Discriminatory Language | Check geographic terms
- `952401de` | Style | Non-Discriminatory Language | Words containing discriminatory terms for people
- `952503de` | Style | Non-Discriminatory Language | Check geopolitically questionable terms
- `952601de` | Style | Non-Discriminatory Language | Strongly discriminatory or euphemistic terms
- `952602de` | Style | Non-Discriminatory Language | Avoid discriminatory terms related to origin
- `952701de` | Style | Non-Discriminatory Language | Strongly discriminatory verbs related to a person's origin
- `952801de` | Style | Non-Discriminatory Language | Strongly discriminatory adjectives related to a person's origin
- `952802de` | Style | Non-Discriminatory Language | Avoid discriminatory adjectives related to a person's origin
- `952803de` | Style | Non-Discriminatory Language | Check discriminatory adjectives related to a person's origin
- `953101de` | Style | Non-Discriminatory Language | Strongly discriminatory terms based on sexual orientation
- `953102de` | Style | Non-Discriminatory Language | Avoid discriminatory terms based on sexual orientation
- `953202de` | Style | Non-Discriminatory Language | Avoid discriminatory terms referring to a person's sexual orientation
- `953203de` | Style | Non-Discriminatory Language | Check discriminatory terms referring to a person's sexual orientation
- `954102de` | Style | Non-Discriminatory Language | Avoid discriminatory terms based on age
- `954103de` | Style | Non-Discriminatory Language | Check terms referring to a specific age
- `954301de` | Style | Non-Discriminatory Language | Strongly age-discriminatory terms
- `954302de` | Style | Non-Discriminatory Language | Avoid age-discriminatory terms
- `954303de` | Style | Non-Discriminatory Language | Check age-discriminatory terms
- `954401de` | Style | Non-Discriminatory Language | Strongly age-discriminatory adjectives
- `954402de` | Style | Non-Discriminatory Language | Avoid age-discriminatory adjectives
- `954502de` | Style | Non-Discriminatory Language | Avoid age-discriminatory verbs
- `955101de` | Style | Non-Discriminatory Language | Strongly discriminatory terms for people with disabilities
- `955102de` | Style | Non-Discriminatory Language | Avoid discriminatory terms for people with disabilities
- `955103de` | Style | Non-Discriminatory Language | Check discriminatory terms for people with disabilities
- `955201de` | Style | Non-Discriminatory Language | Strongly discriminatory adjectives related to disabilities
- `955202de` | Style | Non-Discriminatory Language | Avoid discriminatory adjectives related to disabilities
- `955203de` | Style | Non-Discriminatory Language | Check discriminatory adjectives related to disabilities
- `955301de` | Style | Non-Discriminatory Language | Strongly discriminatory terms related to disabilities
- `955302de` | Style | Non-Discriminatory Language | Avoid discriminatory terms related to disabilities
- `955303de` | Style | Non-Discriminatory Language | Check discriminatory terms related to disabilities
- `955402de` | Style | Non-Discriminatory Language | Avoid discriminatory verbs related to disabilities
- `955502de` | Style | Non-Discriminatory Language | Avoid discriminatory phrases related to disabilities
- `955503de` | Style | Non-Discriminatory Language | Check discriminatory phrases related to disabilities
- `956101de` | Style | Non-Discriminatory Language | Strongly discriminatory terms based on religious affiliation
- `956201de` | Style | Non-Discriminatory Language | Discriminatory terms related to religion and belief
- `957101de` | Style | Non-Discriminatory Language | Strongly discriminatory terms related to gender identity
- `957102de` | Style | Non-Discriminatory Language | Avoid discriminatory terms related to gender identity
- `957202de` | Style | Non-Discriminatory Language | Avoid discriminatory terms related to gender identity
- `957303de` | Style | Non-Discriminatory Language | Check discriminatory phrases related to gender identity
- `958101de` | Style | Non-Discriminatory Language | Strongly discriminatory terms based on social background
- `958102de` | Style | Non-Discriminatory Language | Avoid discriminatory terms based on social background
- `958201de` | Style | Non-Discriminatory Language | Strongly discriminatory terms based on social background
- `958202de` | Style | Non-Discriminatory Language | Avoid terms discriminating based on social background
- `958203de` | Style | Non-Discriminatory Language | Check terms discriminating based on social background
- `958301de` | Style | Non-Discriminatory Language | Strongly discriminatory adjectives based on social background
- `958302de` | Style | Non-Discriminatory Language | Avoid discriminatory adjectives based on social background
- `958303de` | Style | Non-Discriminatory Language | Check discriminatory adjectives based on social background
- `958403de` | Style | Non-Discriminatory Language | Check discriminatory verbs based on social background

## Spelling

- `NEU15` | Abbreviation | General | Checks that month abbreviations (e.g. Oct, Jun) and weekday abbreviations (e.g. Mon, Wed) in short texts are written without a trailing period.

## Style (General)

- `190de` | Style | Punctuation, Brackets & Compounds | Avoid exclamation marks at the end of a sentence
- `191de` | Style | Punctuation, Brackets & Compounds | Avoid semicolons
- `220de` | Style | Punctuation, Brackets & Compounds | Avoid ambiguous possessive constructions
- `230de` | Style | Punctuation, Brackets & Compounds | Avoid ambiguous location references
- `510de` | Style | Sentence Structure | Avoid stacking too many attributes in front of a noun
- `511de` | Style | Sentence Structure | Avoid too many prepositional phrases in one sentence
- `512de` | Style | Sentence Structure | Avoid too many units of meaning in one sentence
- `514de` | Style | Sentence Structure | Avoid complex attributes
- `530de` | Style | Sentence Structure | Keep sentences short
- `532de` | Style | Sentence Structure | Avoid coordinating too many main clauses
- `534de` | Style | Sentence Structure | Avoid long parenthetical insertions
- `560de` | Style | Sentence Structure | Avoid two or more parenthetical insertions in one sentence
- `561de` | Style | Sentence Structure | Mention plural forms in brackets, avoid where possible
- `620de` | Style | Sentence Structure | Follow chronological order in instructions
- `630de` | Style | Sentence Structure | Put the subject before the object in case of ambiguity
- `710de` | Style | Sentence Structure | Avoid passive voice with an explicit agent ("by...")
- `711de` | Style | Sentence Structure | Avoid passive voice
- `720de` | Style | Sentence Structure | Avoid too many nominalizations
- `734de` | Style | Sentence Structure | Avoid modal verbs in passive voice
- `740de` | Style | Sentence Structure | Avoid double negation
- `741de` | Style | Sentence Structure | Avoid strong negation
- `780de` | Style | Word Choice | Avoid too many adjectives
- `79003de` | Style | Punctuation, Brackets & Compounds | Avoid placeholder/lorem-ipsum text
- `NEU09` | Style | Punctuation, Brackets & Compounds | Ensures that bullet points explicitly describing marketing benefits always end with a full stop - even for syntactically incomplete sentences (e.g. "- 50 percent time savings when ironing.").
- `NEU11` | Style | Punctuation, Brackets & Compounds | Requires the brand URL www.karcher.com to always be written in lowercase in body text - this applies even when it directly follows the full stop of the previous sentence.
- `NEU12` | Style | Punctuation, Brackets & Compounds | Checks that footnotes are formatted correctly: the text must start with a capital letter and end with a full stop. The only exception is the standalone marker word "NEU".
- `NEU13` | Style | Punctuation, Brackets & Compounds | Requires thousands separators (numbers with 4+ digits) to always use a comma instead of a period (e.g. 1,000 or 193,000).
- `NEU14` | Style | Punctuation, Brackets & Compounds | Requires the percent sign (%) to directly follow the digit without a space in short texts and tables (e.g. 5%).
- `NEU16` | Style | Punctuation, Brackets & Compounds | Identifies and removes the comma before the last item in a list (Oxford comma), unless it is strictly necessary to avoid ambiguity.
- `NEU17` | Style | Punctuation, Brackets & Compounds | Flags sentences that start with a number written as a digit and requires rephrasing or spelling it out as a word.
- `NEU18` | Style | Punctuation, Brackets & Compounds | Checks that text continues with a lowercase letter after a colon, unless followed by a proper noun.
- `NEU19` | Style | Punctuation, Brackets & Compounds | Requires the word "to" instead of an en dash in body text, and prevents the unit of measurement from being stated twice (e.g. 5 to 8 mg).
- `NEU20` | Style | Punctuation, Brackets & Compounds | Detects gender-specific endings in job titles/person references (e.g. chairman, policeman) and requires gender-neutral alternatives (e.g. chair, police officer).
- `NEU21` | Style | Punctuation, Brackets & Compounds | Detects and removes spaces before or after a slash in compound terms (e.g. only "plug/unplug" is allowed).

## Style (Marketing)

- `781de` | Style | Tone & Address | Avoid superlatives
- `79001de` | Style | Tone & Address | Avoid internet slang
- `79002de` | Style | Tone & Address | Avoid emoticons and emojis
- `333de` | Style | Tone & Address | Avoid excessive politeness fillers like "please"
- `732de` | Style | Tone & Address | Avoid first person ("I"/"we")
- `736de` | Style | Tone & Address | Avoid directly addressing the reader
- `338de` | Style | Tone & Address | Avoid empty phrases and clichés
- `351de` | Style | Tone & Address | Avoid exception phrasing
- `352de` | Style | Tone & Address | Avoid hedging and softening words
- `369de` | Style | Tone & Address | Avoid colloquial words
- `3911de` | Style | Tone & Address | Avoid negatively connotated expressions
- `3921de` | Style | Superlatives & Overselling | Avoid comparative or superlative forms of already intensified adjectives
- `3922de` | Style | Superlatives & Overselling | Check the comparison form of the adjective
- `3930de` | Style | Superlatives & Overselling | Avoid arrogant, overselling phrases
- `625de` | Style | Tone & Address | State the benefit before the feature

## Terminology

- `ADM` | Terminology | Term Status | Display of admitted term status
- `DEFTERM` | Terminology | Term Status | Default term notification
- `DEPR` | Terminology | Term Status | Deprecated term, suggests a positive alternative
- `NUMBER` | Terminology | Grammar Agreement | Don't forget the plural form
- `POSNEG` | Terminology | Term Status | Deprecated/preferred term, suggests a replacement for a deprecated term
- `VARPOSADM` | Terminology | Term Status | Variant of a preferred term and an admitted term
- `VARPOSNEG` | Terminology | Term Status | Variant of POSNEG
