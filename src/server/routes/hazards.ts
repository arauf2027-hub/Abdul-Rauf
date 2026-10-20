import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { actionItems, departments, hazardReports, locations, users } from '../../db/schema.ts';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';
import { generateBusinessId } from '../../services/sequence.ts';
import { logAuditEvent } from '../../services/audit.ts';

const router = Router();

// Helper to determine risk rating from severity (1-5) and likelihood (1-5)
export function getRiskLevelFromMatrix(severity: number, likelihood: number): { score: number; rating: 'Low' | 'Medium' | 'High' | 'Critical' } {
  const score = Math.max(1, Math.min(5, severity)) * Math.max(1, Math.min(5, likelihood));
  let rating: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (score >= 15) {
    rating = 'Critical';
  } else if (score >= 10) {
    rating = 'High';
  } else if (score >= 5) {
    rating = 'Medium';
  } else {
    rating = 'Low';
  }
  return { score, rating };
}

// Seed sample hazards if database is empty so Risk Matrix is populated
async function seedSampleHazardsIfEmpty(adminUserId: number) {
  try {
    const existing = await db.select().from(hazardReports).limit(1);
    if (existing.length > 0) return;

    const allDepts = await db.select().from(departments);
    const allLocs = await db.select().from(locations);
    const allUsers = await db.select().from(users);

    const deptId = allDepts[0]?.id || 1;
    const locId = allLocs[0]?.id || 1;
    const reportedBy = allUsers[0]?.id || adminUserId;

    const samples = [
      {
        title: 'High-Pressure Hydraulic Line Micro-Vibration & Hose Abrasion',
        description: 'Outer reinforcement wire mesh visible on hydraulic line supplying Press #2. Potential burst hazard under 280 bar pressure.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Physical / Mechanical',
        severity: 5,
        likelihood: 4,
        immediateAction: 'Warning flag placed, operating crew alerted to stand clear.',
        recommendedAction: 'Schedule emergency line replacement and install anti-whip safety socks.',
        status: 'Open',
        deptIndex: 1,
        locIndex: 0,
      },
      {
        title: 'Emergency Evacuation Stairwell Blocked by Pallet Staging',
        description: 'Four wooden pallets containing cardboard packaging stacked in front of Fire Exit Door B-12 in Logistics bay.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Fire & Explosion',
        severity: 4,
        likelihood: 4,
        immediateAction: 'Pallets shifted 3 meters away from doorway immediately.',
        recommendedAction: 'Repaint yellow hatched "Keep Clear" zone on floor and brief logistics shift supervisor.',
        status: 'In Progress',
        deptIndex: 3,
        locIndex: 2,
      },
      {
        title: 'Unguarded Rotating Shaft on Infeed Transfer Conveyor',
        description: 'Lock-out inspection revealed yellow safety guard mesh removed during maintenance and not re-bolted to chassis.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Physical / Mechanical',
        severity: 4,
        likelihood: 3,
        immediateAction: 'Conveyor shut down with temporary lockout tag.',
        recommendedAction: 'Fabricate interlocking safety switch on guard panel so line cannot run without enclosure.',
        status: 'Open',
        deptIndex: 1,
        locIndex: 0,
      },
      {
        title: 'Chemical Storage Acid Vapor Odor in Secondary Containment',
        description: 'Faint acidic vapor detected near hydrochloric acid storage tanks. Small leak suspected around flange gasket.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Chemical & Biological',
        severity: 5,
        likelihood: 2,
        immediateAction: 'Mechanical exhaust ventilation ramped to maximum, vapor sensor readings verified below OEL.',
        recommendedAction: 'Torque check flange bolts and replace PTFE gasket during scheduled shutdown.',
        status: 'Open',
        deptIndex: 4,
        locIndex: 1,
      },
      {
        title: 'Worker Operating Reach Truck Without Seatbelt Fastened',
        description: 'Forklift operator observed navigating aisle 4 at warehouse speed limit with seatbelt clicked behind driver seat.',
        observationType: 'Unsafe Act',
        hazardClassification: 'Ergonomic & Behavioral',
        severity: 3,
        likelihood: 4,
        immediateAction: 'Immediate safety stop coaching provided by safety officer.',
        recommendedAction: 'Implement ignition interlock seatbelt sensors across warehouse fleet.',
        status: 'In Progress',
        deptIndex: 3,
        locIndex: 2,
      },
      {
        title: 'Oil Slick Residue Accumulating Beneath Gearbox Housing',
        description: 'Minor oil drip on pedestrian walkway leading to quality testing station. Slip and trip hazard.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Physical / Mechanical',
        severity: 2,
        likelihood: 5,
        immediateAction: 'Granular absorbent applied and warning cone positioned.',
        recommendedAction: 'Reseal gearbox gasket and clean floor surface with industrial degreaser.',
        status: 'Open',
        deptIndex: 2,
        locIndex: 0,
      },
      {
        title: 'Damaged Ground Pin on Portable Arc Welding Rig Cord',
        description: 'Insulation cracking and ground prong bent on 415V extension cable in maintenance fabrication booth.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Electrical',
        severity: 4,
        likelihood: 2,
        immediateAction: 'Cable removed from service and tagged "Out of Order".',
        recommendedAction: 'Rewire with industrial heavy-duty plug and perform PAT resistance test.',
        status: 'Closed',
        deptIndex: 2,
        locIndex: 0,
      },
      {
        title: 'Ergonomic Repetitive Strain from Poor Component Tray Height',
        description: 'Assembly technicians reaching over 60cm repeatedly to grasp metallic housings on Packing Station 4.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Ergonomic & Behavioral',
        severity: 2,
        likelihood: 3,
        immediateAction: 'Adjusted table height manually using temporary risers.',
        recommendedAction: 'Procure adjustable scissor-lift gravity roller conveyors.',
        status: 'In Progress',
        deptIndex: 1,
        locIndex: 0,
      },
      {
        title: 'High Ambient Noise in Compressor Room Exceeding 88 dBA',
        description: 'Auxiliary air compressor #4 sound dampening hood latch broken, allowing excessive acoustic leakage.',
        observationType: 'Unsafe Condition',
        hazardClassification: 'Physical / Mechanical',
        severity: 3,
        likelihood: 2,
        immediateAction: 'Double hearing protection sign posted outside doorway.',
        recommendedAction: 'Replace acoustic seals and latch assembly on compressor enclosure.',
        status: 'Closed',
        deptIndex: 2,
        locIndex: 1,
      },
      {
        title: 'Exemplary Pre-Use Check Conducted on Overhead Crane Rigging',
        description: 'Rigging crew inspected wire rope slings, recorded micrometer measurements, and discarded worn shackle before heavy lift.',
        observationType: 'Good Practice',
        hazardClassification: 'Physical / Mechanical',
        severity: 1,
        likelihood: 1,
        immediateAction: 'Recognized team in morning shift safety briefing.',
        recommendedAction: 'Publish observation photos on HSE board as safety standard benchmark.',
        status: 'Closed',
        deptIndex: 1,
        locIndex: 0,
      },
    ];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const hazardId = `HAZ-2026-${String(1001 + i).padStart(4, '0')}`;
      const dId = allDepts[s.deptIndex % allDepts.length]?.id || deptId;
      const lId = allLocs[s.locIndex % allLocs.length]?.id || locId;
      const { score, rating } = getRiskLevelFromMatrix(s.severity, s.likelihood);

      await db.insert(hazardReports).values({
        hazardId,
        title: s.title,
        reportedByUserId: reportedBy,
        departmentId: dId,
        locationId: lId,
        observationType: s.observationType,
        hazardClassification: s.hazardClassification,
        description: s.description,
        severity: s.severity,
        likelihood: s.likelihood,
        riskScore: score,
        riskRating: rating,
        immediateAction: s.immediateAction,
        recommendedAction: s.recommendedAction,
        status: s.status,
      });
    }
  } catch (err) {
    console.error('Failed to seed sample hazards:', err);
  }
}

// GET /api/hazards
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    await seedSampleHazardsIfEmpty(user.id);

    const list = await db.query.hazardReports.findMany({
      orderBy: [desc(hazardReports.id)],
      with: {
        reportedBy: true,
        department: true,
        location: true,
        subLocation: true,
      },
    });
    res.json(list);
  } catch (error) {
    console.error('Error fetching hazards:', error);
    res.status(500).json({ error: 'Failed to retrieve hazard reports' });
  }
});

// POST /api/hazards
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const body = req.body;

    if (!body.title || !body.description || !body.departmentId || !body.locationId) {
      return res.status(400).json({ error: 'Title, description, department, and location are required.' });
    }

    const hazardId = await generateBusinessId('HAZ', 'hazard_reports', 'hazard_id');

    const severity = Math.max(1, Math.min(5, Number(body.severity) || 3));
    const likelihood = Math.max(1, Math.min(5, Number(body.likelihood) || 3));
    const { score, rating } = getRiskLevelFromMatrix(severity, likelihood);
    const finalRiskRating = body.riskRating && ['Low', 'Medium', 'High', 'Critical'].includes(body.riskRating)
      ? body.riskRating
      : rating;

    const [newHazard] = await db.insert(hazardReports).values({
      hazardId,
      title: body.title.trim(),
      reportedByUserId: user.id,
      departmentId: Number(body.departmentId),
      locationId: Number(body.locationId),
      subLocationId: body.subLocationId ? Number(body.subLocationId) : null,
      observationType: body.observationType || 'Unsafe Condition',
      hazardClassification: body.hazardClassification || 'Physical / Mechanical',
      description: body.description.trim(),
      severity,
      likelihood,
      riskScore: score,
      riskRating: finalRiskRating,
      immediateAction: body.immediateAction || '',
      recommendedAction: body.recommendedAction || '',
      status: 'Open',
    }).returning();

    if (body.createAction && body.responsiblePersonId) {
      const actionId = await generateBusinessId('ACT', 'action_items', 'action_id');
      const targetDate = body.targetDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

      await db.insert(actionItems).values({
        actionId,
        sourceModule: 'Hazard',
        sourceRecordId: hazardId,
        observationFinding: `[${hazardId}] ${body.title}: ${body.description}`,
        recommendedAction: body.recommendedAction || body.description,
        actionType: 'Preventive',
        responsibleDepartmentId: Number(body.departmentId),
        responsiblePersonId: Number(body.responsiblePersonId),
        responsibleGroupLeaderId: body.responsibleGroupLeaderId ? Number(body.responsibleGroupLeaderId) : user.id,
        priority: finalRiskRating === 'Critical' ? 'Urgent' : (finalRiskRating === 'High' ? 'High' : 'Medium'),
        riskClassification: finalRiskRating,
        targetDate,
        status: 'Open',
      });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      module: 'Hazard Reporting',
      recordType: 'hazard_report',
      recordId: hazardId,
      comments: `Hazard reported: ${body.title} (Severity: ${severity}, Likelihood: ${likelihood}, Score: ${score})`,
    });

    res.status(201).json(newHazard);
  } catch (error) {
    console.error('Error reporting hazard:', error);
    res.status(500).json({ error: 'Failed to record hazard report' });
  }
});

// PUT /api/hazards/:id - Update hazard severity, likelihood, status, actions
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const id = Number(req.params.id);
    const body = req.body;

    const existing = await db.query.hazardReports.findFirst({
      where: eq(hazardReports.id, id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Hazard report not found' });
    }

    const severity = body.severity !== undefined ? Math.max(1, Math.min(5, Number(body.severity))) : existing.severity;
    const likelihood = body.likelihood !== undefined ? Math.max(1, Math.min(5, Number(body.likelihood))) : existing.likelihood;
    const { score, rating } = getRiskLevelFromMatrix(severity, likelihood);
    const finalRiskRating = body.riskRating || rating;

    const [updated] = await db.update(hazardReports).set({
      title: body.title !== undefined ? body.title : existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      observationType: body.observationType !== undefined ? body.observationType : existing.observationType,
      hazardClassification: body.hazardClassification !== undefined ? body.hazardClassification : existing.hazardClassification,
      severity,
      likelihood,
      riskScore: score,
      riskRating: finalRiskRating,
      departmentId: body.departmentId ? Number(body.departmentId) : existing.departmentId,
      locationId: body.locationId ? Number(body.locationId) : existing.locationId,
      immediateAction: body.immediateAction !== undefined ? body.immediateAction : existing.immediateAction,
      recommendedAction: body.recommendedAction !== undefined ? body.recommendedAction : existing.recommendedAction,
      status: body.status !== undefined ? body.status : existing.status,
      updatedAt: new Date(),
    }).where(eq(hazardReports.id, id)).returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      module: 'Hazard Reporting',
      recordType: 'hazard_report',
      recordId: existing.hazardId,
      comments: `Hazard updated: S=${severity}, L=${likelihood}, Score=${score}, Rating=${finalRiskRating}, Status=${body.status || existing.status}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating hazard:', error);
    res.status(500).json({ error: 'Failed to update hazard report' });
  }
});

// DELETE /api/hazards/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const id = Number(req.params.id);

    const existing = await db.query.hazardReports.findFirst({
      where: eq(hazardReports.id, id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Hazard report not found' });
    }

    if (user.role !== 'admin' && existing.reportedByUserId !== user.id) {
      return res.status(403).json({ error: 'Only Administrators or the original reporter can remove hazard records' });
    }

    await db.delete(hazardReports).where(eq(hazardReports.id, id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      module: 'Hazard Reporting',
      recordType: 'hazard_report',
      recordId: existing.hazardId,
      comments: `Hazard report deleted: ${existing.hazardId} - ${existing.title}`,
    });

    res.json({ success: true, message: 'Hazard removed successfully' });
  } catch (error) {
    console.error('Error deleting hazard:', error);
    res.status(500).json({ error: 'Failed to delete hazard report' });
  }
});

export default router;
