import { useAuthStore } from '@/stores/auth'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = useAuthStore()
  const { params, ...fetchOptions } = options

  const url = new URL(`/api${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`
  }

  const res = await fetch(url.toString(), { ...fetchOptions, headers })

  if (res.status === 401) {
    auth.logout()
    throw new Error('Non authentifié')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.message ?? 'Erreur serveur'), { statusCode: res.status })
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function useApi() {
  return {
    get: <T>(path: string, params?: Record<string, string>) =>
      request<T>(path, { method: 'GET', params }),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    del: <T>(path: string) =>
      request<T>(path, { method: 'DELETE' }),
  }
}
