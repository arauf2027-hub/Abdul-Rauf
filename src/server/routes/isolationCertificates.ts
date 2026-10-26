import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { electricalIsolationCertificates, ptwPermits } from '../../db/schema.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';
import { generateBusinessId } from '../../services/sequence.ts';
import { logAuditEvent } from '../../services/audit.ts';

const router = Router();

function getAuthUser(req: AuthRequest) {
  if (req.dbUser) return req.dbUser;
  if (req.user) {
    return {
      id: 1,
      email: req.user.email || 'system@powercement.com.pk',
      fullName: (req.user as any).name || 'Authorized User',
      role: (req.user as any).role || 'Officer',
      jobTitle: 'Authorized Officer',
    };
  }
  return null;
}

// GET /api/isolation-certificates/summary - Metric counts
router.get('/summary', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const list = await db.query.electricalIsolationCertificates.findMany();

    let total = list.length;
    let draft = 0;
    let submitted = 0;
    let approved = 0;
    let isolationConfirmed = 0;
    let workInProgress = 0;
    let workCompleted = 0;
    let deIsolated = 0;
    let cancelled = 0;

    for (const c of list) {
      if (c.status === 'Draft') draft++;
      else if (c.status === 'Submitted for Approval') submitted++;
      else if (c.status === 'Approved') approved++;
      else if (c.status === 'Isolation Confirmed') isolationConfirmed++;
      else if (c.status === 'Work in Progress') workInProgress++;
      else if (c.status === 'Work Completed') workCompleted++;
      else if (c.status === 'De-isolation Confirmed') deIsolated++;
      else if (c.status === 'Cancelled') cancelled++;
    }

    res.json({
      total,
      draft,
      submitted,
      approved,
      isolationConfirmed,
      workInProgress,
      workCompleted,
      deIsolated,
      cancelled,
      active: approved + isolationConfirmed + workInProgress,
    });
  } catch (error) {
    console.error('Error fetching EIC summary:', error);
    res.status(500).json({ error: 'Failed to retrieve isolation certificate metrics' });
  }
});

// GET /api/isolation-certificates - List certificates with filters and search
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, locationId, departmentId, search } = req.query;

    const list = await db.query.electricalIsolationCertificates.findMany({
      orderBy: [desc(electricalIsolationCertificates.id)],
      with: {
        location: true,
        department: true,
        createdBy: true,
        ptw: true,
      },
    });

    let enriched = list.map((item) => {
      let parsedElectricalPoints: any[] = [];
      try {
        parsedElectricalPoints = JSON.parse(item.electricalPoints || '[]');
      } catch {}

      let parsedOtherPoints: any[] = [];
      try {
        parsedOtherPoints = JSON.parse(item.otherPoints || '[]');
      } catch {}

      return {
        ...item,
        electricalPoints: parsedElectricalPoints,
        otherPoints: parsedOtherPoints,
      };
    });

    if (status && status !== 'all') {
      enriched = enriched.filter((i) => i.status.toLowerCase() === String(status).toLowerCase());
    }

    if (locationId && locationId !== 'all') {
      enriched = enriched.filter((i) => i.locationId === Number(locationId));
    }

    if (departmentId && departmentId !== 'all') {
      enriched = enriched.filter((i) => i.departmentId === Number(departmentId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter(
        (i) =>
          i.certificateNumber.toLowerCase().includes(q) ||
          i.workLocation.toLowerCase().includes(q) ||
          i.equipmentToIsolate.toLowerCase().includes(q) ||
          (i.equipmentTag && i.equipmentTag.toLowerCase().includes(q)) ||
          (i.ptwNumber && i.ptwNumber.toLowerCase().includes(q)) ||
          i.requestorName.toLowerCase().includes(q)
      );
    }

    res.json(enriched);
  } catch (error) {
    console.error('Error retrieving isolation certificates:', error);
    res.status(500).json({ error: 'Failed to retrieve isolation certificates' });
  }
});

// GET /api/isolation-certificates/:id - Details
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const idParam = req.params.id;
    const isNum = !isNaN(Number(idParam));

    const item = await db.query.electricalIsolationCertificates.findFirst({
      where: isNum
        ? eq(electricalIsolationCertificates.id, Number(idParam))
        : eq(electricalIsolationCertificates.certificateNumber, idParam),
      with: {
        location: true,
        department: true,
        createdBy: true,
        ptw: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Electrical Isolation Certificate not found' });
    }

    let parsedElectricalPoints: any[] = [];
    try {
      parsedElectricalPoints = JSON.parse(item.electricalPoints || '[]');
    } catch {}

    let parsedOtherPoints: any[] = [];
    try {
      parsedOtherPoints = JSON.parse(item.otherPoints || '[]');
    } catch {}

    res.json({
      ...item,
      electricalPoints: parsedElectricalPoints,
      otherPoints: parsedOtherPoints,
    });
  } catch (error) {
    console.error('Error retrieving certificate details:', error);
    res.status(500).json({ error: 'Failed to retrieve certificate details' });
  }
});

// POST /api/isolation-certificates - Create new certificate
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const body = req.body || {};

    // Validate essential work details
    if (!body.workLocation?.trim() || !body.equipmentToIsolate?.trim() || !body.workDescription?.trim() || !body.requestorName?.trim()) {
      return res.status(400).json({
        error: 'Essential details missing: Work Location, Equipment to be Isolated, Work Description, and Requestor Name are required.',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const certificateNumber = await generateBusinessId('EIC', 'electrical_isolation_certificates', 'certificate_number');

    // Default 5 electrical rows if none provided
    const defaultElectricalPoints = [
      { id: '1', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
      { id: '2', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
      { id: '3', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
      { id: '4', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
      { id: '5', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
    ];

    // Default 3 other rows if none provided
    const defaultOtherPoints = [
      { id: '1', controlMechanism: '', location: '', inletOutletDrain: '', blanked: '', valves: '', padlockNo: '', taggedOut: '' },
      { id: '2', controlMechanism: '', location: '', inletOutletDrain: '', blanked: '', valves: '', padlockNo: '', taggedOut: '' },
      { id: '3', controlMechanism: '', location: '', inletOutletDrain: '', blanked: '', valves: '', padlockNo: '', taggedOut: '' },
    ];

    const electricalPoints = Array.isArray(body.electricalPoints) && body.electricalPoints.length > 0
      ? body.electricalPoints
      : defaultElectricalPoints;

    const otherPoints = Array.isArray(body.otherPoints) && body.otherPoints.length > 0
      ? body.otherPoints
      : defaultOtherPoints;

    const initialStatus = body.status === 'Submitted for Approval' ? 'Submitted for Approval' : 'Draft';

    const [newCert] = await db
      .insert(electricalIsolationCertificates)
      .values({
        certificateNumber,
        ptwId: body.ptwId ? Number(body.ptwId) : null,
        ptwNumber: body.ptwNumber || '',
        status: initialStatus,
        locationId: body.locationId ? Number(body.locationId) : null,
        departmentId: body.departmentId ? Number(body.departmentId) : null,
        workLocation: body.workLocation.trim(),
        requestDate: body.requestDate || today,
        requestTime: body.requestTime || nowTime,
        equipmentToIsolate: body.equipmentToIsolate.trim(),
        equipmentTag: body.equipmentTag || '',
        workDescription: body.workDescription.trim(),
        requestorName: body.requestorName.trim(),
        requestorDesignation: body.requestorDesignation || user.jobTitle || 'Requestor',
        requestorSignature: body.requestorSignature || body.requestorName.trim(),
        requestorSignatureDate: new Date(),
        approvedByName: body.approvedByName || '',
        approvedByDesignation: body.approvedByDesignation || '',
        approvedBySignature: body.approvedBySignature || '',
        approvedByDate: body.approvedByDate ? new Date(body.approvedByDate) : null,
        fusesRemoved: Boolean(body.fusesRemoved),
        mainSwitchedOff: Boolean(body.mainSwitchedOff),
        rackedOut: Boolean(body.rackedOut),
        padlocksFitted: Boolean(body.padlocksFitted),
        tagsFitted: Boolean(body.tagsFitted),
        electricalPoints: JSON.stringify(electricalPoints),
        electricalCompetentName: body.electricalCompetentName || '',
        electricalCompetentDesignation: body.electricalCompetentDesignation || '',
        electricalCompetentSignature: body.electricalCompetentSignature || '',
        electricalOperatorSignature: body.electricalOperatorSignature || '',
        electricalIsolationDate: body.electricalIsolationDate ? new Date(body.electricalIsolationDate) : null,
        otherPoints: JSON.stringify(otherPoints),
        otherCompetentName: body.otherCompetentName || '',
        otherCompetentDesignation: body.otherCompetentDesignation || '',
        otherCompetentSignature: body.otherCompetentSignature || '',
        otherIsolationDate: body.otherIsolationDate || '',
        otherIsolationTime: body.otherIsolationTime || '',
        createdById: user.id,
      })
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'CREATE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: certificateNumber,
      comments: `Created Electrical Isolation Certificate ${certificateNumber} for ${newCert.equipmentToIsolate}`,
    });

    res.status(201).json(newCert);
  } catch (error) {
    console.error('Error creating isolation certificate:', error);
    res.status(500).json({ error: 'Failed to create electrical isolation certificate' });
  }
});

// PUT /api/isolation-certificates/:id - Update certificate details
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (existing.status === 'Cancelled' || existing.status === 'De-isolation Confirmed') {
      return res.status(400).json({ error: `Cannot modify certificate in status "${existing.status}"` });
    }

    const body = req.body || {};

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        ptwId: body.ptwId !== undefined ? (body.ptwId ? Number(body.ptwId) : null) : existing.ptwId,
        ptwNumber: body.ptwNumber !== undefined ? body.ptwNumber : existing.ptwNumber,
        locationId: body.locationId !== undefined ? (body.locationId ? Number(body.locationId) : null) : existing.locationId,
        departmentId: body.departmentId !== undefined ? (body.departmentId ? Number(body.departmentId) : null) : existing.departmentId,
        workLocation: body.workLocation !== undefined ? body.workLocation : existing.workLocation,
        requestDate: body.requestDate !== undefined ? body.requestDate : existing.requestDate,
        requestTime: body.requestTime !== undefined ? body.requestTime : existing.requestTime,
        equipmentToIsolate: body.equipmentToIsolate !== undefined ? body.equipmentToIsolate : existing.equipmentToIsolate,
        equipmentTag: body.equipmentTag !== undefined ? body.equipmentTag : existing.equipmentTag,
        workDescription: body.workDescription !== undefined ? body.workDescription : existing.workDescription,
        requestorName: body.requestorName !== undefined ? body.requestorName : existing.requestorName,
        requestorDesignation: body.requestorDesignation !== undefined ? body.requestorDesignation : existing.requestorDesignation,
        approvedByName: body.approvedByName !== undefined ? body.approvedByName : existing.approvedByName,
        approvedByDesignation: body.approvedByDesignation !== undefined ? body.approvedByDesignation : existing.approvedByDesignation,
        fusesRemoved: body.fusesRemoved !== undefined ? Boolean(body.fusesRemoved) : existing.fusesRemoved,
        mainSwitchedOff: body.mainSwitchedOff !== undefined ? Boolean(body.mainSwitchedOff) : existing.mainSwitchedOff,
        rackedOut: body.rackedOut !== undefined ? Boolean(body.rackedOut) : existing.rackedOut,
        padlocksFitted: body.padlocksFitted !== undefined ? Boolean(body.padlocksFitted) : existing.padlocksFitted,
        tagsFitted: body.tagsFitted !== undefined ? Boolean(body.tagsFitted) : existing.tagsFitted,
        electricalPoints: body.electricalPoints !== undefined ? JSON.stringify(body.electricalPoints) : existing.electricalPoints,
        electricalCompetentName: body.electricalCompetentName !== undefined ? body.electricalCompetentName : existing.electricalCompetentName,
        electricalCompetentDesignation: body.electricalCompetentDesignation !== undefined ? body.electricalCompetentDesignation : existing.electricalCompetentDesignation,
        electricalCompetentSignature: body.electricalCompetentSignature !== undefined ? body.electricalCompetentSignature : existing.electricalCompetentSignature,
        electricalOperatorSignature: body.electricalOperatorSignature !== undefined ? body.electricalOperatorSignature : existing.electricalOperatorSignature,
        otherPoints: body.otherPoints !== undefined ? JSON.stringify(body.otherPoints) : existing.otherPoints,
        otherCompetentName: body.otherCompetentName !== undefined ? body.otherCompetentName : existing.otherCompetentName,
        otherCompetentDesignation: body.otherCompetentDesignation !== undefined ? body.otherCompetentDesignation : existing.otherCompetentDesignation,
        otherCompetentSignature: body.otherCompetentSignature !== undefined ? body.otherCompetentSignature : existing.otherCompetentSignature,
        otherIsolationDate: body.otherIsolationDate !== undefined ? body.otherIsolationDate : existing.otherIsolationDate,
        otherIsolationTime: body.otherIsolationTime !== undefined ? body.otherIsolationTime : existing.otherIsolationTime,
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'UPDATE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Updated details for Certificate ${existing.certificateNumber}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: 'Failed to update electrical isolation certificate' });
  }
});

// POST /api/isolation-certificates/:id/submit - Submit for approval
router.post('/:id/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) return res.status(404).json({ error: 'Certificate not found' });
    if (existing.status !== 'Draft') {
      return res.status(400).json({ error: `Cannot submit certificate currently in "${existing.status}"` });
    }

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        status: 'Submitted for Approval',
        requestorSignature: existing.requestorSignature || user.fullName,
        requestorSignatureDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'UPDATE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Submitted Certificate ${existing.certificateNumber} for authorization`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error submitting certificate:', error);
    res.status(500).json({ error: 'Failed to submit certificate for approval' });
  }
});

// POST /api/isolation-certificates/:id/approve - Requisition Approval (Section 2.2)
router.post('/:id/approve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const { approvedByName, approvedByDesignation, approvedBySignature } = req.body;

    if (!approvedByName?.trim()) {
      return res.status(400).json({ error: 'Approver Name is mandatory for certificate authorization.' });
    }

    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) return res.status(404).json({ error: 'Certificate not found' });
    if (existing.status !== 'Submitted for Approval' && existing.status !== 'Draft') {
      return res.status(400).json({ error: `Cannot approve certificate in status "${existing.status}"` });
    }

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        status: 'Approved',
        approvedByName: approvedByName.trim(),
        approvedByDesignation: approvedByDesignation?.trim() || user.jobTitle || 'Authorized Approver',
        approvedBySignature: approvedBySignature?.trim() || approvedByName.trim(),
        approvedByDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'APPROVE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Approved Isolation Requisition for ${existing.certificateNumber} by ${approvedByName}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error approving certificate requisition:', error);
    res.status(500).json({ error: 'Failed to approve certificate requisition' });
  }
});

// POST /api/isolation-certificates/:id/confirm-isolation - Isolation Execution (Sections 3.0 & 4.0)
router.post('/:id/confirm-isolation', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const body = req.body || {};

    if (!body.electricalCompetentName?.trim()) {
      return res.status(400).json({
        error: 'Confirmation by Competent Person (Section 3.3) requires Name of Competent Person.',
      });
    }

    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) return res.status(404).json({ error: 'Certificate not found' });
    if (existing.status !== 'Approved') {
      return res.status(400).json({
        error: `Certificate must be in "Approved" status before confirming physical isolation (current: ${existing.status})`,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        status: 'Isolation Confirmed',
        fusesRemoved: Boolean(body.fusesRemoved),
        mainSwitchedOff: Boolean(body.mainSwitchedOff),
        rackedOut: Boolean(body.rackedOut),
        padlocksFitted: Boolean(body.padlocksFitted),
        tagsFitted: Boolean(body.tagsFitted),
        electricalPoints: body.electricalPoints ? JSON.stringify(body.electricalPoints) : existing.electricalPoints,
        electricalCompetentName: body.electricalCompetentName.trim(),
        electricalCompetentDesignation: body.electricalCompetentDesignation || 'Competent Electrical Person',
        electricalCompetentSignature: body.electricalCompetentSignature || body.electricalCompetentName.trim(),
        electricalOperatorSignature: body.electricalOperatorSignature || 'Operator Acknowledged',
        electricalIsolationDate: new Date(),
        otherPoints: body.otherPoints ? JSON.stringify(body.otherPoints) : existing.otherPoints,
        otherCompetentName: body.otherCompetentName || '',
        otherCompetentDesignation: body.otherCompetentDesignation || '',
        otherCompetentSignature: body.otherCompetentSignature || '',
        otherIsolationDate: body.otherIsolationDate || today,
        otherIsolationTime: body.otherIsolationTime || nowTime,
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'UPDATE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Isolation Confirmed for ${existing.certificateNumber} by ${body.electricalCompetentName}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error confirming isolation:', error);
    res.status(500).json({ error: 'Failed to record isolation confirmation' });
  }
});

// POST /api/isolation-certificates/:id/start-work - Transition to Work in Progress
router.post('/:id/start-work', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) return res.status(404).json({ error: 'Certificate not found' });
    if (existing.status !== 'Isolation Confirmed') {
      return res.status(400).json({
        error: `Isolation must be confirmed prior to commencing work (current: ${existing.status})`,
      });
    }

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        status: 'Work in Progress',
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'UPDATE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Work commenced on isolated equipment for ${existing.certificateNumber}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error starting work:', error);
    res.status(500).json({ error: 'Failed to update work status' });
  }
});

// POST /api/isolation-certificates/:id/complete-work - Work Completion Declaration (Section 5.0)
router.post('/:id/complete-work', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const { workCompletionPerson, workCompletionSignature, workCompletionDate, workCompletionTime, completionApprovedByName, completionApprovedByDesignation, completionApprovedBySignature } = req.body;

    if (!workCompletionPerson?.trim()) {
      return res.status(400).json({
        error: 'Work Completion Declaration (Section 5.1) requires Person in Charge of Work.',
      });
    }

    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) return res.status(404).json({ error: 'Certificate not found' });
    if (existing.status !== 'Work in Progress' && existing.status !== 'Isolation Confirmed') {
      return res.status(400).json({
        error: `Cannot complete work for certificate in status "${existing.status}"`,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        status: 'Work Completed',
        workCompletionPerson: workCompletionPerson.trim(),
        workCompletionSignature: workCompletionSignature?.trim() || workCompletionPerson.trim(),
        workCompletionDate: workCompletionDate || today,
        workCompletionTime: workCompletionTime || nowTime,
        completionApprovedByName: completionApprovedByName?.trim() || '',
        completionApprovedByDesignation: completionApprovedByDesignation?.trim() || '',
        completionApprovedBySignature: completionApprovedBySignature?.trim() || '',
        completionApprovedByDate: completionApprovedByName ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'UPDATE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Work Completion recorded for ${existing.certificateNumber} by ${workCompletionPerson} (Note: System remains isolated until de-isolation confirmed)`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error completing work:', error);
    res.status(500).json({ error: 'Failed to record work completion' });
  }
});

// POST /api/isolation-certificates/:id/confirm-deisolation - De-Isolation & System Re-energization (Section 6.0)
router.post('/:id/confirm-deisolation', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const { deIsolationName, deIsolationDesignation, deIsolationSignature, deIsolationDate, deIsolationTime, ccrOperatorSignature } = req.body;

    if (!deIsolationName?.trim()) {
      return res.status(400).json({
        error: 'De-Isolation Declaration (Section 6.1) requires Name of Competent Person removing isolations.',
      });
    }

    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) return res.status(404).json({ error: 'Certificate not found' });
    if (existing.status !== 'Work Completed') {
      return res.status(400).json({
        error: `Work completion (Section 5.0) must be confirmed before de-isolation can take place (current: ${existing.status})`,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        status: 'De-isolation Confirmed',
        deIsolationName: deIsolationName.trim(),
        deIsolationDesignation: deIsolationDesignation?.trim() || 'Electrical / Operations Authority',
        deIsolationSignature: deIsolationSignature?.trim() || deIsolationName.trim(),
        deIsolationDate: deIsolationDate || today,
        deIsolationTime: deIsolationTime || nowTime,
        ccrOperatorSignature: ccrOperatorSignature?.trim() || 'CCR Operator Re-energization Confirmed',
        ccrOperatorDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'UPDATE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `De-isolation Confirmed & Plant Re-energized for ${existing.certificateNumber} by ${deIsolationName}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error confirming de-isolation:', error);
    res.status(500).json({ error: 'Failed to record de-isolation confirmation' });
  }
});

// POST /api/isolation-certificates/:id/cancel - Cancel certificate
router.post('/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const id = Number(req.params.id);
    const { cancellationReason } = req.body;

    if (!cancellationReason?.trim()) {
      return res.status(400).json({ error: 'Cancellation reason is mandatory.' });
    }

    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: eq(electricalIsolationCertificates.id, id),
    });

    if (!existing) return res.status(404).json({ error: 'Certificate not found' });
    if (existing.status === 'De-isolation Confirmed') {
      return res.status(400).json({ error: 'Cannot cancel a certificate that is already de-isolated and closed.' });
    }

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set({
        status: 'Cancelled',
        cancellationReason: cancellationReason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || req.dbUser?.email || 'system@powercement.com.pk',
      userRole: user.role || req.dbUser?.role || 'User',
      action: 'DELETE',
      module: 'Electrical Isolation Certificate',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Cancelled Certificate ${existing.certificateNumber}: ${cancellationReason}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error cancelling certificate:', error);
    res.status(500).json({ error: 'Failed to cancel certificate' });
  }
});

export default router;
