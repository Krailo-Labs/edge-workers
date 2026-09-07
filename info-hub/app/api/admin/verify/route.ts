export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side Admin Password Verification.
 * This runs securely on Cloudflare Edge Worker and keeps the password completely
 * hidden from the browser console, network bundles, and public client code.
 */
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, message: 'Пароль обов’язковий' }, { status: 400 });
    }

    // Default admin password or environment variable ADMIN_PASSWORD
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (password.trim() === expectedPassword.trim()) {
      return NextResponse.json({ 
        success: true, 
        message: 'Успішний вхід',
        role: 'ADMIN'
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Невірний пароль адміністратора' 
    }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: 'Помилка перевірки пароля: ' + error.message 
    }, { status: 500 });
  }
}
