/**
 * VirtualsApp waitlist collector — Google Apps Script.
 *
 * Appends every landing-page signup as a row in this spreadsheet:
 * [timestamp, email, source].
 *
 * Setup (one time, ~2 minutes):
 *   1. Create a new Google Sheet (e.g. "VirtualsApp Waitlist").
 *   2. Extensions ▸ Apps Script — replace the default code with this file.
 *   3. Deploy ▸ New deployment ▸ type "Web app":
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the Web app URL (ends in /exec) into WAITLIST_ENDPOINT
 *      at the top of main.js, then commit/redeploy the landing page.
 *
 * Note: the landing page posts JSON with a text/plain content type —
 * that avoids the CORS preflight that Apps Script can't answer.
 */
function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "bad payload" });
  }

  var email = String(data.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json_({ ok: false, error: "invalid email" });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Waitlist") || ss.insertSheet("Waitlist");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Email", "Source"]);
  }

  // Skip duplicates so refresh-and-resubmit doesn't pollute the list.
  var emails = sheet
    .getRange(1, 2, sheet.getLastRow(), 1)
    .getValues()
    .flat()
    .map(String);
  if (emails.indexOf(email) === -1) {
    sheet.appendRow([new Date(), email, String(data.source || "")]);
  }

  return json_({ ok: true });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
