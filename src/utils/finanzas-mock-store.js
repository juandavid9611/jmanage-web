// DEV-ONLY simulation layer for Finanzas (cuentas + egresos). Juanda's real
// backend doesn't exist yet (every real call 404s), so Daniel can't see or
// click through the module with real data. bankAccounts.js/expenses.js try
// the real API first; only when that call fails AND we're in a Vite dev
// build (import.meta.env.DEV — statically false and dead-code-eliminated in
// a production build) do they fall back to this localStorage-backed fake
// database instead. The moment the real backend starts responding, every
// call succeeds for real and this file never runs again — nothing to clean
// up later.
//
// Seed data (bankAccounts/adjustments/expenses) comes from
// finanzas-seed-data.json — the real "Finanzas Vittoria.xlsx" history
// (836 egresos, 2025-2026), transformed into this module's shape. Each
// account's opening_balance is the REAL current balance from the sheet's
// own "Summary" tab (as Daniel read it off screen), dated today — not
// derived by replaying the historical rows, which would double-count
// them. That's also why computeBalance() below only counts
// expenses/adjustments dated on/after the account's opening_balance_date:
// the historical rows are imported for reference/filtering, not to be
// subtracted a second time from a balance that already reflects them.

import seedData from './finanzas-seed-data.json';

const STORE_KEY = 'finanzas_mock_store_v2';

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function seed() {
  // Deep-cloned so mutating the live store never touches the imported
  // module object itself (which stays shared/frozen-in-spirit across
  // every seed() call in this session).
  return JSON.parse(JSON.stringify(seedData));
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // malformed storage — reseed below
  }
  const seeded = seed();
  save(seeded);
  return seeded;
}

function save(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function computeBalance(store, accountId) {
  const account = store.bankAccounts.find((a) => a.id === accountId);
  if (!account) return 0;
  // Only count activity from the opening_balance_date forward — anything
  // dated earlier is historical reference already baked into that opening
  // number (see the comment on `seed`), not a fresh movement to subtract.
  const adjustmentsSum = store.adjustments
    .filter((a) => a.bank_account_id === accountId && a.date >= account.opening_balance_date)
    .reduce((sum, a) => sum + a.amount, 0);
  const paidSum = store.expenses
    .filter((e) => e.account_id === accountId && e.expense_date >= account.opening_balance_date)
    .reduce((sum, e) => sum + (e.paid_amount || 0), 0);
  return account.opening_balance + adjustmentsSum - paidSum;
}

function withBalance(store, account) {
  return { ...account, balance: computeBalance(store, account.id) };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const finanzasMock = {
  // ── Cuentas ────────────────────────────────────────────────────────
  listAccounts() {
    const store = load();
    return store.bankAccounts.map((a) => withBalance(store, a));
  },
  getAccount(id) {
    const store = load();
    const account = store.bankAccounts.find((a) => a.id === id);
    return account ? withBalance(store, account) : undefined;
  },
  createAccount(data) {
    const store = load();
    const account = { id: uid('acc'), is_active: true, created_at: today(), ...data };
    store.bankAccounts.push(account);
    save(store);
    return withBalance(store, account);
  },
  updateAccount(id, data) {
    const store = load();
    const idx = store.bankAccounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Cuenta no encontrada (mock)');
    store.bankAccounts[idx] = { ...store.bankAccounts[idx], ...data };
    save(store);
    return withBalance(store, store.bankAccounts[idx]);
  },
  deactivateAccount(id) {
    const store = load();
    const idx = store.bankAccounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Cuenta no encontrada (mock)');
    store.bankAccounts[idx].is_active = false;
    save(store);
    return { ok: true };
  },

  // ── Ajustes ────────────────────────────────────────────────────────
  listAdjustments(accountId) {
    const store = load();
    return store.adjustments.filter((a) => a.bank_account_id === accountId);
  },
  createAdjustment(accountId, data) {
    const store = load();
    const adjustment = { id: uid('adj'), bank_account_id: accountId, created_at: today(), ...data };
    store.adjustments.push(adjustment);
    save(store);
    return adjustment;
  },

  // ── Egresos ────────────────────────────────────────────────────────
  listExpenses() {
    return load().expenses;
  },
  getExpense(id) {
    return load().expenses.find((e) => e.id === id);
  },
  createExpense(data) {
    const store = load();
    const expense = {
      id: uid('exp'),
      status: 'pendiente',
      paid_amount: 0,
      proof_images: [],
      created_at: today(),
      updated_at: today(),
      ...data,
    };
    store.expenses.push(expense);
    save(store);
    return expense;
  },
  updateExpense(id, data) {
    const store = load();
    const idx = store.expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Egreso no encontrado (mock)');
    store.expenses[idx] = { ...store.expenses[idx], ...data, updated_at: today() };
    save(store);
    return store.expenses[idx];
  },
  deleteExpense(id) {
    const store = load();
    store.expenses = store.expenses.filter((e) => e.id !== id);
    save(store);
    return { ok: true };
  },
  approveExpense(id) {
    return this.updateExpense(id, { status: 'aprobado', approved_at: today() });
  },
  rejectExpense(id, reason) {
    return this.updateExpense(id, { status: 'rechazado', rejection_reason: reason });
  },
  markExpensePaid(id, payment) {
    const store = load();
    const idx = store.expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Egreso no encontrado (mock)');
    const expense = store.expenses[idx];
    const pending = expense.total_amount - (expense.paid_amount || 0);
    const amount = payment.amount > 0 ? payment.amount : pending;
    const paidAmount = (expense.paid_amount || 0) + amount;
    const status = paidAmount >= expense.total_amount ? 'pagado' : expense.status;
    store.expenses[idx] = {
      ...expense,
      paid_amount: paidAmount,
      account_id: payment.account_id || expense.account_id,
      status,
      updated_at: today(),
    };
    save(store);
    return store.expenses[idx];
  },

  // ── Comprobantes — convertidos a data URL, no hay S3 real en mock ──
  async uploadProofFiles(files) {
    const dataUrls = await Promise.all(files.map(fileToDataUrl));
    return dataUrls;
  },
};
