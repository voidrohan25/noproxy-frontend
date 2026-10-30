import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { generateBatchAttendanceExcel } from '@/lib/excel/generator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId') || '77777777-7777-7777-7777-777777777771';

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
