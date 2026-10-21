import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { finanzasMock } from 'src/utils/finanzas-mock-store';
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// Finanzas del club: cuentas (bancarias o efectivo) por las que pasa la
// plata. `balance` llega calculado del backend en cada GET — nunca se
// guarda ni se recalcula en el cliente (ver el contrato de API en el
// issue del módulo de Finanzas).
//
// El backend real todavía no existe (issue en curso) — mientras tanto, cada
// función intenta la llamada real primero y, solo si falla y estamos en un
// build de desarrollo (import.meta.env.DEV, eliminado del build de
// producción), cae a un mock local en localStorage (finanzas-mock-store.js)
// para poder construir y mostrar las pantallas. En cuanto el backend
// responda de verdad, este camino deja de usarse solo.

const URL = endpoints.bankAccounts;

async function fetcherWithMockFallback(url, mockFn) {
  try {
    return await fetcher(url);
  } catch (error) {
    if (import.meta.env.DEV) return mockFn();
    throw error;
  }
}

export function useGetBankAccounts(workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(
    url,
    (key) => fetcherWithMockFallback(key, () => finanzasMock.listAccounts())
  );

  return useMemo(
    () => ({
      bankAccounts: data || [],
      bankAccountsLoading: isLoading,
      bankAccountsError: error,
      bankAccountsValidating: isValidating,
      bankAccountsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );
}

export function useGetBankAccount(id, workspaceId) {
  const url = id && workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(
    url,
    (key) => fetcherWithMockFallback(key, () => finanzasMock.getAccount(id))
  );

  return useMemo(
    () => ({
      bankAccount: data,
      bankAccountLoading: isLoading,
      bankAccountError: error,
      bankAccountValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export async function createBankAccount(accountData, workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : URL;
  try {
    const res = await axiosInstance.post(url, accountData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const created = finanzasMock.createAccount(accountData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return created;
  }
}

export async function updateBankAccount(id, accountData, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  try {
    const res = await axiosInstance.put(url, accountData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const updated = finanzasMock.updateAccount(id, accountData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return updated;
  }
}

// Siempre borrado lógico del lado del backend (is_active=false) — una
// cuenta con egresos históricos nunca se puede borrar de verdad.
export async function deleteBankAccount(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  try {
    const res = await axiosInstance.delete(url);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const result = finanzasMock.deactivateAccount(id);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return result;
  }
}

// ── Ajustes de cuenta (plata que entra sin ser el pago de un egreso) ──

export function useGetBankAccountAdjustments(accountId, workspaceId) {
  const url =
    accountId && workspaceId ? `${URL}/${accountId}/adjustments?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(
    url,
    (key) => fetcherWithMockFallback(key, () => finanzasMock.listAdjustments(accountId))
  );

  return useMemo(
    () => ({
      adjustments: data || [],
      adjustmentsLoading: isLoading,
      adjustmentsError: error,
      adjustmentsValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export async function createBankAccountAdjustment(accountId, adjustmentData, workspaceId) {
  const url = workspaceId
    ? `${URL}/${accountId}/adjustments?workspace_id=${workspaceId}`
    : `${URL}/${accountId}/adjustments`;
  try {
    const res = await axiosInstance.post(url, adjustmentData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const created = finanzasMock.createAdjustment(accountId, adjustmentData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return created;
  }
}
