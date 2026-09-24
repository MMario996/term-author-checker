/**
 * Exportiert alle Dateien des aktuellen Projekts als .txt Dateien in einen Drive-Ordner.
 * (Inklusive Fehler-Analyse / Debugging)
 */
function exportProjectToTxt() {
  // Admin-only: jede Funktion ohne "_" am Ende ist per google.script.run aufrufbar.
  _requireAdmin_('export the project source');
  // 1. Einstellungen
  const folderId = "1am6gR_8i_mEg3zv176lfflhGPEYrBPf2"; // Deine Ordner-ID
  const scriptId = ScriptApp.getScriptId(); 
  
  // 2. Zielordner direkt über die ID ansteuern
  const folder = DriveApp.getFolderById(folderId);

  // 3. Apps Script API aufrufen
  const url = "https://script.googleapis.com/v1/projects/" + scriptId + "/content";
  const options = {
    headers: {
      "Authorization": "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  // Nur Statuscode und bei Fehlern einen Auszug loggen - nicht den kompletten
  // Quellcode des Projekts ins Protokoll schreiben.
  Logger.log("API Response Code: " + response.getResponseCode());
  if (response.getResponseCode() !== 200) {
    Logger.log("API Response Body (Auszug): " + response.getContentText().slice(0, 500));
  }

  const projectContent = JSON.parse(response.getContentText());

  if (!projectContent.files) {
    Logger.log("Fehler: Konnte keine Dateien finden. Schau in die 'API Response Body' Zeile oben im Log!");
    return;
  }

  // 4. Dateien im Ordner ablegen/aktualisieren
  projectContent.files.forEach(file => {
    const fileName = file.name + (file.type === 'HTML' ? '.html' : '.gs') + ".txt";
    const content = file.source || ""; // Falls eine Datei leer ist
    
    const existingFiles = folder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      existingFiles.next().setContent(content);
    } else {
      folder.createFile(fileName, content);
    }
  });

  Logger.log("Export abgeschlossen in Ordner: " + folder.getName());
}