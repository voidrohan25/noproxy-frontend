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
      return NextResponse.json({ error: 'Unauthorized: Only authorized trainers can stop attendance sessions' }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify trainer authorization
    if (authSession.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === session.batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned && session.createdBy !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: You are not authorized to stop this attendance session.' },
          { status: 403 }
        );
      }
    }

    const result = db.finalizeSession(sessionId, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to stop session' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      finalizedCount: result.finalizedCount,
      absentCount: result.absentCount,
      message: `Attendance stopped. ${result.finalizedCount} students processed (${result.absentCount} marked ABSENT). Session is now finalized and locked.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
