import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { uploadFileToS3 } from './filesS3';

// ----------------------------------------------------------------------
// Finanzas del club: egresos, con flujo pendiente → aprobado → pagado.
// Reemplaza el seguimiento manual que hoy se lleva en un Excel — ver el
// contrato de API completo en el issue del módulo de Finanzas.

const URL = endpoints.expenses;

export function useGetExpenses(workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

  return useMemo(
    () => ({
      expenses: data || [],
      expensesLoading: isLoading,
      expensesError: error,
      expensesValidating: isValidating,
      expensesEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );
}

export function useGetExpense(id, workspaceId) {
  const url = id && workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(url, fetcher);

  return useMemo(
    () => ({
      expense: data,
      expenseLoading: isLoading,
      expenseError: error,
      expenseValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export async function createExpense(expenseData, workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : URL;
  const res = await axiosInstance.post(url, expenseData);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

export async function updateExpense(id, expenseData, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.put(url, expenseData);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

// Solo permitido server-side mientras status='pendiente'.
export async function deleteExpense(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  const res = await axiosInstance.delete(url);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

// ── Flujo pendiente → aprobado → pagado ──────────────────────────────

export async function approveExpense(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}/approve?workspace_id=${workspaceId}` : `${URL}/${id}/approve`;
  const res = await axiosInstance.post(url, {});
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

export async function rejectExpense(id, reason, workspaceId) {
  const url = workspaceId ? `${URL}/${id}/reject?workspace_id=${workspaceId}` : `${URL}/${id}/reject`;
  const res = await axiosInstance.post(url, { reason });
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

// payment: { amount?, account_id, paid_at, file_names? } — `amount` vacío
// paga el saldo completo; se puede llamar varias veces para cuotas.
export async function markExpensePaid(id, payment, workspaceId) {
  const url = workspaceId ? `${URL}/${id}/mark-paid?workspace_id=${workspaceId}` : `${URL}/${id}/mark-paid`;
  const res = await axiosInstance.post(url, payment);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

// ── Comprobantes de pago (reemplazables, no de una sola subida) ─────

async function uploadExpenseProofFiles(expenseId, files, workspaceId) {
  if (!files.length) return [];
  const url = workspaceId
    ? `${URL}/${expenseId}/generate-presigned-urls?workspace_id=${workspaceId}`
    : `${URL}/${expenseId}/generate-presigned-urls`;
  const fileMetadata = files.map((file) => ({ file_name: file.name, content_type: file.type }));
  const res = await axiosInstance.post(url, fileMetadata);
  const presignedUrlMappings = res.data;

  return Promise.all(
    files.map(async (file, index) => {
      const mapping = presignedUrlMappings[index];
      const fileName = Object.keys(mapping)[0];
      await uploadFileToS3(file, mapping[fileName]);
      return fileName;
    })
  );
}

// images: array mixto de rutas ya subidas (string) y archivos nuevos
// (File) — igual al patrón de processProductImages, para que un tesorero
// pueda quitar/agregar capturas de pantalla sin perder las que ya subió.
export async function processExpenseProofImages(expenseId, images, workspaceId) {
  if (!images?.length) return [];
  const existingPaths = images.filter((image) => typeof image === 'string');
  const newFiles = images.filter((image) => image instanceof File);
  const newPaths = await uploadExpenseProofFiles(expenseId, newFiles, workspaceId);
  return [...existingPaths, ...newPaths];
}
