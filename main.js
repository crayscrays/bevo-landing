// Waitlist form handling.
//
// Emails are collected into a Google Sheet via a Google Apps Script web
// app — see waitlist-apps-script.gs in this repo for the script and the
// 2-minute setup. Paste the deployed /exec URL below, e.g.
// "https://script.google.com/macros/s/AKfyc.../exec".
// While the endpoint is empty the form just shows the success state
// locally without storing anything.
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbxZJi57A5J5WQ4NuDAD2rrd3XFBDW12sXCU1kQlV8aGaewqxo_cUsmctFqhJLx_YRAnEA/exec";

document.querySelectorAll("[data-waitlist]").forEach((form) => {
  const note = form.parentElement.querySelector("[data-waitlist-note]");
  const button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = form.email.value.trim();
    // Normalize the handle to a single leading @.
    const tgRaw = form.tg.value.trim().replace(/^@+/, "");
    const tg = tgRaw ? `@${tgRaw}` : "";

    // Either contact works, but at least one is needed.
    if (!email && !tg) {
      if (note) {
        note.textContent = "Leave an email or a Telegram handle so we can reach you.";
        note.classList.remove("success");
        note.classList.add("error");
      }
      return;
    }
    if (tgRaw && !/^[A-Za-z0-9_]{3,32}$/.test(tgRaw)) {
      if (note) {
        note.textContent = "That Telegram handle doesn't look right — letters, numbers and _ only.";
        note.classList.remove("success");
        note.classList.add("error");
      }
      return;
    }

    button.disabled = true;
    button.textContent = "Joining…";

    try {
      if (WAITLIST_ENDPOINT) {
        // text/plain keeps this a "simple" request — no CORS preflight,
        // which Google Apps Script web apps can't answer.
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ email, tg, source: "bevo-landing" }),
        });
        if (!res.ok) throw new Error(`waitlist endpoint returned ${res.status}`);
      }
      form.reset();
      button.textContent = "You're on the list";
      if (note) {
        note.textContent = "You're on the list — we'll reach out with your invite.";
        note.classList.remove("error");
        note.classList.add("success");
      }
    } catch (err) {
      console.error(err);
      button.disabled = false;
      button.textContent = "Join early access";
      if (note) {
        note.textContent = "Something went wrong — please try again.";
        note.classList.remove("success");
        note.classList.add("error");
      }
    }
  });
});
