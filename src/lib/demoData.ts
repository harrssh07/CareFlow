import { Patient, WaitingListCandidate, ActivityItem, OutcomesCohort, OutcomeRecord } from '@/types';

export const FEVER_THRESHOLD_CELSIUS = 38.0;
export const MAX_CAPACITY = 74;

// Today date reference for consistent mock time calculations
export const TODAY = '2026-10-23';
export const YESTERDAY = '2026-10-22';
export const DAY_BEFORE_YESTERDAY = '2026-10-21';
export const THREE_DAYS_AGO = '2026-10-20';

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah',
  'Timothy', 'Stephanie', 'Ronald', 'Rebecca', 'Edward', 'Sharon', 'Jason', 'Laura',
  'Jeffrey', 'Cynthia', 'Ryan', 'Dorothy', 'Jacob', 'Amy', 'Gary', 'Kathleen',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Emma', 'Stephen', 'Brenda',
  'Larry', 'Pamela'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly'
];

export function generateInitialPatients(): Patient[] {
  const patients: Patient[] = [];

  for (let i = 1; i <= MAX_CAPACITY; i++) {
    const id = `CF-${1000 + i}`;
    const name = `${FIRST_NAMES[(i - 1) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`;
    const bedNumber = i;
    const bed = `Bed ${bedNumber.toString().padStart(2, '0')}`;
    const ward = bedNumber <= 25 ? 'Ward A' : bedNumber <= 50 ? 'Ward B' : 'Ward C';
    const age = 22 + ((i * 7) % 55);
    const gender = i % 2 === 0 ? 'M' : 'F';

    // Admission dates vary between 4 to 18 days ago
    const daysAdmitted = 4 + (i % 14);
    const admissionDate = new Date(new Date(TODAY).getTime() - daysAdmitted * 86400000)
      .toISOString()
      .split('T')[0];

    // Design deliberate test cohorts across the 74 beds:
    // Group 1: Beds 1 to 6 -> Eligible for clinical review (3+ fever-free days, doctor visit pending or done)
    // Group 2: Beds 7 to 8 -> Approved by doctor, awaiting admin discharge
    // Group 3: Beds 9 to 14 -> Today temp completed, doctor visit pending (prime doctor queue)
    // Group 4: Beds 15 to 25 -> Today temp pending, doctor visit pending (prime nurse queue)
    // Group 5: Beds 26 to 30 -> Has missing historical reading (does NOT qualify for discharge even if today temp is low)
    // Group 6: Beds 31 to 35 -> Has fever today (>= 38.2°C, elevated risk)
    // Group 7: Rest -> Mixed realistic clinical flows

    let feverFreeStreak = 0;
    let dischargeStatus: Patient['dischargeStatus'] = 'not_eligible';
    let todayTempCompleted = false;
    let todayVisitCompleted = false;
    let riskCategory: Patient['riskCategory'] = 'Standard';

    const tempHistory = [];
    const visitHistory = [];

    if (i <= 6) {
      // Eligible for clinical review: 3 full consecutive fever-free days
      feverFreeStreak = 3 + (i % 3);
      todayTempCompleted = true;
      todayVisitCompleted = i <= 2;
      dischargeStatus = 'eligible_clinical_review';
      riskCategory = 'Standard';

      tempHistory.push(
        {
          id: `TR-${id}-D3`,
          patientId: id,
          value: 36.6,
          displayUnit: 'C' as const,
          timestamp: `${DAY_BEFORE_YESTERDAY}T08:30:00Z`,
          recordedBy: 'Nurse Clara Vance',
          isRepeat: false,
        },
        {
          id: `TR-${id}-D2`,
          patientId: id,
          value: 36.8,
          displayUnit: 'C' as const,
          timestamp: `${YESTERDAY}T08:45:00Z`,
          recordedBy: 'Nurse Marcus Lee',
          isRepeat: false,
        },
        {
          id: `TR-${id}-D1`,
          patientId: id,
          value: 36.7,
          displayUnit: 'C' as const,
          timestamp: `${TODAY}T08:15:00Z`,
          recordedBy: 'Nurse Clara Vance',
          isRepeat: false,
        }
      );

      if (todayVisitCompleted) {
        visitHistory.push({
          id: `VR-${id}-T`,
          patientId: id,
          visitDate: TODAY,
          doctorNotes: 'Patient asymptomatic, clear chest sounds, ready for clinical discharge clearance.',
          isCompleted: true,
          completedAt: `${TODAY}T10:15:00Z`,
          completedBy: 'Dr. Sarah Lin, MD',
        });
      }
    } else if (i === 7 || i === 8) {
      // Approved by doctor, waiting for Admin discharge
      feverFreeStreak = 4;
      todayTempCompleted = true;
      todayVisitCompleted = true;
      dischargeStatus = 'approved_by_doctor';
      riskCategory = 'Standard';

      tempHistory.push(
        {
          id: `TR-${id}-D3`,
          patientId: id,
          value: 36.5,
          displayUnit: 'C' as const,
          timestamp: `${DAY_BEFORE_YESTERDAY}T08:20:00Z`,
          recordedBy: 'Nurse Marcus Lee',
          isRepeat: false,
        },
        {
          id: `TR-${id}-D2`,
          patientId: id,
          value: 36.6,
          displayUnit: 'C' as const,
          timestamp: `${YESTERDAY}T08:30:00Z`,
          recordedBy: 'Nurse Marcus Lee',
          isRepeat: false,
        },
        {
          id: `TR-${id}-D1`,
          patientId: id,
          value: 36.5,
          displayUnit: 'C' as const,
          timestamp: `${TODAY}T08:00:00Z`,
          recordedBy: 'Nurse Marcus Lee',
          isRepeat: false,
        }
      );

      visitHistory.push({
        id: `VR-${id}-T`,
        patientId: id,
        visitDate: TODAY,
        doctorNotes: 'Clinical clearance criteria fulfilled (4 days afebrile). Approved for administrative discharge.',
        isCompleted: true,
        completedAt: `${TODAY}T09:30:00Z`,
        completedBy: 'Dr. Sarah Lin, MD',
      });
    } else if (i <= 20) {
      // Today temp completed, doctor visit pending
      todayTempCompleted = true;
      todayVisitCompleted = false;
      feverFreeStreak = 1;
      dischargeStatus = 'not_eligible';

      tempHistory.push(
        {
          id: `TR-${id}-D2`,
          patientId: id,
          value: 37.1,
          displayUnit: 'C' as const,
          timestamp: `${YESTERDAY}T09:10:00Z`,
          recordedBy: 'Nurse Clara Vance',
          isRepeat: false,
        },
        {
          id: `TR-${id}-D1`,
          patientId: id,
          value: 36.9,
          displayUnit: 'C' as const,
          timestamp: `${TODAY}T08:40:00Z`,
          recordedBy: 'Nurse Clara Vance',
          isRepeat: false,
        }
      );
    } else if (i <= 30) {
      // Missing historical readings! Only today's reading or missing yesterday.
      // Explicitly cannot assume normal!
      todayTempCompleted = i % 2 === 0;
      todayVisitCompleted = false;
      feverFreeStreak = 0; // cannot claim streak due to missing days
      dischargeStatus = 'not_eligible';

      if (todayTempCompleted) {
        tempHistory.push({
          id: `TR-${id}-D1`,
          patientId: id,
          value: 36.8,
          displayUnit: 'C' as const,
          timestamp: `${TODAY}T08:25:00Z`,
          recordedBy: 'Nurse Marcus Lee',
          note: 'Yesterday reading was missed during ward transit.',
          isRepeat: false,
        });
      }
    } else if (i <= 36) {
      // Patients with fever today
      todayTempCompleted = true;
      todayVisitCompleted = i === 31;
      feverFreeStreak = 0; // broken streak
      dischargeStatus = 'not_eligible';
      riskCategory = 'Critical';

      const feverTemp = 38.4 + ((i % 5) * 0.2);
      tempHistory.push(
        {
          id: `TR-${id}-D2`,
          patientId: id,
          value: 37.9,
          displayUnit: 'C' as const,
          timestamp: `${YESTERDAY}T09:40:00Z`,
          recordedBy: 'Nurse Marcus Lee',
          isRepeat: false,
        },
        {
          id: `TR-${id}-D1`,
          patientId: id,
          value: Number(feverTemp.toFixed(1)),
          displayUnit: 'C' as const,
          timestamp: `${TODAY}T07:50:00Z`,
          recordedBy: 'Nurse Clara Vance',
          note: 'Complains of chills and headache. Antipyretic administered.',
          isRepeat: false,
        }
      );
    } else {
      // General population across 37 to 74
      todayTempCompleted = i % 3 !== 0; // ~66% completed
      todayVisitCompleted = todayTempCompleted && i % 4 === 0;
      feverFreeStreak = i % 3;
      dischargeStatus = 'not_eligible';
      riskCategory = i % 7 === 0 ? 'Elevated' : 'Standard';

      const yesterdayVal = 36.7 + ((i % 8) * 0.1);
      tempHistory.push({
        id: `TR-${id}-D2`,
        patientId: id,
        value: Number(yesterdayVal.toFixed(1)),
        displayUnit: 'C' as const,
        timestamp: `${YESTERDAY}T09:15:00Z`,
        recordedBy: 'Nurse Marcus Lee',
        isRepeat: false,
      });

      if (todayTempCompleted) {
        const todayVal = 36.6 + ((i % 6) * 0.1);
        tempHistory.push({
          id: `TR-${id}-D1`,
          patientId: id,
          value: Number(todayVal.toFixed(1)),
          displayUnit: 'C' as const,
          timestamp: `${TODAY}T08:35:00Z`,
          recordedBy: 'Nurse Clara Vance',
          isRepeat: false,
        });
      }

      if (todayVisitCompleted) {
        visitHistory.push({
          id: `VR-${id}-T`,
          patientId: id,
          visitDate: TODAY,
          doctorNotes: 'Vitals stable. Maintaining supportive quarantine protocol.',
          isCompleted: true,
          completedAt: `${TODAY}T11:00:00Z`,
          completedBy: 'Dr. James Harrison, MD',
        });
      }
    }

    patients.push({
      id,
      name,
      age,
      gender,
      admissionDate,
      bed,
      ward,
      active: true,
      temperatureHistory: tempHistory,
      doctorVisitHistory: visitHistory,
      todayTempStatus: todayTempCompleted ? 'completed' : 'pending',
      todayVisitStatus: todayVisitCompleted ? 'completed' : 'pending',
      feverFreeStreak,
      dischargeStatus,
      doctorDischargeApprovedAt: (i === 7 || i === 8) ? `${TODAY}T09:30:00Z` : undefined,
      doctorDischargeApprovedBy: (i === 7 || i === 8) ? 'Dr. Sarah Lin, MD' : undefined,
      riskCategory,
    });
  }

  return patients;
}

export const INITIAL_WAITING_LIST: WaitingListCandidate[] = [
  {
    id: 'WL-01',
    name: 'Elena Rostova',
    age: 41,
    gender: 'F',
    addedDate: '2026-10-22',
    urgency: 'High',
    contact: '+1 (555) 349-1102',
    notes: 'Symptomatic contact of confirmed case. Oxygen saturation 96%. Needs immediate quarantine isolation.',
  },
  {
    id: 'WL-02',
    name: 'Marcus Brody',
    age: 58,
    gender: 'M',
    addedDate: '2026-10-22',
    urgency: 'High',
    contact: '+1 (555) 890-4421',
    notes: 'Diabetic comorbidity. High transmission cluster origin.',
  },
  {
    id: 'WL-03',
    name: 'Amina Al-Mansoor',
    age: 29,
    gender: 'F',
    addedDate: '2026-10-23',
    urgency: 'Urgent',
    contact: '+1 (555) 712-9844',
    notes: 'International traveler returning from quarantine tier 1 zone.',
  },
  {
    id: 'WL-04',
    name: 'Victor Zhao',
    age: 36,
    gender: 'M',
    addedDate: '2026-10-23',
    urgency: 'Standard',
    contact: '+1 (555) 231-6780',
    notes: 'Mild malaise, secondary household exposure.',
  },
  {
    id: 'WL-05',
    name: 'Chloe Dubois',
    age: 33,
    gender: 'F',
    addedDate: '2026-10-23',
    urgency: 'Standard',
    contact: '+1 (555) 904-5123',
    notes: 'Healthcare worker pending baseline viral clearance isolation.',
  },
];

export const INITIAL_ACTIVITY_LOG: ActivityItem[] = [
  {
    id: 'ACT-01',
    timestamp: `${TODAY}T09:30:00Z`,
    type: 'discharge_review',
    actor: 'Dr. Sarah Lin, MD',
    role: 'Doctor',
    description: 'Approved clinical discharge eligibility for Bed 07 (CF-1007) and Bed 08 (CF-1008).',
    patientId: 'CF-1007',
    patientName: 'William Martinez',
  },
  {
    id: 'ACT-02',
    timestamp: `${TODAY}T09:15:00Z`,
    type: 'doctor_visit',
    actor: 'Dr. James Harrison, MD',
    role: 'Doctor',
    description: 'Completed morning clinical rounds for Ward A patients with recorded morning vitals.',
  },
  {
    id: 'ACT-03',
    timestamp: `${TODAY}T08:40:00Z`,
    type: 'temperature',
    actor: 'Nurse Clara Vance',
    role: 'Nurse',
    description: 'Recorded morning temperature batch for Ward B (12 patients).',
  },
  {
    id: 'ACT-04',
    timestamp: `${TODAY}T07:50:00Z`,
    type: 'temperature',
    actor: 'Nurse Clara Vance',
    role: 'Nurse',
    description: 'Detected elevated temperature (38.8°C) in Bed 32 (CF-1032). Alerted on-duty physician.',
    patientId: 'CF-1032',
    patientName: 'Mark Flores',
  },
  {
    id: 'ACT-05',
    timestamp: `${YESTERDAY}T16:00:00Z`,
    type: 'admission',
    actor: 'Admin Taylor Hayes',
    role: 'Admin',
    description: 'Admitted 3 transfers from regional triage facility. Facility reached 74/74 maximum capacity.',
  },
];

// Fictional outcome cohort strictly 25 cases: 4 deaths (16%), 21 cured/discharged (84%)
export const INITIAL_OUTCOMES_COHORT: OutcomesCohort = {
  completedCases: 25,
  deaths: 4,
  successes: 21,
  mortalityRate: 16.0, // 4/25 = 16.0% (Benchmark: 15%)
  successRate: 84.0,   // 21/25 = 84.0% (Benchmark: 85%)
  mortalityBenchmark: 15.0,
  successBenchmark: 85.0,
  records: [
    { id: 'OC-01', patientName: 'Arthur Pendelton', admissionDate: '2026-09-14', outcomeDate: '2026-09-28', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Full recovery, 3 consecutive afebrile days, viral PCR negative.' },
    { id: 'OC-02', patientName: 'Grace Hopper', admissionDate: '2026-09-15', outcomeDate: '2026-09-29', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Completed full quarantine course without complications.' },
    { id: 'OC-03', patientName: 'Walter Vance', admissionDate: '2026-09-16', outcomeDate: '2026-09-24', outcome: 'deceased', daysInQuarantine: 8, primaryNotes: 'Severe acute respiratory distress syndrome, cardiac arrest.' },
    { id: 'OC-04', patientName: 'Beatrice Webb', admissionDate: '2026-09-18', outcomeDate: '2026-10-02', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Resolved febrile episode, cleared all discharge criteria.' },
    { id: 'OC-05', patientName: 'Clarence Darrow', admissionDate: '2026-09-20', outcomeDate: '2026-10-04', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Discharged afebrile, discharged to outpatient wellness monitor.' },
    { id: 'OC-06', patientName: 'Evelyn Waugh', admissionDate: '2026-09-21', outcomeDate: '2026-10-01', outcome: 'deceased', daysInQuarantine: 10, primaryNotes: 'Septic shock secondary to superinfection, refractory hypotension.' },
    { id: 'OC-07', patientName: 'Franklin Pierce', admissionDate: '2026-09-22', outcomeDate: '2026-10-06', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Stable throughout. Negative serology on day 13.' },
    { id: 'OC-08', patientName: 'Harriet Tubman', admissionDate: '2026-09-23', outcomeDate: '2026-10-07', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Full resolution of presenting symptoms. Discharge protocol completed.' },
    { id: 'OC-09', patientName: 'Irene Curie', admissionDate: '2026-09-25', outcomeDate: '2026-10-09', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Fever-free for 5 consecutive days prior to discharge.' },
    { id: 'OC-10', patientName: 'Julian Huxley', admissionDate: '2026-09-26', outcomeDate: '2026-10-05', outcome: 'deceased', daysInQuarantine: 9, primaryNotes: 'Multiorgan failure, age 81 with pre-existing heart failure.' },
    { id: 'OC-11', patientName: 'Katherine Johnson', admissionDate: '2026-09-27', outcomeDate: '2026-10-11', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Excellent response to symptomatic hydration and care.' },
    { id: 'OC-12', patientName: 'Louis Pasteur', admissionDate: '2026-09-28', outcomeDate: '2026-10-12', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Mild course, discharged back to home residence.' },
    { id: 'OC-13', patientName: 'Marie Tharp', admissionDate: '2026-09-29', outcomeDate: '2026-10-13', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Discharged on Day 14 after 4 consecutive normal temperature logs.' },
    { id: 'OC-14', patientName: 'Niels Bohr', admissionDate: '2026-09-30', outcomeDate: '2026-10-14', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Asymptomatic during second week, vitals within normal limits.' },
    { id: 'OC-15', patientName: 'Otto Hahn', admissionDate: '2026-10-01', outcomeDate: '2026-10-08', outcome: 'deceased', daysInQuarantine: 7, primaryNotes: 'Sudden pulmonary embolism on day 7 of quarantine admission.' },
    { id: 'OC-16', patientName: 'Percy Julian', admissionDate: '2026-10-02', outcomeDate: '2026-10-16', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Clinical score 0, clear lung fields, successful discharge.' },
    { id: 'OC-17', patientName: 'Rachel Carson', admissionDate: '2026-10-03', outcomeDate: '2026-10-17', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Met 3-day afebrile criteria on Day 12, discharged Day 14.' },
    { id: 'OC-18', patientName: 'Srinivasa Ramanujan', admissionDate: '2026-10-04', outcomeDate: '2026-10-18', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Full clinical remission achieved, discharged.' },
    { id: 'OC-19', patientName: 'Tu Youyou', admissionDate: '2026-10-05', outcomeDate: '2026-10-19', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'No lingering respiratory deficits. Afebrile streak of 6 days.' },
    { id: 'OC-20', patientName: 'Ursula Franklin', admissionDate: '2026-10-06', outcomeDate: '2026-10-20', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Discharge cleared by chief medical officer and administrative officer.' },
    { id: 'OC-21', patientName: 'Vera Rubin', admissionDate: '2026-10-07', outcomeDate: '2026-10-21', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Vital signs normal throughout quarantine stay.' },
    { id: 'OC-22', patientName: 'Wilhelm Rontgen', admissionDate: '2026-10-08', outcomeDate: '2026-10-22', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Completed required 14-day protocol with zero febrile excursions.' },
    { id: 'OC-23', patientName: 'Xenia Cage', admissionDate: '2026-10-08', outcomeDate: '2026-10-22', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Cured and discharged with verified post-quarantine home guidance.' },
    { id: 'OC-24', patientName: 'Yukawa Hideki', admissionDate: '2026-10-09', outcomeDate: '2026-10-23', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: 'Discharged this morning following final negative swab evaluation.' },
    { id: 'OC-25', patientName: 'Zora Neale Hurston', admissionDate: '2026-10-09', outcomeDate: '2026-10-23', outcome: 'cured_discharged', daysInQuarantine: 14, primaryNotes: '3 consecutive fever-free days recorded; discharge finalized.' },
  ],
};
