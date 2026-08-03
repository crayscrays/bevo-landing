/**
 * VirtualsApp waitlist collector — Google Apps Script.
 *
 * Appends every landing-page signup as a row in this spreadsheet:
 * [timestamp, email, telegram, source, referral code, referral link].
 * Signups may carry an email, a Telegram handle, or both — at least
 * one is required. New signups that include an email are sent an
 * automatic confirmation email (see sendWelcomeEmail_ below).
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
 *
 * Email quota: MailApp.sendEmail sends as the deploying Google account
 * and is capped by that account's daily quota (100/day on a plain
 * Gmail account, higher on Workspace) — fine for a waitlist, but keep
 * an eye on volume before a big launch push.
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
  var refLink = String(data.refLink || "").trim();
  var refCode = String(data.ref || "").trim();

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
    sheet.appendRow(["Timestamp", "Email", "Telegram", "Source", "Referral Code", "Referral Link"]);
  } else if (sheet.getRange(1, 3).getValue() !== "Telegram") {
    // Migrate sheets created before the Telegram column existed.
    sheet.insertColumnAfter(2);
    sheet.getRange(1, 3).setValue("Telegram");
  }

  // Skip duplicates (by email or handle) so resubmits don't pollute the list
  // or trigger a second welcome email.
  var rows = sheet.getRange(1, 2, sheet.getLastRow(), 2).getValues();
  var seen = rows.some(function (r) {
    return (
      (email && String(r[0]).trim().toLowerCase() === email) ||
      (tg && String(r[1]).trim().toLowerCase() === tgDisplay)
    );
  });
  if (!seen) {
    sheet.appendRow([new Date(), email, tgDisplay, String(data.source || ""), refCode, refLink]);
    if (email) {
      try {
        sendWelcomeEmail_(email, refLink);
      } catch (mailErr) {
        // Don't fail the signup just because the email send hiccuped.
        Logger.log("welcome email failed for " + email + ": " + mailErr);
      }
    }
  }

  return json_({ ok: true });
}

function sendWelcomeEmail_(email, refLink) {
  var subject = "You're on the VirtualsApp waitlist";
  var link = refLink || "https://virtuals.app";
  var body =
    "Hi,\n\n" +
    "Thanks for joining the VirtualsApp early access waitlist — we've received your request.\n\n" +
    "Once we launch, product access and rewards are unlocked based on your position in the " +
    "waitlist queue, including:\n" +
    "  - Up to $20 in free tokens\n" +
    "  - Exclusive access to our private trading community\n\n" +
    "Want to move up the list? Share your personal referral link with friends — every friend " +
    "who joins through it boosts your queue priority, and you'll also earn up to 80% of the " +
    "trading fees your referrals generate on VirtualsApp.\n\n" +
    "Your referral link:\n" + link + "\n\n" +
    "We'll be in touch as soon as your invite is ready.\n\n" +
    "— The VirtualsApp Team";

  var htmlBody =
    '<div style="font-family: -apple-system, Arial, sans-serif; font-size: 15px; color: #111; line-height: 1.6;">' +
    "<p>Hi,</p>" +
    "<p>Thanks for joining the VirtualsApp early access waitlist — we've received your request.</p>" +
    "<p>Once we launch, product access and rewards are unlocked based on your position in the waitlist queue, including:</p>" +
    "<ul>" +
    "<li>Up to $20 in free tokens</li>" +
    "<li>Exclusive access to our private trading community</li>" +
    "</ul>" +
    "<p>Want to move up the list? Share your personal referral link with friends — every friend who joins through it boosts your queue priority, and you'll also earn up to 80% of the trading fees your referrals generate on VirtualsApp.</p>" +
    '<p><a href="' + link + '">' + link + "</a></p>" +
    "<p>We'll be in touch as soon as your invite is ready.</p>" +
    "<p>— The VirtualsApp Team</p>" +
    "</div>";

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    name: "VirtualsApp",
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
