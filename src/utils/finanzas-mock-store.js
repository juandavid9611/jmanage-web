// DEV-ONLY simulation layer for Finanzas (cuentas + egresos). Juanda's real
// backend doesn't exist yet (every real call 404s), so Daniel can't see or
// click through the module with real data. bankAccounts.js/expenses.js try
// the real API first; only when that call fails AND we're in a Vite dev
// build (import.meta.env.DEV — statically false and dead-code-eliminated in
// a production build) do they fall back to this localStorage-backed fake
// database instead. The moment the real backend starts responding, every
// call succeeds for real and this file never runs again — nothing to clean
// up later.

const STORE_KEY = 'finanzas_mock_store_v1';

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function seed() {
  const accountId1 = uid('acc');
  const accountId2 = uid('acc');
  return {
    bankAccounts: [
      {
        id: accountId1,
        name: 'Bancolombia Club',
        type: 'club_bank',
        opening_balance: 2500000,
        opening_balance_date: '2026-01-01',
        is_active: true,
        created_at: '2026-01-01',
      },
      {
        id: accountId2,
        name: 'Efectivo Luis',
        type: 'cash',
        opening_balance: 300000,
        opening_balance_date: '2026-01-01',
        is_active: true,
        created_at: '2026-01-01',
      },
    ],
    adjustments: [
      {
        id: uid('adj'),
        bank_account_id: accountId1,
        amount: 450000,
        date: '2026-02-10',
        note: 'Cuotas de inscripción cobradas directo a la cuenta',
        created_at: '2026-02-10',
      },
    ],
    expenses: [
      {
        id: uid('exp'),
        team: 'masculino',
        category: 'Cancha',
        subcategory: 'Alquiler mensual',
        detail: 'Alquiler cancha Campus Prince — octubre',
        beneficiary_name: 'Complejo Deportivo Prince',
        expense_date: '2026-10-05',
        total_amount: 800000,
        paid_amount: 800000,
        status: 'pagado',
        account_id: accountId1,
        proof_images: [],
        requested_by: 'Luis',
        approved_by: 'Vittoria Masculino',
        approved_at: '2026-10-06',
        created_at: '2026-10-05',
        updated_at: '2026-10-06',
      },
      {
        id: uid('exp'),
        team: 'femenino',
        category: 'Arbitraje',
        subcategory: '',
        detail: 'Árbitros fecha 8',
        beneficiary_name: 'Colegio de Árbitros',
        expense_date: '2026-10-12',
        total_amount: 250000,
        paid_amount: 150000,
        status: 'aprobado',
        account_id: accountId2,
        proof_images: [],
        requested_by: 'Luis',
        approved_by: 'Vittoria Masculino',
        approved_at: '2026-10-12',
        created_at: '2026-10-12',
        updated_at: '2026-10-14',
      },
      {
        id: uid('exp'),
        team: 'general',
        category: 'Indumentaria',
        subcategory: 'Uniformes',
        detail: 'Camisetas suplentes temporada 2026',
        beneficiary_name: 'Deportes Trinche',
        expense_date: '2026-10-18',
        total_amount: 1200000,
        paid_amount: 0,
        status: 'pendiente',
        account_id: null,
        proof_images: [],
        requested_by: 'Luis',
        created_at: '2026-10-18',
        updated_at: '2026-10-18',
      },
    ],
  };
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
  const adjustmentsSum = store.adjustments
    .filter((a) => a.bank_account_id === accountId)
    .reduce((sum, a) => sum + a.amount, 0);
  const paidSum = store.expenses
    .filter((e) => e.account_id === accountId)
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
