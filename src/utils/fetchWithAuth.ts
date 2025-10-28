export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const get = (k: string) =>
    typeof window !== "undefined" ? localStorage.getItem(k) : null;

  const token = get("token") || get("authToken") || (typeof window !== "undefined" ? sessionStorage.getItem("token") : null);
  const orgId = get("orgId");
  const facilityId = get("facilityId");
  const role = get("role");

  const authHeaders: Record<string, string> = {
    "Accept": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(orgId && { "X-Org-Id": orgId, "orgId": orgId }), // keep both while migrating
    ...(facilityId && { "X-Facility-Id": facilityId }),
    ...(role && { "X-Role": role }),
  };

  const headers = new Headers(init?.headers || {});
  Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));

  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (isFormData) {
    headers.delete("Content-Type"); // ← critical for multi-part uploads
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, {
    credentials: init?.credentials ?? "include",
    ...init,
    headers,
  });

  if (res.status === 401) {
    console.warn("⚠️ 401 Unauthorized:", input);
  }
  return res;
}
