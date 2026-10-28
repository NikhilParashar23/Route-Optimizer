import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:5001';

async function proxy(req: NextRequest, ctx: { params: any }) {
  const { path } = await ctx.params;
  const url = `${BACKEND}/api/${(path as string[]).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  const token = req.headers.get('x-trip-token');
  if (contentType) headers.set('content-type', contentType);
  if (token) headers.set('x-trip-token', token);

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: 'no-store',
    });

    return new Response(await res.text(), {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return Response.json(
      { error: 'The route server is not reachable. Make sure Flask is running on port 5001.' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;