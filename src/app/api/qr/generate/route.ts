import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { generateQRChallenge, generateQRCodeDataUrl } from '@/lib/qr/token';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, institutionId } = body;

    if (!sessionId || !institutionId) {
      return NextResponse.json(
        { error: 'Missing sessionId or institutionId' },
        { status: 400 }
      );
    }

    const session = db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.sessionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Session is not active (status: ${session.sessionStatus})` },
        { status: 400 }
      );
    }

    if (session.mode !== 'OFFLINE') {
      return NextResponse.json(
        { error: 'Dynamic QR is only available for OFFLINE lecture sessions' },
        { status: 400 }
      );
    }

    // Default 20-second dynamic challenge window
    const expirySeconds = 20;
    const challenge = generateQRChallenge(sessionId, institutionId, expirySeconds);

    // Generate base64 QR code image
    const qrDataUrl = await generateQRCodeDataUrl(challenge.rawToken);

    return NextResponse.json({
      success: true,
      challengeToken: challenge.rawToken,
      qrDataUrl,
      issuedAt: challenge.payload.issuedAt,
      expiresAt: challenge.payload.expiresAt,
      expiresInSeconds: expirySeconds,
      nonce: challenge.payload.nonce,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
