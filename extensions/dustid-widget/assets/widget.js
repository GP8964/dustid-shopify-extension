document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("d-signin");
  const modal = document.getElementById("dustid-modal");
  const cancelBtn = document.getElementById("dustid-cancel");
  const submitBtn = document.getElementById("dustid-connect");
  const phoneInput = document.getElementById("dustid-phone");

  const otpModal = document.getElementById("dustid-otp-modal");
  const otpPhoneLabel = document.getElementById("dustid-otp-phone");
  const otpCells = Array.from(document.querySelectorAll(".dustid-otp-cell"));
  const verifyBtn = document.getElementById("dustid-verify");
  const otpBackBtn = document.getElementById("dustid-otp-back");
  const resendBtn = document.getElementById("dustid-resend");

  const contactsModal = document.getElementById("dustid-contacts-modal");
  const contactList = document.getElementById("dustid-contact-list");
  const contactSearch = document.getElementById("dustid-contact-search");
  const contactsEmpty = document.getElementById("dustid-contacts-empty");
  const contactsBackBtn = document.getElementById("dustid-contacts-back");

  const phoneError = document.getElementById("dustid-phone-error");
  const otpError = document.getElementById("dustid-otp-error");
  const contactsError = document.getElementById("dustid-contacts-error");

  const selectedChip = document.getElementById("dustid-selected");
  const chipAvatar = document.getElementById("dustid-chip-avatar");
  const chipName = document.getElementById("dustid-chip-name");
  const chipChangeBtn = document.getElementById("dustid-chip-change");

  // Get shop from global Shopify object or fallback to data attribute (for dev/testing)
  const config = document.getElementById("dustid-config");
  const shop = window.Shopify?.shop || config?.dataset.shop;
  const defaultBackendURL = "https://dustid-backend-latest.onrender.com/";  // Default backend URL
  // This one is firing correctly, but another inside the verifyBtn click handler is not, which is very strange.
  // Adding this log here to confirm that the shop variable is being read correctly.
  /*
  verifyBtn.addEventListener("click", async () => {
    console.log("Shopify.shop:", shop);
  });
  */
 
  if (!connectBtn || !modal) return;

  function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function clearError(el) {
    el.textContent = "";
    el.classList.add("hidden");
  }

  // Move overlays to <body> so they escape the section's stacking context.
  // Any ancestor with transform/will-change/filter traps position:fixed children,
  // causing theme product sections to paint on top regardless of z-index.
  [modal, otpModal, contactsModal].forEach((el) => {
    if (el) document.body.appendChild(el);
  });

  // ── Restore session on page load ─────────────────────────────────
  (function restoreSession() {
    const token = localStorage.getItem("dustid_token");
    const saved = localStorage.getItem("dustid_selected_contact");
    if (!token || !saved) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearAuth();
        return;
      }
    } catch {
      clearAuth();
      return;
    }

    try {
      const contact = JSON.parse(saved);
      chipAvatar.textContent = contact.initials;
      chipName.textContent = contact.name;
      connectBtn.classList.add("hidden");
      selectedChip.classList.remove("hidden");
    } catch {
      localStorage.removeItem("dustid_selected_contact");
    }
  })();

  // ── Step 1: phone ────────────────────────────────────────────────
  connectBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    phoneInput.focus();
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    phoneInput.value = "";
  });

  submitBtn.addEventListener("click", async () => {
    const phone = phoneInput.value.trim();
    if (!phone) {
      phoneInput.focus();
      return;
    }

    clearError(phoneError);
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const res = await fetch(defaultBackendURL + "verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          shop: shop
        },
        body: JSON.stringify({
          phoneNumber: phone
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(
          phoneError,
          data.message || "Failed to send OTP. Please try again.",
        );
        return;
      }

      localStorage.setItem("dustid_phone", phone);
      modal.classList.add("hidden");
      otpPhoneLabel.textContent = phone;
      otpCells.forEach((c) => (c.value = ""));
      otpModal.classList.remove("hidden");
      otpCells[0].focus();
    } catch {
      showError(phoneError, "Network error. Please check your connection.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send code";
    }
  });

  phoneInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitBtn.click();
  });

  // ── Step 2: OTP ──────────────────────────────────────────────────
  otpCells.forEach((cell, i) => {
    cell.addEventListener("input", () => {
      cell.value = cell.value.replace(/\D/g, "").slice(-1);
      if (cell.value && i < otpCells.length - 1) otpCells[i + 1].focus();
      if (otpCells.every((c) => c.value)) verifyBtn.click();
    });

    cell.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !cell.value && i > 0) {
        otpCells[i - 1].value = "";
        otpCells[i - 1].focus();
      }
    });

    cell.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, otpCells.length);
      pasted.split("").forEach((char, idx) => {
        if (otpCells[idx]) otpCells[idx].value = char;
      });
      const nextEmpty = otpCells.find((c) => !c.value);
      (nextEmpty || otpCells[otpCells.length - 1]).focus();
    });
  });

  otpBackBtn.addEventListener("click", () => {
    clearError(otpError);
    otpModal.classList.add("hidden");
    modal.classList.remove("hidden");
    phoneInput.focus();
  });

  resendBtn.addEventListener("click", async () => {
    const phone = localStorage.getItem("dustid_phone");
    if (!phone) return;

    clearError(otpError);
    resendBtn.disabled = true;
    resendBtn.textContent = "Resending…";

    try {
      const res = await fetch(defaultBackendURL + "verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          shop: shop
        },
        body: JSON.stringify({
          phoneNumber: phone
        }),
      });

      if (res.ok) {
        otpCells.forEach((c) => (c.value = ""));
        otpCells[0].focus();
        resendBtn.textContent = "Code resent";
        setTimeout(() => {
          resendBtn.textContent = "Resend code";
          resendBtn.disabled = false;
        }, 3000);
      } else {
        showError(otpError, "Failed to resend OTP. Please try again.");
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend code";
      }
    } catch {
      showError(otpError, "Network error. Please check your connection.");
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend code";
    }
  });

  // ── Step 3: contact selection ────────────────────────────────────
  verifyBtn.addEventListener("click", async () => {

    const otp = otpCells.map((c) => c.value).join("");
    if (otp.length < otpCells.length) {
      otpCells.find((c) => !c.value)?.focus();
      return;
    }

    const phone = localStorage.getItem("dustid_phone");
    clearError(otpError);
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying…";

    try {
      const res = await fetch(defaultBackendURL + "validate-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          shop: shop
         },
        body: JSON.stringify({
          phoneNumber: phone,
          otp
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        otpCells.forEach((c) => (c.value = ""));
        otpCells[0].focus();
        showError(otpError, data.message || "Invalid code. Please try again.");
        return;
      }

      if (data.token) {
        localStorage.setItem("dustid_token", data.token);
      }

      otpModal.classList.add("hidden");
      const loaded = await loadContacts();
      if (!loaded) return;
      contactsModal.classList.remove("hidden");
      contactSearch.value = "";
      contactSearch.focus();
    } catch {
      showError(otpError, "Network error. Please check your connection.");
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify";
    }
  });

  // ── Contacts ─────────────────────────────────────────────────────

  let cachedContacts = [];

  function initials(name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function renderContacts(contacts) {
    contactList.innerHTML = "";
    if (!contacts.length) {
      contactsEmpty.classList.remove("hidden");
      return;
    }
    contactsEmpty.classList.add("hidden");
    contacts.forEach((contact) => {
      const li = document.createElement("li");
      li.className = "dustid-contact-item";
      li.setAttribute("role", "option");
      li.dataset.id = contact.id;
      li.innerHTML = `
        <span class="dustid-contact-avatar" aria-hidden="true">${contact.initials}</span>
        <span class="dustid-contact-name">${contact.name}</span>
      `;
      li.addEventListener("click", () => selectContact(contact));
      contactList.appendChild(li);
    });
  }

  function clearAuth() {
    localStorage.removeItem("dustid_token");
    localStorage.removeItem("dustid_selected_contact");
    selectedChip.classList.add("hidden");
    connectBtn.classList.remove("hidden");
  }

  async function loadContacts() {
    const token = localStorage.getItem("dustid_token");
    clearError(contactsError);

    try {
      const res = await fetch(defaultBackendURL + "friends", {
        headers: {
          Authorization: `Bearer ${token}`,
          shop: Shopify.shop
        },
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        clearAuth();
        modal.classList.remove("hidden");
        phoneInput.focus();
        showError(
          phoneError,
          res.status === 403
            ? "Access denied. Please sign in again."
            : "Session expired. Please sign in again.",
        );
        return false;
      }

      if (!res.ok) {
        const friendlyMessage =
          typeof data.message === "string" &&
          !data.message.toLowerCase().includes("schema") &&
          !data.message.toLowerCase().includes("openapi") &&
          !data.message.toLowerCase().includes("spec")
            ? data.message
            : "Failed to load contacts. Please try again.";
        showError(phoneError, friendlyMessage);
        return false;
      }

      cachedContacts = (data.friends || []).map((f) => ({
        ...f,
        initials: initials(f.name),
      }));
      renderContacts(cachedContacts);
      return true;
    } catch {
      showError(phoneError, "Network error. Could not load contacts.");
      return false;
    }
  }

  contactSearch.addEventListener("input", () => {
    const q = contactSearch.value.trim().toLowerCase();
    renderContacts(
      q
        ? cachedContacts.filter((c) => c.name.toLowerCase().includes(q))
        : cachedContacts,
    );
  });

  function selectContact(contact) {
    localStorage.setItem("dustid_selected_contact", JSON.stringify(contact));
    contactsModal.classList.add("hidden");

    chipAvatar.textContent = contact.initials;
    chipName.textContent = contact.name;
    connectBtn.classList.add("hidden");
    selectedChip.classList.remove("hidden");

    console.log("📍 Selected contact address:", contact.address ?? contact);
  }

  chipChangeBtn.addEventListener("click", async () => {
    const loaded = await loadContacts();
    if (!loaded) return;
    contactsModal.classList.remove("hidden");
    contactSearch.value = "";
    contactSearch.focus();
  });

  contactsBackBtn.addEventListener("click", () => {
    contactsModal.classList.add("hidden");
    otpCells.forEach((c) => (c.value = ""));
    otpModal.classList.remove("hidden");
    otpCells[0].focus();
  });

  // ── Checkout intercept → Draft Order ────────────────────────────
  // Selects common checkout button patterns across Shopify themes.
  const CHECKOUT_SELECTOR = "button#checkout, button[name='checkout'], input[name='checkout']";

  document.addEventListener("click", async (e) => {
    const checkoutBtn = e.target.closest(CHECKOUT_SELECTOR);
    if (!checkoutBtn) return;

    alert("[dustid] Checkout button intercepted: " + (checkoutBtn.id || checkoutBtn.name || checkoutBtn.tagName));

    const contactStr = localStorage.getItem("dustid_selected_contact");
    if (!contactStr) { alert("[dustid] STOP: no contact selected in localStorage"); return; }

    const config = document.getElementById("dustid-config");
    const appUrl = config?.dataset.appUrl || defaultBackendURL;  // Fallback to default backend URL if not set in data attribute
    const shop = window.Shopify?.shop || config?.dataset.shop;

    if (!appUrl || !shop) { alert("[dustid] STOP: missing appUrl=" + appUrl + " shop=" + shop); return; }

    e.preventDefault();
    e.stopPropagation();

    checkoutBtn.disabled = true;
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = "Preparing gift checkout…";

    try {
      const cartRes = await fetch("/cart.js");
      const cart = await cartRes.json();

      if (!cart.items?.length) {
        window.location.href = "/checkout";
        return;
      }

      const contact = JSON.parse(contactStr);
      const res = await fetch(`${appUrl}/api/draft-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          items: cart.items.map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
          contact,
        }),
      });

      const data = await res.json();

      alert("[dustid] Draft order response:\n" + JSON.stringify(data, null, 2));

      if (res.ok && data.invoice_url) {
        window.location.href = data.invoice_url;
        return;
      }

      console.error("[dustid] Draft order failed:", data.error);
    } catch (err) {
      alert("[dustid] Checkout intercept error:\n" + err);
      console.error("[dustid] Checkout intercept error:", err);
    }

    // Fallback: restore button and let normal checkout proceed
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = originalText;
    window.location.href = "/checkout";
  });
});
