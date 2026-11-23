const API_BASE = '/api'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const requestError = new Error(data?.error || `Request failed (${response.status})`)
    requestError.status = response.status
    throw requestError
  }

  return data
}
