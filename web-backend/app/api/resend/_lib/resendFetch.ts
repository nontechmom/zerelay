type ResendFetchOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  apiKey: string;
  userAgent: string;
  idempotencyKey?: string;
  jsonBody?: unknown;
};

export async function resendFetch(opts: ResendFetchOptions): Promise<Response> {
  const url = `https://api.resend.com${opts.path}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${opts.apiKey}`);
  headers.set('User-Agent', opts.userAgent);

  if (opts.idempotencyKey) headers.set('Idempotency-Key', opts.idempotencyKey);

  let body: string | undefined;
  if (opts.jsonBody !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(opts.jsonBody);
  }

  return fetch(url, {
    method: opts.method,
    headers,
    body,
    cache: 'no-store',
  });
}
