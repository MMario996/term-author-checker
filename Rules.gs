// ============================================================================
// REGEL-KONFIGURATION FÜR DEN AUTOREN-CHECK
// ============================================================================
 const DEFAULT_RULES_CONFIG = [
    {
      "Description": "Kasus anpassen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "CASE",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Plural nicht vergessen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NUMBER",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Anaphorisches (rückbezügliches) Pronomen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "ANA",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Genus-Meldung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "GENUS",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Default Term-Meldung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "DEFTERM",
      "Type": "Terminology",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Schreibvarianten von Vorzugstermen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "VARPREF",
      "Type": "Terminology",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Vorzugsterme in Versalienschreibung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "VARCAP",
      "Type": "Terminology",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Variante eines Vorzugsterms und erlaubter Term",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "VARPOSADM",
      "Type": "Terminology",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Variante von POSNEG",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "VARPOSNEG",
      "Type": "Terminology",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Schreibvarianten von Negativtermen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "VARDEPR",
      "Type": "Terminology",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Negativterm als Bestandteil eines Kompositums",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "PARTDEPR",
      "Type": "Terminology",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Negativ-/Vorzugsterm, Vorschlag für Negativterm",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "POSNEG",
      "Type": "Terminology",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Negativterm, positiver Vorschlag",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "DEPR",
      "Type": "Terminology",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Anzeige von admitted",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "ADM",
      "Type": "Terminology",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Schreibvarianten von Termen aus dem Benutzerwörterbuch",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NIETERM",
      "Type": "Terminology",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte in bestimmten Elementen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk6001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Allein stehende Nebensätze, Hauptsätze mit Verberststellung oder andere spezielle finite Sätze",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk5002de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte ohne Infinitiv",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk5001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte, die durchgängig als Phrasen erkannt wurden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk4001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit \"z.B.\" am Anfang oder am Ende",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk3005de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Segmente, die nicht mindestens aus einem Substantiv und einem Verb bestehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk3004de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit Sonderzeichen am Anfang und ohne Infinitiv",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk3003de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte, die nur aus drei Substantiven bestehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk3002de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte, die nur aus zwei Substantiven bestehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk3001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte, die nur aus erkannten Termen bestehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk2001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit öffnender Klammer am Anfang",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk1006de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit schließender Klammer vorn oder öffnender Klammer hinten",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk1005de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit Klammerkonstrukt",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk1004de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit aufeinanderfolgenden Unterstrichen oder mehr als drei aufeinanderfolgenden Punkten",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk1003de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit Kästchen (U+2160)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk1002de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte mit \"#\" am Anfang",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk1001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte ohne drei Kleinbuchstaben in Folge",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk0002de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "GK: Satzobjekte ohne Leerzeichen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gk0001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Funktionsbeschreibungen ohne direktes Objekt vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def110de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Verschachtelte Relativsätze vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def108de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Koordination innerhalb von Relativsätzen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def107de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kein Komma, Semikolon oder Spiegelstrich",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def106de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Verb zu Beginn der Definition vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def105de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Keine eingebetteten Phrasen als vorangestelltes Attribut",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def104de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Oberbegriff ohne quantifizierende Angaben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def103de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Maximal ein Adjektiv vor dem Oberbegriff",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Oberbegriff ohne Artikelwort",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def101de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Bestimmte Formulierungen bei Bestandsbeziehungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def220de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"um zu\"-Konstruktion als Ergänzung des Oberbegriffs vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "def210de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Übereinstimmung von Objekt und Prädikatsnomen kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gc8de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Übereinstimmung von Subjekt und Prädikatsnomen kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gc6de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Phrasen zur geschlechtlichen Identität überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "957303de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Phrasen, die sich auf Menschen mit körperlichen oder geistigen Beeinträchtigungen beziehen, vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955502de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Negative genderspezifische Personenbezeichnungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951402de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Paarform als Gendermethode verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951111de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schrägstrich als Gendermethode verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951115de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Doppelpunkt als Gendermethode verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951113de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Gender-Gap als Gendermethode verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951116de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Gender-Stern als Gendermethode verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951112de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Binnen-I als Gendermethode verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951114de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Pronomen kontrollieren ",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gc7de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"derjenige\" vermeiden ",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gc3de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"Kunde\" ungegendert erlauben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951103de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Inklusive Sprache verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951000de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Personenbezeichnungen kontrollieren ",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gc2de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Plural statt Singular verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gc1de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Verben, die sich auf körperliche oder geistige Beeinträchtigungen beziehen, vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955402de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Personenbezeichnungen, die sich auf die soziale Herkunft beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958101de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Personenbezeichnung, die sich auf die soziale Herkunft beziehen, vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Bezeichnungen, die sich auf die soziale Herkunft beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958201de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen, die sich auf die soziale Herkunft beziehen, vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958202de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen, die sich auf die soziale Herkunft beziehen, überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958203de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Adjektive, die sich auf die soziale Herkunft beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958301de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Adjektive, die sich auf die soziale Herkunft beziehen, vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958302de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Adjektive, die sich auf die soziale Herkunft beziehen, überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958303de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Verben, die sich auf die soziale Herkunft beziehen, überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "958403de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"leicht\" und \"sicher\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3444de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"betragen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3443de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"verfügen über\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3442de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"besitzen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3441de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Füllwörter vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3391de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Durchmesserangabe überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1382de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von Uhrzeiten überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1381de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Komposita ohne Bindestrich schreiben (< 5)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1601de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kompositum mit Term als Kopfwort vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "725de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Mehrdeutige Bezüge vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "221de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Verb-Nomen-Ambiguität vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "240de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von mehrteiligen Punktabkürzungen ohne Leerzeichen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "764de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von Maßeinheit und Spannungsart kontrollieren (Leerzeichen verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1221de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von Maßeinheit und Spannungsart kontrollieren (&nbsp; verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "122de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Löscht bestimmte Regelcodes im Zusammenhang mit Auslassungspunkten am Satzende",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "193de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Anglizismen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3692de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Steigerungsform des Adjektivs überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3922de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Steigerungsformen von verstärkten Adjektiven vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3921de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "'Aber' als Hauptsatzkonjunktion vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3912de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Negativ besetzte Ausdrücke vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3911de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Unfreundliche und abwertende Ausdrücke vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "950004de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Generalisierungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "950003de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Relativierende Phrasen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "950002de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Allgemeine Diskriminierung vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "950001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen zur geschlechtlichen Identität vermeiden.",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "957202de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Phrasen, die sich auf Menschen mit körperlichen oder geistigen Beeinträchtigungen beziehen, überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955503de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Adjektive überprüfen, die sich auf Menschen mit Behinderungen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955203de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Adjektive, die sich auf Menschen mit körperlichen oder geistigen Beeinträchtigungen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955201de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen, die sich auf Menschen mit körperlichen oder geistigen Beeinträchtigungen beziehen, überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955303de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen, die sich auf Menschen mit körperlichen oder geistigen Beeinträchtigungen beziehen, vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955302de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Bezeichnungen, die sich auf Menschen mit körperlichen oder geistigen Beeinträchtigungen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955301de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Personenbezeichnungen für Menschen mit Behinderung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955103de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Personenbezeichnungen für Menschen mit Behinderung vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen vermeiden, die sich auf die sexuelle Orientierung von Personen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "953202de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Personenbezeichnungen aufgrund der sexuellen Orientierung vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "953102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Wörter mit diskriminierenden Personenbezeichnungen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952401de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Verben, die sich auf die Herkunft von Personen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952701de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Adjektive, die sich auf die Herkunft von Personen beziehen, überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952803de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Adjektive, die sich auf die Herkunft von Personen beziehen, vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952802de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Personenbezeichnungen aufgrund der Herkunft überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952103de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Personenbezeichnungen aufgrund der Herkunft",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952101de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen zu Religion und Weltanschauung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "956201de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Altersdiskriminierende Verben vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954502de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark altersdiskriminierende Adjektive",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954401de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Altersdiskriminierende Adjektive vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954402de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Altersdiskriminierende Bezeichnungen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954303de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Altersdiskriminierende Bezeichnungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954302de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark altersdiskriminierende Bezeichnungen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954301de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Geopolitisch fragwürdige Bezeichnungen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952503de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Geografische Bezeichnung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952303de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Personenbezeichnung zur geschlechtlichen Identität vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "957102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Personenbezeichnungen zur geschlechtlichen Identität",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "957101de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen überprüfen, die sich auf ein bestimmtes Alter von Menschen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954103de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Personenbezeichnungen aufgrund des Alters vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "954102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Personenbezeichnungen aufgrund der sexuellen Orientierung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "953101de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende oder beschönigende Bezeichnungen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952601de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Adjektive vermeiden, die sich auf Menschen mit Behinderungen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955202de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Personenbezeichnungen für Menschen mit Behinderung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "955101de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Bezeichnungen überprüfen, die sich auf die sexuelle Orientierung von Personen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "953203de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Genderspezifische Pronomen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951302de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Bezeichnungen mit genderspezifischem Bezug vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951202de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Genderspezifische Personenbezeichnungen vermeiden ",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "951102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Personenbezeichnungen aufgrund der Religionszugehörigkeit ",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "956101de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Stark diskriminierende Adjektive, die sich auf die Herkunft von Personen beziehen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952801de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende geografische Bezeichnungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952302de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Rassistische Personenbezeichnungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952102de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Diskriminierende Herkunftsbezeichnungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "952602de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"mancher\" oder \"manch einer\" vermeiden ",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "gc4de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Blindtext vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "79003de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Emoticons und Emojis vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "79002de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Netzjargon vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "79001de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Typografische Anführungszeichen verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "143de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung des Malzeichens überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "138de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Darstellung von Zahlenbereichen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1372de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "bis-Zeichen und Streckenstrich überprüfen (kein Leerzeichen)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1371de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "bis-Zeichen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "137de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von Tausenderzahlen überprüfen (kein Trennzeichen verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "136de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von Tausenderzahlen überprüfen (&nbsp; verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "135de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "überhebliche Floskeln vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3930de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Floskeln vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "338de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ausnahmeformulierung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "353de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"selber\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3691de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Umgangssprachliche Wörter vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "369de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Komplizierte Wortbildungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3941de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "überflüssige Wörter vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "339de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"siehe auch\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "368de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"nötig\" und \"notwendig\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "367de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Veraltete Wörter vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "345de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Unpersönliche Pronomen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "317de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ungenaue Angaben vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "316de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ungenaue Verben vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "315de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zu viele Adjektive vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "3",
      "AllowedParameterValues": ["2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "Name": "780de",
      "Type": "Style",
      "Parameter": "3",
      "IsEnabled": false
    },
    {
      "Description": "Löscht ADM in unmittelbarer Nachbarschaft von Vorzugstermen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "772de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ziffern am Satzende vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1311de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Funktionsverbgefüge vermeiden (mit Korrekturvorschlag)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "322de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"Und\" am Satzanfang vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "380de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Endungslose Verbformen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "752de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Superlative vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "781de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Auslassungspunkte überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "192de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Semikolon vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "191de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Schweifklammern vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "142de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ausrufezeichen am Satzende vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "190de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von Tausenderzahlen überprüfen (Punkt verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "134de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von Dezimalzahlen überprüfen (Punkt verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "139de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von Ordinalzahlen kontrollieren (&nbsp;)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1321de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von Dezimalzahlen überprüfen (Komma verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "133de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Auslassungen bei weit voneinander entfernten Wörtern vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "441de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Verwendung von Artikeln überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "431de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Bedingungssatz mit \"falls\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "334de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Sätze nicht durch Listen unterbrechen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "114de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"wenn\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "337de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"und/oder\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "336de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von etablierten Abkürzungen kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "372de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Direkte Anredeform vermeiden",
      "Information": "Kann nicht zusammen mit 735de aktiv sein.",
      "ConflictsWith": [{"Name": "735de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "736de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Duzen statt Siezen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "737de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Mehrdeutige Ortsangaben vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "230de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Endungen im Dativ Singular kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "724de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Endungen im Genitiv Singular kontrollieren: es-Form verwenden",
      "Information": "Kann nicht zusammen mit 722de aktiv sein.",
      "ConflictsWith": [{"Name": "722de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "723de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Endung im Genitiv bei Wörtern auf -sch kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "7221de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Endungen im Genitiv Singular kontrollieren: s-Form verwenden",
      "Information": "Kann nicht zusammen mit 723de aktiv sein.",
      "ConflictsWith": [{"Name": "723de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "722de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Ungebräuchliche Adjektive vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "346de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"beziehungsweise\" und \"bzw.\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "332de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"bitte\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "333de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Auslassungen bei zusammengesetzten Nomen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "442de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Auslassungen bei zusammengesetzten Wörtern vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "440de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Wortdoppelungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "770de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Prozedurale Nominalgruppen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "721de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ortsangabe vor das Objekt der Handlung setzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "622de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Mehrdeutige Genitiv-Konstruktionen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "220de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Doppelpunkt nach Präpositionalphrasen setzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "150de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von Ordinalzahlen kontrollieren",
      "Information": "Kann nicht zusammen mit 130de aktiv sein.",
      "ConflictsWith": [{"Name": "130de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "132de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von Kardinalzahlen kontrollieren",
      "Information": "Kann nicht zusammen mit 130de aktiv sein.",
      "ConflictsWith": [{"Name": "130de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "131de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Ordinalzahlen von 1.-12. ausschreiben und größer 12. nicht ausschreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1303de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ordinalzahlen von 1.-12. ausschreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1301de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kardinalzahlen von 0-12, Zahlen größer 12 nicht ausschreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1302de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kardinalzahlen von 0-12 ausschreiben",
      "Information": "Kann nicht zusammen mit 131de oder 132de aktiv sein.",
      "ConflictsWith": [{"Name": "131de", "Type": "Style"}, {"Name": "132de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "130de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Verweise in eigene Zeile setzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "121de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Flektierte Formen von Akronymen ohne Apostroph bilden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "763de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Wortdopplung bei Abkürzungen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "762de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Plural von Akronymen gemäß Vorgaben aus dem BW oder mit \"s\" bilden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "7611de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Plural von Akronymen mit \"s\" bilden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "761de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Pluralverwendung von Akronymen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "760de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Futur vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "750de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Vergangenheitsformen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "753de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Doppelte Verneinung vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "740de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Komplexe Attribute vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "7",
      "AllowedParameterValues": ["5", "6", "7", "8", "9", "10"],
      "Name": "514de",
      "Type": "Style",
      "Parameter": "7",
      "IsEnabled": true
    },
    {
      "Description": "Nutzen vor dem Merkmal nennen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "625de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ziel der Handlung nach vorn setzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "623de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"d. h.\" in Einschüben vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "533de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "2. Person Singular vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "731de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Starke Verneinung vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "741de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Keine Überprüfung von Groß-/Kleinschreibung am Anfang von Listen- und Tabellenelementen",
      "Information": "Aktivieren Sie diese Regel, um in Listen und Tabellen nicht auf falsche Kleinschreibung am Satzanfang zu prüfen.",
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "113de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Keine Überprüfung von Satzendezeichen in Listen und Tabellen",
      "Information": "Aktivieren Sie diese Regel, um Listen und Tabellen nicht auf Satzendezeichen zu prüfen.",
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "112de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "1. Person Singular und Plural vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "732de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"zur Abrechnung gelangen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "342de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Weichmacher vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "352de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ausnahmeformulierungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "351de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"alle zwei\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "361de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zusammengesetzte Zeiten vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "542de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Verschachtelte \"zu\"-Konstruktionen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "541de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Pronomen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "210de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"es\" am Satzanfang vermeiden (anstelle des Subjekts)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "550de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"es\" anstelle eines Nebensatzes vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "543de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Modalverben mit Infinitiven vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "540de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "\"geschehen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"bisherig\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "314de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"durchführen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "313de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"betätigen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "310de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"sollen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "350de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"außerdem\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "360de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"sich befinden\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "344de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"vermögen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "341de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Relativsatzanschluss mit Pronomen/Artikel-Verdoppelung vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "771de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"welcher\" als Relativpronomen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "340de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Bei Mehrdeutigkeit Subjekt vor Objekt setzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "630de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Nebensatz an das Satzende stellen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "611de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Lange Klammereinschübe vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "6",
      "AllowedParameterValues": ["3", "4", "5", "6", "7", "8", "9", "10"],
      "Name": "534de",
      "Type": "Style",
      "Parameter": "6",
      "IsEnabled": true
    },
    {
      "Description": "\"mittels\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "343de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"alt\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "331de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"man\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "330de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Funktionsverbgefüge vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "321de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"anbringen\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "312de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Infinitiv als Anredeform vermeiden",
      "Information": "Kann nicht zusammen mit 736de aktiv sein.",
      "ConflictsWith": [{"Name": "736de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "735de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"sein\"+\"zu\"+Infinitiv vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "730de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zu viele Präpositionalphrasen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "5",
      "AllowedParameterValues": ["2", "3", "4", "5", "6", "7", "8", "9", "10"],
      "Name": "511de",
      "Type": "Style",
      "Parameter": "5",
      "IsEnabled": true
    },
    {
      "Description": "Passiv vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "711de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Zu viele Nominalisierungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "6",
      "AllowedParameterValues": ["3", "4", "5", "6", "7", "8"],
      "Name": "720de",
      "Type": "Style",
      "Parameter": "6",
      "IsEnabled": true
    },
    {
      "Description": "Passiv mit Täterangabe (\"von\", \"durch\") vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "710de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Modalverben im Passiv vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "734de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "\"müssen\" mit Passiv vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "733de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Artikellose Nominalphrasen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "430de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Verblose Konstruktionen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "420de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Bedingungssatz mit \"wenn\" einleiten",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "410de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Konjunktiv vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "751de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "\"nachfolgend\" vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "335de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zu viele Bedeutungseinheiten vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "8",
      "AllowedParameterValues": ["5", "6", "7", "8", "9", "10"],
      "Name": "512de",
      "Type": "Style",
      "Parameter": "8",
      "IsEnabled": true
    },
    {
      "Description": "Hauptsatzkoordination vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "532de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Distanz zwischen Verbteilen verkürzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "16",
      "AllowedParameterValues": ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
      "Name": "531de",
      "Type": "Style",
      "Parameter": "16",
      "IsEnabled": true
    },
    {
      "Description": "Verb weiter nach vorn setzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "14",
      "AllowedParameterValues": ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
      "Name": "610de",
      "Type": "Style",
      "Parameter": "14",
      "IsEnabled": true
    },
    {
      "Description": "Mehrzahlendung in Klammern vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "563de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Mehrzahlnennung in Klammern vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "561de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Drei und mehr Klammereinschübe vermeiden",
      "Information": "Kann nicht zusammen mit 560de aktiv sein.",
      "ConflictsWith": [{"Name": "560de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "562de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zwei und mehr Klammereinschübe vermeiden",
      "Information": "Kann nicht zusammen mit 562de aktiv sein.",
      "ConflictsWith": [{"Name": "562de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "560de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Verwendung von Leerzeichen bei Schrägstrichen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "173de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "&-Zeichen in Wortbildungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "172de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Pluszeichen in Wortbildungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "171de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zu lange Überschriften vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "7",
      "AllowedParameterValues": ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"],
      "Name": "182de",
      "Type": "Style",
      "Parameter": "7",
      "IsEnabled": false
    },
    {
      "Description": "Nebensätze in Überschriften vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "181de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ganze Sätze in Überschriften vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "180de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schrägstriche vermeiden (Ausnahme: zwischen Ziffern oder Einheiten)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "170de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Keine Klammern verwenden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "141de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Ganze Sätze in Klammern vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "140de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Mehrere Nebensätze als Liste darstellen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "111de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Aufzählungen als Liste darstellen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "4",
      "AllowedParameterValues": ["3", "4", "5", "6", "7", "8", "9", "10"],
      "Name": "110de",
      "Type": "Style",
      "Parameter": "4",
      "IsEnabled": false
    },
    {
      "Description": "Abkürzungen ohne darauffolgende Zahl ausschreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "371de",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zwei und mehr Bedingungen innerhalb eines Satzes vermeiden",
      "Information": "Kann nicht zusammen mit 520de aktiv sein.",
      "ConflictsWith": [{"Name": "520de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "521de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Mehrere Bedingungen als Liste darstellen",
      "Information": "Kann nicht zusammen mit 521de aktiv sein.",
      "ConflictsWith": [{"Name": "521de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "520de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Schreibweise von \"vorn\" kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "362de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von \"Tür\" kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "363de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Wiederholungszahl mit Zahlwort schreiben (zweimal)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "366de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Wiederholungszahl mit Ziffer schreiben (2-mal)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "365de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibweise von \"gern\" kontrollieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "364de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Attributanhäufungen vermeiden",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "510de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Zeitliche Abfolge bei Anweisungen beachten",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "620de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Satzlänge verkürzen (für bestimmte Elemente)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "15",
      "AllowedParameterValues": ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
      "Name": "5301de",
      "Type": "Style",
      "Parameter": "15",
      "IsEnabled": false
    },
    {
      "Description": "Satzlänge verkürzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": true,
      "DefaultParameter": "26",
      "AllowedParameterValues": ["15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40"],
      "Name": "530de",
      "Type": "Style",
      "Parameter": "26",
      "IsEnabled": true
    },
    {
      "Description": "Kein Bindestrich nach Fugenelementen e, (e)r und (e)n",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1691de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kein Bindestrich bei drei gleichen aufeinandertreffenden Buchstaben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "168de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zu langes Kompositum (>4) als Genitivkonstruktion formulieren",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "167de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zusammensetzungen mit Namensbestandteilen mit Bindestrich schreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1662de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Komposita mit englischsprachigen Bestandteilen mit Bindestrich schreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1661de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Komposita mit Entlehnungen (nicht: griechischen oder lateinischen Ursprungs) mit Bindestrich schreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "166de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Komposita mit Entlehnungen mit Bindestrich schreiben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "165de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Komposita mit Zahlwörtern bilden",
      "Information": "Kann nicht zusammen mit 163de aktiv sein.",
      "ConflictsWith": [{"Name": "163de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "164de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Komposita mit Ziffern bilden",
      "Information": "Kann nicht zusammen mit 164de aktiv sein.",
      "ConflictsWith": [{"Name": "164de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "163de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zu langes Kompositum aufgliedern (=3)",
      "Information": "Kann nicht zusammen mit 160de oder 161de aktiv sein.",
      "ConflictsWith": [{"Name": "161de", "Type": "Style"}, {"Name": "160de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "162de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zu langes Kompositum aufgliedern (>4)",
      "Information": "Kann nicht zusammen mit 160de oder 162de aktiv sein.",
      "ConflictsWith": [{"Name": "162de", "Type": "Style"}, {"Name": "160de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "161de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Zu langes Kompositum aufgliedern (>3)",
      "Information": "Kann nicht zusammen mit 161de oder 162de aktiv sein.",
      "ConflictsWith": [{"Name": "161de", "Type": "Style"}, {"Name": "162de", "Type": "Style"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "160de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kein Bindestrich nach Fugen-S",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "169de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung falscher Kleinschreibung substantivischer Wörter",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "45",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung falscher Großschreibung nicht substantivischer Wörter",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "44",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung falscher Großschreibung nicht substantivischer Wörter am Anfang unvollständiger Sätze",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "44EWfrag",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung falscher Kleinschreibung am Satzanfang",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "43",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung fehlenden Bindestrichs",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "nhaequ",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von Einzelbuchstaben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "letter",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung falscher Fuge",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "ff",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von Bindestrichkomposita mit unbekanntem erstem Teil",
      "Information": "ggf. sinnvoll, wenn 211de (Grammatik) nicht aktiv ist.",
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "uh",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung unbekannter Wörter (Tippfehler)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "unknown",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung unbekannter Wörter als mutmaßliche Straßennamen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "unknownstreet",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung unbekannter Wörter als mutmaßliche Ortsnamen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "unknowntopo",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung unbekannter Wörter als mutmaßliche Familiennamen oder Vornamen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "unknownpers",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung alter Rechtschreibung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "alt",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung falschgeschriebener Maßeinheiten",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "funit",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von lexikalisch erfasster Falschschreibung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "nie",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung mehrteiliger Punktabkürzungen ohne oder mit zu vielen Leerzeichen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "space_bl",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung mehrteiliger Punktabkürzungen ohne Leerzeichen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "space",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung falsch geschriebener Abkürzungen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "fabk",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von falschem Apostroph",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "apo",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung konservativer Schreibweise",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "kon",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": false
    },
    {
      "Description": "Erkennung überflüssiger Wörter",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "392de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Doppelter Superlativ mit \"am\"",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "391001de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Wortfolge überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "391de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung falscher Wortformen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "292de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung mutmaßlicher Wortverwechslung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "291de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Bindestrichsetzung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "2633de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Fragezeichen statt Punkt setzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "5251de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von fehlendem \"zu\" bei Infinitiv mit Modalverb",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "462de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Fragliche Satzstruktur",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "4649de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von falschen Verbgruppen mit zwei finiten Verben",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "4639de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von falschen Verbgruppen mit identischem Verb",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "4637de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von falscher Verbkoordination",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "46291de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von falschen Verbgruppen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "4629de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung des Pronomens überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "2417de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von falsch gesetzten Zeichen im Wort",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "215de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von Akronymen etc. überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "212de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von Falschschreibungen (unbekannter Wortbestandteil, unbekanntes Wortbildungsmuster u.?.)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "211de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kommasetzung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "73de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Anführungszeichen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "72de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Klammersetzung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "71de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von mehrfachen Leerzeichen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6131de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "überflüssiges Leerzeichen entfernen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "612de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Fehlendes Leerzeichen nach Satzzeichen ergänzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "611de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Schreibung der Währungsangabe überprüfen (Leerzeichen verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6281de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Währungsangabe überprüfen (&nbsp; verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "628de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Maßangabe überprüfen (ohne Leerzeichen)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6270de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Maßangabe überprüfen (Leerzeichen verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6271de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Maßangabe überprüfen (&nbsp; verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "627de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Schreibung der Paragrafenangabe überprüfen (Leerzeichen verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6261de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Paragrafenangabe überprüfen (&nbsp; verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "626de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung des Rechen- oder Verhältniszeichens überprüfen (Leerzeichen verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6251de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung des Rechen- oder Verhältniszeichens überprüfen (&nbsp; verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "625de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Gradangabe überprüfen (Leerzeichen zwischen Zahl und Gradzeichen verwenden)",
      "Information": "Kann nicht zusammen mit 624de (Grammatik) aktiv sein.",
      "ConflictsWith": [{"Name": "624de", "Type": "Grammar"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6241de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Gradangabe überprüfen (&nbsp; zwischen Zahl und Gradzeichen verwenden)",
      "Information": "Kann nicht zusammen mit 6241de (Grammatik) aktiv sein.",
      "ConflictsWith": [{"Name": "6241de", "Type": "Grammar"}],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "624de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Prozentangabe überprüfen (Leerzeichen verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6231de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung der Prozentangabe überprüfen (&nbsp; verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "623de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Zwischenräume bei Datumsangaben überprüfen (&nbsp; zwischen Tag und Monat verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "621de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Zwischenräume bei Datumsangaben überprüfen (Leerzeichen zwischen Tag und Monat verwenden)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6211de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Schreibung von \"dass\" überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "741de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von fehlendem Satzendezeichen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "523de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Satzzeichen in Aufzählungen und Tabellen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "5225de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Satzendezeichen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "522de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Fehlendes Komma vor \"und zwar\"",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "52142de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von fehlendem Komma in Teilsätzen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "5214de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Falsche Kommasetzung bei Erläuterung zwischen Adjektiv und Substantiv",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "524512de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Falsche Kommasetzung bei Erläuterung zwischen Artikelwort und Substantiv",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "524511de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Fehlendes Komma vor Erläuterung zwischen Adjektiv und Substantiv",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "521511de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kommasetzung bei erweitertem Infinitiv überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "52131de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Kommasetzung beim Infinitivsatz überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "52130de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Ziffer und Nachsilbe überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3143de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung der Adjektive überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3131de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Superlativ und Adjektiv bedeutungsabhängig überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "313129de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Getrenntschreibung von Superlativ und Adjektiv überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "313121de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Getrenntschreibung der Adjektive bedeutungsabhängig überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "313119de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung der Adjektive verwendungsabhängig überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "313118de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung der Adjektive bei progressiver Schreibweise überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31311pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Großschreibung von attributiv-elliptisch gebrauchten Adjektiven überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24214de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Großschreibung von nicht-substantivischen Bruchzahlen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24213de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Großschreibung von aus Substantiven entstandenen Wörtern überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24212de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Großschreibung nicht-substantivischer Wörter überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24211de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Adjektiv und Verb (untrennbare Zusammensetzung) überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31132de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Adjektiv und Verb (trennbare Zusammensetzung) überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31131de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung der Verben bei progressiver Schreibweise bedeutungsabhängig überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311519pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung der Verben bei progressiver Schreibweise überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311511pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Adjektiv und Verb bedeutungsabhängig überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311319de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Adjektiv und Verb bei progressiver Schreibweise bedeutungsabhängig überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311319pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Adjektiv und Verb bei progressiver Schreibweise prüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311311pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Schreibung der Prozentangabe überprüfen (ohne Leerzeichen)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "6230de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Getrenntschreibung von Substantiv und Adjektiv überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3132de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Substantiv und Partizip überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "313220de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Zusammenschreibung von nicht verblasstem Substantiv und Verb überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "2515de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Zusammenschreibung von Substantiv und Adjektiv überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "252de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung des Adjektivs überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24141de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kleinschreibung der adverbialen Wendung bei progressiver Schreibweise überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241412pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kleinschreibung der festen adverbialen Wendung bei progressiver Schreibweise überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241411pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Falscher Superlativ (hinten)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "262202de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Doppelter Superlativ",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "262201de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Übereinstimmung von Satzteilen überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "42219de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Verbform nach Präposition überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "421210de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von fehlender Präpositionalergänzung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "4212de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von Artikel nach kontrahierter Präposition",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "421170de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von nichtstandardsprachlichem Präpositionalkasus bei \"statt\"",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "421153de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von nichtstandardsprachlichem Präpositionalkasus bei \"pro\"",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "421152de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von nichtstandardsprachlichem Präpositionalkasus",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "421150de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kasus der Präpositionalergänzung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "4211de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Wortverdopplung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "349de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Punktverdoppelung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "341de",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Wortverdoppelung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "34de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Beugung von \"diesen\" und \"jenen\" überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "41170de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Nominalkongruenz überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "411de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von fehlendem Bindestrich bei Zusammensetzungen mit Abkürzungen aus dem Benutzerwörterbuch",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31621de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von fehlendem Bindestrich",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3162de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von fehlendem Bindestrich bei Zusammensetzungen mit Wortgruppen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31622de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von fehlendem Ergänzungsstrich",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3161de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von falsch gesetztem Ergänzungsstrich",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31611de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von falscher Getrenntschreibung nach Bindestrich",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31603de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Bindestrichsetzung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31602de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Leerzeichen in Bindestrichzusammensetzungen löschen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31601de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von verkürztem Adverb und Verb überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31121de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Substantiv und Verb überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "315de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24162de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung der Tageszeitangabe überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24161de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung bei Mehrwortausdrücken überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24151de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung des Infinitivs überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24146de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung der Interjektion überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241454de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung der Konjunktion überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241453de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung der Präposition überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241452de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Groß-/Kleinschreibung des Adverbs überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241451de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kleinschreibung der Ordnungszahl überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241442de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kleinschreibung der Bruchzahl überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "241441de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kleinschreibung des Zahlworts überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24143de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kleinschreibung des Pronomens überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "24142de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Schreibung von \"das\" und Kommasetzung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "42232de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Schreibung von \"das\" überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "42231de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "317de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung der Zahlableitung überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3142de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung der Zahlwörter überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "3141de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Fehlendes Komma vor \"sondern\"",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "44115de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kommasetzung überprüfen (überflüssiges Komma)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "4412de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Falsche Kommasetzung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "5249de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Falsche Kommasetzung vor vermeintlichem Nachfeld",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "5242de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Falsche Kommasetzung vor dem Hauptsatzverb",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "524de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kommasetzung beim Relativsatz überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "52123de",
      "Type": "Grammar",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Kleinschreibung nach Doppelpunkt überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "2413de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Großschreibung nach Doppelpunkt überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "2422de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Präfix und Verb (untrennbare Zusammensetzung) überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31112de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von präpositionalem Präfix und Verb (trennbare Zusammensetzung) überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31111de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Korrelat und Verb bedeutungsabhängig überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311119de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Partikel und Verb bei progressiver Schreibweise überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "311111pro",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Substantiv und Verb überprüfen. Untrennbare Zusammensetzung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31142de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von verblasstem Substantiv und Verb überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "31141de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Getrenntschreibung von Präposition und Substantiv überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "312de",
      "Type": "Spelling",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Leerzeichen vor Apostroph überprüfen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "614de",
      "Type": "Style",
      "Parameter": "-1",
      "IsEnabled": true
    },
    {
      "Description": "Erkennung von unbekannten Einzelteilen bei zusammengesetzten Wörtern",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "214de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von falscher Zusammenschreibung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "213de",
      "Type": "Spelling",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erkennung von fremdsprachlichen Textpassagen",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "1110de",
      "Type": "Grammar",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Unbekanntes Akronym",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "acronym",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Bekannte Bedeutung",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "useracro",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": false
    },
    {
      "Description": "Erfordert nach dem Markennamen „Kärcher“ zwingend ein normales Leerzeichen und verbietet die Kopplung mit Bindestrichen (z. B. „Kärcher-Reinigungsmittel“ wird zu „Kärcher Reinigungsmittel“).",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU01",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Prüft in Fließtexten und Langbeschreibungen, ob gängige Maßeinheiten und gekoppelte Begriffe fälschlicherweise abgekürzt wurden, und fordert das Ausschreiben des Wortes (z. B. „100-l-Tank“ zu „100-Liter-Tank“).",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU02",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Kontrolliert, ob Bezeichnungen der Produktklasse (wie „-Reihe“, „-Modell“, „-Gerät“, „-Maschine“) korrekt mit einem Bindestrich an den eigentlichen Produktnamen angeschlossen sind (z. B. „FC 5-Modell“)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU03",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Weist darauf hin, dass zusammengesetzte Adjektive mit dem Markennamen (wie „kärcherexklusiv“ oder „Kärcher’sche“) vermieden und stattdessen durch substantivische Umschreibungen (z. B. „exklusiv bei Kärcher“) ersetzt werden sollten. Eine Ausnahme bildet lediglich „kärchereigen“.",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU04",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Prüft, ob in Fließtexten und Langbeschreibungen gängige Abkürzungen verwendet werden, und fordert das vollständige Ausschreiben (z. B. „z. B.“ zu „zum Beispiel“, „d. h.“ zu „das heißt“). Nicht ausformulierte Texte (z. B. Kurzbeschreibungen, technische Daten, Tabellen, Features / Benefits) Abkürzungen werden verwendet mit geschütztem Leerzeichen dazwischen. Beispiel: (z. B. Milch, Teige, Soßen, Säfte)",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU05",
      "Type": "Abbreviation",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Kontrolliert die kontextabhängige Schreibung von „bis“. Fordert im Fließtext das ausgeschriebene Wort „bis“ (z. B. „2 bis 3 Liter“), in Tabellen und technischen Daten hingegen den Gedankenstrich mit geschütztem Leerzeichen (z. B. „220 – 240 V“).",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU06",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Stellt sicher, dass in Tabellen, Klammerwerten und Features/Benefits die standardisierten Einheiten-Kürzel verwendet werden (z. B. „55 cm“, „100-l-Tank“), statt die Wörter in nicht ausformulierten Texten auszuschreiben.",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU07",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Erfordert im Fließtext die ausgeschriebene Form „Prozent“ (z. B. „10 Prozent“), in Tabellen und Kurzbeschreibungen hingegen das Symbol mit geschütztem Leerzeichen (z. B. „5 %“). Ausnahme: Ab zwei Nachkommastellen gilt immer das Symbol (z. B. „99,99 %“).",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU08",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Stellt sicher, dass Aufzählungspunkte, die explizit werbliche Vorteile (Benefits) beschreiben, am Ende immer mit einem Schlusspunkt versehen werden – auch wenn es sich um syntaktisch unvollständige Sätze handelt (z. B. „- 50 Prozent Zeitersparnis beim Bügeln.“).",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU09",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Schließt die Verwendung von Tausender-Trennpunkten für Zahlenwerte innerhalb von Tabellenstrukturen explizit aus, um die Datenlesbarkeit zu wahren (z. B. „10000“ statt „10.000“).",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU10",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Erfordert, dass die Marken-URL www.karcher.com im Fließtext konsequent kleingeschrieben wird – dies gilt ausdrücklich auch dann, wenn sie direkt auf einen Schlusspunkt des vorhergehenden Satzes folgt.",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU11",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    },
    {
      "Description": "Kontrolliert, ob Fußnoten regelkonform formatiert sind. Der Text muss mit einem Großbuchstaben beginnen und mit einem Schlusspunkt enden. Einzige Ausnahme ist das alleinstehende Kennzeichnungswort „NEU“.",
      "Information": null,
      "ConflictsWith": [],
      "IsConfigurable": false,
      "DefaultParameter": "-1",
      "AllowedParameterValues": [],
      "Name": "NEU12",
      "Type": "Style",
      "Parameter": null,
      "IsEnabled": true
    }
  ];

/**
 * Hilfsfunktion: Holt oder erstellt den Ordner "TermCheck Rules" in Google Drive.
 */
function _getOrCreateRulesFolder_() {
  var folders = DriveApp.getFoldersByName("TermCheck Rules");
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder("TermCheck Rules");
  }
}

// ============================================================================
// SECTION MAPPING (folgt deiner Allgemein/Technisch/Marketing-Sortierung oben)
// ============================================================================
// Nur Style-Regeln werden weiter unterteilt. Terminology, Grammar, Spelling
// und Abbreviation bleiben jeweils eine eigene Section, unabhängig davon,
// in welchem Block sie oben stehen.
var STYLE_SECTION_GENERAL = ["110de", "111de", "113de", "114de", "121de", "140de", "141de", "142de", "143de", "150de", "1601de", "161de", "162de", "165de", "1661de", "1662de", "166de", "167de", "168de", "1691de", "169de", "171de", "172de", "173de", "180de", "181de", "182de", "190de", "191de", "192de", "193de", "210de", "220de", "221de", "230de", "240de", "310de", "311de", "312de", "313de", "314de", "315de", "316de", "317de", "330de", "331de", "332de", "334de", "335de", "336de", "337de", "339de", "340de", "341de", "342de", "343de", "344de", "345de", "346de", "349de", "350de", "353de", "360de", "361de", "362de", "363de", "364de", "365de", "366de", "367de", "368de", "3441de", "3442de", "3443de", "3444de", "3691de", "380de", "410de", "411de", "420de", "430de", "431de", "440de", "441de", "442de", "510de", "511de", "512de", "514de", "520de", "521de", "530de", "5301de", "531de", "532de", "533de", "534de", "540de", "541de", "542de", "543de", "550de", "560de", "561de", "562de", "610de", "611de", "620de", "622de", "630de", "710de", "711de", "720de", "722de", "723de", "7221de", "724de", "730de", "733de", "734de", "740de", "741de", "750de", "751de", "752de", "753de", "770de", "771de", "772de", "780de", "930de", "3912de", "950001de", "951000de", "951102de", "951111de", "951112de", "951113de", "951114de", "951115de", "951116de", "951202de", "951302de", "951402de", "952101de", "952102de", "952103de", "952302de", "952303de", "952401de", "952503de", "952601de", "952602de", "952701de", "952801de", "952802de", "952803de", "953101de", "953102de", "953202de", "953203de", "954102de", "954103de", "954301de", "954302de", "954303de", "954401de", "954402de", "954502de", "955101de", "955102de", "955103de", "955201de", "955202de", "955203de", "955301de", "955302de", "955303de", "955402de", "955502de", "955503de", "956101de", "956201de", "957101de", "957102de", "957202de", "957303de", "958101de", "958102de", "958201de", "958202de", "958203de", "958301de", "958302de", "958303de", "958403de", "79003de", "def101de", "def102de", "def103de", "def104de", "def106de", "def107de", "def108de", "def210de", "def220de", "gc1de", "gc2de", "gc3de", "gc4de", "gc6de", "gc7de", "gc8de"];
var STYLE_SECTION_TECHNICAL = ["112de", "1221de", "122de", "1301de", "1302de", "1303de", "130de", "1311de", "131de", "1321de", "133de", "134de", "135de", "136de", "1371de", "1372de", "137de", "1381de", "1382de", "138de", "139de", "163de", "170de", "321de", "322de", "371de", "372de", "563de", "621de", "623de", "624de", "760de", "761de", "7611de", "762de", "763de", "764de", "721de", "def110de", "gk0001de", "gk0002de", "gk1001de", "gk1002de", "gk1003de", "gk1004de", "gk1005de", "gk1006de", "gk2001de", "gk3001de", "gk3002de", "gk3003de", "gk3004de", "gk3005de", "gk4001de", "gk5001de", "gk5002de", "gk6001de"];
var STYLE_SECTION_MARKETING = ["333de", "338de", "351de", "352de", "3692de", "369de", "3911de", "3921de", "3922de", "3930de", "625de", "731de", "732de", "735de", "737de", "781de", "79001de", "79002de", "950002de", "950003de", "950004de", "951103de", "736de"];

function _getSubsectionForRule_(rule) {
  if (rule.Type === "Terminology") {
    if (["ADM","DEFTERM","DEPR","POSNEG","VARPOSADM","VARPOSNEG","VARDEPR","PARTDEPR"].indexOf(rule.Name) !== -1) return "Term Status";
    if (["VARPREF","VARCAP","NIETERM"].indexOf(rule.Name) !== -1) return "Spelling Variants";
    return "Grammar Agreement";
  }
  if (rule.Type === "Spelling") {
    if (["43","44","44EWfrag","45"].indexOf(rule.Name) !== -1) return "Capitalization";
    if (["unknown","unknownpers","unknowntopo","unknownstreet","uh","nhaequ","fabk","funit","space","space_bl","letter"].indexOf(rule.Name) !== -1) return "Unknown & Misspelled Words";
    return "Other Spelling";
  }
  if (rule.Type === "Grammar") {
    if (/^5\d{3,4}de$/.test(rule.Name) || rule.Name === "73de" || rule.Name === "4412de" || rule.Name === "44115de") return "Punctuation & Commas";
    if (/^24\d+de$/.test(rule.Name) || ["2413de","2422de","2417de"].indexOf(rule.Name) !== -1) return "Capitalization";
    if (/^31\d+(de|pro)$/.test(rule.Name) || ["252de","2515de"].indexOf(rule.Name) !== -1) return "Word Spacing (Compound Words)";
    if (/^316\d*de$/.test(rule.Name) || ["168de","169de","1691de","214de","213de","211de","212de","215de"].indexOf(rule.Name) !== -1) return "Hyphenation & Word Formation";
    if (/^6\d+de$/.test(rule.Name) || ["24213de","24212de"].indexOf(rule.Name) !== -1) return "Numbers, Units & Symbols";
    return "Other Grammar";
  }
  if (rule.Type === "Style") {
    if (/^9\d{5}de$/.test(rule.Name)) return "Non-Discriminatory Language";
    if (typeof STYLE_SECTION_TECHNICAL !== "undefined" && STYLE_SECTION_TECHNICAL.indexOf(rule.Name) !== -1) {
      if (/^gk/.test(rule.Name)) return "Constituent Recognition (GK)";
      if (/^(112de|1221de|122de|130de|1301de|1302de|1303de|1311de|131de|1321de|133de|134de|135de|136de|137de|1371de|1372de|138de|1381de|1382de|139de)$/.test(rule.Name)) return "Numbers & Units";
      return "Definitions & Structure";
    }
    if (typeof STYLE_SECTION_MARKETING !== "undefined" && STYLE_SECTION_MARKETING.indexOf(rule.Name) !== -1) {
      if (["3921de","3922de","3930de"].indexOf(rule.Name) !== -1) return "Superlatives & Overselling";
      return "Tone & Address";
    }
    if (/^(510de|511de|512de|514de|530de|5301de|531de|532de|533de|534de|540de|541de|542de|543de|550de|560de|561de|562de|563de|610de|611de|620de|621de|622de|623de|624de|630de|710de|711de|720de|722de|723de|7221de|724de|730de|733de|734de|740de|741de|750de|751de|752de|753de)$/.test(rule.Name)) return "Sentence Structure";
    if (/^(310de|311de|312de|313de|314de|315de|316de|317de|321de|322de|330de|331de|332de|334de|335de|336de|337de|339de|340de|341de|342de|343de|344de|345de|346de|349de|350de|353de|360de|361de|362de|363de|364de|365de|366de|367de|368de|3441de|3442de|3443de|3444de|3691de|372de|380de|410de|780de|781de)$/.test(rule.Name)) return "Word Choice";
    return "Punctuation, Brackets & Compounds";
  }
  return "General";
}

function _getSectionForRule_(rule) {
  if (rule.Type === "Terminology") return "Terminology";
  if (rule.Type === "Grammar") return "Grammar";
  if (rule.Type === "Spelling") return "Spelling";
  if (rule.Type === "Abbreviation") return "Spelling";

  if (rule.Type === "Style") {
    // Diskriminierungs-/Genderregeln (9xxxxxde) als eigene, klar benannte
    // Sektion statt generisch unter "Style" - auf Wunsch von Alex.
    if (/^9\d{5}de$/.test(rule.Name)) return "Inclusive Language / Corporate Policy";
    if (STYLE_SECTION_MARKETING.indexOf(rule.Name) !== -1) return "Style (Marketing)";
    if (STYLE_SECTION_TECHNICAL.indexOf(rule.Name) !== -1) return "Style (Technical Documentation)";
    if (STYLE_SECTION_GENERAL.indexOf(rule.Name) !== -1) return "Style (General)";
    return "Style (General)";
  }

  return rule.Type || "Other";
}

// ============================================================================
// LANGUAGE CONFIGURATION
// ============================================================================
var DEFAULT_RULES_CONFIG_EN = [
  { "Description": "Display of admitted term status", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "ADM", "Type": "Terminology", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Default term notification", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "DEFTERM", "Type": "Terminology", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Deprecated term, suggests a positive alternative", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "DEPR", "Type": "Terminology", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Don't forget the plural form", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NUMBER", "Type": "Terminology", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Deprecated/preferred term, suggests a replacement for a deprecated term", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "POSNEG", "Type": "Terminology", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Variant of a preferred term and an admitted term", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "VARPOSADM", "Type": "Terminology", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Variant of POSNEG", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "VARPOSNEG", "Type": "Terminology", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid exclamation marks at the end of a sentence", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "190de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid semicolons", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "191de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid ambiguous possessive constructions", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "220de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid ambiguous location references", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "230de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid stacking too many attributes in front of a noun", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "510de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid too many prepositional phrases in one sentence", "Information": null, "ConflictsWith": [], "IsConfigurable": true, "DefaultParameter": "5", "AllowedParameterValues": ["2", "3", "4", "5", "6", "7", "8", "9", "10"], "Name": "511de", "Type": "Style", "Parameter": "5", "IsEnabled": true },
  { "Description": "Avoid too many units of meaning in one sentence", "Information": null, "ConflictsWith": [], "IsConfigurable": true, "DefaultParameter": "8", "AllowedParameterValues": ["5", "6", "7", "8", "9", "10"], "Name": "512de", "Type": "Style", "Parameter": "8", "IsEnabled": true },
  { "Description": "Avoid complex attributes", "Information": null, "ConflictsWith": [], "IsConfigurable": true, "DefaultParameter": "7", "AllowedParameterValues": ["5", "6", "7", "8", "9", "10"], "Name": "514de", "Type": "Style", "Parameter": "7", "IsEnabled": true },
  { "Description": "Keep sentences short", "Information": null, "ConflictsWith": [], "IsConfigurable": true, "DefaultParameter": "26", "AllowedParameterValues": ["15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40"], "Name": "530de", "Type": "Style", "Parameter": "26", "IsEnabled": true },
  { "Description": "Avoid coordinating too many main clauses", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "532de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid long parenthetical insertions", "Information": null, "ConflictsWith": [], "IsConfigurable": true, "DefaultParameter": "6", "AllowedParameterValues": ["3", "4", "5", "6", "7", "8", "9", "10"], "Name": "534de", "Type": "Style", "Parameter": "6", "IsEnabled": true },
  { "Description": "Avoid two or more parenthetical insertions in one sentence", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "560de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Mention plural forms in brackets, avoid where possible", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "561de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Follow chronological order in instructions", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "620de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Put the subject before the object in case of ambiguity", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "630de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid passive voice with an explicit agent (\"by...\")", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "710de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid passive voice", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "711de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid too many nominalizations", "Information": null, "ConflictsWith": [], "IsConfigurable": true, "DefaultParameter": "6", "AllowedParameterValues": ["3", "4", "5", "6", "7", "8"], "Name": "720de", "Type": "Style", "Parameter": "6", "IsEnabled": true },
  { "Description": "Avoid modal verbs in passive voice", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "734de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid double negation", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "740de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid strong negation", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "741de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid too many adjectives", "Information": null, "ConflictsWith": [], "IsConfigurable": true, "DefaultParameter": "3", "AllowedParameterValues": ["2", "3", "4", "5", "6", "7", "8", "9", "10"], "Name": "780de", "Type": "Style", "Parameter": "3", "IsEnabled": true },
  { "Description": "Avoid superlatives", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "781de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid internet slang", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "79001de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid emoticons and emojis", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "79002de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid placeholder/lorem-ipsum text", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "79003de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory language in general", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "950001de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid relativizing phrases", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "950002de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid generalizations", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "950003de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid unfriendly and derogatory expressions", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "950004de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Use inclusive language", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "951000de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms for people based on origin", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952101de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid racist terms for people", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952102de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check terms that discriminate based on origin", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952103de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory geographic terms", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952302de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check geographic terms", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952303de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Words containing discriminatory terms for people", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952401de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check geopolitically questionable terms", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952503de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory or euphemistic terms", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952601de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms related to origin", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952602de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory verbs related to a person's origin", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952701de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory adjectives related to a person's origin", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952801de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory adjectives related to a person's origin", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952802de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory adjectives related to a person's origin", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "952803de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms based on sexual orientation", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "953101de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms based on sexual orientation", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "953102de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms referring to a person's sexual orientation", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "953202de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory terms referring to a person's sexual orientation", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "953203de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms based on age", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954102de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check terms referring to a specific age", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954103de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly age-discriminatory terms", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954301de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid age-discriminatory terms", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954302de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check age-discriminatory terms", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954303de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly age-discriminatory adjectives", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954401de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid age-discriminatory adjectives", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954402de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid age-discriminatory verbs", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "954502de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms for people with disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955101de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms for people with disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955102de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory terms for people with disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955103de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory adjectives related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955201de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory adjectives related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955202de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory adjectives related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955203de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955301de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955302de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory terms related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955303de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory verbs related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955402de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory phrases related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955502de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory phrases related to disabilities", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "955503de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms based on religious affiliation", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "956101de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Discriminatory terms related to religion and belief", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "956201de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms related to gender identity", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "957101de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms related to gender identity", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "957102de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms related to gender identity", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "957202de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory phrases related to gender identity", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "957303de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958101de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory terms based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958102de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory terms based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958201de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid terms discriminating based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958202de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check terms discriminating based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958203de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Strongly discriminatory adjectives based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958301de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid discriminatory adjectives based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958302de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory adjectives based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958303de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check discriminatory verbs based on social background", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "958403de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid excessive politeness fillers like \"please\"", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "333de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid first person (\"I\"/\"we\")", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "732de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid directly addressing the reader", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "736de", "Type": "Style", "Parameter": "-1", "IsEnabled": true },
  { "Description": "Avoid empty phrases and clichés", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "338de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid exception phrasing", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "351de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid hedging and softening words", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "352de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid colloquial words", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "369de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid negatively connotated expressions", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "3911de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid comparative or superlative forms of already intensified adjectives", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "3921de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Check the comparison form of the adjective", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "3922de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Avoid arrogant, overselling phrases", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "3930de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "State the benefit before the feature", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "625de", "Type": "Style", "Parameter": null, "IsEnabled": false },
  { "Description": "Stellt sicher, dass Aufzählungspunkte, die explizit werbliche Vorteile (Benefits) beschreiben, am Ende immer mit einem Schlusspunkt versehen werden – auch wenn es sich um syntaktisch unvollständige Sätze handelt (z. B. „- 50 Prozent Zeitersparnis beim Bügeln.“).", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU09", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Erfordert, dass die Marken-URL www.karcher.com im Fließtext konsequent kleingeschrieben wird – dies gilt ausdrücklich auch dann, wenn sie direkt auf einen Schlusspunkt des vorhergehenden Satzes folgt.", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU11", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Kontrolliert, ob Fußnoten regelkonform formatiert sind. Der Text muss mit einem Großbuchstaben beginnen und mit einem Schlusspunkt enden. Einzige Ausnahme ist das alleinstehende Kennzeichnungswort „NEU“.", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU12", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Trennt Tausenderstellen ab 4 Ziffern zwingend mit einem Komma statt einem Punkt (z. B. 1,000 oder 193,000).", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU13", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Erfordert, dass das Prozentzeichen (%) in Kurztexten und Tabellen ohne Leerzeichen direkt an die Ziffer anschließt (z. B. 5%).", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU14", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Prüft, ob Abkürzungen von Monaten (z. B. Oct, Jun) und Wochentagen (z. B. Mon, Wed) in Kurztexten ohne abschließenden Punkt geschrieben sind.", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU15", "Type": "Abbreviation", "Parameter": null, "IsEnabled": true },
  { "Description": "Identifiziert und entfernt das Komma vor dem letzten Element in Aufzählungen (Oxford Comma), außer es ist zur Vermeidung von Mehrdeutigkeiten zwingend nötig.", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU16", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Meldet Sätze, die mit einer Zahl als Ziffer beginnen, und fordert eine Umformulierung oder das Ausschreiben als Wort.", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU17", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Kontrolliert, ob der Text nach einem Doppelpunkt mit einem Kleinbuchstaben fortgesetzt wird, sofern kein Eigenname folgt.", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU18", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Erfordert in Fließtexten die Verwendung des Wortes \"to\" anstelle eines Bis-Strichs und verhindert die doppelte Nennung der Maßeinheit (z. B. 5 to 8 mg).", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU19", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Erkennt geschlechtsspezifische Endungen bei Personenbezeichnungen (z. B. chairman, policeman) und fordert neutrale Alternativen (z. B. chair, police officer).", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU20", "Type": "Style", "Parameter": null, "IsEnabled": true },
  { "Description": "Erkennt und entfernt Leerzeichen vor oder nach einem Schrägstrich bei Wortverbindungen (z. B. erlaubt ist nur: plug/unplug).", "Information": null, "ConflictsWith": [], "IsConfigurable": false, "DefaultParameter": "-1", "AllowedParameterValues": [], "Name": "NEU21", "Type": "Style", "Parameter": null, "IsEnabled": true }
];

function _getDefaultRulesForLanguage_(language) {
  return language === "en" ? DEFAULT_RULES_CONFIG_EN : DEFAULT_RULES_CONFIG;
}
function _getOverridesPropertyKey_(language) {
  return language === "en" ? "AUTHORCHECK_RULES_EN" : "AUTHORCHECK_RULES_DE";
}
function _getActiveRulesFileName_(language) {
  return language === "en" ? "active_rules_en.json" : "active_rules_de.json";
}

// ============================================================================
// RULE CONFIGURATION (language aware, with Section)
// ============================================================================
// Wird bei jedem Author-Check-Lauf aufgerufen und macht sonst bei jedem Aufruf
// einen vollen Drive-Roundtrip (Ordner suchen, Datei lesen, JSON parsen).
// Ergebnis daher pro Nutzer cachen (UserCache, da Overrides userspezifisch sind).
var AUTHORCHECK_RULES_CACHE_TTL = 3600;
function _rulesConfigCacheKey_(language) {
  return 'AUTHORCHECK_RULES_CONFIG_' + language;
}

function apiGetRulesConfig(language) {
  language = language || "de";

  var cache = CacheService.getUserCache();
  var cacheKey = _rulesConfigCacheKey_(language);
  try {
    var cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  var defaults = _getDefaultRulesForLanguage_(language);

  var props = PropertiesService.getUserProperties();
  var overridesStr = props.getProperty(_getOverridesPropertyKey_(language));
  var overrides = overridesStr ? JSON.parse(overridesStr) : {};

  var config = defaults.map(function(rule) {
    var r = Object.assign({}, rule);
    r.Language = language;
    r.Section = (overrides[r.Name] && overrides[r.Name].Section) || _getSectionForRule_(r);
    r.Subsection = (overrides[r.Name] && overrides[r.Name].Subsection) || _getSubsectionForRule_(r);
    if (overrides[r.Name]) {
      r.IsEnabled = overrides[r.Name].IsEnabled;
      if (r.IsConfigurable && overrides[r.Name].Parameter) {
        r.Parameter = overrides[r.Name].Parameter;
      }
    }
    return r;
  });

  try {
    var folder = _getOrCreateRulesFolder_();
    var files = folder.getFilesByName(_getActiveRulesFileName_(language));
    if (files.hasNext()) {
      var file = files.next();
      var driveRules = JSON.parse(file.getBlob().getDataAsString());
      if (Array.isArray(driveRules)) {
        driveRules.forEach(function(dr) {
          if (dr.Name && dr.Name.indexOf("CUSTOM_") === 0) {
            dr.Language = language;
            dr.Section = dr.Section || _getSectionForRule_(dr);
            dr.Subsection = dr.Subsection || _getSubsectionForRule_(dr);
            config.push(dr);
          }
        });
      }
    }
  } catch(e) {
    console.warn("Could not read Drive rules: " + e.message);
  }

  try { cache.put(cacheKey, JSON.stringify(config), AUTHORCHECK_RULES_CACHE_TTL); } catch (e) {}
  return config;
}

function apiSaveRulesConfig(updatedRules, language) {
  language = language || "de";
  var props = PropertiesService.getUserProperties();
  var overrides = {};

  updatedRules.forEach(function(rule) {
    overrides[rule.Name] = {
      IsEnabled: rule.IsEnabled,
      Parameter: rule.Parameter,
      Section: rule.Section,
      Subsection: rule.Subsection
    };
  });

  props.setProperty(_getOverridesPropertyKey_(language), JSON.stringify(overrides));
  apiExportRulesToDrive(updatedRules, language);
  try { CacheService.getUserCache().remove(_rulesConfigCacheKey_(language)); } catch (e) {}
  return { success: true };
}

/**
 * Saves the rules as JSON in the "TermCheck Rules" Drive folder.
 * One file per language, overwritten if it already exists.
 */
function apiExportRulesToDrive(rules, language) {
  language = language || "de";
  var folder = _getOrCreateRulesFolder_();
  var fileName = _getActiveRulesFileName_(language);
  var jsonContent = JSON.stringify(rules, null, 2);

  var existingFiles = folder.getFilesByName(fileName);
  if (existingFiles.hasNext()) {
    var file = existingFiles.next();
    file.setContent(jsonContent);
  } else {
    folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
  }

  return { success: true };
}

var CUSTOM_RULES_LOG_HEADERS = ["Timestamp", "Creator", "Language", "Origin", "Section", "Subsection", "Type", "Name", "Description", "Prompt", "Reference URL"];

/**
 * Holt das Tabellenblatt mit dem gegebenen Namen oder legt es an, falls es noch nicht existiert.
 */
function _getOrCreateNamedSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

/**
 * Stellt sicher, dass das Log-Sheet eine Kopfzeile hat, bevor Zeilen angehängt werden.
 */
function _ensureLogSheetHeaders_(sheet) {
  var firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell) {
    sheet.getRange(1, 1, 1, CUSTOM_RULES_LOG_HEADERS.length).setValues([CUSTOM_RULES_LOG_HEADERS]);
    sheet.getRange(1, 1, 1, CUSTOM_RULES_LOG_HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#FFED00")
      .setFontColor("#3A3A3A");
    sheet.setFrozenRows(1);
  }
}

/**
 * Loggt neu angelegte oder importierte Custom-Regeln zentral im Tabellenblatt "Custom"
 * (nur anhängen, nie löschen) + Mail an Admins, damit Admins mitbekommen, wenn
 * irgendwer im Team eine neue Regel anlegt.
 */
function apiLogNewCustomRules(newRules, language) {
  if (!newRules || !newRules.length) return { success: true, logged: 0 };
  language = language || "de";

  var props = PropertiesService.getScriptProperties();
  var sheetId = (props.getProperty('CUSTOM_RULES_LOG_SHEET_ID') || '').trim();
  var caller = getUserEmail_();
  var timestamp = new Date();

  if (sheetId) {
    try {
      var ss = SpreadsheetApp.openById(sheetId);
      var sheet = _getOrCreateNamedSheet_(ss, 'Custom');
      _ensureLogSheetHeaders_(sheet);
      newRules.forEach(function(r) {
        sheet.appendRow([
          timestamp, caller, language, "Custom", r.Section || '', r.Subsection || '',
          r.Type || '', r.Name || '', r.Description || '', r.CustomPrompt || '', r.ReferenceUrl || ''
        ]);
      });
    } catch(e) {
      console.warn("Konnte zentrales Regel-Log nicht schreiben: " + e.message);
    }
  }

  try {
    var admins = String(props.getProperty('ADMIN_EMAILS') || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
    if (admins.length) {
      var lines = newRules.map(function(r) {
        return '- [' + (r.Section || r.Type) + ' / ' + (r.Subsection || '-') + '] ' + r.Description;
      }).join('\n');
      MailApp.sendEmail({
        to: admins.join(','),
        subject: 'Neue Author-Check-Regel(n) von ' + caller,
        body: caller + ' hat ' + newRules.length + ' neue Regel(n) angelegt (Sprache: ' + language + '):\n\n' + lines
      });
    }
  } catch(e) {
    console.warn("Konnte Admin-Benachrichtigung nicht senden: " + e.message);
  }

  return { success: true, logged: newRules.length };
}

/**
 * Einmaliger Bulk-Export: schreibt NUR die Standardregeln (keine Custom-Regeln, die
 * liegen bereits fortlaufend im Tabellenblatt "Custom") in das Tabellenblatt "Standard",
 * das dabei jedes Mal komplett geleert und neu befüllt wird, damit es immer den
 * aktuellen Ist-Stand zeigt statt sich mit jedem Lauf zu duplizieren.
 */
function apiExportAllRulesToLogSheet(rules, language) {
  var caller = getUserEmail_();
  if (getUserRole_(caller) !== 'ADMIN') throw new Error("Unauthorized: Nur Admins können den Bulk-Export ins Log-Sheet ausführen.");

  if (!rules || !rules.length) throw new Error("No rules to export.");
  language = language || "de";

  var props = PropertiesService.getScriptProperties();
  var sheetId = (props.getProperty('CUSTOM_RULES_LOG_SHEET_ID') || '').trim();
  if (!sheetId) throw new Error("Kein Custom Rules Log Sheet hinterlegt (Admin-Einstellungen).");

  var timestamp = new Date();
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = _getOrCreateNamedSheet_(ss, 'Standard');

  var standardRules = rules.filter(function(r) {
    return !(r.Name && r.Name.indexOf('CUSTOM_') === 0);
  });

  // Komplett leeren, damit "Standard" immer den aktuellen Gesamtstand der
  // Standardregeln abbildet, statt sich mit jedem Lauf zu duplizieren.
  sheet.clear();
  _ensureLogSheetHeaders_(sheet);

  var rows = standardRules.map(function(r) {
    return [
      timestamp,
      'System',
      language,
      'Default',
      r.Section || '',
      r.Subsection || '',
      r.Type || '',
      r.Name || '',
      r.Description || '',
      r.CustomPrompt || '',
      r.ReferenceUrl || ''
    ];
  });

  sheet.getRange(2, 1, rows.length, CUSTOM_RULES_LOG_HEADERS.length).setValues(rows);

  return { success: true, exported: rows.length };
}