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
      return NextResponse.json({ error: 'Unauthorized: Only authorized Trainers or Administrators can mark participants ONLINE' }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId, studentId } = body;

    if (!sessionId || !studentId) {
      return NextResponse.json(
        { error: 'Missing sessionId or studentId' },
        { status: 400 }
      );
    }

    const attSession = db.getSession(sessionId);
    if (!attSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (authSession.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === attSession.batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned && attSession.createdBy !== userId) {
        return NextResponse.json({ error: 'Forbidden: You are not assigned to manage attendance for this batch session' }, { status: 403 });
      }
    }

    const result = db.markParticipantOnline(sessionId, studentId, userId);

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
