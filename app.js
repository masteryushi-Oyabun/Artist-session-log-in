const defaultArtists = [
  { name: "JC", password: "1234" },
  { name: "Mina", password: "1234" },
  { name: "Alex", password: "1234" },
  { name: "Sam", password: "1234" }
];
const adminPassword = "admin123";
const clients = ["Gianna Casanova", "Armando Gonzales", "Chang-hee Lee"];
const appointmentTypes = ["Walk-in", "One-Done", "On-Going", "Closing"];
const paymentTypes = ["Cash", "Credit Card", "Venmo, Zelle, Cash App"];
const depositSessionTypes = ["Single", "Multiple"];

const state = {
  artist: "",
  receipt: null,
  currentMode: "Session",
  pendingDeposit: null,
  artists: []
};

const $ = (selector) => document.querySelector(selector);

function setScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === id);
  });
}

function formatDateTime(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${year} ${hours}:${minutes}`;
}

function money(value) {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatScheduleDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${month}-${day} ${year}`;
}

function formatScheduleTime(value) {
  if (!value) {
    return "";
  }

  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute}${period}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[character];
  });
}

function loadArtists() {
  const saved = JSON.parse(localStorage.getItem("artistRunArtists") || "null");
  state.artists = Array.isArray(saved) && saved.length ? saved : [...defaultArtists];
}

function saveArtists() {
  localStorage.setItem("artistRunArtists", JSON.stringify(state.artists));
  fillDatalist("#artist-list", state.artists.map((artist) => artist.name));
  renderAdminArtists();
}

function fillDatalist(id, values) {
  const list = $(id);
  list.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
}

function fillSelect(id, values, selectedValue) {
  const select = $(id);
  select.innerHTML = values
    .map((value, index) => {
      const selected = value === selectedValue || (!selectedValue && index === 0) ? "selected" : "";
      return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(value)}</option>`;
    })
    .join("");
}

function validateEntry() {
  const required = [
    $("#client-name").value.trim(),
    $("#tattoo-price").value.trim(),
    $("#tip-amount").value.trim(),
    $("#appointment-type").value,
    $("#tattoo-payment").value,
    $("#tip-payment").value
  ];
  $("#enter-button").disabled = required.some((value) => !value);
}

function validateSimpleEntry() {
  const required = [
    $("#simple-client-name").value.trim(),
    $("#simple-amount").value.trim(),
    $("#simple-payment").value
  ];
  $("#simple-enter-button").disabled = required.some((value) => !value);
}

function validateDepositInfo() {
  const required = [
    $("#deposit-client-name").value.trim(),
    $("#deposit-phone").value.trim(),
    $("#deposit-email").value.trim(),
    $("#deposit-subject").value.trim(),
    $("#deposit-size").value.trim(),
    $("#deposit-session-type").value,
    $("#deposit-amount").value.trim(),
    $("#deposit-payment").value
  ];
  $("#deposit-info-enter-button").disabled = required.some((value) => !value);
}

function validateDepositSchedule() {
  const required = [
    $("#deposit-schedule-date").value,
    $("#deposit-schedule-time-input").value
  ];
  $("#deposit-schedule-submit-button").disabled = required.some((value) => !value);
}

function populateReceipt(receipt) {
  $("#receipt-artist").textContent = receipt.artist;
  $("#receipt-kind").textContent = receipt.kind;
  $("#receipt-time").textContent = receipt.dateTime.replace(/ (\d{2}:\d{2})$/, "\n$1");
  $("#receipt-client").textContent = receipt.client;
  $("#receipt-appointment-label").classList.toggle("hidden", receipt.kind === "Deposit");
  $("#receipt-appointment").classList.toggle("hidden", receipt.kind === "Deposit");
  $("#receipt-appointment").textContent = receipt.kind === "Session" ? receipt.appointmentType : receipt.kind;
  $("#receipt-details-label").classList.toggle("hidden", receipt.kind !== "Deposit");
  $("#receipt-details").classList.toggle("hidden", receipt.kind !== "Deposit");
  $("#receipt-details-label").textContent = receipt.kind === "Deposit" ? "Phone / Email" : "Details";
  $("#receipt-details").textContent = receipt.kind === "Deposit" ? `${receipt.phone} | ${receipt.email}` : "";
  $("#receipt-design-label").classList.add("hidden");
  $("#receipt-design").classList.add("hidden");
  $("#receipt-design").textContent = "";
  $("#receipt-session-label").classList.toggle("hidden", receipt.kind !== "Deposit");
  $("#receipt-session").classList.toggle("hidden", receipt.kind !== "Deposit");
  $("#receipt-session-label").textContent = receipt.kind === "Deposit" ? "Session Type" : "Session";
  $("#receipt-session").textContent = receipt.kind === "Deposit" ? receipt.sessionType : "";
  $("#receipt-schedule-label").classList.toggle("hidden", receipt.kind !== "Deposit");
  $("#receipt-schedule").classList.toggle("hidden", receipt.kind !== "Deposit");
  $("#receipt-schedule").textContent = receipt.kind === "Deposit"
    ? `${formatScheduleDate(receipt.scheduleDate)} ${formatScheduleTime(receipt.scheduleTime)}`
    : "";
  $("#receipt-price-label").textContent = receipt.kind === "Session" ? "Tattoo Price" : `${receipt.kind} Amount`;
  $("#receipt-price").textContent = money(receipt.kind === "Session" ? receipt.tattooPrice : receipt.amount);
  $("#receipt-price-payment").textContent = receipt.kind === "Session" ? receipt.tattooPayment : receipt.payment;
  $("#receipt-tip-label").classList.toggle("hidden", receipt.kind !== "Session");
  $("#receipt-tip-row").classList.toggle("hidden", receipt.kind !== "Session");
  $("#receipt-tip").textContent = receipt.kind === "Session" ? money(receipt.tip) : "";
  $("#receipt-tip-payment").textContent = receipt.kind === "Session" ? receipt.tipPayment : "";
  $("#receipt-memo").textContent = receipt.memo || "-";
  $("#print-artist").textContent = receipt.artist;
}

function saveSubmission(receipt) {
  const previous = JSON.parse(localStorage.getItem("artistRunSubmissions") || "[]");
  previous.push(receipt);
  localStorage.setItem("artistRunSubmissions", JSON.stringify(previous));
}

function startMenu() {
  const now = formatDateTime();
  $("#menu-artist").textContent = state.artist;
  $("#menu-time").textContent = now;
  setScreen("menu-screen");
}

function startEntry() {
  const now = formatDateTime();
  state.currentMode = "Session";
  $("#current-artist").textContent = state.artist;
  $("#current-time").textContent = now;
  $("#client-name").value = "";
  $("#tattoo-price").value = "";
  $("#tip-amount").value = "";
  $("#memo").value = "";
  fillSelect("#appointment-type", appointmentTypes, "Walk-in");
  fillSelect("#tattoo-payment", paymentTypes, "Cash");
  fillSelect("#tip-payment", paymentTypes, "Credit Card");
  validateEntry();
  setScreen("entry-screen");
  $("#client-name").focus();
}

function startSimpleEntry(kind) {
  const now = formatDateTime();
  state.currentMode = kind;
  $("#simple-entry-kind").textContent = kind;
  $("#simple-entry-artist").textContent = state.artist;
  $("#simple-entry-time").textContent = now;
  $("#simple-amount-label").textContent = `${kind} Amount`;
  $("#simple-client-name").value = "";
  $("#simple-amount").value = "";
  $("#simple-memo").value = "";
  fillSelect("#simple-payment", paymentTypes, "Cash");
  validateSimpleEntry();
  setScreen("simple-entry-screen");
  $("#simple-client-name").focus();
}

function startDepositInfo() {
  const now = formatDateTime();
  state.currentMode = "Deposit";
  state.pendingDeposit = null;
  $("#deposit-info-artist").textContent = state.artist;
  $("#deposit-info-time").textContent = now;
  $("#deposit-client-name").value = "";
  $("#deposit-phone").value = "";
  $("#deposit-email").value = "";
  $("#deposit-subject").value = "";
  $("#deposit-size").value = "";
  $("#deposit-amount").value = "";
  $("#deposit-memo").value = "";
  fillSelect("#deposit-session-type", depositSessionTypes, "Single");
  fillSelect("#deposit-payment", paymentTypes, "Cash");
  validateDepositInfo();
  setScreen("deposit-info-screen");
  $("#deposit-client-name").focus();
}

function startDepositSchedule() {
  const now = formatDateTime();
  $("#deposit-schedule-artist").textContent = state.artist;
  $("#deposit-schedule-time").textContent = now;
  $("#deposit-schedule-summary").textContent = state.pendingDeposit
    ? `${state.pendingDeposit.client} | ${money(state.pendingDeposit.amount)} | ${state.pendingDeposit.sessionType}`
    : "";
  $("#deposit-schedule-date").value = "";
  $("#deposit-schedule-time-input").value = "";
  $("#deposit-schedule-date").min = new Date().toISOString().slice(0, 10);
  validateDepositSchedule();
  setScreen("deposit-schedule-screen");
  $("#deposit-schedule-date").focus();
}

function showAdmin() {
  renderAdminArtists();
  setScreen("admin-screen");
  $("#new-artist-name").focus();
}

function renderAdminArtists() {
  const list = $("#admin-artist-list");
  if (!list) {
    return;
  }

  list.innerHTML = state.artists
    .map((artist) => {
      return `
        <div class="artist-row">
          <strong>${escapeHtml(artist.name)}</strong>
          <code>PW: ${escapeHtml(artist.password)}</code>
          <button class="danger-button" type="button" data-delete-artist="${escapeHtml(artist.name)}">Delete</button>
        </div>
      `;
    })
    .join("");
}

function wireEvents() {
  $("#login-button").addEventListener("click", () => {
    const artist = $("#artist-name").value.trim();
    const password = $("#artist-password").value;

    if (artist.toLowerCase() === "admin" && password === adminPassword) {
      $("#login-error").textContent = "";
      showAdmin();
      return;
    }

    const matchingArtist = state.artists.find((item) => item.name.toLowerCase() === artist.toLowerCase());

    if (!matchingArtist || matchingArtist.password !== password) {
      $("#login-error").textContent = "Artist name or password is not correct.";
      return;
    }

    $("#login-error").textContent = "";
    state.artist = matchingArtist.name;
    startMenu();
  });

  $("#artist-password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      $("#login-button").click();
    }
  });

  $("#admin-back-button").addEventListener("click", () => {
    $("#artist-name").value = "";
    $("#artist-password").value = "";
    setScreen("login-screen");
  });

  $("#artist-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#new-artist-name").value.trim();
    const password = $("#new-artist-password").value.trim();

    if (!name || !password) {
      return;
    }

    const existing = state.artists.find((artist) => artist.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.name = name;
      existing.password = password;
    } else {
      state.artists.push({ name, password });
    }

    $("#new-artist-name").value = "";
    $("#new-artist-password").value = "";
    saveArtists();
    $("#new-artist-name").focus();
  });

  $("#admin-artist-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-artist]");
    if (!button) {
      return;
    }

    const name = button.dataset.deleteArtist;
    if (state.artists.length <= 1) {
      alert("At least one artist is required.");
      return;
    }

    state.artists = state.artists.filter((artist) => artist.name !== name);
    saveArtists();
  });

  $("#session-button").addEventListener("click", startEntry);

  $("#deposit-button").addEventListener("click", () => {
    startDepositInfo();
  });

  $("#merch-button").addEventListener("click", () => {
    startSimpleEntry("Merch");
  });

  $("#logout-button").addEventListener("click", () => {
    state.artist = "";
    $("#artist-name").value = "";
    $("#artist-password").value = "";
    setScreen("login-screen");
  });

  $("#entry-form").addEventListener("input", validateEntry);
  $("#entry-form").addEventListener("change", validateEntry);

  $("#entry-form").addEventListener("submit", (event) => {
    event.preventDefault();
    validateEntry();
    if ($("#enter-button").disabled) {
      return;
    }

    const receipt = {
      kind: "Session",
      artist: state.artist,
      dateTime: $("#current-time").textContent,
      client: $("#client-name").value.trim(),
      appointmentType: $("#appointment-type").value,
      tattooPrice: $("#tattoo-price").value,
      tattooPayment: $("#tattoo-payment").value,
      tip: $("#tip-amount").value,
      tipPayment: $("#tip-payment").value,
      memo: $("#memo").value.trim()
    };

    state.receipt = receipt;
    populateReceipt(receipt);
    setScreen("result-screen");
  });

  $("#simple-entry-form").addEventListener("input", validateSimpleEntry);
  $("#simple-entry-form").addEventListener("change", validateSimpleEntry);

  $("#simple-entry-form").addEventListener("submit", (event) => {
    event.preventDefault();
    validateSimpleEntry();
    if ($("#simple-enter-button").disabled) {
      return;
    }

    const receipt = {
      kind: state.currentMode,
      artist: state.artist,
      dateTime: $("#simple-entry-time").textContent,
      client: $("#simple-client-name").value.trim(),
      amount: $("#simple-amount").value,
      payment: $("#simple-payment").value,
      memo: $("#simple-memo").value.trim()
    };

    state.receipt = receipt;
    populateReceipt(receipt);
    setScreen("result-screen");
  });

  $("#simple-back-button").addEventListener("click", startMenu);

  $("#deposit-info-form").addEventListener("input", validateDepositInfo);
  $("#deposit-info-form").addEventListener("change", validateDepositInfo);

  $("#deposit-info-form").addEventListener("submit", (event) => {
    event.preventDefault();
    validateDepositInfo();
    if ($("#deposit-info-enter-button").disabled) {
      return;
    }

    state.pendingDeposit = {
      kind: "Deposit",
      artist: state.artist,
      dateTime: $("#deposit-info-time").textContent,
      client: $("#deposit-client-name").value.trim(),
      phone: $("#deposit-phone").value.trim(),
      email: $("#deposit-email").value.trim(),
      subject: $("#deposit-subject").value.trim(),
      size: $("#deposit-size").value.trim(),
      sessionType: $("#deposit-session-type").value,
      amount: $("#deposit-amount").value,
      payment: $("#deposit-payment").value,
      memo: $("#deposit-memo").value.trim()
    };

    startDepositSchedule();
  });

  $("#deposit-info-back-button").addEventListener("click", startMenu);

  $("#deposit-schedule-form").addEventListener("input", validateDepositSchedule);
  $("#deposit-schedule-form").addEventListener("change", validateDepositSchedule);

  $("#deposit-schedule-form").addEventListener("submit", (event) => {
    event.preventDefault();
    validateDepositSchedule();
    if ($("#deposit-schedule-submit-button").disabled || !state.pendingDeposit) {
      return;
    }

    const receipt = {
      ...state.pendingDeposit,
      scheduleDate: $("#deposit-schedule-date").value,
      scheduleTime: $("#deposit-schedule-time-input").value
    };

    state.receipt = receipt;
    populateReceipt(receipt);
    setScreen("result-screen");
  });

  $("#deposit-schedule-back-button").addEventListener("click", () => {
    setScreen("deposit-info-screen");
  });

  $("#submit-button").addEventListener("click", () => {
    if (state.receipt) {
      saveSubmission(state.receipt);
    }
    setScreen("print-screen");
  });

  $("#back-button").addEventListener("click", () => {
    if (state.receipt && state.receipt.kind === "Session") {
      setScreen("entry-screen");
      return;
    }

    if (state.receipt && state.receipt.kind === "Deposit") {
      setScreen("deposit-schedule-screen");
      return;
    }

    setScreen("simple-entry-screen");
  });

  $("#print-button").addEventListener("click", () => {
    window.print();
  });

  $("#close-button").addEventListener("click", () => {
    startMenu();
  });
}

loadArtists();
fillDatalist("#artist-list", state.artists.map((artist) => artist.name));
fillDatalist("#client-list", clients);
wireEvents();
