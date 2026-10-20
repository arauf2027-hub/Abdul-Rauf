import { Router } from 'express';
import { and, desc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { notifications, ptwExtensions, ptwPermits, users } from '../../db/schema.ts';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';
import { generateBusinessId } from '../../services/sequence.ts';
import { logAuditEvent } from '../../services/audit.ts';
import { generateChecklistForPermitTypes, DEFAULT_ISOLATIONS, DEFAULT_GAS_TESTING } from '../../config/ptwChecklists.ts';

const router = Router();

// GET /api/ptw - List permits with filters
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, permitType, departmentId, locationId, search } = req.query;

    const list = await db.query.ptwPermits.findMany({
      orderBy: [desc(ptwPermits.id)],
      with: {
        department: true,
        location: true,
        subLocation: true,
        receiver: true,
        issuer: true,
        extensions: {
          orderBy: [ptwExtensions.dayNumber],
        },
      },
    });

    // Parse JSON columns safely and apply in-memory filters
    let enriched = list.map((p) => {
      let parsedTypes: string[] = [];
      try {
        parsedTypes = JSON.parse(p.permitTypes || '[]');
      } catch {
        parsedTypes = [p.permitTypes];
      }

      let parsedChecklists = [];
      try {
        parsedChecklists = JSON.parse(p.checklists || '[]');
      } catch {
        parsedChecklists = [];
      }

      let parsedIsolations = DEFAULT_ISOLATIONS;
      try {
        parsedIsolations = JSON.parse(p.isolations || '{}');
      } catch {}

      let parsedGasTesting = DEFAULT_GAS_TESTING;
      try {
        parsedGasTesting = JSON.parse(p.gasTesting || '{}');
      } catch {}

      return {
        ...p,
        permitTypes: parsedTypes,
        checklists: parsedChecklists,
        isolations: parsedIsolations,
        gasTesting: parsedGasTesting,
      };
    });

    if (status && status !== 'all') {
      enriched = enriched.filter((p) => p.status.toLowerCase() === String(status).toLowerCase());
    }

    if (permitType && permitType !== 'all') {
      enriched = enriched.filter((p) => p.permitTypes.includes(String(permitType) as any));
    }

    if (departmentId && departmentId !== 'all') {
      enriched = enriched.filter((p) => p.departmentId === Number(departmentId));
    }

    if (locationId && locationId !== 'all') {
      enriched = enriched.filter((p) => p.locationId === Number(locationId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter(
        (p) =>
          p.permitNumber.toLowerCase().includes(q) ||
          p.specificLocation.toLowerCase().includes(q) ||
          p.workDescription.toLowerCase().includes(q) ||
          p.leadManName.toLowerCase().includes(q) ||
          p.contractorName.toLowerCase().includes(q) ||
          (p.equipmentNumber && p.equipmentNumber.toLowerCase().includes(q))
      );
    }

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching PTW list:', error);
    res.status(500).json({ error: 'Failed to retrieve permits' });
  }
});

// GET /api/ptw/analytics/summary - KPI Dashboard Metrics
router.get('/analytics/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const all = await db.select().from(ptwPermits);
    const todayStr = new Date().toISOString().split('T')[0];

    let total = all.length;
    let draft = 0;
    let underReview = 0;
    let approved = 0;
    let suspended = 0;
    let extended = 0;
    let workCompleted = 0;
    let closed = 0;
    let highRiskCount = 0;
    let expiringToday = 0;

    for (const p of all) {
      if (p.status === 'Draft') draft++;
      else if (p.status === 'Under Review') underReview++;
      else if (p.status === 'Approved') approved++;
      else if (p.status === 'Suspended') suspended++;
      else if (p.status === 'Extended') extended++;
      else if (p.status === 'Work Completed') workCompleted++;
      else if (p.status === 'Closed') closed++;

      // Active = Approved or Extended
      if (p.status === 'Approved' || p.status === 'Extended') {
        if (p.validTo && p.validTo.startsWith(todayStr)) {
          expiringToday++;
        }
      }

      try {
        const types: string[] = JSON.parse(p.permitTypes || '[]');
        if (
          types.includes('Hot Work') ||
          types.includes('Confined Space Entry') ||
          types.includes('Work at Height')
        ) {
          highRiskCount++;
        }
      } catch {}
    }

    res.json({
      total,
      draft,
      underReview,
      approved,
      suspended,
      extended,
      workCompleted,
      closed,
      active: approved + extended,
      expiringToday,
      highRiskCount,
    });
  } catch (error) {
    console.error('Error fetching PTW summary metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve PTW summary metrics' });
  }
});

// GET /api/ptw/:id - Full details for a single permit
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));

    const permit = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
      with: {
        department: true,
        location: true,
        subLocation: true,
        receiver: true,
        issuer: true,
        extensions: {
          orderBy: [ptwExtensions.dayNumber],
        },
      },
    });

    if (!permit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    let parsedTypes: string[] = [];
    try {
      parsedTypes = JSON.parse(permit.permitTypes || '[]');
    } catch {
      parsedTypes = [permit.permitTypes];
    }

    let parsedChecklists = [];
    try {
      parsedChecklists = JSON.parse(permit.checklists || '[]');
    } catch {}

    let parsedIsolations = DEFAULT_ISOLATIONS;
    try {
      parsedIsolations = JSON.parse(permit.isolations || '{}');
    } catch {}

    let parsedGasTesting = DEFAULT_GAS_TESTING;
    try {
      parsedGasTesting = JSON.parse(permit.gasTesting || '{}');
    } catch {}

    res.json({
      ...permit,
      permitTypes: parsedTypes,
      checklists: parsedChecklists,
      isolations: parsedIsolations,
      gasTesting: parsedGasTesting,
    });
  } catch (error) {
    console.error('Error fetching permit details:', error);
    res.status(500).json({ error: 'Failed to retrieve permit details' });
  }
});

// POST /api/ptw - Create a new PTW (Draft or Submitted)
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const body = req.body;

    if (
      !body.permitTypes ||
      !Array.isArray(body.permitTypes) ||
      body.permitTypes.length === 0 ||
      !body.locationId ||
      !body.departmentId ||
      !body.specificLocation ||
      !body.workDescription ||
      !body.leadManName ||
      !body.contactNumber
    ) {
      return res.status(400).json({
        error:
          'Mandatory fields missing (At least 1 Permit Type, Plant Area/Location, Department, Work Location, Scope, Lead Man, Contact).',
      });
    }

    const permitNumber = await generateBusinessId('PTW', 'ptw_permits', 'permit_number');
    const today = new Date().toISOString().split('T')[0];

    // Build dynamic checklist based on chosen types
    const checklists = generateChecklistForPermitTypes(body.permitTypes, body.checklists);

    const initialStatus = body.status === 'Under Review' ? 'Under Review' : 'Draft';

    const [newPermit] = await db
      .insert(ptwPermits)
      .values({
        permitNumber,
        permitTypes: JSON.stringify(body.permitTypes),
        status: initialStatus,
        locationId: Number(body.locationId),
        subLocationId: body.subLocationId ? Number(body.subLocationId) : null,
        specificLocation: body.specificLocation,
        equipmentNumber: body.equipmentNumber || '',
        departmentId: Number(body.departmentId),
        contractorName: body.contractorName || '',
        leadManName: body.leadManName,
        contactNumber: body.contactNumber,
        workersCount: Number(body.workersCount) || 1,
        workDescription: body.workDescription,
        issueDate: body.issueDate || today,
        validFrom: body.validFrom || `${today} 08:00`,
        validTo: body.validTo || `${today} 18:00`,
        jsaReference: body.jsaReference || '',
        tbtConducted: Boolean(body.tbtConducted),
        tbtNotes: body.tbtNotes || '',
        emergencyArrangements: body.emergencyArrangements || 'Nearest Muster Point & First Aid Post verified.',
        checklists: JSON.stringify(checklists),
        additionalHazards: body.additionalHazards || '',
        additionalControls: body.additionalControls || '',
        isolations: JSON.stringify(body.isolations || DEFAULT_ISOLATIONS),
        gasTesting: JSON.stringify(body.gasTesting || DEFAULT_GAS_TESTING),
        receiverUserId: user.id,
        receiverName: body.receiverName || user.fullName,
        receiverDesignation: body.receiverDesignation || user.jobTitle || 'Performing Authority',
        receiverSignatureDate: new Date(),
        receiverAcknowledged: true,
      })
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: permitNumber,
      comments: `New PTW ${permitNumber} created with types: ${body.permitTypes.join(', ')} in status ${initialStatus}`,
    });

    // Notify Area Authorities / EHS if submitted
    if (initialStatus === 'Under Review') {
      const authUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.role, 'admin'), eq(users.role, 'rgl'), eq(users.role, 'ehs_manager')));

      for (const u of authUsers) {
        await db.insert(notifications).values({
          userId: u.id,
          title: `PTW Submitted for Review: ${permitNumber}`,
          message: `${user.fullName} submitted ${body.permitTypes.join(', ')} permit at ${body.specificLocation} for approval.`,
          recordType: 'ptw_permit',
          recordId: permitNumber,
          isRead: false,
        });
      }
    }

    res.status(201).json(newPermit);
  } catch (error) {
    console.error('Error creating PTW:', error);
    res.status(500).json({ error: 'Failed to create permit' });
  }
});

// PUT /api/ptw/:id - Update permit content & checklists
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const body = req.body;

    // If permit types changed, regenerate dynamic checklists while preserving current answers
    let updatedTypes = body.permitTypes;
    if (typeof updatedTypes === 'string') {
      try {
        updatedTypes = JSON.parse(updatedTypes);
      } catch {
        updatedTypes = [updatedTypes];
      }
    }
    const currentTypes = updatedTypes || JSON.parse(existing.permitTypes || '[]');
    const dynamicChecklists = generateChecklistForPermitTypes(
      currentTypes,
      body.checklists !== undefined ? body.checklists : JSON.parse(existing.checklists || '[]')
    );

    const [updated] = await db
      .update(ptwPermits)
      .set({
        permitTypes: JSON.stringify(currentTypes),
        locationId: body.locationId !== undefined ? Number(body.locationId) : existing.locationId,
        subLocationId: body.subLocationId !== undefined ? Number(body.subLocationId) : existing.subLocationId,
        specificLocation: body.specificLocation !== undefined ? body.specificLocation : existing.specificLocation,
        equipmentNumber: body.equipmentNumber !== undefined ? body.equipmentNumber : existing.equipmentNumber,
        departmentId: body.departmentId !== undefined ? Number(body.departmentId) : existing.departmentId,
        contractorName: body.contractorName !== undefined ? body.contractorName : existing.contractorName,
        leadManName: body.leadManName !== undefined ? body.leadManName : existing.leadManName,
        contactNumber: body.contactNumber !== undefined ? body.contactNumber : existing.contactNumber,
        workersCount: body.workersCount !== undefined ? Number(body.workersCount) : existing.workersCount,
        workDescription: body.workDescription !== undefined ? body.workDescription : existing.workDescription,
        issueDate: body.issueDate !== undefined ? body.issueDate : existing.issueDate,
        validFrom: body.validFrom !== undefined ? body.validFrom : existing.validFrom,
        validTo: body.validTo !== undefined ? body.validTo : existing.validTo,
        jsaReference: body.jsaReference !== undefined ? body.jsaReference : existing.jsaReference,
        tbtConducted: body.tbtConducted !== undefined ? Boolean(body.tbtConducted) : existing.tbtConducted,
        tbtNotes: body.tbtNotes !== undefined ? body.tbtNotes : existing.tbtNotes,
        emergencyArrangements: body.emergencyArrangements !== undefined ? body.emergencyArrangements : existing.emergencyArrangements,
        checklists: JSON.stringify(dynamicChecklists),
        additionalHazards: body.additionalHazards !== undefined ? body.additionalHazards : existing.additionalHazards,
        additionalControls: body.additionalControls !== undefined ? body.additionalControls : existing.additionalControls,
        isolations: body.isolations !== undefined ? JSON.stringify(body.isolations) : existing.isolations,
        gasTesting: body.gasTesting !== undefined ? JSON.stringify(body.gasTesting) : existing.gasTesting,
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} updated by ${user.fullName}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating PTW:', error);
    res.status(500).json({ error: 'Failed to update permit' });
  }
});

// POST /api/ptw/:id/submit - Submit Draft to Under Review
router.post('/:id/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const [updated] = await db
      .update(ptwPermits)
      .set({
        status: 'Under Review',
        receiverAcknowledged: true,
        receiverSignatureDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'SUBMIT',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} submitted for Area Authority review`,
    });

    res.json({ success: true, permit: updated });
  } catch (error) {
    console.error('Error submitting PTW:', error);
    res.status(500).json({ error: 'Failed to submit permit' });
  }
});

// POST /api/ptw/:id/approve - Area Authority / Issuer Approval
router.post('/:id/approve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));
    const { issuerRemarks, ehsVerified, ehsRemarks } = req.body;

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const [updated] = await db
      .update(ptwPermits)
      .set({
        status: 'Approved',
        issuerUserId: user.id,
        issuerName: user.fullName,
        issuerDesignation: user.jobTitle || 'Authorized Area Authority',
        issuerSignatureDate: new Date(),
        issuerRemarks: issuerRemarks || 'Approved. Adhere strictly to site safety controls & PPE.',
        ehsUserId: ehsVerified ? user.id : existing.ehsUserId,
        ehsName: ehsVerified ? user.fullName : existing.ehsName,
        ehsVerified: ehsVerified !== undefined ? Boolean(ehsVerified) : existing.ehsVerified,
        ehsRemarks: ehsRemarks || existing.ehsRemarks,
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'APPROVE',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} authorized & approved by ${user.fullName}`,
    });

    if (existing.receiverUserId) {
      await db.insert(notifications).values({
        userId: existing.receiverUserId,
        title: `PTW Approved & Active: ${existing.permitNumber}`,
        message: `Your permit for "${existing.workDescription}" has been authorized and is now Active.`,
        recordType: 'ptw_permit',
        recordId: existing.permitNumber,
        isRead: false,
      });
    }

    res.json({ success: true, permit: updated });
  } catch (error) {
    console.error('Error approving PTW:', error);
    res.status(500).json({ error: 'Failed to approve permit' });
  }
});

// POST /api/ptw/:id/suspend - Temporarily Halt Work
router.post('/:id/suspend', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Mandatory suspension reason is required.' });
    }

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const [updated] = await db
      .update(ptwPermits)
      .set({
        status: 'Suspended',
        closureRemarks: `SUSPENDED: ${reason.trim()}`,
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'SUSPEND',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} suspended by ${user.fullName}. Reason: ${reason}`,
    });

    res.json({ success: true, permit: updated });
  } catch (error) {
    console.error('Error suspending PTW:', error);
    res.status(500).json({ error: 'Failed to suspend permit' });
  }
});

// POST /api/ptw/:id/reactivate - Resume Suspended Work
router.post('/:id/reactivate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const [updated] = await db
      .update(ptwPermits)
      .set({
        status: 'Approved',
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'REACTIVATE',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} reactivated to Approved by ${user.fullName}`,
    });

    res.json({ success: true, permit: updated });
  } catch (error) {
    console.error('Error reactivating PTW:', error);
    res.status(500).json({ error: 'Failed to reactivate permit' });
  }
});

// POST /api/ptw/:id/extend - Multi-Day Revalidation (Day 2 to Day 7)
router.post('/:id/extend', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));
    const { dayNumber, extensionDate, startTime, endTime, siteReinspected, gasTestVerified, receiverName, issuerName, remarks } = req.body;

    if (!dayNumber || Number(dayNumber) < 2 || Number(dayNumber) > 7) {
      return res.status(400).json({ error: 'Valid extension day number (Day 2 to Day 7) is required.' });
    }

    if (!extensionDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Extension Date, Start Time, and End Time are required.' });
    }

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
      with: { extensions: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    // Insert extension log
    const [ext] = await db
      .insert(ptwExtensions)
      .values({
        permitId: existing.id,
        dayNumber: Number(dayNumber),
        extensionDate,
        startTime,
        endTime,
        siteReinspected: Boolean(siteReinspected),
        gasTestVerified: gasTestVerified || 'N/A',
        receiverName: receiverName || user.fullName,
        issuerName: issuerName || 'Authorized Issuer',
        status: 'Approved',
        remarks: remarks || '',
      })
      .returning();

    // Update permit status to Extended and update validity end time
    await db
      .update(ptwPermits)
      .set({
        status: 'Extended',
        validTo: `${extensionDate} ${endTime}`,
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EXTEND',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} extended for Day ${dayNumber} (${extensionDate} ${startTime}-${endTime})`,
    });

    res.json({ success: true, extension: ext });
  } catch (error) {
    console.error('Error extending PTW:', error);
    res.status(500).json({ error: 'Failed to record permit extension' });
  }
});

// POST /api/ptw/:id/complete - Performing Authority Work Completion Handover
router.post('/:id/complete', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));
    const { completionStatus, housekeepingDone, toolsPersonnelRemoved, comments } = req.body;

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const [updated] = await db
      .update(ptwPermits)
      .set({
        status: 'Work Completed',
        completionStatus: completionStatus || 'Completed',
        housekeepingDone: Boolean(housekeepingDone),
        toolsPersonnelRemoved: Boolean(toolsPersonnelRemoved),
        handbackDate: new Date(),
        closureRemarks: comments || 'Work completed on site, housekeeping done, all tools removed.',
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'COMPLETE',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Work completed on permit ${existing.permitNumber} by ${user.fullName}`,
    });

    res.json({ success: true, permit: updated });
  } catch (error) {
    console.error('Error completing PTW:', error);
    res.status(500).json({ error: 'Failed to mark permit completed' });
  }
});

// POST /api/ptw/:id/close - Final De-isolation & Operations Hand-back Closure
router.post('/:id/close', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));
    const { deIsolationElectrical, deIsolationMechanical, deIsolationUtilities, ccrNotified, ccrOperatorName, closureRemarks } = req.body;

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const [updated] = await db
      .update(ptwPermits)
      .set({
        status: 'Closed',
        deIsolationElectrical: deIsolationElectrical || 'N/A',
        deIsolationMechanical: deIsolationMechanical || 'N/A',
        deIsolationUtilities: deIsolationUtilities || 'N/A',
        ccrNotified: Boolean(ccrNotified),
        ccrOperatorName: ccrOperatorName || '',
        closedByUserId: user.id,
        closureDate: new Date(),
        closureRemarks: closureRemarks || 'De-isolation verified and accepted. Plant area normalized and handed back to Operations/CCR.',
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CLOSE',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} de-isolated and closed by ${user.fullName}`,
    });

    res.json({ success: true, permit: updated });
  } catch (error) {
    console.error('Error closing PTW:', error);
    res.status(500).json({ error: 'Failed to close permit' });
  }
});

// POST /api/ptw/:id/cancel - Cancellation / Revocation
router.post('/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Mandatory cancellation reason is required.' });
    }

    const existing = await db.query.ptwPermits.findFirst({
      where: isNum ? eq(ptwPermits.id, Number(idParam)) : eq(ptwPermits.permitNumber, idParam),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    const [updated] = await db
      .update(ptwPermits)
      .set({
        status: 'Cancelled',
        cancellationReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(ptwPermits.id, existing.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CANCEL',
      module: 'Permit-to-Work',
      recordType: 'ptw_permit',
      recordId: existing.permitNumber,
      comments: `Permit ${existing.permitNumber} cancelled by ${user.fullName}. Reason: ${reason}`,
    });

    res.json({ success: true, permit: updated });
  } catch (error) {
    console.error('Error cancelling PTW:', error);
    res.status(500).json({ error: 'Failed to cancel permit' });
  }
});

export default router;
