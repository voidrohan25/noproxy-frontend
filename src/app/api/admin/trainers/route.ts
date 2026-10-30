import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get('institutionId') || '11111111-1111-1111-1111-111111111111';

  const trainers = db.listTrainers(institutionId);
  return NextResponse.json({ success: true, trainers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, batchIds, subjectIds, actorId, institutionId } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Trainer name and email address are required.' },
        { status: 400 }
      );
    }

    const result = db.createTrainerAccount({
      institutionId: institutionId || '11111111-1111-1111-1111-111111111111',
      name: name.trim(),
      email: email.trim(),
      password: password || 'Trainer@2026!',
      batchIds: Array.isArray(batchIds) ? batchIds : [],
      subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
      actorId: actorId || 'admin',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      trainer: result.trainer,
      message: 'Trainer account created and assigned to selected academic batches.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
