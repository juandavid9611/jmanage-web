import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { finanzasMock } from 'src/utils/finanzas-mock-store';
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { uploadFileToS3 } from './filesS3';

// ----------------------------------------------------------------------
// Finanzas del club: egresos, con flujo pendiente → aprobado → pagado.
// Reemplaza el seguimiento manual que hoy se lleva en un Excel — ver el
// contrato de API completo en el issue del módulo de Finanzas.
//
// El backend real todavía no existe (issue en curso) — mientras tanto, cada
// función intenta la llamada real primero y, solo si falla y estamos en un
// build de desarrollo (import.meta.env.DEV, eliminado del build de
// producción), cae a un mock local en localStorage (finanzas-mock-store.js)
// para poder construir y mostrar las pantallas. En cuanto el backend
// responda de verdad, este camino deja de usarse solo.

const URL = endpoints.expenses;

async function fetcherWithMockFallback(url, mockFn) {
  try {
    return await fetcher(url);
  } catch (error) {
    if (import.meta.env.DEV) return mockFn();
    throw error;
  }
}

export function useGetExpenses(workspaceId) {
  const url = workspaceId ? `${URL}?workspace_id=${workspaceId}` : null;
  const { data, isLoading, error, isValidating } = useSWR(
    url,
    (key) => fetcherWithMockFallback(key, () => finanzasMock.listExpenses())
  );

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
  const { data, isLoading, error, isValidating } = useSWR(
    url,
    (key) => fetcherWithMockFallback(key, () => finanzasMock.getExpense(id))
  );

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
  try {
    const res = await axiosInstance.post(url, expenseData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const created = finanzasMock.createExpense(expenseData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return created;
  }
}

export async function updateExpense(id, expenseData, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  try {
    const res = await axiosInstance.put(url, expenseData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const updated = finanzasMock.updateExpense(id, expenseData);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return updated;
  }
}

// Solo permitido server-side mientras status='pendiente'.
export async function deleteExpense(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}?workspace_id=${workspaceId}` : `${URL}/${id}`;
  try {
    const res = await axiosInstance.delete(url);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const result = finanzasMock.deleteExpense(id);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return result;
  }
}

// ── Flujo pendiente → aprobado → pagado ──────────────────────────────

export async function approveExpense(id, workspaceId) {
  const url = workspaceId ? `${URL}/${id}/approve?workspace_id=${workspaceId}` : `${URL}/${id}/approve`;
  try {
    const res = await axiosInstance.post(url, {});
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const updated = finanzasMock.approveExpense(id);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return updated;
  }
}

export async function rejectExpense(id, reason, workspaceId) {
  const url = workspaceId ? `${URL}/${id}/reject?workspace_id=${workspaceId}` : `${URL}/${id}/reject`;
  try {
    const res = await axiosInstance.post(url, { reason });
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const updated = finanzasMock.rejectExpense(id, reason);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return updated;
  }
}

// payment: { amount?, account_id, paid_at, file_names? } — `amount` vacío
// paga el saldo completo; se puede llamar varias veces para cuotas.
export async function markExpensePaid(id, payment, workspaceId) {
  const url = workspaceId ? `${URL}/${id}/mark-paid?workspace_id=${workspaceId}` : `${URL}/${id}/mark-paid`;
  try {
    const res = await axiosInstance.post(url, payment);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return res.data;
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    const updated = finanzasMock.markExpensePaid(id, payment);
    mutate((key) => typeof key === 'string' && key.startsWith(URL));
    return updated;
  }
}

// ── Comprobantes de pago (reemplazables, no de una sola subida) ─────

async function uploadExpenseProofFiles(expenseId, files, workspaceId) {
  if (!files.length) return [];
  const url = workspaceId
    ? `${URL}/${expenseId}/generate-presigned-urls?workspace_id=${workspaceId}`
    : `${URL}/${expenseId}/generate-presigned-urls`;
  const fileMetadata = files.map((file) => ({ file_name: file.name, content_type: file.type }));

  let urls;
  try {
    const res = await axiosInstance.post(url, fileMetadata);
    // Mismo formato que payments/productos: { urls: { "<file_name>": "<url>" } }.
    ({ urls } = res.data);
  } catch (error) {
    if (!import.meta.env.DEV) throw error;
    // No hay S3 real en el mock — los comprobantes se guardan como data
    // URL directamente, así que no hace falta pedir URLs prefirmadas.
    return finanzasMock.uploadProofFiles(files);
  }

  // fetch does not reject on HTTP errors, so check each PUT explicitly —
  // otherwise an expired/forbidden presigned URL would still record the
  // filename in proof_images as if the upload had actually succeeded.
  return Promise.all(
    files.map(async (file) => {
      const uploadRes = await uploadFileToS3(file, urls[file.name]);
      if (!uploadRes.ok) throw new Error(`Image upload failed (${uploadRes.status})`);
      return file.name;
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
