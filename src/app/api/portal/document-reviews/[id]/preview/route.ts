import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hdrs: Record<string, string> = {};
    const auth = request.headers.get('authorization');
    if (auth) hdrs['Authorization'] = auth;
    const tenant = request.headers.get('x-tenant-name');
    if (tenant) hdrs['X-Tenant-Name'] = tenant;

    const response = await fetch(`${BACKEND_URL}/api/portal/document-reviews/${id}/preview`, {
      method: 'GET',
      headers: hdrs,
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    const body = await response.arrayBuffer();

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);

    return new NextResponse(Buffer.from(body), { status: 200, headers });
  } catch (error) {
    console.error('Preview document proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to preview document' },
      { status: 500 }
    );
  }
}
