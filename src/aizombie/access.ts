import { auth } from '@/auth/auth';

export async function requireVideoUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return {
      response: Response.json(
        { error: 'Sign in to continue.' },
        { status: 401 }
      ),
    };
  }
  if (!session.user.emailVerified) {
    return {
      response: Response.json(
        { error: 'Verify your email first.' },
        { status: 403 }
      ),
    };
  }
  return { userId: session.user.id };
}

export function requireSameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json(
      { error: 'Untrusted request origin.' },
      { status: 403 }
    );
  }
  return null;
}

export async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new Error('Expected application/json.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new Error('Request body is too large.');
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
