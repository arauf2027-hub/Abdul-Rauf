import React, { useState } from 'react';
import {
  AlertTriangle,
  Building,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Factory,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { UsersView } from '../users/UsersView.tsx';
import { Department, Location } from '../../types/index.ts';

export const SettingsView: React.FC = () => {
  const { organization, departments, locations, subLocations, currentUser, users, refreshMasterData } = useAuth();
  const toast = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'org' | 'departments' | 'locations' | 'users'>('departments');

  // Org form state
  const [orgName, setOrgName] = useState(organization?.name || 'Power Cement Limited (PCL)');
  const [hoursWorked, setHoursWorked] = useState(organization?.totalHoursWorked || 750000);
  const [trirMult, setTrirMult] = useState(organization?.trirMultiplier || 200000);
  const [ltifrMult, setLtifrMult] = useState(organization?.ltifrMultiplier || 1000000);

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Location / Area Modal State
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState('Plant');
  const [locSearch, setLocSearch] = useState('');
  const [deletingLoc, setDeletingLoc] = useState<Location | null>(null);

  // Sub-location inline state
  const [expandedLocId, setExpandedLocId] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  // Handle Org Save
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      toast.warning('Only Administrators can modify organization parameters.');
      return;
    }

    try {
      await api.updateOrganization({
        name: orgName,
        totalHoursWorked: Number(hoursWorked),
        trirMultiplier: Number(trirMult),
        ltifrMultiplier: Number(ltifrMult),
      });

      await refreshMasterData();
      toast.success('Organization parameters updated successfully.');
    } catch (err: any) {
      toast.error('Error updating organization: ' + err.message);
    }
  };

  // Open Department Modal
  const openAddDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptDesc('');
    setShowDeptModal(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDesc(dept.description || '');
    setShowDeptModal(true);
  };

  // Save Department (Add or Edit)
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) {
      toast.warning('Department name and code are required.');
      return;
    }

    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, {
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
          description: deptDesc.trim(),
        });
        toast.success(`Department "${deptName}" updated successfully.`);
      } else {
        await api.createDepartment({
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
          description: deptDesc.trim(),
        });
        toast.success(`New department "${deptName}" created successfully.`);
      }

      setShowDeptModal(false);
      await refreshMasterData();
    } catch (err: any) {
      toast.error('Department error: ' + err.message);
    }
  };

  // Delete Department
  const handleDeleteDept = async () => {
    if (!deletingDept) return;
    try {
      const res = await api.deleteDepartment(deletingDept.id);
      toast.success(res.message || `Department "${deletingDept.name}" removed.`);
      setDeletingDept(null);
      await refreshMasterData();
    } catch (err: any) {
      toast.error('Failed to remove department: ' + err.message);
    }
  };

  // Open Location Modal
  const openAddLoc = () => {
    setEditingLoc(null);
    setLocName('');
    setLocCode('');
    setLocType('Plant');
    setShowLocModal(true);
  };

  const openEditLoc = (loc: Location) => {
    setEditingLoc(loc);
    setLocName(loc.name);
    setLocCode(loc.code);
    setLocType(loc.locationType || 'Plant');
    setShowLocModal(true);
  };

  // Save Location (Add or Edit)
  const handleSaveLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locCode.trim()) {
      toast.warning('Plant area name and code are required.');
      return;
    }

    try {
      if (editingLoc) {
        await api.updateLocation(editingLoc.id, {
          name: locName.trim(),
          code: locCode.trim().toUpperCase(),
          locationType: locType.trim(),
        });
        toast.success(`Plant / Area "${locName}" updated successfully.`);
      } else {
        await api.createLocation({
          name: locName.trim(),
          code: locCode.trim().toUpperCase(),
          locationType: locType.trim(),
        });
        toast.success(`New Area "${locName}" created successfully.`);
      }

      setShowLocModal(false);
      await refreshMasterData();
    } catch (err: any) {
      toast.error('Location error: ' + err.message);
    }
  };

  // Delete Location
  const handleDeleteLoc = async () => {
    if (!deletingLoc) return;
    try {
      const res = await api.deleteLocation(deletingLoc.id);
      toast.success(res.message || `Area "${deletingLoc.name}" removed.`);
      setDeletingLoc(null);
      await refreshMasterData();
    } catch (err: any) {
      toast.error('Failed to remove area: ' + err.message);
    }
  };

  // Sub-location handlers
  const handleAddSubLocation = async (locationId: number) => {
    if (!newSubName.trim()) {
      toast.warning('Sub-location name is required.');
      return;
    }

    try {
      await api.createSubLocation({
        locationId,
        name: newSubName.trim(),
        code: (newSubCode || newSubName.substring(0, 4)).trim().toUpperCase(),
      });
      setNewSubName('');
      setNewSubCode('');
      await refreshMasterData();
      toast.success('Sub-location zone added successfully.');
    } catch (err: any) {
      toast.error('Failed to add sub-location: ' + err.message);
    }
  };

  const handleDeleteSubLocation = async (subId: number) => {
    try {
      await api.deleteSubLocation(subId);
      await refreshMasterData();
      toast.success('Sub-location zone removed.');
    } catch (err: any) {
      toast.error('Failed to remove sub-location: ' + err.message);
    }
  };

  // Filtered lists
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  const filteredLocations = locations.filter((l) =>
    l.name.toLowerCase().includes(locSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(locSearch.toLowerCase()) ||
    l.locationType.toLowerCase().includes(locSearch.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-xs text-slate-200">
      {/* Settings Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>System Settings & Master Data Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage organizational departments, plant operational areas, user accounts & calculation parameters
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start md:self-auto flex-wrap">
          <button
            onClick={() => setActiveSubTab('departments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'departments'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Departments</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-emerald-300 font-bold border border-slate-700">
              {departments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('locations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'locations'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Areas & Plant Facilities</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-sky-300 font-bold border border-slate-700">
              {locations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('org')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'org'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Entity & Rates</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'users'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Access</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700">
              {users.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEPARTMENTS MANAGEMENT */}
      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span>Company Departments Directory</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Add new departments, update operational codes, or remove obsolete divisions
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    placeholder="Search departments..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
                  />
                </div>

                <button
                  onClick={openAddDept}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Department</span>
                </button>
              </div>
            </div>

            {/* Department Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Department Name</th>
                    <th className="py-3 px-4">Description / Mandate</th>
                    <th className="py-3 px-4 text-center">Active Users</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No departments found. Click "+ Add Department" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept) => {
                      const userCount = users.filter((u) => u.departmentId === dept.id).length;
                      return (
                        <tr key={dept.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {dept.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {dept.name}
                          </td>
                          <td className="py-3 px-4 text-slate-400 max-w-md truncate">
                            {dept.description || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300 font-medium">
                              {userCount} user{userCount === 1 ? '' : 's'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditDept(dept)}
                                className="p-1.5 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 rounded-lg transition-colors"
                                title="Edit Department"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingDept(dept)}
                                className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors"
                                title="Remove Department"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AREAS & PLANT FACILITIES MANAGEMENT */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Factory className="w-4 h-4 text-sky-400" />
                  <span>Plant Areas & Operational Facilities</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Change "Plant Alpha / Beta" to your facility names (e.g. Kiln Line 1, Raw Mill, Packing Plant), add new areas, or manage sub-zones
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                    placeholder="Search areas & plants..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 w-48 sm:w-60"
                  />
                </div>

                <button
                  onClick={openAddLoc}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Area / Facility</span>
                </button>
              </div>
            </div>

            {/* Areas List / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLocations.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800">
                  No areas found. Click "+ Add Area / Facility" to create one.
                </div>
              ) : (
                filteredLocations.map((loc) => {
                  const locSubs = subLocations.filter((s) => s.locationId === loc.id);
                  const isExpanded = expandedLocId === loc.id;
                  const locUsers = users.filter((u) => u.locationId === loc.id).length;

                  return (
                    <div
                      key={loc.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {loc.code}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                              {loc.locationType}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm">{loc.name}</h4>
                          <span className="text-[11px] text-slate-400">
                            {locUsers} assigned staff &bull; {locSubs.length} sub-zones
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditLoc(loc)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-sky-600/30 text-sky-300 border border-slate-700 hover:border-sky-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            title="Rename or change area details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Area</span>
                          </button>
                          <button
                            onClick={() => setDeletingLoc(loc)}
                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                            title="Remove area"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sub-locations collapsible */}
                      <div className="pt-2 border-t border-slate-850">
                        <button
                          onClick={() => setExpandedLocId(isExpanded ? null : loc.id)}
                          className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-white py-1"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <Layers className="w-3.5 h-3.5 text-sky-400" />
                            <span>Sub-Locations & Specific Zones ({locSubs.length})</span>
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                            {locSubs.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {locSubs.map((sub) => (
                                  <span
                                    key={sub.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                                  >
                                    <span className="font-semibold">{sub.name}</span>
                                    <span className="text-slate-500 font-mono text-[9px]">({sub.code})</span>
                                    <button
                                      onClick={() => handleDeleteSubLocation(sub.id)}
                                      className="text-slate-500 hover:text-rose-400 ml-1"
                                      title="Remove zone"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic">No sub-locations defined for this area yet.</p>
                            )}

                            {/* Add Sub-location input */}
                            <div className="pt-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={newSubName}
                                onChange={(e) => setNewSubName(e.target.value)}
                                placeholder="New zone (e.g. Kiln Preheater, Silo 4)..."
                                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                              />
                              <input
                                type="text"
                                value={newSubCode}
                                onChange={(e) => setNewSubCode(e.target.value)}
                                placeholder="Code"
                                className="w-16 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white uppercase focus:outline-none focus:border-sky-500"
                              />
                              <button
                                onClick={() => handleAddSubLocation(loc.id)}
                                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs transition-colors"
                              >
                                Add Zone
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ENTITY & STATUTORY RATE PARAMETERS */}
      {activeSubTab === 'org' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Building className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                Corporate Safety & Statutory Calculation Basis
              </h3>
            </div>

            <form onSubmit={handleSaveOrg} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Organization Display Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Total Cumulative Hours Worked (Current Cycle)</label>
                <input
                  type="number"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  Directly divides recordables and lost-time injuries in TRIR and LTIFR safety computations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">TRIR Multiplier (OSHA)</label>
                  <input
                    type="number"
                    value={trirMult}
                    onChange={(e) => setTrirMult(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">Standard: 200,000</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">LTIFR Multiplier (ISO)</label>
                  <input
                    type="number"
                    value={ltifrMult}
                    onChange={(e) => setLtifrMult(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">Standard: 1,000,000</p>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Formula Parameters</span>
              </button>
            </form>
          </div>

          {/* Quick Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                Master Data Summary
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">{departments.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Configured Departments</div>
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-sky-400">{locations.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Operating Plant Areas</div>
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-purple-400">{subLocations.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Sub-Zones / Units</div>
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-amber-400">{users.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">EHS Personnel Accounts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER & ROLE ACCESS */}
      {activeSubTab === 'users' && (
        <div className="-mx-6 lg:-mx-8">
          <UsersView />
        </div>
      )}

      {/* DEPARTMENT ADD/EDIT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>{editingDept ? 'Edit Department' : 'Add New Department'}</span>
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Quality Control & Assurance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Department Code *</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. QC, OPS, EHS, MNT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white uppercase focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Description / Scope</label>
                <textarea
                  rows={2}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Scope of department responsibility..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT DELETE CONFIRMATION MODAL */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-bold text-white">Remove Department?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove <strong className="text-white">"{deletingDept.name}" ({deletingDept.code})</strong>?
              Assigned personnel will be unlinked gracefully.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingDept(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDept}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs"
              >
                Yes, Remove Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AREA / LOCATION ADD/EDIT MODAL */}
      {showLocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Factory className="w-4 h-4 text-sky-400" />
                <span>{editingLoc ? 'Edit Area / Plant Facility' : 'Add New Plant Area'}</span>
              </h3>
              <button onClick={() => setShowLocModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoc} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Area / Facility Name *</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Kiln Line 1 - Pyroprocessing, Packing Plant, Quarry..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-500">
                  Change default plant names to your real operational sections
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Area Code *</label>
                  <input
                    type="text"
                    required
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value)}
                    placeholder="e.g. KLN-1, PKG, QRY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white uppercase focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Facility Type</label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Plant">Plant</option>
                    <option value="Production Line">Production Line</option>
                    <option value="Quarry & Mining">Quarry & Mining</option>
                    <option value="Packaging & Dispatch">Packaging & Dispatch</option>
                    <option value="Power Plant">Power Plant</option>
                    <option value="Workshop & Warehouse">Workshop & Warehouse</option>
                    <option value="Administrative Office">Administrative Office</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {editingLoc ? 'Update Area' : 'Create Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AREA DELETE CONFIRMATION MODAL */}
      {deletingLoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-sm font-bold text-white">Remove Area / Facility?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove <strong className="text-white">"{deletingLoc.name}" ({deletingLoc.code})</strong>?
              Associated sub-location zones and personnel assignments will be unlinked.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingLoc(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLoc}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs"
              >
                Yes, Remove Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
