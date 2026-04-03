import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = request.headers.get('authorization');
    if (auth) hdrs['Authorization'] = auth;
    const tenant = request.headers.get('x-tenant-name');
    if (tenant) hdrs['X-Tenant-Name'] = tenant;

    const response = await fetch(`${BACKEND_URL}/api/portal/document-reviews/${id}/accept`, {
      method: 'PUT',
      headers: hdrs,
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Accept document proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to accept document' },
      { status: 500 }
    );
  }
}
