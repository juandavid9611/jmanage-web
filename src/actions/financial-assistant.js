import Anthropic from '@anthropic-ai/sdk';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// Financial assistant: a tool-use chat where Claude decides which of the
// tools below to call, and we execute them locally against the real
// payment-request data already served by this workspace's API (same
// endpoint as src/actions/paymentRequest.js, fetched directly here since
// tool execution happens outside a React render, not inside a hook).
//
// callFinancialAssistant() calls the Anthropic API directly from the
// browser with a key the admin pastes in locally (see getStoredApiKey /
// setStoredApiKey below) — this is a TEST-ONLY setup, not safe for a
// production release with real users, since the key is readable from
// this browser's devtools. Shipping this for real needs a backend
// endpoint that proxies the call so the key stays server-side.

const CATEGORY_VALUES = ['Entrenos', 'Sansiones', 'Indumentarias', 'tournament_fine'];
const STATUS_VALUES = ['paid', 'pending', 'overdue', 'approval_pending'];
const MAX_ROWS_RETURNED = 100;

export async function fetchPaymentRequestsForAssistant(workspaceId) {
  if (!workspaceId) return [];
  const url = `${endpoints.paymentRequests}?workspace_id=${workspaceId}`;
  return fetcher(url);
}

// ----------------------------------------------------------------------

export const FINANCIAL_TOOLS = [
  {
    name: 'query_payment_requests',
    description:
      'Devuelve cobros (payment requests) individuales filtrados por jugador, categoría, estado y/o rango de fechas. Usar cuando el usuario pide el detalle de cobros puntuales, no un total agregado.',
    input_schema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: 'Nombre o email (parcial) del jugador al que se le hizo el cobro.',
        },
        category: { type: 'string', enum: CATEGORY_VALUES },
        status: { type: 'string', enum: STATUS_VALUES },
        date_from: { type: 'string', description: 'Fecha mínima de vencimiento, formato YYYY-MM-DD.' },
        date_to: { type: 'string', description: 'Fecha máxima de vencimiento, formato YYYY-MM-DD.' },
      },
    },
  },
  {
    name: 'summarize_payment_requests',
    description:
      'Agrega totales de cobros (cantidad y montos, separados por pagado/pendiente/vencido) agrupados por jugador, categoría, estado o mes. Usar para preguntas de totales, deuda, o comparaciones entre jugadores/categorías.',
    input_schema: {
      type: 'object',
      properties: {
        group_by: { type: 'string', enum: ['player', 'category', 'status', 'month'] },
        player_name: { type: 'string', description: 'Filtrar por nombre o email (parcial) de jugador.' },
        category: { type: 'string', enum: CATEGORY_VALUES },
        status: { type: 'string', enum: STATUS_VALUES },
        date_from: { type: 'string', description: 'Fecha mínima de vencimiento, formato YYYY-MM-DD.' },
        date_to: { type: 'string', description: 'Fecha máxima de vencimiento, formato YYYY-MM-DD.' },
      },
      required: ['group_by'],
    },
  },
];

export const FINANCIAL_ASSISTANT_SYSTEM_PROMPT = `Sos el asistente financiero interno de un club deportivo. Respondés en español,
de forma breve y con números concretos, preguntas de administradores sobre cobros
a jugadores (por jugador, por categoría —incluida "Entrenos" para entrenamientos y
"tournament_fine" para torneos—, por estado o por fecha).

Reglas:
- Nunca inventes montos ni jugadores: toda cifra debe salir de una llamada a una tool.
- Si una pregunta requiere datos que las tools no cubren (por ejemplo donaciones o
  ingresos de la tienda), decilo explícitamente en vez de estimar.
- Preferí "summarize_payment_requests" para totales/comparaciones y
  "query_payment_requests" solo cuando el usuario pide el detalle de cobros puntuales.
- Mostrá los montos formateados como moneda y aclará cuántos cobros componen cada total.`;

// ----------------------------------------------------------------------

function filterPaymentRequests(requests, filters = {}) {
  const { player_name: playerName, category, status, date_from: dateFrom, date_to: dateTo } = filters;
  const needle = playerName?.toLowerCase().trim();

  return requests.filter((request) => {
    if (needle) {
      const name = request.paymentRequestTo?.name?.toLowerCase() || '';
      const email = request.paymentRequestTo?.email?.toLowerCase() || '';
      if (!name.includes(needle) && !email.includes(needle)) return false;
    }
    if (category && request.category !== category) return false;
    if (status && request.status !== status) return false;
    if (dateFrom && new Date(request.dueDate) < new Date(dateFrom)) return false;
    if (dateTo && new Date(request.dueDate) > new Date(dateTo)) return false;
    return true;
  });
}

function summarizePaymentRequests(requests, groupBy) {
  const groups = new Map();

  requests.forEach((request) => {
    let key = 'Sin especificar';
    if (groupBy === 'player') key = request.paymentRequestTo?.name || 'Sin asignar';
    else if (groupBy === 'category') key = request.category || 'Sin categoría';
    else if (groupBy === 'status') key = request.status || 'Sin estado';
    else if (groupBy === 'month') key = request.dueDate ? request.dueDate.slice(0, 7) : 'Sin fecha';

    const amount = request.totalAmount || 0;
    const entry = groups.get(key) || { group: key, count: 0, total: 0, paid: 0, pending: 0, overdue: 0 };
    entry.count += 1;
    entry.total += amount;
    if (request.status === 'paid') entry.paid += amount;
    if (request.status === 'pending') entry.pending += amount;
    if (request.status === 'overdue') entry.overdue += amount;
    groups.set(key, entry);
  });

  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}

function toSummaryRow(request) {
  return {
    id: request.id,
    player: request.paymentRequestTo?.name,
    category: request.category,
    status: request.status,
    concept: request.concept,
    totalAmount: request.totalAmount,
    dueDate: request.dueDate,
  };
}

export async function executeFinancialTool(toolName, input, workspaceId) {
  const requests = await fetchPaymentRequestsForAssistant(workspaceId);
  const filtered = filterPaymentRequests(requests, input);

  if (toolName === 'query_payment_requests') {
    return {
      matchCount: filtered.length,
      rows: filtered.slice(0, MAX_ROWS_RETURNED).map(toSummaryRow),
      truncated: filtered.length > MAX_ROWS_RETURNED,
    };
  }

  if (toolName === 'summarize_payment_requests') {
    return { groups: summarizePaymentRequests(filtered, input.group_by) };
  }

  throw new Error(`Herramienta desconocida: ${toolName}`);
}

// ----------------------------------------------------------------------

const AI_API_KEY_STORAGE_KEY = 'jmanage_ai_test_api_key';

export function getStoredApiKey() {
  try {
    return localStorage.getItem(AI_API_KEY_STORAGE_KEY) || '';
  } catch (error) {
    return '';
  }
}

export function setStoredApiKey(key) {
  try {
    if (key) localStorage.setItem(AI_API_KEY_STORAGE_KEY, key);
    else localStorage.removeItem(AI_API_KEY_STORAGE_KEY);
  } catch (error) {
    // Storage unavailable (private browsing, etc.) — nothing to do.
  }
}

export class AIApiKeyMissingError extends Error {
  constructor() {
    super('AI_API_KEY_MISSING');
    this.name = 'AIApiKeyMissingError';
  }
}

/**
 * TEST-ONLY: calls the Anthropic API directly from the browser with a
 * locally-stored API key. The key never leaves this browser except in
 * requests to Anthropic itself, but it IS readable from devtools by
 * anyone using this browser — acceptable for local testing, never for a
 * production build with real users. Shipping this to real admins needs a
 * backend endpoint that proxies the call so the key stays server-side.
 */
export async function callFinancialAssistant(messages, tools) {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new AIApiKeyMissingError();

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  return client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system: FINANCIAL_ASSISTANT_SYSTEM_PROMPT,
    thinking: { type: 'adaptive' },
    tools,
    messages,
  });
}
