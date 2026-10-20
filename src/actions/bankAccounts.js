import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// Finanzas del club: cuentas (bancarias o efectivo) por las que pasa la
// plata. `balance` llega calculado del backend en cada GET — nunca se
// guarda ni se recalcula en el cliente (ver el contrato de API en el
// issue del módulo de Finanzas).

const URL = endpoints.bankAccounts;

export function useGetBankAccounts(workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

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
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

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
  const res = await axiosInstance.post(url, accountData);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

export async function updateBankAccount(id, accountData, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.put(url, accountData);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

// Siempre borrado lógico del lado del backend (is_active=false) — una
// cuenta con egresos históricos nunca se puede borrar de verdad.
export async function deleteBankAccount(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.delete(url);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

// ── Ajustes de cuenta (plata que entra sin ser el pago de un egreso) ──

export function useGetBankAccountAdjustments(accountId, workspaceId) {
  const url =
    accountId && workspaceId ? `${URL}/${accountId}/adjustments?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

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
  const res = await axiosInstance.post(url, adjustmentData);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}
