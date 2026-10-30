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
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Trainer access required' }, { status: 403 });
    }

    const institutionId = session.institution?.id || '11111111-1111-1111-1111-111111111111';

    // Find batches assigned to this trainer (or all batches if Admin)
    let assignedBatchIds: string[] = [];
    if (session.role === 'ADMIN') {
      assignedBatchIds = Array.from(db.batches.keys());
    } else {
      assignedBatchIds = Array.from(db.trainerAssignments.values())
        .filter((a) => a.trainerId === userId && a.status === 'ACTIVE')
        .map((a) => a.batchId);
    }

    const allBatches = db.listBatches(institutionId);
    const trainerBatches = allBatches
      .filter((b) => assignedBatchIds.includes(b.id))
      .map((batch) => {
        // Enrolled students in this batch
        const students = db.getBatchEnrolledStudents(batch.id);

        // Subject assigned to this batch
        const assignment = Array.from(db.trainerAssignments.values()).find(
          (a) => a.batchId === batch.id && a.status === 'ACTIVE'
        );
        const subject = assignment?.subjectId ? db.subjects.get(assignment.subjectId) : undefined;

        // Current active session for this batch (if any)
        const activeSession = Array.from(db.sessions.values()).find(
          (s) => s.batchId === batch.id && s.sessionStatus === 'ACTIVE'
        );

        let liveStatus = null;
        if (activeSession) {
          liveStatus = db.getSessionLiveStatus(activeSession.id);
        }

        return {
          batch,
          subject,
          enrolledCount: students.length,
          students: students.map((s) => ({
            id: s.student.id,
            displayName: s.student.displayName,
            email: s.student.email,
            rollNumber: s.rollNumber || '',
          })),
          activeSession,
          liveStatus,
        };
      });

    return NextResponse.json({
      success: true,
      trainer: session.user,
      batches: trainerBatches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
