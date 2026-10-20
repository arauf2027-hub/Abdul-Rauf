import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, Filter, Plus, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { HazardReport } from '../../types/index.ts';

export const HazardsView: React.FC = () => {
  const { currentUser, departments, locations, users } = useAuth();
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [observationType, setObservationType] = useState('Unsafe Condition');
  const [hazardClassification, setHazardClassification] = useState('Physical / Mechanical');
  const [riskRating, setRiskRating] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [deptId, setDeptId] = useState('');
  const [locId, setLocId] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [autoCreateAction, setAutoCreateAction] = useState(true);
  const [rpId, setRpId] = useState('');

  const loadHazards = async () => {
    try {
      setLoading(true);
      const data = await api.getHazards();
      setHazards(data);
    } catch (err) {
      console.error('Failed to load hazards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHazards();
  }, []);

  const handleCreateHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deptId || !locId) {
      alert('Please fill mandatory fields.');
      return;
    }

    try {
      await api.createHazard({
        title,
        description,
        observationType,
        hazardClassification,
        riskRating,
        departmentId: deptId,
        locationId: locId,
        immediateAction,
        recommendedAction,
        createAction: autoCreateAction,
        responsiblePersonId: rpId || undefined,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await loadHazards();
      alert('Hazard report filed with unique Hazard ID!');
    } catch (err: any) {
      alert('Failed to report hazard: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Hazard & Safety Observations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Proactive frontline reporting of unsafe acts, unsafe conditions, and good practices
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report Hazard Observation</span>
        </button>
      </div>

      {/* Hazards Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Hazard ID</th>
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-4">Observation Type</th>
                <th className="py-3 px-4">Department & Location</th>
                <th className="py-3 px-4">Risk Rating</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {hazards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No standalone hazard reports recorded yet.
                  </td>
                </tr>
              ) : (
                hazards.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{h.hazardId}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-white">{h.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{h.description}</div>
                    </td>
                    <td className="py-3 px-4">{h.observationType}</td>
                    <td className="py-3 px-4">
                      <div>{h.department?.name}</div>
                      <div className="text-[11px] text-slate-500">{h.location?.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {h.riskRating}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{h.reportedBy?.fullName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Report Proactive Safety Hazard</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHazard} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Observation Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Oil slick accumulated beneath Hydraulic Press #3"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Detailed Description *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you observe? Exact equipment or walkway affected..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Observation Type</label>
                  <select
                    value={observationType}
                    onChange={(e) => setObservationType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="Unsafe Condition">Unsafe Condition</option>
                    <option value="Unsafe Act">Unsafe Act</option>
                    <option value="Non-conformity">Non-conformity</option>
                    <option value="Good Practice">Good Practice</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Risk Rating</label>
                  <select
                    value={riskRating}
                    onChange={(e: any) => setRiskRating(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Department *</label>
                  <select
                    required
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Location *</label>
                  <select
                    required
                    value={locId}
                    onChange={(e) => setLocId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Immediate Action Taken</label>
                <input
                  type="text"
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  placeholder="e.g. Absorbent pads placed, warning cone placed"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Recommended Corrective Action</label>
                <input
                  type="text"
                  value={recommendedAction}
                  onChange={(e) => setRecommendedAction(e.target.value)}
                  placeholder="e.g. Replace hydraulic seal on hose coupling"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateAction}
                    onChange={(e) => setAutoCreateAction(e.target.checked)}
                  />
                  <span>Create Linked Central CAPA Action</span>
                </label>
                {autoCreateAction && (
                  <select
                    value={rpId}
                    onChange={(e) => setRpId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-xs"
                  >
                    <option value="">Assign Responsible Person (RP)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold"
                >
                  Submit Hazard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
