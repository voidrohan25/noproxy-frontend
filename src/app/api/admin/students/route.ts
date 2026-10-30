import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (batchId) {
      const students = db.getBatchEnrolledStudents(batchId);
      return NextResponse.json({
        success: true,
        students: students.map((s) => ({
          id: s.student.id,
          displayName: s.student.displayName,
          email: s.student.email,
        })),
      });
    }

    // List all students across the institute
    const studentUserIds = new Set(
      Array.from(db.memberships.values())
        .filter((m) => m.role === 'STUDENT')
        .map((m) => m.userId)
    );
    const allStudents = Array.from(db.profiles.values())
      .filter((p) => studentUserIds.has(p.id) || p.role === 'STUDENT')
      .map((student) => {
        const enrollments = Array.from(db.studentEnrollments.values())
          .filter((e) => e.studentId === student.id && e.status === 'ACTIVE')
          .map((e) => {
            const batch = db.batches.get(e.batchId);
            return {
              batchId: e.batchId,
              batchName: batch?.name || 'Batch',
              enrolledAt: e.enrolledAt || e.createdAt || new Date().toISOString(),
            };
          });

        return {
          id: student.id,
          displayName: student.displayName,
          email: student.email,
          accountStatus: student.accountStatus,
          createdAt: student.createdAt,
          enrollments,
        };
      });

    return NextResponse.json({ success: true, students: allStudents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, fullName, email, studentIdNumber } = body;

    if (!batchId || !fullName || (!email && !studentIdNumber)) {
      return NextResponse.json(
        { error: 'Missing batchId, fullName, or email.' },
        { status: 400 }
      );
    }

    const studentEmail = email || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.edu`;

    const result = db.enrollStudentByEmail({
      batchId,
      fullName: fullName.trim(),
      email: studentEmail.trim(),
      actorId: 'admin',
      actorRole: 'ADMIN',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      student: result.student,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
