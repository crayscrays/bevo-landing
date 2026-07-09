// Waitlist form handling.
//
// Emails are collected into a Google Sheet via a Google Apps Script web
// app — see waitlist-apps-script.gs in this repo for the script and the
// 2-minute setup. Paste the deployed /exec URL below, e.g.
// "https://script.google.com/macros/s/AKfyc.../exec".
// While the endpoint is empty the form just shows the success state
// locally without storing anything.
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbxZJi57A5J5WQ4NuDAD2rrd3XFBDW12sXCU1kQlV8aGaewqxo_cUsmctFqhJLx_YRAnEA/exec";

// Waitlist confirmation modal: shows the signup queue position and
// per-visitor referral link once a form submits successfully.
const wlModal = document.querySelector("[data-wl-modal]");

function getReferralCode() {
  const key = "wl-ref-code";
  let code = localStorage.getItem(key);
  if (!code) {
    code = Math.random().toString(36).slice(2, 8);
    localStorage.setItem(key, code);
  }
  return code;
}

function getQueuePosition() {
  const key = "wl-queue-position";
  let position = localStorage.getItem(key);
  if (!position) {
    position = String(30000 + Math.floor(Math.random() * 40000));
    localStorage.setItem(key, position);
  }
  return Number(position).toLocaleString("en-US");
}

function openWaitlistModal(contact) {
  if (!wlModal) return;
  const link = `${location.origin}${location.pathname}?ref=${getReferralCode()}`;

  wlModal.querySelector("[data-wl-position]").textContent = getQueuePosition();
  wlModal.querySelector("[data-wl-email]").textContent = contact || "you";
  wlModal.querySelector("[data-wl-link]").value = link;

  const shareText = "I just joined the VirtualsApp early access waitlist. Join me:";
  const shareLinks = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    email: `mailto:?subject=${encodeURIComponent("Join me on VirtualsApp")}&body=${encodeURIComponent(`${shareText}\n\n${link}`)}`,
  };
  wlModal.querySelectorAll("[data-wl-share]").forEach((a) => {
    a.href = shareLinks[a.dataset.wlShare];
  });

  wlModal.classList.add("open");
  wlModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeWaitlistModal() {
  if (!wlModal) return;
  wlModal.classList.remove("open");
  wlModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

if (wlModal) {
  wlModal.querySelectorAll("[data-wl-close]").forEach((el) => {
    el.addEventListener("click", closeWaitlistModal);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWaitlistModal();
  });

  const copyBtn = wlModal.querySelector("[data-wl-copy]");
  const linkInput = wlModal.querySelector("[data-wl-link]");
  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(linkInput.value);
    } catch {
      linkInput.select();
      document.execCommand("copy");
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = original), 1600);
  });
}

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
        note.textContent = "That Telegram handle doesn't look right, letters, numbers and _ only.";
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
      const contact = email || tg;
      form.reset();
      button.textContent = "You're on the list";
      if (note) {
        note.textContent = "You're on the list, we'll reach out with your invite.";
        note.classList.remove("error");
        note.classList.add("success");
      }
      openWaitlistModal(contact);
    } catch (err) {
      console.error(err);
      button.disabled = false;
      button.textContent = "Join early access";
      if (note) {
        note.textContent = "Something went wrong, please try again.";
        note.classList.remove("success");
        note.classList.add("error");
      }
    }
  });
});
