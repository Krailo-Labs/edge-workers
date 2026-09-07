export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareR2 } from '@/shared/utils/cloudflare-bindings';

export async function GET() {
  const r2 = getCloudflareR2();
  const cdnBase = process.env.NEXT_PUBLIC_R2_CDN_URL || 'https://cdn.info-hub.krailo.sh';
  return NextResponse.json({
    isR2Connected: !!r2,
    cdnBase,
    bucket: 'info-hub',
    status: r2 ? 'R2 bucket binding (info_hub) is active' : 'Local fallback mode active (R2 binding not detected)'
  });
}

export async function POST(req: NextRequest) {
  try {
    const r2 = getCloudflareR2();
    const cdnBase = (process.env.NEXT_PUBLIC_R2_CDN_URL || 'https://cdn.info-hub.krailo.sh').replace(/\/$/, '');

    const body = await req.json();
    const { assets } = body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json({ error: 'No assets provided in payload' }, { status: 400 });
    }

    const uploadedFiles: Record<string, string> = {};

    // If R2 binding is not available in current runtime (e.g. dev/local preview)
    if (!r2) {
      for (const asset of assets) {
        const cleanName = asset.name.replace(/^assets\//, '').replace(/^\.\//, '');
        uploadedFiles[asset.name] = `${cdnBase}/assets/${cleanName}`;
        uploadedFiles[`assets/${cleanName}`] = `${cdnBase}/assets/${cleanName}`;
        uploadedFiles[cleanName] = `${cdnBase}/assets/${cleanName}`;
      }

      return NextResponse.json({
        success: true,
        uploadedToR2: false,
        isLocalFallback: true,
        cdnBase,
        message: 'R2 binding not detected in current environment. Using local preview data.',
        files: uploadedFiles
      });
    }

    // When R2 binding is connected on Cloudflare Pages / Worker
    for (const asset of assets) {
      const { name, contentBase64, mimeType } = asset;
      if (!name || !contentBase64) continue;

      const cleanName = name.replace(/^assets\//, '').replace(/^\.\//, '');
      const binaryString = atob(contentBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const contentType = mimeType || (
        cleanName.endsWith('.svg') ? 'image/svg+xml' :
        cleanName.endsWith('.gif') ? 'image/gif' :
        cleanName.endsWith('.webp') ? 'image/webp' :
        cleanName.endsWith('.png') ? 'image/png' : 'image/jpeg'
      );

      // Upload to both assets/filename and filename for fail-safe access
      await r2.put(`assets/${cleanName}`, bytes.buffer, {
        httpMetadata: { contentType }
      });
      await r2.put(cleanName, bytes.buffer, {
        httpMetadata: { contentType }
      });

      const publicCdnUrl = `${cdnBase}/assets/${cleanName}`;
      uploadedFiles[name] = publicCdnUrl;
      uploadedFiles[`assets/${cleanName}`] = publicCdnUrl;
      uploadedFiles[cleanName] = publicCdnUrl;
    }

    return NextResponse.json({
      success: true,
      uploadedToR2: true,
      cdnBase,
      files: uploadedFiles
    });
  } catch (err: any) {
    console.error('R2 upload endpoint error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to upload assets to R2'
    }, { status: 500 });
  }
}
