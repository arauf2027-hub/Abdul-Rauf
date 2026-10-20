import { Router } from 'express';
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { auditEvents, departments, locations, meetingAttendees, notifications, organizations, subLocations, systemConfig, users } from '../../db/schema.ts';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';
import { logAuditEvent } from '../../services/audit.ts';
import { processOverdueActions } from '../../services/reminders.ts';

const router = Router();

// GET /api/masterdata
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const allDepts = await db.select().from(departments);
    const allLocs = await db.select().from(locations);
    const allSubs = await db.select().from(subLocations);
    const allUsers = await db.query.users.findMany({
      with: {
        department: true,
        location: true,
      },
    });
    const orgs = await db.select().from(organizations).limit(1);
    const configs = await db.select().from(systemConfig);

    res.json({
      departments: allDepts,
      locations: allLocs,
      subLocations: allSubs,
      users: allUsers,
      organization: orgs[0] || null,
      systemConfig: configs,
      currentUser: req.dbUser,
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ error: 'Failed to retrieve master data' });
  }
});

// PUT /api/masterdata/organization
router.put('/organization', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can update organization settings.' });
    }

    const { name, logoUrl, trirMultiplier, ltifrMultiplier, totalHoursWorked } = req.body;

    const existing = await db.select().from(organizations).limit(1);
    let updated;
    if (existing.length > 0) {
      [updated] = await db.update(organizations).set({
        name: name || existing[0].name,
        logoUrl: logoUrl !== undefined ? logoUrl : existing[0].logoUrl,
        trirMultiplier: trirMultiplier ? Number(trirMultiplier) : existing[0].trirMultiplier,
        ltifrMultiplier: ltifrMultiplier ? Number(ltifrMultiplier) : existing[0].ltifrMultiplier,
        totalHoursWorked: totalHoursWorked ? Number(totalHoursWorked) : existing[0].totalHoursWorked,
        updatedAt: new Date(),
      }).where(eq(organizations.id, existing[0].id)).returning();
    } else {
      [updated] = await db.insert(organizations).values({
        name: name || 'Apex Industrial Group',
        logoUrl: logoUrl || '',
        trirMultiplier: Number(trirMultiplier) || 200000,
        ltifrMultiplier: Number(ltifrMultiplier) || 1000000,
        totalHoursWorked: Number(totalHoursWorked) || 750000,
      }).returning();
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      module: 'Organization Settings',
      recordType: 'organization',
      recordId: String(updated.id),
      comments: `Updated organization settings: name=${updated.name}, hours=${updated.totalHoursWorked}`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization settings' });
  }
});

// POST /api/masterdata/departments
router.post('/departments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can create departments.' });
    }
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required.' });
    }

    const [dept] = await db.insert(departments).values({
      name,
      code: code.toUpperCase().trim(),
      description: description || '',
    }).returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      module: 'Organization Settings',
      recordType: 'department',
      recordId: String(dept.id),
      comments: `Created department #${dept.id}: ${dept.name} (${dept.code})`,
    });

    res.status(201).json(dept);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/masterdata/departments/:id - Edit/rename department
router.put('/departments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can edit departments.' });
    }
    const id = Number(req.params.id);
    const { name, code, description } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (code) updateData.code = code.toUpperCase().trim();
    if (description !== undefined) updateData.description = description;

    const [updated] = await db.update(departments)
      .set(updateData)
      .where(eq(departments.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      module: 'Organization Settings',
      recordType: 'department',
      recordId: String(id),
      comments: `Updated department #${id}: ${updated.name} (${updated.code})`,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: error.message || 'Failed to update department' });
  }
});

// DELETE /api/masterdata/departments/:id - Remove department
router.delete('/departments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can delete departments.' });
    }
    const id = Number(req.params.id);

    const [dept] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Set references in users table to null
    await db.update(users).set({ departmentId: null }).where(eq(users.departmentId, id));

    await db.delete(departments).where(eq(departments.id, id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      module: 'Organization Settings',
      recordType: 'department',
      recordId: String(id),
      comments: `Deleted department #${id}: ${dept.name} (${dept.code})`,
    });

    res.json({ success: true, message: `Department "${dept.name}" removed successfully.` });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: error.message || 'Failed to delete department' });
  }
});

// POST /api/masterdata/locations
router.post('/locations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can create locations.' });
    }
    const { name, code, locationType } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Location name and code are required.' });
    }

    const [loc] = await db.insert(locations).values({
      name,
      code: code.toUpperCase().trim(),
      locationType: locationType || 'Plant',
    }).returning();

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      module: 'Organization Settings',
      recordType: 'location',
      recordId: String(loc.id),
      comments: `Created location #${loc.id}: ${loc.name} (${loc.code})`,
    });

    res.status(201).json(loc);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/masterdata/locations/:id - Edit/rename location (e.g. change plant alfa/beta)
router.put('/locations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can edit locations/areas.' });
    }
    const id = Number(req.params.id);
    const { name, code, locationType } = req.body;
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (code) updateData.code = code.toUpperCase().trim();
    if (locationType) updateData.locationType = locationType.trim();

    const [updated] = await db.update(locations)
      .set(updateData)
      .where(eq(locations.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Location not found' });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      module: 'Organization Settings',
      recordType: 'location',
      recordId: String(id),
      comments: `Updated location #${id}: ${updated.name} (${updated.code})`,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message || 'Failed to update location' });
  }
});

// DELETE /api/masterdata/locations/:id - Remove location/area
router.delete('/locations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can delete locations/areas.' });
    }
    const id = Number(req.params.id);

    const [loc] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    if (!loc) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Delete sublocations and clear user location references
    await db.delete(subLocations).where(eq(subLocations.locationId, id));
    await db.update(users).set({ locationId: null }).where(eq(users.locationId, id));

    await db.delete(locations).where(eq(locations.id, id));

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      module: 'Organization Settings',
      recordType: 'location',
      recordId: String(id),
      comments: `Deleted location #${id}: ${loc.name} (${loc.code})`,
    });

    res.json({ success: true, message: `Area/Location "${loc.name}" removed successfully.` });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: error.message || 'Failed to delete location' });
  }
});

// POST /api/masterdata/sublocations - Add sub-location
router.post('/sublocations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can create sub-locations.' });
    }
    const { locationId, name, code } = req.body;
    if (!locationId || !name) {
      return res.status(400).json({ error: 'Location ID and sub-location name are required.' });
    }

    const [sub] = await db.insert(subLocations).values({
      locationId: Number(locationId),
      name: name.trim(),
      code: (code || name.substring(0, 4)).toUpperCase().trim(),
    }).returning();

    res.status(201).json(sub);
  } catch (error: any) {
    console.error('Error creating sub-location:', error);
    res.status(500).json({ error: error.message || 'Failed to create sub-location' });
  }
});

// DELETE /api/masterdata/sublocations/:id
router.delete('/sublocations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can delete sub-locations.' });
    }
    const id = Number(req.params.id);
    await db.delete(subLocations).where(eq(subLocations.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sub-location:', error);
    res.status(500).json({ error: error.message || 'Failed to delete sub-location' });
  }
});

// POST /api/masterdata/users - Add user and email address
router.post('/users', requireAuth, async (req: AuthRequest, res) => {
  try {
    const adminUser = req.dbUser!;
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can add new users.' });
    }

    const { email, fullName, role, departmentId, locationId, jobTitle, isActive } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const [existing] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing) {
      return res.status(400).json({ error: `A user with email "${cleanEmail}" already exists.` });
    }

    const generatedUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cleanRole = role && ['admin', 'rgl', 'rp', 'viewer'].includes(role) ? role : 'rp';
    const cleanFullName = fullName?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    const [newUser] = await db.insert(users).values({
      uid: generatedUid,
      email: cleanEmail,
      fullName: cleanFullName,
      role: cleanRole,
      departmentId: departmentId ? Number(departmentId) : null,
      locationId: locationId ? Number(locationId) : null,
      jobTitle: jobTitle?.trim() || (cleanRole === 'admin' ? 'EHS Director' : cleanRole === 'rgl' ? 'EHS Supervisor' : 'EHS Officer'),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    }).returning();

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'CREATE',
      module: 'User Management',
      recordType: 'user',
      recordId: String(newUser.id),
      comments: `Admin added user #${newUser.id} (${newUser.email}) with role ${newUser.role}`,
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: error.message || 'Failed to add user' });
  }
});

// PUT /api/masterdata/users/:id - Update user, role, email, and permissions
router.put('/users/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const adminUser = req.dbUser!;
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can update user roles and permissions.' });
    }

    const userId = Number(req.params.id);
    const { email, role, departmentId, locationId, jobTitle, isActive, fullName } = req.body;

    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    let cleanEmail = existing.email;
    if (email && email.toLowerCase().trim() !== existing.email) {
      cleanEmail = email.toLowerCase().trim();
      if (!cleanEmail.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      const duplicate = await db.select().from(users).where(and(eq(users.email, cleanEmail), ne(users.id, userId))).limit(1);
      if (duplicate.length > 0) {
        return res.status(400).json({ error: `Email address "${cleanEmail}" is already used by another user.` });
      }
    }

    const [updatedUser] = await db.update(users).set({
      email: cleanEmail,
      role: role !== undefined ? role : undefined,
      departmentId: departmentId !== undefined ? (departmentId ? Number(departmentId) : null) : undefined,
      locationId: locationId !== undefined ? (locationId ? Number(locationId) : null) : undefined,
      jobTitle: jobTitle !== undefined ? jobTitle : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      fullName: fullName !== undefined ? fullName : undefined,
    }).where(eq(users.id, userId)).returning();

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'UPDATE',
      module: 'User Management',
      recordType: 'user',
      recordId: String(userId),
      comments: `Admin updated user #${userId} (${updatedUser.email}): role=${updatedUser.role}`,
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// DELETE /api/masterdata/users/:id - Delete or archive user email and access
router.delete('/users/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const adminUser = req.dbUser!;
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only Administrators can delete users.' });
    }

    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === adminUser.id) {
      return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
    }

    if (targetUser.role === 'admin') {
      const allAdmins = await db.select().from(users).where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
      if (allAdmins.length <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only active System Administrator.' });
      }
    }

    // Clean up dependent notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // Nullify non-critical foreign keys where user ID is optional
    await db.update(auditEvents).set({ userId: null }).where(eq(auditEvents.userId, userId));
    await db.update(meetingAttendees).set({ userId: null }).where(eq(meetingAttendees.userId, userId));

    // Try hard delete first; if historical relations exist, gracefully archive/deactivate
    let deleteMode = 'hard_delete';
    try {
      await db.delete(users).where(eq(users.id, userId));
    } catch (fkErr: any) {
      deleteMode = 'archived_deactivated';
      const archivedEmail = `archived_${userId}_${Date.now()}@removed.local`;
      await db.update(users).set({
        email: archivedEmail,
        fullName: `[Deactivated] ${targetUser.fullName}`,
        isActive: false,
        jobTitle: 'Deactivated User',
      }).where(eq(users.id, userId));
    }

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'DELETE',
      module: 'User Management',
      recordType: 'user',
      recordId: String(userId),
      comments: `Admin deleted user #${userId} (${targetUser.email}, ${targetUser.fullName}) [mode: ${deleteMode}]`,
    });

    res.json({
      success: true,
      message: deleteMode === 'hard_delete'
        ? `User account and email address (${targetUser.email}) were completely removed.`
        : `User email removed and account deactivated. Historical compliance records were preserved for audit.`,
      mode: deleteMode,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

// GET /api/masterdata/audit
router.get('/audit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { module, action, search } = req.query;

    const list = await db.query.auditEvents.findMany({
      orderBy: [desc(auditEvents.id)],
      limit: 200,
    });

    let filtered = list;
    if (module) {
      filtered = filtered.filter(a => a.module === String(module));
    }
    if (action) {
      filtered = filtered.filter(a => a.action === String(action));
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(a =>
        a.recordId.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        (a.comments && a.comments.toLowerCase().includes(q))
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to retrieve audit trail' });
  }
});

// GET /api/masterdata/notifications
router.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    const notifs = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      orderBy: [desc(notifications.id)],
      limit: 50,
    });
    res.json(notifs);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// POST /api/masterdata/notifications/:id/read
router.post('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/masterdata/notifications/read-all
router.post('/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.dbUser!;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// POST /api/masterdata/automation/run-reminders
router.post('/automation/run-reminders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await processOverdueActions();
    res.json(result);
  } catch (error) {
    console.error('Error running reminders:', error);
    res.status(500).json({ error: 'Failed to run overdue reminder cycle' });
  }
});

export default router;
