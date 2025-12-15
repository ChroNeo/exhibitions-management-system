/**
 * Custom fetch wrapper that adds ngrok-skip-browser-warning header
 * to bypass ngrok's browser warning page during development
 */
export async function fetchWithNgrokBypass(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  // Add ngrok bypass header
  headers.set('ngrok-skip-browser-warning', 'true');

  return fetch(input, {
    ...init,
    headers,
  });
}
