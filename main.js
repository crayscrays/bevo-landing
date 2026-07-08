// Waitlist form handling.
//
// Emails are collected into a Google Sheet via a Google Apps Script web
// app — see waitlist-apps-script.gs in this repo for the script and the
// 2-minute setup. Paste the deployed /exec URL below, e.g.
// "https://script.google.com/macros/s/AKfyc.../exec".
// While the endpoint is empty the form just shows the success state
// locally without storing anything.
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbxMv2zxOwrpnU-9Sm7dxBe2kVhXRI1U3SeDzZgZeAQbMCa-zoykUL0z0Nv3RALQLQV93Q/exec";

document.querySelectorAll("[data-waitlist]").forEach((form) => {
  const note = form.parentElement.querySelector("[data-waitlist-note]");
  const button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = form.email.value.trim();
    if (!email) return;

    button.disabled = true;
    button.textContent = "Joining…";

    try {
      if (WAITLIST_ENDPOINT) {
        // text/plain keeps this a "simple" request — no CORS preflight,
        // which Google Apps Script web apps can't answer.
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ email, source: "bevo-landing" }),
        });
        if (!res.ok) throw new Error(`waitlist endpoint returned ${res.status}`);
      }
      form.reset();
      button.textContent = "You're on the list";
      if (note) {
        note.textContent = "You're on the list — watch your inbox for the invite.";
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
