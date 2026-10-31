import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';
import { AttendanceStatus } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Only authorized Trainers or Administrators can correct attendance records' }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId, studentId, newStatus, reason } = body;

    if (!sessionId || !studentId || !newStatus || !reason) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, studentId, newStatus, reason' },
        { status: 400 }
      );
    }

    // Verify session exists and check trainer assignment if not admin
    const attSession = db.getSession(sessionId);
    if (!attSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === attSession.batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned && attSession.createdBy !== userId) {
        return NextResponse.json({ error: 'Forbidden: You are not assigned to manage attendance for this batch session' }, { status: 403 });
      }
    }

    // Strict 3-status verification
    const allowedStatuses: AttendanceStatus[] = ['PRESENT', 'ONLINE', 'ABSENT'];
    if (!allowedStatuses.includes(newStatus as AttendanceStatus)) {
      return NextResponse.json(
        {
          error: `CRITICAL STATUS ERROR: Status '${newStatus}' is strictly prohibited. Permitted statuses are strictly: PRESENT, ONLINE, ABSENT.`,
        },
        { status: 400 }
      );
    }

    const result = db.correctAttendance({
      sessionId,
      studentId,
      newStatus: newStatus as AttendanceStatus,
      reason,
      actorId: userId,
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
      message: `Attendance corrected to ${newStatus} and audit log updated.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
