export const API_BASE_URL =
  import.meta.env.VITE_API_URL;

const AuthFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const { skip401Handler, headers, body, ...rest } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...rest,
    body,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401 && !skip401Handler) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("session-expired"));
  }

  return response;
};

export default AuthFetch;
