import { db } from '../lib/db/mock-db';
import { generateBatchAttendanceExcel } from '../lib/excel/generator';
import { generateQRChallenge, verifyQRChallenge } from '../lib/qr/token';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPart14Regression() {
  console.log('================================================================');
  console.log('       PART 14 — FULL MASTER REGRESSION SEQUENCE EXECUTION       ');
  console.log('================================================================');

  const instId = '11111111-1111-1111-1111-111111111111';

  // Step 1: Initialize Admin
  console.log('\n--- Step 1: Initialize Admin ---');
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@noproxy.edu').toLowerCase();
  const adminPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@NoProxy2026!';
  const adminCred = db.credentials.get(adminEmail);
  assert(adminCred !== undefined && adminCred.role === 'ADMIN', `Admin user (${adminEmail}) exists with verified role ADMIN`);

  // Step 2: Log in as Admin
  console.log('\n--- Step 2: Log in as Admin ---');
  const adminAuth = db.authenticateUser(adminEmail, adminPass);
  assert(adminAuth.success && adminAuth.role === 'ADMIN', 'Admin authentication succeeded with verified ADMIN role');

  // Step 3: Create Python Batch
  console.log('\n--- Step 3: Create Python Batch ---');
  const pythonBatchRes = db.createBatch({
    name: 'Python Master Batch 2026',
    courseName: 'Data Engineering Master Track',
    institutionId: instId
  });
  assert(pythonBatchRes.success && !!pythonBatchRes.batch, 'Python batch created successfully');
  const pythonBatch = pythonBatchRes.batch!;

  // Step 4: Create Java Batch
  console.log('\n--- Step 4: Create Java Batch ---');
  const javaBatchRes = db.createBatch({
    name: 'Java Enterprise Batch 2026',
    courseName: 'Distributed Systems Track',
    institutionId: instId
  });
  assert(javaBatchRes.success && !!javaBatchRes.batch, 'Java batch created successfully');
  const javaBatch = javaBatchRes.batch!;

  // Step 5: Create Trainer 1 & Assign to Python
  console.log('\n--- Step 5: Create Trainer 1 & Assign to Python Batch ---');
  const trainer1Res = db.createTrainerAccount({
    name: 'Vikram Mehta',
    email: `vikram.${Date.now()}@noproxy.edu`,
    password: 'TrainerPassword2026!',
    institutionId: instId,
    batchIds: [pythonBatch.id],
    subjectIds: ['66666666-6666-6666-6666-666666666661'],
    actorId: adminAuth.user?.id || 'admin-root'
  });
  assert(trainer1Res.success && !!trainer1Res.trainer, 'Trainer 1 (Vikram) created and assigned to Python Batch');
  const trainer1 = trainer1Res.trainer!;

  // Step 6: Create Trainer 2 & Assign to Java
  console.log('\n--- Step 6: Create Trainer 2 & Assign to Java Batch ---');
  const trainer2Res = db.createTrainerAccount({
    name: 'Ananya Roy',
    email: `ananya.${Date.now()}@noproxy.edu`,
    password: 'TrainerPassword2026!',
    institutionId: instId,
    batchIds: [javaBatch.id],
    subjectIds: ['66666666-6666-6666-6666-666666666661'],
    actorId: adminAuth.user?.id || 'admin-root'
  });
  assert(trainer2Res.success && !!trainer2Res.trainer, 'Trainer 2 (Ananya) created and assigned to Java Batch');
  const trainer2 = trainer2Res.trainer!;

  // Step 7: Add new student Rahul Sharma (rahul.sharma.reg@example.com) to Python
  console.log('\n--- Step 7: Enroll Rahul Sharma in Python Batch ---');
  const rahulEmail = `rahul.reg.${Date.now()}@example.com`;
  const enrollRahulPython = db.enrollStudentByEmail({
    batchId: pythonBatch.id,
    fullName: 'Rahul Sharma',
    email: rahulEmail,
    actorId: trainer1.id,
    actorRole: 'TRAINER'
  });
  assert(enrollRahulPython.success && !!enrollRahulPython.student, 'Rahul Sharma enrolled in Python Batch');
  assert(enrollRahulPython.isNewStudent === true, 'Rahul registered as a new student');
  const studentRahul = enrollRahulPython.student!;

  // Step 8: Log in as Trainer 2 (Java) -> Search Rahul -> Add to Java Batch
  console.log('\n--- Step 8: Trainer 2 Searches Rahul & Enrolls in Java Batch ---');
  const trainer2Auth = db.authenticateUser(trainer2.email, 'TrainerPassword2026!');
  assert(trainer2Auth.success && trainer2Auth.role === 'TRAINER', 'Trainer 2 logged in successfully');

  // Search Rahul
  const searchResults = db.searchStudents(rahulEmail, javaBatch.id);
  assert(searchResults.length === 1 && searchResults[0].email.toLowerCase() === rahulEmail.toLowerCase(), 'Trainer 2 found existing student Rahul by email search');
  assert(!searchResults[0].isAlreadyEnrolled, 'Search confirms Rahul is not yet enrolled in Java Batch');

  // Enroll in Java with upper-case email to verify normalization
  const enrollRahulJava = db.enrollStudentByEmail({
    batchId: javaBatch.id,
    fullName: 'Rahul Sharma',
    email: rahulEmail.toUpperCase(),
    actorId: trainer2.id,
    actorRole: 'TRAINER'
  });
  assert(enrollRahulJava.success, 'Existing student Rahul enrolled into Java Batch with case-insensitive email normalization');
  assert(enrollRahulJava.isNewStudent === false, 'Account was REUSED with 0 duplicate profile creation');

  // Step 9: Refresh and verify student list: 1 student profile, 2 enrollments
  console.log('\n--- Step 9: Verify Student Isolation & Multi-Batch Enrollments ---');
  const rahulProfiles = Array.from(db.profiles.values()).filter(p => p.email.toLowerCase() === rahulEmail.toLowerCase());
  assert(rahulProfiles.length === 1, `Database contains strictly ONE student profile (found ${rahulProfiles.length})`);

  const rahulEnrollments = Array.from(db.studentEnrollments.values()).filter(
    e => e.studentId === studentRahul.id && e.status === 'ACTIVE'
  );
  assert(rahulEnrollments.length === 2, `Rahul has strictly 2 active enrollments (found ${rahulEnrollments.length})`);

  const pythonStudents = db.getBatchEnrolledStudents(pythonBatch.id);
  const javaStudents = db.getBatchEnrolledStudents(javaBatch.id);
  assert(pythonStudents.some(s => s.student.id === studentRahul.id), 'Rahul appears in Python Batch student list');
  assert(javaStudents.some(s => s.student.id === studentRahul.id), 'Rahul appears in Java Batch student list');

  // Step 10: Log in as Trainer 1 -> Verify assigned batches
  console.log('\n--- Step 10: Verify Trainer 1 Batch Isolation ---');
  const trainer1Assignments = Array.from(db.trainerAssignments.values()).filter(
    a => a.trainerId === trainer1.id && a.status === 'ACTIVE'
  );
  assert(trainer1Assignments.length === 1 && trainer1Assignments[0].batchId === pythonBatch.id, 'Trainer 1 is assigned strictly to Python Batch');
  const trainer1CanAccessJava = trainer1Assignments.some(a => a.batchId === javaBatch.id);
  assert(!trainer1CanAccessJava, 'Trainer 1 CANNOT access Java Batch');

  // Step 11: Trainer 1 starts attendance session -> Generates dynamic QR
  console.log('\n--- Step 11: Start Attendance Session & Generate Dynamic QR ---');
  const sessionId = `session-reg-${Date.now()}`;
  db.sessions.set(sessionId, {
    id: sessionId,
    institutionId: instId,
    batchId: pythonBatch.id,
    subjectId: '66666666-6666-6666-6666-666666666661',
    classroomId: '88888888-8888-8888-8888-888888888881',
    createdBy: trainer1.id,
    title: 'Python Core Architecture - Session 1',
    sessionDate: '2026-11-01',
    startTime: '10:00:00',
    endTime: '12:00:00',
    mode: 'OFFLINE',
    sessionStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  assert(db.sessions.has(sessionId), 'Attendance session created and ACTIVE');

  // Dynamic QR Challenge Generation
  const qrChallenge = generateQRChallenge(sessionId, instId, 20);
  assert(!!qrChallenge.rawToken && qrChallenge.rawToken.length > 20, 'Cryptographic dynamic QR challenge generated with HMAC-SHA256');

  // Step 12: Student marks attendance within GPS Geofence
  console.log('\n--- Step 12: Student Scans Dynamic QR within Classroom Geofence ---');
  const classroom = db.classrooms.get('88888888-8888-8888-8888-888888888881')!;
  const studentCoords = { latitude: classroom.latitude + 0.00005, longitude: classroom.longitude + 0.00005, accuracy: 10 }; // within classroom
  const attRes = db.submitOfflineAttendance({
    authenticatedUserId: studentRahul.id,
    sessionId,
    rawToken: qrChallenge.rawToken,
    studentCoords,
    deviceCredentialId: `cred-device-${Date.now()}`,
    localAuthConfirmed: true
  });
  assert(attRes.success, 'Student attendance marked PRESENT inside classroom geofence');

  // Step 13: Trainer 1 live attendance monitor updates
  console.log('\n--- Step 13: Trainer Live Attendance Monitor ---');
  const sessionRecords = Array.from(db.attendance.values()).filter(
    r => r.sessionId === sessionId && r.status === 'PRESENT'
  );
  assert(sessionRecords.length === 1 && sessionRecords[0].studentId === studentRahul.id, 'Live session reflects Rahul as PRESENT');

  // Step 14: Trainer 1 stops/finalizes attendance session
  console.log('\n--- Step 14: Stop & Finalize Attendance Session ---');
  const finalizeRes = db.finalizeSession(sessionId, trainer1.id);
  assert(finalizeRes.success, 'Attendance session finalized and stopped successfully');
  const finalizedSession = db.sessions.get(sessionId);
  assert(finalizedSession?.sessionStatus === 'FINALIZED', 'Session status transitioned to FINALIZED');

  // Step 15: Attempt another scan after session stopped -> Must be REJECTED
  console.log('\n--- Step 15: Re-scan Rejected on Stopped Session ---');
  const reScanRes = db.submitOfflineAttendance({
    authenticatedUserId: studentRahul.id,
    sessionId,
    rawToken: qrChallenge.rawToken,
    studentCoords
  });
  assert(!reScanRes.success, 'Scan attempt on finalized session was correctly REJECTED');

  // Step 16: Export Attendance Excel Register (.xlsx) & Verify Data
  console.log('\n--- Step 16: Export Excel Register (.xlsx) & Verify Metrics ---');
  const exportData = db.getBatchExportData(pythonBatch.id);
  assert(exportData !== null, 'Batch export data retrieved successfully');
  const excelBuffer = await generateBatchAttendanceExcel(exportData!);
  assert(excelBuffer.length > 5000, `Excel buffer generated (${excelBuffer.length} bytes)`);
  assert(excelBuffer.subarray(0, 4).toString('hex') === '504b0304', 'Excel register contains valid ZIP/PK magic bytes');

  // Step 17: Unauthorized access tests
  console.log('\n--- Step 17: Security & Unauthorized Access Boundary Tests ---');
  // Check trainer cannot enroll students in unassigned batch
  const unauthorizedEnroll = db.enrollStudentByEmail({
    batchId: javaBatch.id,
    fullName: 'Sneha Rao',
    email: 'sneha@example.com',
    actorId: trainer1.id,
    actorRole: 'TRAINER'
  });
  assert(!unauthorizedEnroll.success, 'Trainer 1 unauthorized enrollment attempt into Java Batch was strictly BLOCKED');

  // Deactivated Trainer blocks access
  const trainerCred = db.credentials.get(trainer1.email);
  if (trainerCred) {
    db.profiles.get(trainer1.id)!.accountStatus = 'INACTIVE';
  }
  const deactivatedLogin = db.authenticateUser(trainer1.email, 'TrainerPassword2026!');
  assert(!deactivatedLogin.success, 'Deactivated trainer login was strictly BLOCKED');

  // Reactivate Trainer
  db.profiles.get(trainer1.id)!.accountStatus = 'ACTIVE';
  const reactivatedLogin = db.authenticateUser(trainer1.email, 'TrainerPassword2026!');
  assert(reactivatedLogin.success, 'Reactivated trainer login succeeded');

  console.log('\n================================================================');
  console.log('       PART 14 REGRESSION SEQUENCE: 100% PASSED!                ');
  console.log('================================================================');
}

runPart14Regression().catch(err => {
  console.error('Regression sequence failed:', err);
  process.exit(1);
});
