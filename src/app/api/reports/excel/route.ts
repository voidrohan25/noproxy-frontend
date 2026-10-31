import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';
import { generateBatchAttendanceExcel } from '@/lib/excel/generator';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Access restricted strictly to authorized Trainers and Administrators' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId parameter' }, { status: 400 });
    }

    // If Trainer, verify assigned to this batch
    if (session.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden: You are not authorized to export reports for this batch' }, { status: 403 });
      }
    }

    const exportData = db.getBatchExportData(batchId);
    if (!exportData) {
      return NextResponse.json({ error: 'Batch not found or no data available' }, { status: 404 });
    }

    const excelBuffer = await generateBatchAttendanceExcel(exportData);
    const safeCode = exportData.batchCode.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `NoProxy_Attendance_Register_${safeCode}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating Excel register' }, { status: 500 });
  }
}
