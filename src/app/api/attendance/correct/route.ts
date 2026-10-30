import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { AttendanceStatus } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, studentId, newStatus, reason, actorId } = body;

    if (!sessionId || !studentId || !newStatus || !reason || !actorId) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, studentId, newStatus, reason, actorId' },
        { status: 400 }
      );
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
      actorId,
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
