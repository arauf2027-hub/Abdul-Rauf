import { db } from './index.ts';
import * as schema from './schema.ts';
import { initialMasterData, initialIncidents } from './initialData.ts';

export async function seedDatabaseIfEmpty() {
  try {
    const existingUsers = await db.select().from(schema.users).limit(1);
    if (existingUsers.length > 0) {
      console.log('[EHS DB] Database already contains records. Skipping seed.');
      return;
    }

    console.log('[EHS DB] Seeding initial EHS master data and incidents...');

    // 1. Organization
    if (initialMasterData.organization) {
      await db.insert(schema.organizations).values({
        id: initialMasterData.organization.id || 1,
        name: initialMasterData.organization.name || 'Power Cement Limited (PCL)',
        logoUrl: initialMasterData.organization.logoUrl || '',
        trirMultiplier: initialMasterData.organization.trirMultiplier || 200000,
        ltifrMultiplier: initialMasterData.organization.ltifrMultiplier || 1000000,
        totalHoursWorked: initialMasterData.organization.totalHoursWorked || 750000,
      }).onConflictDoNothing();
    } else {
      await db.insert(schema.organizations).values({
        name: 'Power Cement Limited (PCL)',
        trirMultiplier: 200000,
        ltifrMultiplier: 1000000,
        totalHoursWorked: 750000,
      }).onConflictDoNothing();
    }

    // 2. Departments
    if (Array.isArray(initialMasterData.departments)) {
      for (const dept of initialMasterData.departments) {
        await db.insert(schema.departments).values({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.description || '',
        }).onConflictDoNothing();
      }
    }

    // 3. Locations
    if (Array.isArray(initialMasterData.locations)) {
      for (const loc of initialMasterData.locations) {
        await db.insert(schema.locations).values({
          id: loc.id,
          name: loc.name,
          code: loc.code,
          locationType: loc.locationType || 'Plant',
        }).onConflictDoNothing();
      }
    }

    // 4. SubLocations
    if (Array.isArray(initialMasterData.subLocations)) {
      for (const sub of initialMasterData.subLocations) {
        await db.insert(schema.subLocations).values({
          id: sub.id,
          locationId: sub.locationId,
          name: sub.name,
          code: sub.code,
        }).onConflictDoNothing();
      }
    }

    // 5. Users
    if (Array.isArray(initialMasterData.users)) {
      for (const u of initialMasterData.users) {
        await db.insert(schema.users).values({
          id: u.id,
          uid: u.uid || `user-${u.id}`,
          email: u.email,
          fullName: u.fullName,
          role: u.role || 'rp',
          departmentId: u.departmentId,
          locationId: u.locationId,
          jobTitle: u.jobTitle || 'EHS Officer',
          isActive: u.isActive !== false,
        }).onConflictDoNothing();
      }
    }

    // 6. System Config
    if (Array.isArray(initialMasterData.systemConfig)) {
      for (const cfg of initialMasterData.systemConfig) {
        await db.insert(schema.systemConfig).values({
          key: cfg.key,
          value: cfg.value,
          description: cfg.description || '',
        }).onConflictDoNothing();
      }
    }

    // 7. Incidents
    if (Array.isArray(initialIncidents)) {
      for (const inc of initialIncidents) {
        await db.insert(schema.events).values({
          id: inc.id,
          eventId: inc.eventId,
          title: inc.title,
          eventType: inc.eventType,
          occurrenceDate: inc.occurrenceDate,
          occurrenceTime: inc.occurrenceTime,
          reportedByUserId: inc.reportedByUserId || 1,
          departmentId: inc.departmentId || 1,
          locationId: inc.locationId || 1,
          subLocationId: inc.subLocationId || null,
          eventCategory: inc.eventCategory || 'Safety',
          actualConsequence: inc.actualConsequence || 'None',
          potentialConsequence: inc.potentialConsequence || 'Minor Injury',
          immediateActionsTaken: inc.immediateActionsTaken || '',
          personsInvolved: inc.personsInvolved || '',
          witnesses: inc.witnesses || '',
          injuryOrEnvironmentalDetails: inc.injuryOrEnvironmentalDetails || '',
          initialRiskClassification: inc.initialRiskClassification || 'Medium',
          potentialRiskClassification: inc.potentialRiskClassification || 'High',
          status: inc.status || 'Reported',
          assignedRglId: inc.assignedRglId || null,
          assignedRpId: inc.assignedRpId || null,
          investigationDueDate: inc.investigationDueDate || '',
        }).onConflictDoNothing();
      }
    }

    console.log('[EHS DB] Initial seeding completed successfully.');
  } catch (error) {
    console.error('[EHS DB] Seeding error (non-fatal):', error);
  }
}

export async function seedPtwIfEmpty() {
  try {
    const existing = await db.select().from(schema.ptwPermits).limit(1);
    if (existing.length > 0) return;

    console.log('[EHS DB] Seeding initial PCL Permit-to-Work records...');
    const today = new Date().toISOString().split('T')[0];

    // Seed 1: Hot Work + Work at Height (Approved & Active)
    await db.insert(schema.ptwPermits).values({
      permitNumber: 'PTW-2026-000001',
      permitTypes: JSON.stringify(['Hot Work', 'Work at Height']),
      status: 'Approved',
      locationId: 1,
      specificLocation: 'Raw Mill #2 Cyclone Preheater Platform Level +32m',
      equipmentNumber: '411-FN-01 / Fan Ducting',
      departmentId: 2,
      contractorName: 'PCL Mechanical Maintenance Crew',
      leadManName: 'Tariq Mehmood',
      contactNumber: 'Ext 4211 / Radio Ch 3',
      workersCount: 4,
      workDescription: 'Cutting and welding reinforcement plates on fan discharge casing and replacing duct damper hinge pins at elevated platform.',
      issueDate: today,
      validFrom: `${today} 08:00`,
      validTo: `${today} 18:00`,
      jsaReference: 'JSA-PCL-2026-MECH-042',
      tbtConducted: true,
      tbtNotes: 'Toolbox talk conducted on 100% harness tie-off, hot work spark containment, and continuous fire watch.',
      emergencyArrangements: 'Nearest Muster Point #2, Safety Shower & Eyewash at +30m platform verified operable, Radio Channel 3.',
      checklists: JSON.stringify([
        { id: 'GEN-01', category: 'General Pre-Work Verification', label: 'Work area inspected and cleared of unnecessary personnel', status: 'Yes', notes: 'Area cordoned off' },
        { id: 'GEN-02', category: 'General Pre-Work Verification', label: 'Risk Assessment / JSA reviewed with crew', status: 'Yes', notes: 'JSA signed by crew' },
        { id: 'GEN-03', category: 'General Pre-Work Verification', label: 'Daily Tool Box Talk conducted', status: 'Yes', notes: '07:45 AM TBT' },
        { id: 'GEN-04', category: 'General Pre-Work Verification', label: 'Personnel competent & inducted', status: 'Yes', notes: 'Verified badges' },
        { id: 'GEN-05', category: 'General Pre-Work Verification', label: 'Mandatory standard PPE inspected & worn', status: 'Yes', notes: 'Harness + Face shields' },
        { id: 'HW-01', category: 'Hot Work', label: 'Dedicated Fire Watch appointed with air horn', status: 'Yes', notes: 'Fire watch: M. Asif' },
        { id: 'HW-02', category: 'Hot Work', label: 'Combustibles cleared within 10m', status: 'Yes', notes: 'Area washed down' },
        { id: 'HW-03', category: 'Hot Work', label: 'Fire tarpaulins / blankets rigged for sparks', status: 'Yes', notes: 'Heavy silicone blanket rigged' },
        { id: 'HW-04', category: 'Hot Work', label: 'Certified portable fire extinguishers adjacent', status: 'Yes', notes: '2x 6kg DCP, 1x CO2 on site' },
        { id: 'HW-05', category: 'Hot Work', label: 'Gas test for flammable vapors conducted (<1% LEL)', status: 'Yes', notes: '0% LEL verified' },
        { id: 'WAH-01', category: 'Work at Height', label: 'Full body harness with dual shock-absorbing lanyards', status: 'Yes', notes: 'Inspected 100% tie-off' },
        { id: 'WAH-02', category: 'Work at Height', label: 'Certified anchorage point verified overhead', status: 'Yes', notes: 'Rated beam trolley line' },
        { id: 'WAH-04', category: 'Work at Height', label: 'Working platform fully planked with toe-boards', status: 'Yes', notes: 'Green tagged scaffold' },
        { id: 'WAH-07', category: 'Work at Height', label: 'Ground drop zone barricaded below', status: 'Yes', notes: 'Red danger tape strung' },
      ]),
      additionalHazards: 'Falling sparks to lower conveyor level; elevated heat stress in tower.',
      additionalControls: 'Lower conveyor deck covered with fire blankets; rotation breaks every 45 mins with hydration.',
      isolations: JSON.stringify({
        electrical: { required: 'Yes', equipmentTag: 'MCC-411 / Breaker 08', lockNumber: 'LOTO-EL-104', isolatedBy: 'M. Imran (Elec)', verifiedBy: 'Tariq Mehmood', permitRef: 'ISO-2026-091' },
        mechanical: { required: 'Yes', equipmentTag: 'Damper Lock Pin', lockNumber: 'LOTO-ME-052', isolatedBy: 'S. Ahmed (Mech)', verifiedBy: 'Tariq Mehmood', permitRef: 'ISO-2026-092' },
        utilities: { required: 'N/A', equipmentTag: '', lockNumber: '', isolatedBy: '', verifiedBy: '', permitRef: '' },
        production: { required: 'N/A', equipmentTag: '', lockNumber: '', isolatedBy: '', verifiedBy: '', permitRef: '' },
      }),
      gasTesting: JSON.stringify({
        testedBy: 'A. Sattar (Certified Gas Tester)',
        testTime: '08:10 AM',
        oxygen: '20.9',
        lel: '0.0',
        co: '1',
        h2s: '0',
        result: 'Safe for Hot Work',
        notes: 'Combustible atmosphere test zero. Safe to ignite torch.',
      }),
      receiverName: 'Tariq Mehmood',
      receiverDesignation: 'Mechanical Maintenance Lead',
      receiverSignatureDate: new Date(),
      receiverAcknowledged: true,
      issuerName: 'Engr. Noman Bashir',
      issuerDesignation: 'Raw Mill Area Production Manager',
      issuerSignatureDate: new Date(),
      issuerRemarks: 'Approved. Maintain continuous spark blanket vigil. Fire watch must remain 45 mins post-welding.',
      ehsName: 'Corporate EHS Officer',
      ehsVerified: true,
      ehsRemarks: 'Safety inspection completed. All fall protection & firefighting equipment certified.',
    });

    // Seed 2: Confined Space Entry + Cold Work (Under Review)
    await db.insert(schema.ptwPermits).values({
      permitNumber: 'PTW-2026-000002',
      permitTypes: JSON.stringify(['Confined Space Entry', 'Cold Work']),
      status: 'Under Review',
      locationId: 2,
      specificLocation: 'Cement Silo #3 Bottom Extraction Cone Internal Chamber',
      equipmentNumber: '512-SL-03 / Extraction Chute',
      departmentId: 1,
      contractorName: 'Al-Hafeez Industrial Cleaning Services',
      leadManName: 'Rashid Ali',
      contactNumber: '0300-9876543 / Ch 4',
      workersCount: 3,
      workDescription: 'Internal descaling, buildup chipping, and inspection of aeration air-pad fabric liners inside the silo extraction cone chamber.',
      issueDate: today,
      validFrom: `${today} 09:00`,
      validTo: `${today} 17:00`,
      jsaReference: 'JSA-PCL-2026-CSE-019',
      tbtConducted: true,
      tbtNotes: 'Briefed on continuous forced ventilation, hole watch duties, man-count log, and lifeline hook-up.',
      emergencyArrangements: 'Tripod with rescue retrieval winch mounted at silo manhole; EEBD positioned outside.',
      checklists: JSON.stringify([
        { id: 'GEN-01', category: 'General Pre-Work Verification', label: 'Work area inspected and cleared of unnecessary personnel', status: 'Yes', notes: 'Manhole perimeter clear' },
        { id: 'GEN-02', category: 'General Pre-Work Verification', label: 'Risk Assessment / JSA reviewed with crew', status: 'Yes', notes: 'Crew briefed' },
        { id: 'CSE-01', category: 'Confined Space Entry', label: 'Atmospheric gas testing verified: O2, LEL, CO, H2S', status: 'Yes', notes: 'Continuous 4-gas meter active' },
        { id: 'CSE-02', category: 'Confined Space Entry', label: 'Standby Person / Hole Watch continuously stationed', status: 'Yes', notes: 'Standby: Zulfiqar Ali' },
        { id: 'CSE-03', category: 'Confined Space Entry', label: 'Forced mechanical ventilation air blower operating', status: 'Yes', notes: 'Air blower running 1500 CFM' },
        { id: 'CSE-04', category: 'Confined Space Entry', label: 'Entry & Exit Man-count log sheet mounted at manhole', status: 'Yes', notes: 'Log board posted' },
        { id: 'CSE-05', category: 'Confined Space Entry', label: 'Full-body recovery harness with lifeline attached to tripod', status: 'Yes', notes: 'Tested winch' },
        { id: 'CSE-07', category: 'Confined Space Entry', label: 'Zero energy positive isolation locked and blinded', status: 'Yes', notes: 'Upper feed slide gate locked' },
      ]),
      additionalHazards: 'Risk of cement dust accumulation, engulfed material collapse, oxygen depletion.',
      additionalControls: 'P100 dust respirators worn, lifeline tethered at all times, no entry under overhead hung material.',
      isolations: JSON.stringify({
        electrical: { required: 'Yes', equipmentTag: 'Feeder Motor 512-FD-03', lockNumber: 'LOTO-EL-215', isolatedBy: 'K. Mehmood', verifiedBy: 'Rashid Ali', permitRef: 'ISO-2026-110' },
        mechanical: { required: 'Yes', equipmentTag: 'Silo Top Slide Gate', lockNumber: 'LOTO-ME-118', isolatedBy: 'H. Raza', verifiedBy: 'Rashid Ali', permitRef: 'ISO-2026-111' },
        utilities: { required: 'Yes', equipmentTag: 'Pneumatic Fluidizing Air Line', lockNumber: 'LOTO-UT-044', isolatedBy: 'H. Raza', verifiedBy: 'Rashid Ali', permitRef: 'ISO-2026-112' },
        production: { required: 'Yes', equipmentTag: 'Feed Chute Locked', lockNumber: 'LOTO-PR-029', isolatedBy: 'H. Raza', verifiedBy: 'Rashid Ali', permitRef: 'ISO-2026-113' },
      }),
      gasTesting: JSON.stringify({
        testedBy: 'A. Sattar (Certified Gas Tester)',
        testTime: '08:30 AM',
        oxygen: '20.8',
        lel: '0.0',
        co: '0',
        h2s: '0',
        result: 'Safe to Enter',
        notes: 'Atmosphere safe. Continuous blower must remain energized throughout work.',
      }),
      receiverName: 'Rashid Ali',
      receiverDesignation: 'Contractor Safety Supervisor',
      receiverSignatureDate: new Date(),
      receiverAcknowledged: true,
      issuerName: 'Area Authority',
      issuerDesignation: 'Packing & Silos Section Head',
    });

    console.log('[EHS DB] Initial PTW records seeded successfully.');
  } catch (err) {
    console.error('[EHS DB] PTW seeding error (non-fatal):', err);
  }
}

