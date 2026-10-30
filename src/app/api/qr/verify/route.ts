import { NextRequest, NextResponse } from 'next/server';
import { verifyQRChallenge } from '@/lib/qr/token';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawToken, expectedSessionId } = body;

    const result = verifyQRChallenge(rawToken, expectedSessionId);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ valid: true, payload: result.payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
