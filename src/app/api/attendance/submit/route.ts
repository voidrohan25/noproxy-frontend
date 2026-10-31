import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Authenticated Student from Secure Session Cookie or Bearer Token
    let authenticatedUserId = req.cookies.get('noproxy_session_user')?.value;

    if (!authenticatedUserId && req.headers.get('authorization')) {
      const authHeader = req.headers.get('authorization')!;
      if (authHeader.startsWith('Bearer ')) {
        authenticatedUserId = authHeader.substring(7).trim();
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be signed in with an active student account to submit attendance.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      sessionId,
      rawToken,
      studentCoords,
      deviceCredentialId,
      localAuthConfirmed,
    } = body;

    if (!sessionId || !rawToken) {
      return NextResponse.json(
        { error: 'Missing required attendance parameters (sessionId or dynamic QR token).' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    // 2. Submit with Authoritative Server Verification
    const result = db.submitOfflineAttendance({
      authenticatedUserId,
      sessionId,
      rawToken,
      studentCoords,
      deviceCredentialId,
      localAuthConfirmed,
      ipAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      record: result.record,
      checks: result.checks,
      message: 'Attendance verified against authoritative institutional roster and recorded as PRESENT.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
