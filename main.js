// Waitlist form handling.
//
// Set WAITLIST_ENDPOINT to a real collector (e.g. a bevo-server route,
// Formspree, or a Google Form action) to actually store signups. While it
// is empty the form just shows the success state locally.
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source: "bevo-landing" }),
        });
        if (!res.ok) throw new Error(`waitlist endpoint returned ${res.status}`);
      }
      form.reset();
      button.textContent = "You're in ✓";
      if (note) {
        note.textContent = "You're on the list — watch your inbox for the invite.";
        note.classList.remove("error");
        note.classList.add("success");
      }
    } catch (err) {
      console.error(err);
      button.disabled = false;
      button.textContent = "Join the waitlist";
      if (note) {
        note.textContent = "Something went wrong — please try again.";
        note.classList.remove("success");
        note.classList.add("error");
      }
    }
  });
});
