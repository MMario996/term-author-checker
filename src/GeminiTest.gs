/**
 * Admin-Debug-Helfer: testet die Gemini-Verbindung (Apigee-Gateway) isoliert
 * mit einer Mini-Anfrage, damit man bei Problemen sofort sieht, ob es am
 * konfigurierten Key/URL liegt oder woanders. Admin-only.
 */
function apiDebugGeminiConnection() {
  var caller = getUserEmail_();
  if (getUserRole_(caller) !== 'ADMIN') {
    throw new Error("Unauthorized: Admins only. Deine aktuelle E-Mail ('" + caller + "') ist nicht berechtigt.");
  }
  
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
  var result = { ok: false, httpStatus: null, errorMsg: null, keyConfigured: apiKey.length > 0, keyPreview: '', urlCalled: '', modelUsed: '' };
  
  if (!apiKey) { 
    result.errorMsg = 'No GEMINI_API_KEY saved in Settings.'; 
    console.log(JSON.stringify(result, null, 2));
    return result; 
  }
  
  result.keyPreview = apiKey.length > 8
    ? (apiKey.slice(0, 4) + '…' + apiKey.slice(-4) + ' (' + apiKey.length + ' chars)')
    : ('unusually short: ' + apiKey.length + ' chars – that alone looks wrong');
  
  // URL bereinigen, falls versehentlich Markdown gespeichert wurde
  var rawUrl = props.getProperty('GEMINI_API_URL') || 'https://34-111-99-134.nip.io/gemini/v1beta/models/';
  var apiUrl = rawUrl.split(']')[0].replace('[', '').trim();
  
  var model  = (props.getProperty('AI_MODEL') || 'gemini-3.6-flash').trim();
  var call = _buildGeminiRequest_(apiUrl, model, apiKey, { contents: [{ role: 'user', parts: [{ text: 'Reply with just "ok".' }] }] });
  
  result.urlCalled = call.url;
  result.modelUsed = model;
  result.authMethod = 'x-api-key header (Apigee proxy)';
  
  try {
    var res = UrlFetchApp.fetch(call.url, {
      method: 'post', contentType: 'application/json',
      headers: call.headers,
      payload: JSON.stringify(call.body), muteHttpExceptions: true
    });
    result.httpStatus = res.getResponseCode();
    result.ok = result.httpStatus === 200;
    if (!result.ok) result.errorMsg = res.getContentText().slice(0, 400);
  } catch(e) { 
    result.errorMsg = e.message; 
  }
  
  // LOG-AUSGABE für den Editor:
  console.log(JSON.stringify(result, null, 2));
  return result;
}