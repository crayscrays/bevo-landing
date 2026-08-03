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
  var subject = "You're on the list, welcome to Virtuals App";
  var link = refLink || "https://virtuals.app";
  var body =
    "Hi there,\n\n" +
    "Thanks for signing up! You're officially on the waitlist for Virtuals App.\n\n" +
    "We're building something we're genuinely excited about. A space where you, your friends, " +
    "and AI agents come together to connect, and trade stocks and tokens alongside the top 1% " +
    "around the world. We're putting the finishing touches on it now.\n\n" +
    "Want in faster, with the best perks?\n" +
    "Move up the waitlist by inviting friends. Share your landing page link, and every friend " +
    "who joins bumps you higher, unlocking earlier access, the most exclusive communities, and " +
    "our best perks. You've got 3 invites to give, so choose wisely.\n\n" +
    link + "\n\n" +
    "The moment we launch, you'll be among the first to know, right here in your inbox.\n\n" +
    "One quick note for your safety: we'll only ever email you about early access and community " +
    "invites, and the only link we'll ever send is the official App Store or Google Play download. " +
    "Please ignore anything else claiming to be us.\n\n" +
    "Talk soon,\n" +
    "The Virtuals App Team";

  // Layout mirrors a typical bank "connected account" notification email:
  // a solid brand-color header band with the logo/wordmark, a white card
  // body with a status pill, headline, bullet benefits, a CTA button, and
  // a light gray "about this message" footer box.
  var brand = "#0A564D";
  var logoUrl = "https://raw.githubusercontent.com/crayscrays/bevo-landing/main/assets/Group%2040.png";

  var htmlBody =
    '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;color:#111;">' +
      '<div style="background:' + brand + ';padding:28px 32px;border-radius:12px 12px 0 0;">' +
        '<img src="' + logoUrl + '" width="28" height="28" alt="" style="vertical-align:middle;border-radius:6px;display:inline-block;" />' +
        '<span style="color:#fff;font-weight:700;font-size:19px;margin-left:10px;vertical-align:middle;">Virtuals APP</span>' +
      '</div>' +
      '<div style="background:#ffffff;padding:36px 32px;border:1px solid #e6e6e6;border-top:none;border-radius:0 0 12px 12px;">' +
        '<span style="display:inline-block;background:#eef2f0;color:' + brand + ';font-size:12px;font-weight:700;letter-spacing:0.02em;padding:6px 14px;border-radius:999px;margin-bottom:18px;">You\'re on the list</span>' +
        '<h1 style="font-size:24px;line-height:1.3;font-weight:800;margin:0 0 18px;color:#111;">Welcome to Virtuals App</h1>' +
        '<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hi there,</p>' +
        '<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Thanks for signing up! You\'re officially on the waitlist for Virtuals App.</p>' +
        '<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">We\'re building something we\'re genuinely excited about. A space where you, your friends, and AI agents come together to connect, and trade stocks and tokens alongside the top 1% around the world. We\'re putting the finishing touches on it now.</p>' +
        '<p style="font-size:15px;line-height:1.6;margin:0 0 4px;font-weight:700;">Want in faster, with the best perks?</p>' +
        '<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Move up the waitlist by inviting friends. Share your landing page link, and every friend who joins bumps you higher, unlocking earlier access, the most exclusive communities, and our best perks. You\'ve got 3 invites to give, so choose wisely.</p>' +
        '<a href="' + link + '" style="display:inline-block;background:' + brand + ';color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;margin-bottom:24px;">Share your invite link</a>' +
        '<p style="font-size:15px;line-height:1.6;margin:0 0 28px;">The moment we launch, you\'ll be among the first to know, right here in your inbox.</p>' +
        '<div style="background:#f6f7f6;border-radius:8px;padding:16px 20px;margin-bottom:24px;">' +
          '<p style="font-size:11px;font-weight:700;letter-spacing:0.04em;color:#666;margin:0 0 8px;">ONE QUICK NOTE FOR YOUR SAFETY</p>' +
          '<p style="font-size:12px;line-height:1.6;color:#666;margin:0;">We\'ll only ever email you about early access and community invites, and the only link we\'ll ever send is the official App Store or Google Play download. Please ignore anything else claiming to be us.</p>' +
        '</div>' +
        '<p style="font-size:15px;line-height:1.6;margin:0;">Talk soon,<br>The Virtuals App Team</p>' +
      '</div>' +
    '</div>';

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
