import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Only authorized Trainers or Administrators can finalize sessions' }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const attSession = db.getSession(sessionId);
    if (!attSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === attSession.batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned && attSession.createdBy !== userId) {
        return NextResponse.json({ error: 'Forbidden: You are not authorized to finalize this session' }, { status: 403 });
      }
    }

    const result = db.finalizeSession(sessionId, userId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      status: 'FINALIZED',
      absentMarkedCount: result.absentCount,
      totalStudents: result.finalizedCount,
      message: `Session finalized. ${result.absentCount} non-recorded students marked ABSENT. Session is now locked.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
