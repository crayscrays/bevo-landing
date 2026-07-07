// Waitlist form handling.
//
// Emails are collected via a third-party form endpoint (Formspree-style).
// Setup (one time):
//   1. Create a free form at https://formspree.io (or web3forms.com).
//   2. Paste the endpoint below, e.g. "https://formspree.io/f/abcdwxyz".
// Submissions then appear in the Formspree dashboard (with CSV export and
// email notifications). While the endpoint is empty the form just shows
// the success state locally without storing anything.
const WAITLIST_ENDPOINT = "";

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
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
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
