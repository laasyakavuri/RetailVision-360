import {
  DashboardSummary, SystemStatus, Product, InventoryRecord,
  Planogram, PlanogramCompareResult, ShelfAudit, OperationalTask,
  TaskStatusHistoryItem, TaskVerificationResult, CheckoutSession,
  Alert, StoreZoneActivity, ChatConversation, ChatMessage
} from '../types';

const BASE_URL = '/api';

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    let errorDetail = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

// System & Health
export const getHealth = () => apiRequest<{ status: string }>('/health');
export const getSystemStatus = () => apiRequest<SystemStatus>('/system/status');

// Dashboard
export const getDashboardSummary = () => apiRequest<DashboardSummary>('/dashboard/summary');
export const getDashboardActivity = () => apiRequest<any[]>('/dashboard/activity');

// Products & Inventory
export const getProducts = () => apiRequest<Product[]>('/products');
export const createProduct = (data: Partial<Product>) =>
  apiRequest<Product>('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
export const updateProduct = (id: number, data: Partial<Product>) =>
  apiRequest<Product>(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
export const deleteProduct = (id: number) =>
  apiRequest<{ message: string }>(`/products/${id}`, { method: 'DELETE' });

export const getInventory = () => apiRequest<InventoryRecord[]>('/inventory');
export const updateInventory = (data: { product_id: number; recorded_shelf_qty?: number; recorded_backroom_qty?: number; recent_sales_qty?: number; source?: string }) =>
  apiRequest<InventoryRecord>('/inventory/updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

// Planograms
export const getPlanograms = () => apiRequest<Planogram[]>('/planograms');
export const createPlanogram = (data: any) =>
  apiRequest<Planogram>('/planograms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
export const comparePlanogram = (planogramId: number, auditId: number) =>
  apiRequest<PlanogramCompareResult>(`/planograms/${planogramId}/compare?audit_id=${auditId}`, { method: 'POST' });

// Shelf Audits
export const getShelfAudits = () => apiRequest<ShelfAudit[]>('/shelf-audits');
export const getShelfAuditDetail = (id: number) => apiRequest<ShelfAudit>(`/shelf-audits/${id}`);
export const uploadShelfAudit = async (file: File, aisle: string, shelf: string, planogramId?: number, notes?: string): Promise<ShelfAudit> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('aisle', aisle);
  formData.append('shelf', shelf);
  if (planogramId) formData.append('planogram_id', planogramId.toString());
  if (notes) formData.append('notes', notes);

  const res = await fetch(`${BASE_URL}/shelf-audits`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to analyze shelf image');
  }
  return res.json();
};

// Tasks & Priority
export const getTasks = (status?: string) =>
  apiRequest<OperationalTask[]>(`/tasks${status ? `?status=${status}` : ''}`);
export const getTaskDetail = (id: number) => apiRequest<OperationalTask>(`/tasks/${id}`);
export const updateTaskStatus = (id: number, data: { status?: string; assigned_to?: string; employee_notes?: string }) =>
  apiRequest<OperationalTask>(`/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
export const getTaskHistory = (id: number) => apiRequest<TaskStatusHistoryItem[]>(`/tasks/${id}/history`);
export const verifyTask = async (taskId: number, file: File, notes?: string): Promise<TaskVerificationResult> => {
  const formData = new FormData();
  formData.append('file', file);
  if (notes) formData.append('notes', notes);

  const res = await fetch(`${BASE_URL}/tasks/${taskId}/verify`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Verification request failed');
  }
  return res.json();
};

export const getPriorityQueue = () => apiRequest<any[]>('/priority-queue');

// Checkout
export const getCheckoutSessions = () => apiRequest<CheckoutSession[]>('/checkout/sessions');
export const createCheckoutSession = (data: any) =>
  apiRequest<CheckoutSession>('/checkout/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

// Alerts
export const getAlerts = (status?: string, severity?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (severity) params.append('severity', severity);
  const q = params.toString();
  return apiRequest<Alert[]>(`/alerts${q ? `?${q}` : ''}`);
};
export const updateAlertStatus = (id: number, status: string) =>
  apiRequest<Alert>(`/alerts/${id}?status=${status}`, { method: 'PATCH' });

// Store Efficiency Analytics
export const getZoneAnalytics = () => apiRequest<StoreZoneActivity[]>('/analytics/zones');
export const getDwellTimeSummary = () => apiRequest<any[]>('/analytics/dwell-time');

// Gemini Chatbot
export const getChatStatus = () => apiRequest<{ gemini_available: boolean; model: string; api_key_configured: boolean }>('/chat/status');
export const getChatConversations = () => apiRequest<ChatConversation[]>('/chat/conversations');
export const createChatConversation = (title?: string) =>
  apiRequest<ChatConversation>(`/chat/conversations${title ? `?title=${encodeURIComponent(title)}` : ''}`, { method: 'POST' });
export const getConversationDetail = (id: number) => apiRequest<ChatConversation>(`/chat/conversations/${id}`);
export const deleteConversation = (id: number) => apiRequest<{ message: string }>(`/chat/conversations/${id}`, { method: 'DELETE' });
export const sendChatMessage = (conversationId: number, content: string) =>
  apiRequest<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });

// Demo Data Reset
export const resetDemoData = () => apiRequest<{ status: string; message: string }>('/demo/reset', { method: 'POST' });
