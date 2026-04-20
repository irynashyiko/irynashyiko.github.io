const revealElements = document.querySelectorAll("[data-reveal]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

const storageKeys = {
  accounts: "wimm_accounts",
  income: "wimm_income",
  invoices: "wimm_invoices",
  currency: "wimm_currency",
};

const demoTimestamp = "April 2026";
const demoSummary = {
  totalTracked: 4240,
  paidIncome: 3100,
  pendingIncome: 1140,
  breakdown: {
    spotify: 1240,
    prs: 320,
    ppl: 180,
    invoices: 2500,
  },
};

const seedData = {
  accounts: [
    {
      id: "acct-spotify",
      platform: "Spotify Artists",
      link: "https://artists.spotify.com/",
      amount: 1240,
      status: "Synced",
    },
    {
      id: "acct-prs",
      platform: "PRS for Music",
      link: "https://members.prsformusic.com/",
      amount: 320,
      status: "Pending",
    },
    {
      id: "acct-ppl",
      platform: "PPL",
      link: "https://www.ppluk.com/",
      amount: 180,
      status: "Synced",
    },
    {
      id: "acct-live-promoter",
      platform: "Live Promoter",
      link: "https://portal.londonpromoter.co.uk/",
      amount: 2500,
      status: "Needs review",
    },
  ],
  income: [
    {
      id: "income-spotify-april",
      source: "Spotify April payout",
      category: "Streaming",
      amount: 1240,
      status: "Paid",
    },
    {
      id: "income-prs-q1",
      source: "PRS Q1 distribution",
      category: "PRS",
      amount: 320,
      status: "Pending",
    },
    {
      id: "income-ppl-q1",
      source: "PPL broadcast payment",
      category: "PPL",
      amount: 180,
      status: "Paid",
    },
    {
      id: "income-live-london",
      source: "Live show London",
      category: "Live",
      amount: 600,
      status: "Paid",
    },
    {
      id: "income-session-recording",
      source: "Session recording",
      category: "Publishing",
      amount: 200,
      status: "Pending",
    },
  ],
  invoices: [
    {
      id: "inv-london-promoter",
      template: "Session work",
      client: "London promoter",
      service: "Live performance",
      amount: 2500,
      dueDate: "2026-04-28",
      status: "Sent",
    },
    {
      id: "inv-indie-label",
      template: "Production",
      client: "Indie label",
      service: "Mixing & mastering",
      amount: 800,
      dueDate: "2026-04-14",
      status: "Paid",
    },
    {
      id: "inv-artist-collab",
      template: "Feature verse",
      client: "Artist collaboration",
      service: "Feature verse",
      amount: 400,
      dueDate: "2026-05-06",
      status: "Draft",
    },
  ],
};

const state = {
  accounts: loadCollection(storageKeys.accounts, seedData.accounts),
  income: loadCollection(storageKeys.income, seedData.income),
  invoices: loadCollection(storageKeys.invoices, seedData.invoices),
  currency: localStorage.getItem(storageKeys.currency) || "GBP",
  pendingFocus: null,
  statusTimers: {},
};

const accountForm = document.querySelector("#account-form");
const incomeForm = document.querySelector("#income-form");
const invoiceForm = document.querySelector("#invoice-form");
const currencySelect = document.querySelector("#currency-select");
const heroCardFoot = document.querySelector(".hero-card-foot");

function loadCollection(key, fallback) {
  const saved = localStorage.getItem(key);

  if (!saved) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return [...fallback];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return [...fallback];
    }

    return parsed;
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return [...fallback];
  }
}

function saveCollection(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatCurrency(value) {
  const locales = {
    GBP: "en-GB",
    USD: "en-US",
    EUR: "en-IE",
  };

  return new Intl.NumberFormat(locales[state.currency] || "en-GB", {
    style: "currency",
    currency: state.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getStatusModifier(status) {
  const normalized = String(status).toLowerCase();

  if (normalized === "paid" || normalized === "synced") {
    return "status-paid";
  }

  if (normalized === "pending") {
    return "status-pending";
  }

  if (normalized === "sent") {
    return "status-sent";
  }

  if (normalized === "draft") {
    return "status-draft";
  }

  if (normalized === "overdue" || normalized === "needs review") {
    return "status-overdue";
  }

  return "";
}

function updateDemoMeta() {
  if (!heroCardFoot) {
    return;
  }

  heroCardFoot.textContent = `Structured like a modern analytics tool, but built for artist money flow. Demo data • ${demoTimestamp}`;
}

function renderMetrics() {
  const paidInvoices = state.invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);

  document.querySelector("#total-income").textContent = formatCurrency(demoSummary.totalTracked);
  document.querySelector("#pending-income").textContent = formatCurrency(demoSummary.pendingIncome);
  document.querySelector("#paid-invoices").textContent = formatCurrency(paidInvoices);
  document.querySelector("#connected-count").textContent = String(state.accounts.length);
  document.querySelector("#hero-total-income").textContent = formatCurrency(demoSummary.totalTracked);
  document.querySelector("#hero-paid-income").textContent = formatCurrency(demoSummary.paidIncome);
  document.querySelector("#hero-pending-income").textContent = formatCurrency(demoSummary.pendingIncome);
  document.querySelector("#hero-spotify-income").textContent = formatCurrency(demoSummary.breakdown.spotify);
  document.querySelector("#hero-prs-income").textContent = formatCurrency(demoSummary.breakdown.prs);
  document.querySelector("#hero-ppl-income").textContent = formatCurrency(demoSummary.breakdown.ppl);
  document.querySelector("#hero-invoice-income").textContent = formatCurrency(demoSummary.breakdown.invoices);
  updateDemoMeta();
}

function renderAccounts() {
  const accountList = document.querySelector("#account-list");

  if (!accountList) {
    return;
  }

  if (state.accounts.length === 0) {
    accountList.innerHTML = '<p class="empty-state">No connected accounts yet. Add your first platform to get started.</p>';
    return;
  }

  accountList.innerHTML = state.accounts
    .map(
      (account) => `
        <article class="connected-item" data-entry-id="${escapeHtml(account.id)}">
          <div>
            <h3>${escapeHtml(account.platform)}</h3>
            <a href="${escapeHtml(account.link)}" target="_blank" rel="noreferrer">${escapeHtml(account.link)}</a>
          </div>
          <div class="connected-meta">
            <span class="status-pill ${getStatusModifier(account.status)}">${escapeHtml(account.status)}</span>
            <strong>${formatCurrency(Number(account.amount))}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

function renderIncome() {
  const incomeList = document.querySelector("#income-list");

  if (!incomeList) {
    return;
  }

  if (state.income.length === 0) {
    incomeList.innerHTML = '<p class="empty-state">No income recorded yet. Add your first payment to get started.</p>';
    return;
  }

  incomeList.innerHTML = state.income
    .map(
      (item) => `
        <article class="table-row" data-entry-id="${escapeHtml(item.id)}">
          <span>${escapeHtml(item.source)}</span>
          <span>${escapeHtml(item.category)}</span>
          <span class="status-chip ${getStatusModifier(item.status)}">${escapeHtml(item.status)}</span>
          <strong>${formatCurrency(Number(item.amount))}</strong>
        </article>
      `
    )
    .join("");
}

function renderInvoices() {
  const invoiceList = document.querySelector("#invoice-list");

  if (!invoiceList) {
    return;
  }

  if (state.invoices.length === 0) {
    invoiceList.innerHTML = '<p class="empty-state">No invoices created yet.</p>';
    return;
  }

  invoiceList.innerHTML = state.invoices
    .map(
      (invoice) => `
        <article class="invoice-item" data-entry-id="${escapeHtml(invoice.id)}">
          <div class="invoice-item-head">
            <div>
              <h3>${escapeHtml(invoice.client)}</h3>
              <p>${escapeHtml(invoice.template)} template</p>
            </div>
            <span class="status-pill ${getStatusModifier(invoice.status)}">${escapeHtml(invoice.status)}</span>
          </div>
          <div class="invoice-item-grid">
            <div>
              <span>Service</span>
              <strong>${escapeHtml(invoice.service)}</strong>
            </div>
            <div>
              <span>Due</span>
              <strong>${escapeHtml(invoice.dueDate)}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>${formatCurrency(Number(invoice.amount))}</strong>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderAll() {
  if (currencySelect) {
    currencySelect.value = state.currency;
  }

  renderMetrics();
  renderAccounts();
  renderIncome();
  renderInvoices();
  highlightPendingEntry();
}

function setStatus(id, message) {
  const element = document.querySelector(id);

  if (element) {
    element.textContent = message;

    if (state.statusTimers[id]) {
      window.clearTimeout(state.statusTimers[id]);
    }

    state.statusTimers[id] = window.setTimeout(() => {
      element.textContent = "";
    }, 2400);
  }
}

function queueEntryFocus(id) {
  state.pendingFocus = id;
}

function highlightPendingEntry() {
  if (!state.pendingFocus) {
    return;
  }

  const entry = [...document.querySelectorAll("[data-entry-id]")].find(
    (element) => element.dataset.entryId === state.pendingFocus
  );

  if (!entry) {
    state.pendingFocus = null;
    return;
  }

  requestAnimationFrame(() => {
    entry.classList.add("is-new-item");
    entry.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
    });

    window.setTimeout(() => {
      entry.classList.remove("is-new-item");
    }, 1800);
  });

  state.pendingFocus = null;
}

accountForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!accountForm.checkValidity()) {
    accountForm.reportValidity();
    return;
  }

  const formData = new FormData(accountForm);
  const account = {
    id: createId("account"),
    platform: formData.get("platform"),
    link: formData.get("link"),
    amount: Number(formData.get("amount")),
    status: formData.get("status"),
  };

  state.accounts.unshift(account);

  saveCollection(storageKeys.accounts, state.accounts);
  queueEntryFocus(account.id);
  renderAll();
  accountForm.reset();
  setStatus("#account-status", "Saved successfully");
});

incomeForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!incomeForm.checkValidity()) {
    incomeForm.reportValidity();
    return;
  }

  const formData = new FormData(incomeForm);
  const income = {
    id: createId("income"),
    source: formData.get("source"),
    category: formData.get("category"),
    amount: Number(formData.get("amount")),
    status: formData.get("status"),
  };

  state.income.unshift(income);

  saveCollection(storageKeys.income, state.income);
  queueEntryFocus(income.id);
  renderAll();
  incomeForm.reset();
  setStatus("#income-status", "Saved successfully");
});

invoiceForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!invoiceForm.checkValidity()) {
    invoiceForm.reportValidity();
    return;
  }

  const formData = new FormData(invoiceForm);
  const invoice = {
    id: createId("invoice"),
    template: formData.get("template"),
    client: formData.get("client"),
    service: formData.get("service"),
    amount: Number(formData.get("amount")),
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
  };

  state.invoices.unshift(invoice);
  saveCollection(storageKeys.invoices, state.invoices);
  queueEntryFocus(invoice.id);

  if (invoice.status === "Paid" || invoice.status === "Sent") {
    state.income.unshift({
      id: createId("income"),
      source: `${invoice.client} invoice`,
      category: "Invoice",
      amount: invoice.amount,
      status: invoice.status === "Paid" ? "Paid" : "Pending",
    });
    saveCollection(storageKeys.income, state.income);
  }

  renderAll();
  invoiceForm.reset();
  setStatus("#invoice-status", "Saved successfully");
});

currencySelect?.addEventListener("change", (event) => {
  const nextCurrency = event.target.value;
  state.currency = nextCurrency;
  localStorage.setItem(storageKeys.currency, nextCurrency);
  renderAll();
});

renderAll();
