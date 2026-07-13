// Waitlist form handling.
//
// Emails are collected into a Google Sheet via a Google Apps Script web
// app — see waitlist-apps-script.gs in this repo for the script and the
// 2-minute setup. Paste the deployed /exec URL below, e.g.
// "https://script.google.com/macros/s/AKfyc.../exec".
// While the endpoint is empty the form just shows the success state
// locally without storing anything.
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbxZJi57A5J5WQ4NuDAD2rrd3XFBDW12sXCU1kQlV8aGaewqxo_cUsmctFqhJLx_YRAnEA/exec";

// Ecosystem demo: clicking a feature swaps the phone screenshot so
// visitors can preview each agent without leaving the page.
document.querySelectorAll("[data-demo]").forEach((demo) => {
  const tabs = demo.querySelectorAll("[data-demo-target]");
  const panels = demo.querySelectorAll("[data-demo-panel]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.demoTarget;

      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => p.classList.toggle("active", p.dataset.demoPanel === target));
    });
  });
});

// Trade prompt tabs: clicking a category swaps the example prompts shown.
document.querySelectorAll("[data-trade-prompt]").forEach((block) => {
  const tabs = block.querySelectorAll("[data-trade-target]");
  const panels = block.querySelectorAll("[data-trade-panel]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tradeTarget;

      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => p.classList.toggle("active", p.dataset.tradePanel === target));
    });
  });
});

// Social orbit: the two rings spin independently (clockwise / counter-
// clockwise). Hovering an avatar freezes the spin and pulls every other
// avatar in toward it; leaving the stage releases them and resumes spin.
(() => {
  const stage = document.querySelector("[data-orbit-stage]");
  if (!stage) return;

  const avatars = [...stage.querySelectorAll(".orbit-avatar")];
  const outerGroup = stage.querySelector('[data-orbit-group="outer"]');
  const innerGroup = stage.querySelector('[data-orbit-group="inner"]');

  const currentAngle = (group, prop) => parseFloat(getComputedStyle(group).getPropertyValue(prop)) || 0;

  avatars.forEach((avatar) => {
    avatar.addEventListener("mouseenter", () => {
      stage.classList.add("is-paused");

      const outerAngle = currentAngle(outerGroup, "--spin-outer");
      const innerAngle = currentAngle(innerGroup, "--spin-inner");
      const hoveredRect = avatar.getBoundingClientRect();
      const hoveredCenter = { x: hoveredRect.left + hoveredRect.width / 2, y: hoveredRect.top + hoveredRect.height / 2 };

      avatars.forEach((other) => {
        if (other === avatar) {
          other.classList.add("is-hot");
          other.style.setProperty("--nudge-x", "0px");
          other.style.setProperty("--nudge-y", "0px");
          return;
        }
        other.classList.remove("is-hot");

        const rect = other.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const dx = hoveredCenter.x - center.x;
        const dy = hoveredCenter.y - center.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = Math.min(dist * 0.4, 70);
        const screenX = (dx / dist) * pull;
        const screenY = (dy / dist) * pull;

        // The avatar sits inside a rotated group, so a screen-space nudge
        // has to be rotated back into that group's local space first.
        const angle = other.closest(".orbit-group-outer") ? outerAngle : innerAngle;
        const rad = (-angle * Math.PI) / 180;
        const localX = screenX * Math.cos(rad) - screenY * Math.sin(rad);
        const localY = screenX * Math.sin(rad) + screenY * Math.cos(rad);

        other.style.setProperty("--nudge-x", `${localX.toFixed(2)}px`);
        other.style.setProperty("--nudge-y", `${localY.toFixed(2)}px`);
      });
    });
  });

  stage.addEventListener("mouseleave", () => {
    stage.classList.remove("is-paused");
    avatars.forEach((el) => {
      el.classList.remove("is-hot");
      el.style.setProperty("--nudge-x", "0px");
      el.style.setProperty("--nudge-y", "0px");
    });
  });
})();

// Social section: the title/orbit intro fades out ~1s after it scrolls
// into view, then a scripted Butler chat reveals line by line.
(() => {
  const section = document.querySelector(".social-orbit");
  const chat = section?.querySelector("[data-social-chat]");
  if (!section || !chat) return;

  const lines = [...chat.querySelectorAll("[data-chat-line]")];
  let inView = false;
  let running = false;

  function runChat() {
    if (!inView) {
      running = false;
      return;
    }

    section.classList.add("is-chatting");
    lines.forEach((line, i) => {
      setTimeout(() => line.classList.add("is-visible"), i * 900);
    });

    const holdAfterLast = 1800;
    const totalChat = (lines.length - 1) * 900 + holdAfterLast;

    setTimeout(() => {
      section.classList.remove("is-chatting");

      setTimeout(() => {
        lines.forEach((line) => line.classList.remove("is-visible"));
        if (inView) {
          setTimeout(runChat, 1200);
        } else {
          running = false;
        }
      }, 700);
    }, totalChat);
  }

  function startLoop() {
    if (running) return;
    running = true;
    setTimeout(runChat, 1000);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        inView = entry.isIntersecting;
        if (entry.isIntersecting) startLoop();
      });
    },
    { threshold: 0.5 }
  );
  observer.observe(section);
})();

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
