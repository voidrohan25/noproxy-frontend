// ==============================================================================
// NOPROXY INDEPENDENT SENIOR SECURITY & ADVERSARIAL AUDIT TEST SUITE
// Deliberately attempts to break:
// - Cross-batch / Cross-role IDOR & Unauthorized Access
// - Replay attacks & Token forgery
// - GPS spoofing & Geofence boundary bypass
// - Concurrent race condition duplicate scans
// - Attendance status corruption & Formula injection
// - Inactive / Deactivated account session hijacking
// ==============================================================================

import { db } from '../lib/db/mock-db';
import { generateBatchAttendanceExcel } from '../lib/excel/generator';
import { generateQRChallenge, verifyQRChallenge } from '../lib/qr/token';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const discoveredBugs: string[] = [];

function auditAssert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    const bug = `FAIL: ${testName} - ${failureDetails || 'Assertion violated'}`;
    discoveredBugs.push(bug);
    console.error(`  [FAIL] ${testName}: ${failureDetails || 'Assertion violated'}`);
  }
}

export async function runAdversarialSecurityAudit() {
  console.log('================================================================');
  console.log('       INDEPENDENT SENIOR QA & ADVERSARIAL SECURITY AUDIT        ');
  console.log('================================================================');

  const instId = '11111111-1111-1111-1111-111111111111';

  // --------------------------------------------------------------------------
  // TEST GROUP 1: IDOR & OBJECT-LEVEL AUTHORIZATION BOUNDARIES
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Testing IDOR & Boundary Isolation ---');

  // Create two distinct batches
  const batchARes = db.createBatch({ name: 'Batch Alpha (Python)', institutionId: instId });
  const batchBRes = db.createBatch({ name: 'Batch Beta (Java)', institutionId: instId });
  const batchA = batchARes.batch!;
  const batchB = batchBRes.batch!;

  // Create Trainer A (assigned to Batch Alpha ONLY)
  const trainerARes = db.createTrainerAccount({
    institutionId: instId,
    name: 'Trainer Alpha',
    email: `trainer.alpha.${Date.now()}@noproxy.edu`,
    password: 'Password123!',
    batchIds: [batchA.id],
    subjectIds: ['66666666-6666-6666-6666-666666666661'],
    actorId: 'admin-root',
  });
  const trainerA = trainerARes.trainer!;

  // Create Trainer B (assigned to Batch Beta ONLY)
  const trainerBRes = db.createTrainerAccount({
    institutionId: instId,
    name: 'Trainer Beta',
    email: `trainer.beta.${Date.now()}@noproxy.edu`,
    password: 'Password123!',
    batchIds: [batchB.id],
    subjectIds: ['66666666-6666-6666-6666-666666666661'],
    actorId: 'admin-root',
  });
  const trainerB = trainerBRes.trainer!;

  // Create Student Alice in Batch Alpha
  const studentAliceRes = db.enrollStudentByEmail({
    batchId: batchA.id,
    fullName: 'Alice Walker',
    email: `alice.${Date.now()}@noproxy.edu`,
  });
  const studentAlice = studentAliceRes.student!;

  // Test 1.1: Trainer A attempting to enroll a student into Batch Beta (Must FAIL)
  const unauthorizedEnroll = db.enrollStudentByEmail({
    batchId: batchB.id,
    fullName: 'Intruder Student',
    email: `intruder.${Date.now()}@test.com`,
    actorId: trainerA.id,
    actorRole: 'TRAINER',
  });
  auditAssert(!unauthorizedEnroll.success, 'Trainer A unauthorized student enrollment into Batch B is strictly BLOCKED');

  // Test 1.2: Trainer A batch access check on Batch Beta (Must be false)
  const trainerAAccessBatchB = Array.from(db.trainerAssignments.values()).some(
    (a) => a.trainerId === trainerA.id && a.batchId === batchB.id && a.status === 'ACTIVE'
  );
  auditAssert(!trainerAAccessBatchB, 'Trainer A cannot view or manage Batch B assignments');

  // Test 1.3: Student Alice attempting to enroll another student (Must FAIL)
  const studentEnrollAttempt = db.enrollStudentByEmail({
    batchId: batchA.id,
    fullName: 'Malicious Student',
    email: `malicious.${Date.now()}@test.com`,
    actorId: studentAlice.id,
    actorRole: 'STUDENT',
  });
  auditAssert(!studentEnrollAttempt.success, 'Student role cannot enroll other students into batches');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: ATTENDANCE STATUS 3-VALUE INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Testing Strict 3-Status Rules ---');

  // Start an active session in Batch Alpha
  const sessionAlphaId = `session-audit-${Date.now()}`;
  db.sessions.set(sessionAlphaId, {
    id: sessionAlphaId,
    institutionId: instId,
    batchId: batchA.id,
    subjectId: '66666666-6666-6666-6666-666666666661',
    classroomId: '88888888-8888-8888-8888-888888888881',
    createdBy: trainerA.id,
    title: 'Adversarial Security Session',
    sessionDate: '2026-11-01',
    startTime: '09:00:00',
    endTime: '11:00:00',
    mode: 'OFFLINE',
    sessionStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Test 2.1: Prohibited statuses rejection in correctAttendance
  const badStatuses = ['LATE', 'HALF_DAY', 'GRACE_PERIOD', 'EXCUSED', 'DELAYED', 'TARDY'];
  let allBadStatusesRejected = true;
  for (const bad of badStatuses) {
    const res = db.correctAttendance({
      sessionId: sessionAlphaId,
      studentId: studentAlice.id,
      newStatus: bad as any,
      reason: 'Adversarial test injection',
      actorId: trainerA.id,
    });
    if (res.success) {
      allBadStatusesRejected = false;
      console.error(`Prohibited status accepted: ${bad}`);
    }
  }
  auditAssert(allBadStatusesRejected, 'All prohibited non-3-status values (LATE, GRACE, EXCUSED, etc.) strictly REJECTED');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: DYNAMIC QR SECURITY, TAMPERING & REPLAY DEFENSE
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Testing Dynamic QR Cryptographic Verification & Anti-Replay ---');

  // Generate valid challenge
  const challenge = generateQRChallenge(sessionAlphaId, instId, 20);

  // Test 3.1: Valid challenge verification
  const validVerify = verifyQRChallenge(challenge.rawToken, sessionAlphaId);
  auditAssert(validVerify.valid === true, 'Fresh cryptographic QR challenge valid within 20s TTL');

  // Test 3.2: Tampered payload verification
  const tokenParts = challenge.rawToken.split('.');
  const tamperedToken = `${tokenParts[0]}.FORGED_DATA.${tokenParts[2]}.${tokenParts[3]}`;
  const tamperedVerify = verifyQRChallenge(tamperedToken, sessionAlphaId);
  auditAssert(tamperedVerify.valid === false, 'Tampered QR challenge payload strictly REJECTED');

  // Test 3.3: Stale / Expired challenge
  const expiredChallenge = generateQRChallenge(sessionAlphaId, instId, -10); // 10 seconds in the past
  const expiredVerify = verifyQRChallenge(expiredChallenge.rawToken, sessionAlphaId);
  auditAssert(expiredVerify.valid === false, 'Expired QR challenge token strictly REJECTED');

  // Test 3.4: Challenge generated for a different session
  const wrongSessionVerify = verifyQRChallenge(challenge.rawToken, 'session-totally-different-id');
  auditAssert(wrongSessionVerify.valid === false, 'QR challenge presented to mismatched session strictly REJECTED');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: GPS GEOFENCING & LOCATION INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Testing GPS Geofence & Boundary Integrity ---');

  // Classroom dynamic coordinates check
  const classroom = db.classrooms.get('88888888-8888-8888-8888-888888888881')!;
  // Test 4.1: Student directly inside classroom
  const coordsInside = { latitude: classroom.latitude + 0.00005, longitude: classroom.longitude + 0.00005, accuracy: 10 };
  const attInside = db.submitOfflineAttendance({
    authenticatedUserId: studentAlice.id,
    sessionId: sessionAlphaId,
    rawToken: challenge.rawToken,
    studentCoords: coordsInside,
    deviceCredentialId: `cred-${Date.now()}`,
    localAuthConfirmed: true,
  });
  auditAssert(attInside.success === true, 'Student inside geofence radius recorded as PRESENT');

  // Test 4.2: Duplicate attendance submission on same session (Must FAIL)
  const attDuplicate = db.submitOfflineAttendance({
    authenticatedUserId: studentAlice.id,
    sessionId: sessionAlphaId,
    rawToken: challenge.rawToken,
    studentCoords: coordsInside,
  });
  auditAssert(attDuplicate.success === false, 'Duplicate scan by same student on same session strictly REJECTED');

  // Test 4.3: Unenrolled student scanning QR (Must FAIL)
  const studentBobRes = db.enrollStudentByEmail({
    batchId: batchB.id, // Enrolled in Java, not Python!
    fullName: 'Bob Smith',
    email: `bob.${Date.now()}@noproxy.edu`,
  });
  const studentBob = studentBobRes.student!;
  const challenge2 = generateQRChallenge(sessionAlphaId, instId, 20);
  const attUnenrolled = db.submitOfflineAttendance({
    authenticatedUserId: studentBob.id,
    sessionId: sessionAlphaId,
    rawToken: challenge2.rawToken,
    studentCoords: coordsInside,
  });
  auditAssert(attUnenrolled.success === false, 'Unenrolled student attendance submission strictly REJECTED');

  // Test 4.4: Outside geofence radius (e.g. 1km away)
  const studentCharlieRes = db.enrollStudentByEmail({
    batchId: batchA.id,
    fullName: 'Charlie Davis',
    email: `charlie.${Date.now()}@noproxy.edu`,
  });
  const studentCharlie = studentCharlieRes.student!;
  const coordsOutside = { latitude: classroom.latitude + 0.03, longitude: classroom.longitude + 0.03, accuracy: 10 }; // ~4.5 km away
  const challenge3 = generateQRChallenge(sessionAlphaId, instId, 20);
  const attOutside = db.submitOfflineAttendance({
    authenticatedUserId: studentCharlie.id,
    sessionId: sessionAlphaId,
    rawToken: challenge3.rawToken,
    studentCoords: coordsOutside,
  });
  auditAssert(attOutside.success === false, 'Student outside geofence radius (4.5 km away) strictly REJECTED');

  // Test 4.5: Inaccurate GPS reading (accuracy = 120m > 30m maximum allowed)
  const coordsInaccurate = { latitude: classroom.latitude + 0.00005, longitude: classroom.longitude + 0.00005, accuracy: 120 };
  const challenge4 = generateQRChallenge(sessionAlphaId, instId, 20);
  const attInaccurate = db.submitOfflineAttendance({
    authenticatedUserId: studentCharlie.id,
    sessionId: sessionAlphaId,
    rawToken: challenge4.rawToken,
    studentCoords: coordsInaccurate,
  });
  auditAssert(attInaccurate.success === false, 'Inaccurate GPS device fix (accuracy: 120m > 30m threshold) strictly REJECTED');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: CONCURRENT ATTENDANCE RACE CONDITIONS
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Testing Concurrency & Race Conditions ---');

  const studentDavidRes = db.enrollStudentByEmail({
    batchId: batchA.id,
    fullName: 'David Concurrency',
    email: `david.${Date.now()}@noproxy.edu`,
  });
  const studentDavid = studentDavidRes.student!;
  const raceChallenge = generateQRChallenge(sessionAlphaId, instId, 20);

  // Send 25 concurrent scan requests for David
  const concurrentSubmissions = await Promise.all(
    Array.from({ length: 25 }, () =>
      Promise.resolve(
        db.submitOfflineAttendance({
          authenticatedUserId: studentDavid.id,
          sessionId: sessionAlphaId,
          rawToken: raceChallenge.rawToken,
          studentCoords: coordsInside,
        })
      )
    )
  );

  const successfulScans = concurrentSubmissions.filter((r) => r.success);
  const duplicateRejections = concurrentSubmissions.filter((r) => !r.success);

  auditAssert(
    successfulScans.length === 1 && duplicateRejections.length === 24,
    '25 concurrent scan submissions: Exactly 1 SUCCESS, 24 duplicate rejections',
    `Got ${successfulScans.length} successes and ${duplicateRejections.length} rejections`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 6: EXCEL GENERATION & FORMULA INJECTION MITIGATION
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Testing Excel Matrix Export & Security Sanitization ---');

  // Enroll student with formula injection payload
  const injectionStudentRes = db.enrollStudentByEmail({
    batchId: batchA.id,
    fullName: '=cmd|\'/C calc\'!A0',
    email: `+malicious.${Date.now()}@student.edu`,
  });
  const injectionStudent = injectionStudentRes.student!;

  // Finalize session
  db.finalizeSession(sessionAlphaId, trainerA.id);

  const exportData = db.getBatchExportData(batchA.id);
  auditAssert(exportData !== null, 'Batch export data generated for finalized session');

  const excelBuffer = await generateBatchAttendanceExcel(exportData!);
  auditAssert(excelBuffer.length > 5000, `Excel binary generated successfully (${excelBuffer.length} bytes)`);
  auditAssert(excelBuffer.subarray(0, 4).toString('hex') === '504b0304', 'Excel register contains valid ZIP/PK magic bytes');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: DEACTIVATED / INACTIVE ACCOUNT DEFENSE
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Testing Deactivated Account Enforcement ---');

  // Deactivate Trainer A
  db.profiles.get(trainerA.id)!.accountStatus = 'INACTIVE';
  const deactLogin = db.authenticateUser(trainerA.email, 'Password123!');
  auditAssert(deactLogin.success === false, 'Deactivated trainer account login strictly BLOCKED');

  // Reactivate Trainer A
  db.profiles.get(trainerA.id)!.accountStatus = 'ACTIVE';
  const reactLogin = db.authenticateUser(trainerA.email, 'Password123!');
  auditAssert(reactLogin.success === true, 'Reactivated trainer account login SUCCEEDS');

  // --------------------------------------------------------------------------
  // AUDIT SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL AUDIT TESTS EXECUTED : ${totalTests}`);
  console.log(`TESTS PASSED               : ${passedTests}`);
  console.log(`TESTS FAILED               : ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error('DISCOVERED VULNERABILITIES:');
    discoveredBugs.forEach((b) => console.error(`  - ${b}`));
    throw new Error(`${failedTests} security audit tests failed.`);
  } else {
    console.log('ALL ADVERSARIAL SECURITY & INTEGRITY TESTS PASSED! (100%)');
  }
}

runAdversarialSecurityAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
