import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rosterId, reason, actorId } = body;

    if (!rosterId || !reason) {
      return NextResponse.json(
        { error: 'Missing rosterId or mandatory reset audit reason.' },
        { status: 400 }
      );
    }

    const result = db.resetStudentClaim(rosterId, actorId || 'admin', reason);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student account claim reset. Student may now re-verify their account.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
