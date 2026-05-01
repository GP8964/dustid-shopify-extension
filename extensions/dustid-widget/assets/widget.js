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

  const selectedChip   = document.getElementById("dustid-selected");
  const chipAvatar     = document.getElementById("dustid-chip-avatar");
  const chipName       = document.getElementById("dustid-chip-name");
  const chipChangeBtn  = document.getElementById("dustid-chip-change");

  if (!connectBtn || !modal) return;

  // Move overlays to <body> so they escape the section's stacking context.
  // Any ancestor with transform/will-change/filter traps position:fixed children,
  // causing theme product sections to paint on top regardless of z-index.
  [modal, otpModal, contactsModal].forEach((el) => {
    if (el) document.body.appendChild(el);
  });

  // ── Step 1: phone ────────────────────────────────────────────────
  connectBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    phoneInput.focus();
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    phoneInput.value = "";
  });

  submitBtn.addEventListener("click", () => {
    const phone = phoneInput.value.trim();
    if (!phone) {
      phoneInput.focus();
      return;
    }
    localStorage.setItem("dustid_phone", phone);
    modal.classList.add("hidden");
    otpPhoneLabel.textContent = phone;
    otpCells.forEach((c) => (c.value = ""));
    otpModal.classList.remove("hidden");
    otpCells[0].focus();
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
    otpModal.classList.add("hidden");
    modal.classList.remove("hidden");
    phoneInput.focus();
  });

  resendBtn.addEventListener("click", () => {
    // TODO: call resend OTP API
    otpCells.forEach((c) => (c.value = ""));
    otpCells[0].focus();
    resendBtn.textContent = "Code resent";
    setTimeout(() => (resendBtn.textContent = "Resend code"), 3000);
  });

  // ── Step 3: contact selection ────────────────────────────────────
  verifyBtn.addEventListener("click", () => {
    const otp = otpCells.map((c) => c.value).join("");
    if (otp.length < otpCells.length) {
      otpCells.find((c) => !c.value)?.focus();
      return;
    }
    // TODO: call verify API with otp + localStorage.getItem("dustid_phone")
    otpModal.classList.add("hidden");
    loadContacts();
    contactsModal.classList.remove("hidden");
    contactSearch.value = "";
    contactSearch.focus();
  });

  // ── Contacts ─────────────────────────────────────────────────────

  // TODO: replace with fetch("/api/dustid/contacts") after real auth
  const MOCK_CONTACTS = [
    { id: "c1", name: "Alice Johnson",  initials: "AJ" },
    { id: "c2", name: "Bob Martinez",   initials: "BM" },
    { id: "c3", name: "Clara Osei",     initials: "CO" },
    { id: "c4", name: "David Kim",      initials: "DK" },
    { id: "c5", name: "Ella Nguyen",    initials: "EN" },
  ];

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

  function loadContacts() {
    renderContacts(MOCK_CONTACTS);
  }

  contactSearch.addEventListener("input", () => {
    const q = contactSearch.value.trim().toLowerCase();
    renderContacts(
      q ? MOCK_CONTACTS.filter((c) => c.name.toLowerCase().includes(q)) : MOCK_CONTACTS
    );
  });

  function selectContact(contact) {
    localStorage.setItem("dustid_selected_contact", JSON.stringify(contact));
    contactsModal.classList.add("hidden");

    chipAvatar.textContent = contact.initials;
    chipName.textContent   = contact.name;
    connectBtn.classList.add("hidden");
    selectedChip.classList.remove("hidden");
  }

  chipChangeBtn.addEventListener("click", () => {
    loadContacts();
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
});
