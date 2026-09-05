import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  
  // Ready to connect with Cloudflare env.DB or KV if present
  return NextResponse.json({
    status: 'ok',
    mode: 'ready_for_cloudflare_d1',
    filterType: type
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      status: 'ok',
      message: 'Saved successfully',
      data: body
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 400 });
  }
}
