import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

export async function GET(request: NextRequest) {
  try {
    const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = request.headers.get('authorization');
    if (auth) hdrs['Authorization'] = auth;
    const tenant = request.headers.get('x-tenant-name');
    if (tenant) hdrs['X-Tenant-Name'] = tenant;

    const response = await fetch(`${BACKEND_URL}/api/portal/document-reviews/pending`, {
      method: 'GET',
      headers: hdrs,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Pending document reviews proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Document review service unavailable' },
      { status: 500 }
    );
  }
}
