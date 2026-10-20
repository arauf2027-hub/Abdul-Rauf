import { Router } from 'express';
import { and, desc, eq, ne, or } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { actionItems, events, fiveWhys, incidentReports, keyFindings, notifications, users } from '../../db/schema.ts';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';
import { generateBusinessId } from '../../services/sequence.ts';
import { logAuditEvent } from '../../services/audit.ts';

const router = Router();

// GET /api/incidents - List incidents with filters
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { departmentId, locationId, eventType, status, search } = req.query;

    const list = await db.query.events.findMany({
      orderBy: [desc(events.id)],
      with: {
        department: true,
        location: true,
        reportedBy: true,
        assignedRgl: true,
        assignedRp: true,
      },
    });

    let filtered = list;
    if (departmentId) {
      filtered = filtered.filter(e => e.departmentId === Number(departmentId));
    }
    if (locationId) {
      filtered = filtered.filter(e => e.locationId === Number(locationId));
    }
    if (eventType) {
      filtered = filtered.filter(e => e.eventType === String(eventType));
    }
    if (status) {
      filtered = filtered.filter(e => e.status === String(status));
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(e => 
        e.eventId.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to retrieve incidents' });
  }
});

// POST /api/incidents - Create new incident
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const body = req.body;

    if (!body.title || !body.eventType || !body.occurrenceDate || !body.occurrenceTime || !body.departmentId || !body.locationId) {
      return res.status(400).json({ error: 'Missing mandatory incident fields.' });
    }

    const eventId = await generateBusinessId('EVT', 'events', 'event_id');

    const [newEvent] = await db.insert(events).values({
      eventId,
      title: body.title,
      description: body.description || '',
      eventType: body.eventType,
      occurrenceDate: body.occurrenceDate,
      occurrenceTime: body.occurrenceTime,
      reportedByUserId: user.id,
      departmentId: Number(body.departmentId),
      locationId: Number(body.locationId),
      subLocationId: body.subLocationId ? Number(body.subLocationId) : null,
      eventCategory: body.eventCategory || 'Safety',
      actualConsequence: body.actualConsequence || 'None recorded',
      potentialConsequence: body.potentialConsequence || 'Potential minor injury or delay',
      immediateActionsTaken: body.immediateActionsTaken || 'Area cordoned off, supervisor notified.',
      personsInvolved: body.personsInvolved || '',
      witnesses: body.witnesses || '',
      injuryOrEnvironmentalDetails: body.injuryOrEnvironmentalDetails || '',
      initialRiskClassification: body.initialRiskClassification || 'Medium',
      potentialRiskClassification: body.potentialRiskClassification || 'High',
      status: 'Reported',
      assignedRglId: body.assignedRglId ? Number(body.assignedRglId) : null,
      assignedRpId: body.assignedRpId ? Number(body.assignedRpId) : null,
      investigationDueDate: body.investigationDueDate || '',
    }).returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      module: 'Incident Management',
      recordType: 'event',
      recordId: eventId,
      newValues: newEvent,
      comments: `New incident reported: ${body.title}`,
    });

    if (newEvent.assignedRglId) {
      await db.insert(notifications).values({
        userId: newEvent.assignedRglId,
        title: `New Incident Reported: ${eventId}`,
        message: `An incident "${newEvent.title}" requires your review and investigation assignment.`,
        recordType: 'event',
        recordId: eventId,
        isRead: false,
      });
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident event' });
  }
});

// GET /api/incidents/:id - Get full incident details
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const eventIdParam = req.params.id;
    const isNumeric = !isNaN(Number(eventIdParam));

    const eventRecord = await db.query.events.findFirst({
      where: isNumeric ? eq(events.id, Number(eventIdParam)) : eq(events.eventId, eventIdParam),
      with: {
        department: true,
        location: true,
        subLocation: true,
        reportedBy: true,
        assignedRgl: true,
        assignedRp: true,
      },
    });

    if (!eventRecord) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const report = await db.query.incidentReports.findFirst({
      where: eq(incidentReports.eventId, eventRecord.id),
      with: {
        assignedRp: true,
        reviewingRgl: true,
        whys: {
          orderBy: [fiveWhys.whyNumber],
        },
        findings: true,
      },
    });

    const actions = await db.query.actionItems.findMany({
      where: or(
        eq(actionItems.sourceEventId, eventRecord.id),
        eq(actionItems.sourceRecordId, eventRecord.eventId)
      ),
      with: {
        department: true,
        responsiblePerson: true,
        responsibleGroupLeader: true,
      },
    });

    res.json({
      event: eventRecord,
      investigationReport: report || null,
      actions,
    });
  } catch (error) {
    console.error('Error fetching incident details:', error);
    res.status(500).json({ error: 'Failed to retrieve incident details' });
  }
});

// POST /api/incidents/:id/assign - RGL assigns RP
router.post('/:id/assign', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const { assignedRpId, assignedRglId, investigationDueDate, assignmentNotes } = req.body;

    if (!assignedRpId) {
      return res.status(400).json({ error: 'Responsible Person (RP) is required for assignment.' });
    }

    const eventIdParam = req.params.id;
    const isNumeric = !isNaN(Number(eventIdParam));

    const eventRecord = await db.query.events.findFirst({
      where: isNumeric ? eq(events.id, Number(eventIdParam)) : eq(events.eventId, eventIdParam),
    });

    if (!eventRecord) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const rglId = assignedRglId ? Number(assignedRglId) : user.id;

    await db.update(events)
      .set({
        assignedRglId: rglId,
        assignedRpId: Number(assignedRpId),
        investigationDueDate: investigationDueDate || '',
        status: 'Under Investigation',
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventRecord.id));

    let existingReport = await db.query.incidentReports.findFirst({
      where: eq(incidentReports.eventId, eventRecord.id),
    });

    if (!existingReport) {
      const reportId = await generateBusinessId('IR', 'incident_reports', 'report_id');
      const today = new Date().toISOString().split('T')[0];
      const dueDate = investigationDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const [newReport] = await db.insert(incidentReports).values({
        reportId,
        eventId: eventRecord.id,
        assignedRpId: Number(assignedRpId),
        reviewingRglId: rglId,
        status: 'Open',
        investigationStartDate: today,
        investigationDueDate: dueDate,
      }).returning();
      existingReport = newReport;
    } else {
      await db.update(incidentReports)
        .set({
          assignedRpId: Number(assignedRpId),
          reviewingRglId: rglId,
          investigationDueDate: investigationDueDate || existingReport.investigationDueDate,
          updatedAt: new Date(),
        })
        .where(eq(incidentReports.id, existingReport.id));
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'ASSIGN',
      module: 'Incident Investigation',
      recordType: 'event',
      recordId: eventRecord.eventId,
      comments: `Investigation assigned to RP #${assignedRpId} by RGL #${rglId}. ${assignmentNotes || ''}`,
    });

    await db.insert(notifications).values({
      userId: Number(assignedRpId),
      title: `Assigned Investigation: ${eventRecord.eventId}`,
      message: `You have been assigned as lead investigator for "${eventRecord.title}". Due date: ${investigationDueDate || 'standard'}.`,
      recordType: 'event',
      recordId: eventRecord.eventId,
      isRead: false,
    });

    res.json({ success: true, report: existingReport });
  } catch (error) {
    console.error('Error assigning incident investigation:', error);
    res.status(500).json({ error: 'Failed to assign investigation' });
  }
});

// POST /api/incidents/:id/investigation/save-draft
router.post('/:id/investigation/save-draft', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const eventIdParam = req.params.id;
    const isNumeric = !isNaN(Number(eventIdParam));

    const eventRecord = await db.query.events.findFirst({
      where: isNumeric ? eq(events.id, Number(eventIdParam)) : eq(events.eventId, eventIdParam),
    });

    if (!eventRecord) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    let report = await db.query.incidentReports.findFirst({
      where: eq(incidentReports.eventId, eventRecord.id),
    });

    const body = req.body;
    if (!report) {
      const reportId = await generateBusinessId('IR', 'incident_reports', 'report_id');
      const [newRep] = await db.insert(incidentReports).values({
        reportId,
        eventId: eventRecord.id,
        assignedRpId: user.id,
        reviewingRglId: eventRecord.assignedRglId || user.id,
        status: 'Open',
        investigationStartDate: new Date().toISOString().split('T')[0],
        investigationDueDate: eventRecord.investigationDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        sequenceOfEvents: body.sequenceOfEvents || '',
        immediateCauses: body.immediateCauses || '',
        contributingFactors: body.contributingFactors || '',
        failedOrMissingControls: body.failedOrMissingControls || '',
        finalRootCause: body.finalRootCause || '',
        rootCauseCategory: body.rootCauseCategory || 'Procedures & Compliance',
      }).returning();
      report = newRep;
    } else {
      await db.update(incidentReports).set({
        sequenceOfEvents: body.sequenceOfEvents !== undefined ? body.sequenceOfEvents : report.sequenceOfEvents,
        immediateCauses: body.immediateCauses !== undefined ? body.immediateCauses : report.immediateCauses,
        contributingFactors: body.contributingFactors !== undefined ? body.contributingFactors : report.contributingFactors,
        failedOrMissingControls: body.failedOrMissingControls !== undefined ? body.failedOrMissingControls : report.failedOrMissingControls,
        finalRootCause: body.finalRootCause !== undefined ? body.finalRootCause : report.finalRootCause,
        rootCauseCategory: body.rootCauseCategory || report.rootCauseCategory,
        updatedAt: new Date(),
      }).where(eq(incidentReports.id, report.id));
    }

    if (Array.isArray(body.whys)) {
      await db.delete(fiveWhys).where(eq(fiveWhys.incidentReportId, report.id));
      for (const w of body.whys) {
        if (w.question && w.answer) {
          await db.insert(fiveWhys).values({
            incidentReportId: report.id,
            whyNumber: Number(w.whyNumber),
            question: w.question,
            answer: w.answer,
            evidence: w.evidence || '',
          });
        }
      }
    }

    if (Array.isArray(body.findings)) {
      await db.delete(keyFindings).where(eq(keyFindings.incidentReportId, report.id));
      for (const f of body.findings) {
        if (f.description && f.recommendedAction) {
          await db.insert(keyFindings).values({
            incidentReportId: report.id,
            findingRef: f.findingRef || 'KF-01',
            description: f.description,
            evidence: f.evidence || '',
            significance: f.significance || 'Medium',
            recommendedAction: f.recommendedAction,
          });
        }
      }
    }

    res.json({ success: true, message: 'Investigation draft saved successfully' });
  } catch (error) {
    console.error('Error saving investigation draft:', error);
    res.status(500).json({ error: 'Failed to save investigation draft' });
  }
});

// POST /api/incidents/:id/investigation/submit - Strict validation (>= 5 whys, >= 2 findings)
router.post('/:id/investigation/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const eventIdParam = req.params.id;
    const isNumeric = !isNaN(Number(eventIdParam));

    const eventRecord = await db.query.events.findFirst({
      where: isNumeric ? eq(events.id, Number(eventIdParam)) : eq(events.eventId, eventIdParam),
    });

    if (!eventRecord) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const report = await db.query.incidentReports.findFirst({
      where: eq(incidentReports.eventId, eventRecord.id),
      with: {
        whys: true,
        findings: true,
      },
    });

    if (!report) {
      return res.status(400).json({ error: 'No investigation report created yet. Save draft first.' });
    }

    if (!report.sequenceOfEvents || !report.immediateCauses || !report.finalRootCause) {
      return res.status(400).json({
        error: 'Validation failed: Sequence of events, immediate causes, and final root cause are mandatory before submission.'
      });
    }

    // MANDATORY >= 5 Whys
    const validWhys = report.whys.filter(w => w.question.trim().length > 0 && w.answer.trim().length > 0);
    if (validWhys.length < 5) {
      return res.status(400).json({
        error: `Validation failed: At least 5 completed Why entries are mandatory before submission (Current valid entries: ${validWhys.length}). Each must include question and answer.`
      });
    }

    // MANDATORY >= 2 Findings
    const validFindings = report.findings.filter(f => f.description.trim().length > 0 && f.recommendedAction.trim().length > 0);
    if (validFindings.length < 2) {
      return res.status(400).json({
        error: `Validation failed: At least 2 key findings are mandatory before submission (Current valid findings: ${validFindings.length}). Each finding must specify description and recommended action.`
      });
    }

    await db.update(incidentReports).set({
      status: 'Under Review',
      rpSubmissionStatus: 'Submitted',
      rpSubmittedAt: new Date(),
      rglReviewStatus: 'Pending',
      updatedAt: new Date(),
    }).where(eq(incidentReports.id, report.id));

    await db.update(events).set({
      status: 'Under Review',
      updatedAt: new Date(),
    }).where(eq(events.id, eventRecord.id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'SUBMIT',
      module: 'Incident Investigation',
      recordType: 'incident_report',
      recordId: report.reportId,
      comments: `Investigation report submitted by RP ${user.fullName} for RGL review. Validated ${validWhys.length} Whys and ${validFindings.length} findings.`,
    });

    await db.insert(notifications).values({
      userId: report.reviewingRglId,
      title: `Investigation Submitted for Review: ${report.reportId}`,
      message: `RP ${user.fullName} has submitted the complete investigation report for "${eventRecord.title}". Review and decision required.`,
      recordType: 'event',
      recordId: eventRecord.eventId,
      isRead: false,
    });

    res.json({ success: true, message: 'Investigation submitted for RGL review successfully' });
  } catch (error) {
    console.error('Error submitting investigation report:', error);
    res.status(500).json({ error: 'Failed to submit investigation report' });
  }
});

// POST /api/incidents/:id/investigation/review
router.post('/:id/investigation/review', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const { decision, reviewComments } = req.body;

    if (!decision || (decision !== 'Approved' && decision !== 'Returned')) {
      return res.status(400).json({ error: 'Decision must be either "Approved" or "Returned".' });
    }

    const eventIdParam = req.params.id;
    const isNumeric = !isNaN(Number(eventIdParam));

    const eventRecord = await db.query.events.findFirst({
      where: isNumeric ? eq(events.id, Number(eventIdParam)) : eq(events.eventId, eventIdParam),
    });

    if (!eventRecord) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const report = await db.query.incidentReports.findFirst({
      where: eq(incidentReports.eventId, eventRecord.id),
      with: {
        findings: true,
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Investigation report not found' });
    }

    // Separation of duties enforcement: RP cannot approve their own report
    if (user.role === 'rp' && user.id === report.assignedRpId) {
      return res.status(403).json({
        error: 'Forbidden: Separation of duties violation. An investigator (RP) cannot approve their own report.'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    if (decision === 'Returned') {
      if (!reviewComments || reviewComments.trim().length === 0) {
        return res.status(400).json({
          error: 'Mandatory review comments are required when returning an investigation for correction.'
        });
      }

      await db.update(incidentReports).set({
        status: 'Returned for Correction',
        rglReviewStatus: 'Returned',
        rglReviewComments: reviewComments,
        rglReviewedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(incidentReports.id, report.id));

      await db.update(events).set({
        status: 'Under Investigation',
        updatedAt: new Date(),
      }).where(eq(events.id, eventRecord.id));

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'RETURN',
        module: 'Incident Investigation',
        recordType: 'incident_report',
        recordId: report.reportId,
        comments: `Report returned for correction by ${user.fullName}: ${reviewComments}`,
      });

      await db.insert(notifications).values({
        userId: report.assignedRpId,
        title: `Report Returned for Correction: ${report.reportId}`,
        message: `Your investigation report was returned by RGL: "${reviewComments}". Please address comments and resubmit.`,
        recordType: 'event',
        recordId: eventRecord.eventId,
        isRead: false,
      });

      return res.json({ success: true, message: 'Report returned for correction' });
    }

    // Approved
    await db.update(incidentReports).set({
      status: 'Approved',
      rglReviewStatus: 'Approved',
      rglReviewComments: reviewComments || 'Approved by reviewing RGL.',
      rglReviewedAt: new Date(),
      approvalDate: today,
      updatedAt: new Date(),
    }).where(eq(incidentReports.id, report.id));

    await db.update(events).set({
      status: 'Approved',
      updatedAt: new Date(),
    }).where(eq(events.id, eventRecord.id));

    const createdActions: any[] = [];
    for (const f of report.findings) {
      const existingAction = await db.query.actionItems.findFirst({
        where: eq(actionItems.sourceFindingId, f.id),
      });

      if (!existingAction) {
        const actionId = await generateBusinessId('ACT', 'action_items', 'action_id');
        const targetDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

        const [newAction] = await db.insert(actionItems).values({
          actionId,
          sourceModule: 'Incident',
          sourceRecordId: eventRecord.eventId,
          sourceEventId: eventRecord.id,
          sourceIncidentReportId: report.id,
          sourceFindingId: f.id,
          observationFinding: `[${f.findingRef}] ${f.description}`,
          recommendedAction: f.recommendedAction,
          actionType: 'Corrective',
          responsibleDepartmentId: eventRecord.departmentId,
          responsiblePersonId: report.assignedRpId,
          responsibleGroupLeaderId: report.reviewingRglId,
          priority: f.significance === 'Critical' ? 'Urgent' : (f.significance === 'High' ? 'High' : 'Medium'),
          riskClassification: f.significance || 'Medium',
          targetDate,
          status: 'Open',
        }).returning();

        createdActions.push(newAction);
      }
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'APPROVE',
      module: 'Incident Investigation',
      recordType: 'incident_report',
      recordId: report.reportId,
      comments: `Investigation report approved by ${user.fullName}. Created ${createdActions.length} linked CAPA actions.`,
    });

    await db.insert(notifications).values({
      userId: report.assignedRpId,
      title: `Investigation Approved: ${report.reportId}`,
      message: `Your investigation report for "${eventRecord.title}" has been approved. Traceable CAPA actions have been initialized.`,
      recordType: 'event',
      recordId: eventRecord.eventId,
      isRead: false,
    });

    res.json({
      success: true,
      message: 'Investigation approved and CAPA actions generated',
      createdActionsCount: createdActions.length,
    });
  } catch (error) {
    console.error('Error reviewing investigation:', error);
    res.status(500).json({ error: 'Failed to review investigation report' });
  }
});

// POST /api/incidents/:id/close
router.post('/:id/close', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const eventIdParam = req.params.id;
    const isNumeric = !isNaN(Number(eventIdParam));

    const eventRecord = await db.query.events.findFirst({
      where: isNumeric ? eq(events.id, Number(eventIdParam)) : eq(events.eventId, eventIdParam),
    });

    if (!eventRecord) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const openActions = await db.query.actionItems.findMany({
      where: and(
        eq(actionItems.sourceEventId, eventRecord.id),
        ne(actionItems.status, 'Closed')
      ),
    });

    if (openActions.length > 0) {
      return res.status(400).json({
        error: `Cannot close incident: ${openActions.length} associated corrective action(s) remain open. All CAPA items must be verified and closed by RGL before final incident closure.`,
        openActionsCount: openActions.length,
      });
    }

    const today = new Date().toISOString().split('T')[0];

    await db.update(events).set({
      status: 'Closed',
      updatedAt: new Date(),
    }).where(eq(events.id, eventRecord.id));

    await db.update(incidentReports).set({
      status: 'Closed',
      closureDate: today,
      updatedAt: new Date(),
    }).where(eq(incidentReports.eventId, eventRecord.id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CLOSE',
      module: 'Incident Management',
      recordType: 'event',
      recordId: eventRecord.eventId,
      comments: `Incident ${eventRecord.eventId} formally closed by ${user.fullName}.`,
    });

    res.json({ success: true, message: `Incident ${eventRecord.eventId} has been closed successfully.` });
  } catch (error) {
    console.error('Error closing incident:', error);
    res.status(500).json({ error: 'Failed to close incident' });
  }
});

// PUT /api/incidents/:id - Update incident event details (title, description, etc.)
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const eventIdParam = req.params.id;
    const isNumeric = !isNaN(Number(eventIdParam));
    const body = req.body;

    const eventRecord = await db.query.events.findFirst({
      where: isNumeric ? eq(events.id, Number(eventIdParam)) : eq(events.eventId, eventIdParam),
    });

    if (!eventRecord) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.eventType !== undefined) updateData.eventType = body.eventType;
    if (body.occurrenceDate !== undefined) updateData.occurrenceDate = body.occurrenceDate;
    if (body.occurrenceTime !== undefined) updateData.occurrenceTime = body.occurrenceTime;
    if (body.departmentId !== undefined) updateData.departmentId = Number(body.departmentId);
    if (body.locationId !== undefined) updateData.locationId = Number(body.locationId);
    if (body.subLocationId !== undefined) updateData.subLocationId = body.subLocationId ? Number(body.subLocationId) : null;
    if (body.eventCategory !== undefined) updateData.eventCategory = body.eventCategory;
    if (body.actualConsequence !== undefined) updateData.actualConsequence = body.actualConsequence;
    if (body.potentialConsequence !== undefined) updateData.potentialConsequence = body.potentialConsequence;
    if (body.immediateActionsTaken !== undefined) updateData.immediateActionsTaken = body.immediateActionsTaken;
    if (body.initialRiskClassification !== undefined) updateData.initialRiskClassification = body.initialRiskClassification;
    if (body.potentialRiskClassification !== undefined) updateData.potentialRiskClassification = body.potentialRiskClassification;

    const [updated] = await db.update(events)
      .set(updateData)
      .where(eq(events.id, eventRecord.id))
      .returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      module: 'Incident Management',
      recordType: 'event',
      recordId: eventRecord.eventId,
      comments: `Updated incident ${eventRecord.eventId}: title="${updated.title}"`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Failed to update incident details' });
  }
});

export default router;
