import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const authSession = getSessionForUserId(userId);
    if (!authSession || (authSession.role !== 'TRAINER' && authSession.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Only authorized trainers can start attendance sessions' }, { status: 403 });
    }

    const body = await req.json();
    const { batchId, title } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
    }

    // Verify trainer is authorized for this batch
    if (authSession.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'Forbidden: You are not assigned to manage attendance for this batch.' },
          { status: 403 }
        );
      }
    }

    const result = db.startBatchAttendanceSession({
      batchId,
      trainerId: userId,
      title,
    });

    if (!result.success || !result.session) {
      return NextResponse.json({ error: result.error || 'Failed to start attendance session' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      session: result.session,
      message: 'Active attendance session started. Dynamic QR code is ready for scanning.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
