/**
 * VirtualsApp waitlist collector — Google Apps Script.
 *
 * Appends every landing-page signup as a row in this spreadsheet:
 * [timestamp, email, telegram, source]. Signups may carry an email,
 * a Telegram handle, or both — at least one is required.
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
 * Updating the script later: Deploy ▸ Manage deployments ▸ edit ▸
 * New version — saving alone does NOT update the live /exec URL.
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
  var tg = String(data.tg || "").trim().replace(/^@+/, "").toLowerCase();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json_({ ok: false, error: "invalid email" });
  }
  if (tg && !/^[a-z0-9_]{3,32}$/.test(tg)) {
    return json_({ ok: false, error: "invalid telegram handle" });
  }
  if (!email && !tg) {
    return json_({ ok: false, error: "email or telegram required" });
  }
  var tgDisplay = tg ? "@" + tg : "";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Waitlist") || ss.insertSheet("Waitlist");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Email", "Telegram", "Source"]);
  } else if (sheet.getRange(1, 3).getValue() !== "Telegram") {
    // Migrate sheets created before the Telegram column existed.
    sheet.insertColumnAfter(2);
    sheet.getRange(1, 3).setValue("Telegram");
  }

  // Skip duplicates (by email or handle) so resubmits don't pollute the list.
  var rows = sheet.getRange(1, 2, sheet.getLastRow(), 2).getValues();
  var seen = rows.some(function (r) {
    return (
      (email && String(r[0]).trim().toLowerCase() === email) ||
      (tg && String(r[1]).trim().toLowerCase() === tgDisplay)
    );
  });
  if (!seen) {
    sheet.appendRow([new Date(), email, tgDisplay, String(data.source || "")]);
  }

  return json_({ ok: true });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
