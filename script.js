
const $ = id => document.getElementById(id);
const STORAGE_KEY = "pennywise-transactions";
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let kind = "expense";

function money(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(n);
}

function safe(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

$("today").textContent = new Date().toLocaleDateString("en-IN", {
  day: "numeric", month: "short", year: "numeric"
});
$("date").value = new Date().toISOString().slice(0, 10);

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function render() {
  const income = transactions
    .filter(t => t.kind === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expenses = transactions
    .filter(t => t.kind === "expense")
    .reduce((s, t) => s + t.amount, 0);

  $("balance").textContent = money(income - expenses);
  $("income").textContent = money(income);
  $("expenses").textContent = money(expenses);
  $("incomeValue").textContent = money(income);
  $("expenseValue").textContent = money(expenses);

  const max = Math.max(income, expenses, 1);
  $("incomeBar").style.height = Math.max(4, income / max * 125) + "px";
  $("expenseBar").style.height = Math.max(4, expenses / max * 125) + "px";

  $("recentList").innerHTML = makeRows(transactions.slice(0, 5), false);
  filterTransactions();
}

function makeRows(list, canDelete) {
  if (!list.length) {
    return '<div class="empty">No transactions yet. Add your first transaction!</div>';
  }

  return list.map(t => `
    <div class="transaction-row">
      <div class="tx-info">
        <b>${safe(t.description || t.category)}</b>
        <small>${safe(t.category)} · ${safe(t.date)}</small>
      </div>
      <div class="tx-amount ${t.kind}">
        ${t.kind === "income" ? "+" : "−"} ${money(t.amount)}
      </div>
      ${canDelete
        ? `<button class="delete-btn" data-delete="${t.id}">Delete</button>`
        : ""}
    </div>
  `).join("");
}

function filterTransactions() {
  const q = $("search").value.trim().toLowerCase();
  const list = transactions.filter(t =>
    [t.description, t.category, t.kind]
      .join(" ").toLowerCase().includes(q)
  );
  $("allList").innerHTML = makeRows(list, true);
}

document.querySelectorAll(".kind").forEach(button => {
  button.addEventListener("click", () => {
    kind = button.dataset.kind;

    document.querySelectorAll(".kind").forEach(b => {
      b.classList.remove("selected", "income-kind");
    });

    button.classList.add("selected");

    if (kind === "income") {
      button.classList.add("income-kind");
    }
  });
});

$("expenseForm").addEventListener("submit", event => {
  event.preventDefault();

  const amount = Number($("amount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    $("message").textContent = "Enter an amount greater than zero.";
    return;
  }

  const date = $("date").value;
  if (!date) {
    $("message").textContent = "Please select a date.";
    return;
  }

  transactions.unshift({
    id: Date.now() + Math.random(),
    kind,
    amount,
    category: $("category").value,
    date,
    description: $("description").value.trim()
  });

  save();
  render();

  $("amount").value = "";
  $("description").value = "";
  $("message").textContent = "Transaction added successfully!";
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  if (!confirm("Delete this transaction?")) return;

  transactions = transactions.filter(
    t => String(t.id) !== button.dataset.delete
  );

  save();
  render();
});

$("search").addEventListener("input", filterTransactions);

function showPage(page) {
  $("dashboard").classList.toggle("hidden", page !== "dashboard");
  $("transactionsPage").classList.toggle("hidden", page !== "transactions");
  $("pageTitle").textContent =
    page === "dashboard" ? "Dashboard" : "Transactions";

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });
}

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

$("viewAll").addEventListener("click", () => showPage("transactions"));

render();
