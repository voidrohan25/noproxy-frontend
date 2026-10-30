import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
    }

    // Scoped strictly to the authenticated student's authoritative identity
    const enrolledBatches = db.getStudentEnrolledBatches(userId);

    return NextResponse.json({
      success: true,
      batches: enrolledBatches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
