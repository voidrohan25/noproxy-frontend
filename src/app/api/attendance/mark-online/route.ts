import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, studentId, trainerId } = body;

    if (!sessionId || !studentId || !trainerId) {
      return NextResponse.json(
        { error: 'Missing sessionId, studentId, or trainerId' },
        { status: 400 }
      );
    }

    const result = db.markParticipantOnline(sessionId, studentId, trainerId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      record: result.record,
      message: 'Participant marked as ONLINE based on live meeting roster.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
