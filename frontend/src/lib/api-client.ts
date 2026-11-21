/**
 * Typed client connector for Jersey Fit Backend API.
 * Dispatches RPC calls to backend API / server functions.
 */

// In development or when backend is running on port 3001
const API_BASE_URL = typeof window !== "undefined"
  ? (window.location.port === "3000" || window.location.port === "5173" || window.location.port === "8080"
      ? "http://localhost:3001"
      : "")
  : "http://localhost:3001";

export async function callBackendApi<T = any>(
  action: string,
  params?: any,
  token?: string,
): Promise<T> {
  // If running in browser, retrieve session token if not explicitly provided
  let authToken = token;
  if (!authToken && typeof window !== "undefined") {
    try {
      const sessionStr = window.localStorage.getItem("jf_admin_session");
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        authToken = parsed.token;
      }
    } catch {
      // ignore
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/rpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ action, params }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "Unknown server error" }));
    throw new Error(errorBody.message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
