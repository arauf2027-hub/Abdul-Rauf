import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { electricalIsolationCertificates, ptwPermits, users } from '../../db/schema.ts';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';
import { generateBusinessId } from '../../services/sequence.ts';
import { logAuditEvent } from '../../services/audit.ts';

const router = Router();

// Default 5 electrical isolation points
export const DEFAULT_ISOLATION_POINTS = [
  { id: '1', location: '', breakerNo: '', action: '' as const, padlockNo: '', tagOut: '' as const },
  { id: '2', location: '', breakerNo: '', action: '' as const, padlockNo: '', tagOut: '' as const },
  { id: '3', location: '', breakerNo: '', action: '' as const, padlockNo: '', tagOut: '' as const },
  { id: '4', location: '', breakerNo: '', action: '' as const, padlockNo: '', tagOut: '' as const },
  { id: '5', location: '', breakerNo: '', action: '' as const, padlockNo: '', tagOut: '' as const },
];

// Default 3 other isolation points
export const DEFAULT_OTHER_ISOLATIONS = [
  { id: '1', controlMechanism: '', location: '', inletOutletDrain: '' as const, linesBlanked: '' as const, valvesStatus: '' as const, padlockNo: '', taggedOut: '' as const },
  { id: '2', controlMechanism: '', location: '', inletOutletDrain: '' as const, linesBlanked: '' as const, valvesStatus: '' as const, padlockNo: '', taggedOut: '' as const },
  { id: '3', controlMechanism: '', location: '', inletOutletDrain: '' as const, linesBlanked: '' as const, valvesStatus: '' as const, padlockNo: '', taggedOut: '' as const },
];

function parseEicRecord(c: any) {
  let parsedIsolationPoints = DEFAULT_ISOLATION_POINTS;
  try {
    const raw = JSON.parse(c.isolationPoints || '[]');
    if (Array.isArray(raw) && raw.length > 0) {
      parsedIsolationPoints = raw;
    }
  } catch {}

  let parsedOtherIsolations = DEFAULT_OTHER_ISOLATIONS;
  try {
    const raw = JSON.parse(c.otherIsolations || '[]');
    if (Array.isArray(raw) && raw.length > 0) {
      parsedOtherIsolations = raw;
    }
  } catch {}

  return {
    ...c,
    isolationPoints: parsedIsolationPoints,
    otherIsolations: parsedOtherIsolations,
  };
}

// GET /api/ptw/eic/summary - KPI summary statistics
router.get('/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const all = await db.select().from(electricalIsolationCertificates);

    const summary = {
      total: all.length,
      draft: all.filter((c) => c.status === 'Draft').length,
      submitted: all.filter((c) => c.status === 'Submitted for Approval').length,
      approved: all.filter((c) => c.status === 'Approved').length,
      isolationConfirmed: all.filter((c) => c.status === 'Isolation Confirmed').length,
      workInProgress: all.filter((c) => c.status === 'Work in Progress').length,
      workCompleted: all.filter((c) => c.status === 'Work Completed').length,
      closed: all.filter((c) => c.status === 'Closed' || c.status === 'De-isolation Confirmed').length,
      cancelled: all.filter((c) => c.status === 'Cancelled' || c.status === 'Rejected').length,
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching EIC summary:', error);
    res.status(500).json({ error: 'Failed to retrieve certificate summary metrics' });
  }
});

// GET /api/ptw/eic - List certificates with filters
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, locationId, linkedPtwId, search } = req.query;

    const list = await db.query.electricalIsolationCertificates.findMany({
      orderBy: [desc(electricalIsolationCertificates.id)],
      with: {
        location: true,
        requestor: true,
        approver: true,
        linkedPtw: true,
      },
    });

    let enriched = list.map(parseEicRecord);

    if (status && status !== 'all') {
      enriched = enriched.filter((c) => c.status.toLowerCase() === String(status).toLowerCase());
    }

    if (locationId && locationId !== 'all') {
      enriched = enriched.filter((c) => c.locationId === Number(locationId));
    }

    if (linkedPtwId) {
      enriched = enriched.filter((c) => c.linkedPtwId === Number(linkedPtwId));
    }

    if (search) {
      const q = String(search).toLowerCase();
      enriched = enriched.filter(
        (c) =>
          c.certificateNumber.toLowerCase().includes(q) ||
          c.workLocation.toLowerCase().includes(q) ||
          c.equipmentToIsolate.toLowerCase().includes(q) ||
          c.workDescription.toLowerCase().includes(q) ||
          c.requestorName.toLowerCase().includes(q) ||
          (c.linkedPtwNumber && c.linkedPtwNumber.toLowerCase().includes(q))
      );
    }

    res.json(enriched);
  } catch (error) {
    console.error('Error listing EIC records:', error);
    res.status(500).json({ error: 'Failed to retrieve electrical isolation certificates' });
  }
});

// GET /api/ptw/eic/:id - Single certificate
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid certificate ID' });
    }

    const record = await db.query.electricalIsolationCertificates.findFirst({
      where: (c, { eq }) => eq(c.id, id),
      with: {
        location: true,
        requestor: true,
        approver: true,
        linkedPtw: true,
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'Electrical isolation certificate not found' });
    }

    res.json(parseEicRecord(record));
  } catch (error) {
    console.error('Error fetching EIC record:', error);
    res.status(500).json({ error: 'Failed to retrieve certificate details' });
  }
});

// POST /api/ptw/eic - Create new certificate
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser;
    const body = req.body;

    // Minimum validations before saving
    if (!body.workLocation || !body.equipmentToIsolate || !body.workDescription) {
      return res.status(400).json({
        error: 'Work Location, Equipment to be Isolated, and Work Description are mandatory.',
      });
    }

    const certificateNumber = await generateBusinessId(
      'EIC',
      'electrical_isolation_certificates',
      'certificate_number'
    );

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    const isolationPointsJson = JSON.stringify(
      Array.isArray(body.isolationPoints) && body.isolationPoints.length > 0
        ? body.isolationPoints
        : DEFAULT_ISOLATION_POINTS
    );

    const otherIsolationsJson = JSON.stringify(
      Array.isArray(body.otherIsolations) && body.otherIsolations.length > 0
        ? body.otherIsolations
        : DEFAULT_OTHER_ISOLATIONS
    );

    const initialStatus = body.status === 'Submitted for Approval' ? 'Submitted for Approval' : 'Draft';

    const [newCert] = await db
      .insert(electricalIsolationCertificates)
      .values({
        certificateNumber,
        status: initialStatus,
        linkedPtwId: body.linkedPtwId ? Number(body.linkedPtwId) : null,
        linkedPtwNumber: body.linkedPtwNumber || '',
        workLocation: body.workLocation,
        locationId: body.locationId ? Number(body.locationId) : null,
        equipmentToIsolate: body.equipmentToIsolate,
        date: body.date || today,
        time: body.time || nowTime,
        workDescription: body.workDescription,
        requestorUserId: user?.id || null,
        requestorName: body.requestorName || user?.fullName || 'Requestor',
        requestorDesignation: body.requestorDesignation || user?.jobTitle || '',
        requestorSignature: body.requestorSignature || (initialStatus === 'Submitted for Approval' ? body.requestorName || user?.fullName : ''),
        requestorDate: body.requestorDate || (initialStatus === 'Submitted for Approval' ? `${today} ${nowTime}` : ''),
        approverUserId: body.approverUserId ? Number(body.approverUserId) : null,
        approverName: body.approverName || '',
        approverDesignation: body.approverDesignation || '',
        approverSignature: body.approverSignature || '',
        approvalRemarks: body.approvalRemarks || '',
        fusesRemoved: Boolean(body.fusesRemoved),
        mainSwitchedOff: Boolean(body.mainSwitchedOff),
        rackedOut: Boolean(body.rackedOut),
        padlocksFitted: Boolean(body.padlocksFitted),
        tagsFitted: Boolean(body.tagsFitted),
        isolationPoints: isolationPointsJson,
        competentPersonName: body.competentPersonName || '',
        competentPersonDesignation: body.competentPersonDesignation || '',
        operatorSignature: body.operatorSignature || '',
        competentPersonSignature: body.competentPersonSignature || '',
        otherIsolations: otherIsolationsJson,
        otherCompetentPersonName: body.otherCompetentPersonName || '',
        otherCompetentPersonDesignation: body.otherCompetentPersonDesignation || '',
        otherCompetentPersonSignature: body.otherCompetentPersonSignature || '',
        otherConfirmationDate: body.otherConfirmationDate || '',
        otherConfirmationTime: body.otherConfirmationTime || '',
      })
      .returning();

    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'system',
      userRole: user?.role || 'user',
      action: 'Create',
      module: 'EIC',
      recordType: 'ElectricalIsolationCertificate',
      recordId: certificateNumber,
      newValues: JSON.stringify({ status: newCert.status, equipment: newCert.equipmentToIsolate }),
      comments: `New Electrical Isolation Certificate prepared by ${newCert.requestorName}`,
    });

    res.status(201).json(parseEicRecord(newCert));
  } catch (error: any) {
    console.error('Error creating EIC:', error);
    res.status(500).json({ error: 'Failed to create certificate: ' + (error.message || 'Database error') });
  }
});

// PUT /api/ptw/eic/:id - Update certificate & handle workflow transitions
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const user = req.dbUser;
    const body = req.body;

    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: (c, { eq }) => eq(c.id, id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    // Updatable basic fields
    if (body.workLocation !== undefined) updates.workLocation = body.workLocation;
    if (body.locationId !== undefined) updates.locationId = body.locationId ? Number(body.locationId) : null;
    if (body.equipmentToIsolate !== undefined) updates.equipmentToIsolate = body.equipmentToIsolate;
    if (body.date !== undefined) updates.date = body.date;
    if (body.time !== undefined) updates.time = body.time;
    if (body.workDescription !== undefined) updates.workDescription = body.workDescription;
    if (body.linkedPtwId !== undefined) updates.linkedPtwId = body.linkedPtwId ? Number(body.linkedPtwId) : null;
    if (body.linkedPtwNumber !== undefined) updates.linkedPtwNumber = body.linkedPtwNumber || '';

    // Section 2.1 Requestor
    if (body.requestorName !== undefined) updates.requestorName = body.requestorName;
    if (body.requestorDesignation !== undefined) updates.requestorDesignation = body.requestorDesignation;
    if (body.requestorSignature !== undefined) updates.requestorSignature = body.requestorSignature;
    if (body.requestorDate !== undefined) updates.requestorDate = body.requestorDate;

    // Section 2.2 Approver
    if (body.approverName !== undefined) updates.approverName = body.approverName;
    if (body.approverDesignation !== undefined) updates.approverDesignation = body.approverDesignation;
    if (body.approverSignature !== undefined) updates.approverSignature = body.approverSignature;
    if (body.approvalRemarks !== undefined) updates.approvalRemarks = body.approvalRemarks;

    // Section 3.1 Verification checkboxes
    if (body.fusesRemoved !== undefined) updates.fusesRemoved = Boolean(body.fusesRemoved);
    if (body.mainSwitchedOff !== undefined) updates.mainSwitchedOff = Boolean(body.mainSwitchedOff);
    if (body.rackedOut !== undefined) updates.rackedOut = Boolean(body.rackedOut);
    if (body.padlocksFitted !== undefined) updates.padlocksFitted = Boolean(body.padlocksFitted);
    if (body.tagsFitted !== undefined) updates.tagsFitted = Boolean(body.tagsFitted);

    // Section 3.2 Electrical isolation points
    if (body.isolationPoints !== undefined) {
      updates.isolationPoints = JSON.stringify(body.isolationPoints);
    }

    // Section 3.3 Competent Person confirmation
    if (body.competentPersonName !== undefined) updates.competentPersonName = body.competentPersonName;
    if (body.competentPersonDesignation !== undefined) updates.competentPersonDesignation = body.competentPersonDesignation;
    if (body.operatorSignature !== undefined) updates.operatorSignature = body.operatorSignature;
    if (body.competentPersonSignature !== undefined) updates.competentPersonSignature = body.competentPersonSignature;

    // Section 4.0 Other isolations
    if (body.otherIsolations !== undefined) {
      updates.otherIsolations = JSON.stringify(body.otherIsolations);
    }
    if (body.otherCompetentPersonName !== undefined) updates.otherCompetentPersonName = body.otherCompetentPersonName;
    if (body.otherCompetentPersonDesignation !== undefined) updates.otherCompetentPersonDesignation = body.otherCompetentPersonDesignation;
    if (body.otherCompetentPersonSignature !== undefined) updates.otherCompetentPersonSignature = body.otherCompetentPersonSignature;
    if (body.otherConfirmationDate !== undefined) updates.otherConfirmationDate = body.otherConfirmationDate;
    if (body.otherConfirmationTime !== undefined) updates.otherConfirmationTime = body.otherConfirmationTime;

    // Section 5.0 Work completion
    if (body.workPersonInChargeName !== undefined) updates.workPersonInChargeName = body.workPersonInChargeName;
    if (body.workPersonInChargeSignature !== undefined) updates.workPersonInChargeSignature = body.workPersonInChargeSignature;
    if (body.workCompletionDate !== undefined) updates.workCompletionDate = body.workCompletionDate;
    if (body.workCompletionTime !== undefined) updates.workCompletionTime = body.workCompletionTime;
    if (body.completionApproverName !== undefined) updates.completionApproverName = body.completionApproverName;
    if (body.completionApproverDesignation !== undefined) updates.completionApproverDesignation = body.completionApproverDesignation;
    if (body.completionApproverSignature !== undefined) updates.completionApproverSignature = body.completionApproverSignature;

    // Section 6.0 De-isolation
    if (body.deIsolationName !== undefined) updates.deIsolationName = body.deIsolationName;
    if (body.deIsolationDesignation !== undefined) updates.deIsolationDesignation = body.deIsolationDesignation;
    if (body.deIsolationSignature !== undefined) updates.deIsolationSignature = body.deIsolationSignature;
    if (body.deIsolationDate !== undefined) updates.deIsolationDate = body.deIsolationDate;
    if (body.deIsolationTime !== undefined) updates.deIsolationTime = body.deIsolationTime;
    if (body.ccrOperatorSignatures !== undefined) updates.ccrOperatorSignatures = body.ccrOperatorSignatures;

    if (body.cancellationReason !== undefined) updates.cancellationReason = body.cancellationReason;

    // Workflow status transitions with safety validation
    if (body.status && body.status !== existing.status) {
      const targetStatus = body.status;

      if (targetStatus === 'Submitted for Approval') {
        if (!existing.workLocation && !updates.workLocation) {
          return res.status(400).json({ error: 'Section 1.1 Work Location is required to submit.' });
        }
        if (!existing.requestorName && !updates.requestorName) {
          return res.status(400).json({ error: 'Section 2.1 Requestor Name is required to submit.' });
        }
        updates.status = 'Submitted for Approval';
      } else if (targetStatus === 'Approved') {
        if (!body.approverName && !existing.approverName) {
          return res.status(400).json({ error: 'Section 2.2 Approved By Name is required for authorization.' });
        }
        if (!body.approverSignature && !existing.approverSignature) {
          return res.status(400).json({ error: 'Section 2.2 Approver Signature is required for authorization.' });
        }
        updates.status = 'Approved';
        updates.approverUserId = user?.id || null;
        updates.approvedAt = new Date();
      } else if (targetStatus === 'Isolation Confirmed') {
        // Must verify electrical checks
        const fuses = updates.fusesRemoved ?? existing.fusesRemoved;
        const mainSw = updates.mainSwitchedOff ?? existing.mainSwitchedOff;
        const padlocks = updates.padlocksFitted ?? existing.padlocksFitted;
        const tags = updates.tagsFitted ?? existing.tagsFitted;

        if (!fuses && !mainSw && !padlocks && !tags) {
          return res.status(400).json({
            error: 'Section 3.1: At least one physical electrical isolation verification item must be completed.',
          });
        }

        const compName = updates.competentPersonName || existing.competentPersonName;
        const compSign = updates.competentPersonSignature || existing.competentPersonSignature;
        const opSign = updates.operatorSignature || existing.operatorSignature;

        if (!compName || !compSign) {
          return res.status(400).json({
            error: 'Section 3.3: Competent Person performing electrical isolation name and signature are mandatory.',
          });
        }
        if (!opSign) {
          return res.status(400).json({
            error: 'Section 3.3: CCR-Operator signature / notification confirmation is required.',
          });
        }

        updates.status = 'Isolation Confirmed';
        updates.isolationVerifiedAt = new Date();
        updates.isolationVerifiedByUserId = user?.id || null;
        updates.competentPersonConfirmedAt = new Date();
      } else if (targetStatus === 'Work in Progress') {
        if (existing.status !== 'Isolation Confirmed' && existing.status !== 'Work in Progress') {
          return res.status(400).json({
            error: 'Electrical Isolation must be confirmed before beginning work in progress.',
          });
        }
        updates.status = 'Work in Progress';
      } else if (targetStatus === 'Work Completed') {
        const pic = updates.workPersonInChargeName || existing.workPersonInChargeName;
        const picSign = updates.workPersonInChargeSignature || existing.workPersonInChargeSignature;

        if (!pic || !picSign) {
          return res.status(400).json({
            error: 'Section 5.1: Person in charge of work name and completion declaration signature are mandatory.',
          });
        }
        updates.status = 'Work Completed';
        updates.workCompletedAt = new Date();
      } else if (targetStatus === 'Closed' || targetStatus === 'De-isolation Confirmed') {
        if (existing.status !== 'Work Completed') {
          return res.status(400).json({
            error: 'Section 5.0 Work Completion must be recorded before De-Isolation can be confirmed.',
          });
        }

        const deIsoName = updates.deIsolationName || existing.deIsolationName;
        const deIsoSign = updates.deIsolationSignature || existing.deIsolationSignature;
        const ccrSign = updates.ccrOperatorSignatures || existing.ccrOperatorSignatures;

        if (!deIsoName || !deIsoSign) {
          return res.status(400).json({
            error: 'Section 6.1: Competent Person confirming de-isolation name and signature are mandatory.',
          });
        }
        if (!ccrSign) {
          return res.status(400).json({
            error: 'Section 6.1: CCR Operator signature confirming system re-energization is mandatory.',
          });
        }

        updates.status = 'Closed';
        updates.deIsolationConfirmedAt = new Date();
        updates.closedAt = new Date();
        updates.closedByUserId = user?.id || null;
      } else if (targetStatus === 'Cancelled') {
        if (!body.cancellationReason && !existing.cancellationReason) {
          return res.status(400).json({ error: 'Cancellation reason is required to cancel certificate.' });
        }
        updates.status = 'Cancelled';
      } else {
        updates.status = targetStatus;
      }
    }

    const [updated] = await db
      .update(electricalIsolationCertificates)
      .set(updates)
      .where(eq(electricalIsolationCertificates.id, id))
      .returning();

    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'system',
      userRole: user?.role || 'user',
      action: 'Update',
      module: 'EIC',
      recordType: 'ElectricalIsolationCertificate',
      recordId: updated.certificateNumber,
      previousValues: JSON.stringify({ status: existing.status }),
      newValues: JSON.stringify({ status: updated.status }),
      comments: `Certificate updated to status ${updated.status} by ${user?.fullName || 'user'}`,
    });

    res.json(parseEicRecord(updated));
  } catch (error: any) {
    console.error('Error updating EIC record:', error);
    res.status(500).json({ error: 'Failed to update certificate: ' + (error.message || 'Database error') });
  }
});

// DELETE /api/ptw/eic/:id - Delete draft certificate
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.query.electricalIsolationCertificates.findFirst({
      where: (c, { eq }) => eq(c.id, id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (existing.status !== 'Draft' && existing.status !== 'Cancelled') {
      return res.status(400).json({ error: 'Only Draft or Cancelled certificates can be deleted.' });
    }

    await db.delete(electricalIsolationCertificates).where(eq(electricalIsolationCertificates.id, id));

    await logAuditEvent({
      userId: req.dbUser?.id,
      userEmail: req.dbUser?.email || 'system',
      userRole: req.dbUser?.role || 'user',
      action: 'Delete',
      module: 'EIC',
      recordType: 'ElectricalIsolationCertificate',
      recordId: existing.certificateNumber,
      comments: `Draft certificate deleted by ${req.dbUser?.fullName || 'user'}`,
    });

    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting EIC:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

export default router;
