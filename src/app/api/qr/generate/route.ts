import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';
import { generateQRChallenge, generateQRCodeDataUrl } from '@/lib/qr/token';

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const authSession = getSessionForUserId(userId);
    if (!authSession || (authSession.role !== 'TRAINER' && authSession.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Only authorized Trainers or Administrators can generate attendance QR codes' }, { status: 403 });
    }

    const body = await req.json();
    let { sessionId, institutionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required sessionId parameter' },
        { status: 400 }
      );
    }

    const session = db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (authSession.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === session.batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned && session.createdBy !== userId) {
        return NextResponse.json({ error: 'Forbidden: You are not assigned to generate QR codes for this batch session' }, { status: 403 });
      }
    }

    if (!institutionId) {
      institutionId = session.institutionId || '11111111-1111-1111-1111-111111111111';
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
