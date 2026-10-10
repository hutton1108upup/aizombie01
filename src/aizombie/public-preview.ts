/** Public previews never touch authentication, storage, billing or AI providers. */
export function publicPreviewResponse(request: Request): Response | null {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
  const headers = { 'Cache-Control': 'no-store' };
  if (request.method === 'GET' && pathname === '/api/auth/get-session') {
    return Response.json(null, { headers });
  }
  if (request.method === 'GET' && pathname === '/api/ping') {
    return Response.json({ message: 'pong' }, { headers });
  }
  if (pathname.startsWith('/api/e2e/')) {
    return new Response('Not found', { status: 404, headers });
  }
  if (/^\/(auth|dashboard|settings|admin)(\/|$)/.test(pathname)) {
    url.pathname = '/';
    url.search = '';
    return Response.redirect(url, 303);
  }
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_serverFn') ||
    !['GET', 'HEAD'].includes(request.method)
  ) {
    return Response.json(
      {
        code: 'preview_only',
        error: 'Accounts, uploads, generation and checkout are not open yet.',
      },
      { status: 503, headers }
    );
  }
  return null;
}
