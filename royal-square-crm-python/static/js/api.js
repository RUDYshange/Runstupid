/**
 * Every call to the backend goes through here.
 *
 * One place to add an auth header, one place to handle a 401, one place that
 * knows the error shape. Scattering fetch() calls through the view files means
 * changing all of them the day authentication is added.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (response.status === 204) return null;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // The backend's ApiError shape: { timestamp, status, message, fieldErrors }
    throw new ApiError(
      body?.message || 'Something went wrong. Try again.',
      response.status,
      body?.fieldErrors || {}
    );
  }
  return body;
}

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const api = {
  clients: {
    list:   (q)  => request('/clients' + (q ? `?q=${encodeURIComponent(q)}` : '')),
    detail: (id) => request(`/clients/${id}`),
    create: (payload) => request('/clients', { method: 'POST', body: JSON.stringify(payload) })
  },

  reminders: {
    queue:     (rule) => request('/reminders' + (rule ? `?rule=${rule}` : '')),
    rules:     ()     => request('/reminders/rules'),
    dismiss:   (key)  => request(`/reminders/${encodeURIComponent(key)}/dismiss`, { method: 'POST' }),
    reinstate: (key)  => request(`/reminders/${encodeURIComponent(key)}/dismiss`, { method: 'DELETE' })
  },

  claims: {
    list:     ()          => request('/claims'),
    detail:   (id)        => request(`/claims/${id}`),
    register: (payload)   => request('/claims', { method: 'POST', body: JSON.stringify(payload) }),
    advance:  (id)        => request(`/claims/${id}/advance`, { method: 'POST' }),
    toggleSceneItem: (id, item) => request(`/claims/${id}/scene/${item}`, { method: 'POST' })
  }
};
