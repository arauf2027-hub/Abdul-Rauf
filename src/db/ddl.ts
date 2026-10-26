export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Apex Industrial Group',
  logo_url TEXT DEFAULT '',
  trir_multiplier INTEGER NOT NULL DEFAULT 200000,
  ltifr_multiplier INTEGER NOT NULL DEFAULT 1000000,
  total_hours_worked INTEGER NOT NULL DEFAULT 750000,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  location_type TEXT NOT NULL DEFAULT 'Plant',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS sub_locations (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'rp',
  department_id INTEGER REFERENCES departments(id),
  location_id INTEGER REFERENCES locations(id),
  job_title TEXT DEFAULT 'EHS Officer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_type TEXT NOT NULL,
  occurrence_date TEXT NOT NULL,
  occurrence_time TEXT NOT NULL,
  reported_at TIMESTAMP DEFAULT NOW() NOT NULL,
  reported_by_user_id INTEGER NOT NULL REFERENCES users(id),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  sub_location_id INTEGER REFERENCES sub_locations(id),
  event_category TEXT NOT NULL DEFAULT 'Safety',
  actual_consequence TEXT NOT NULL,
  potential_consequence TEXT NOT NULL,
  immediate_actions_taken TEXT NOT NULL,
  persons_involved TEXT DEFAULT '',
  witnesses TEXT DEFAULT '',
  injury_or_environmental_details TEXT DEFAULT '',
  initial_risk_classification TEXT NOT NULL DEFAULT 'Medium',
  potential_risk_classification TEXT NOT NULL DEFAULT 'High',
  status TEXT NOT NULL DEFAULT 'Reported',
  assigned_rgl_id INTEGER REFERENCES users(id),
  assigned_rp_id INTEGER REFERENCES users(id),
  investigation_due_date TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id SERIAL PRIMARY KEY,
  report_id TEXT NOT NULL UNIQUE,
  event_id INTEGER NOT NULL REFERENCES events(id),
  assigned_rp_id INTEGER NOT NULL REFERENCES users(id),
  reviewing_rgl_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Open',
  investigation_start_date TEXT NOT NULL,
  investigation_due_date TEXT NOT NULL,
  sequence_of_events TEXT NOT NULL DEFAULT '',
  immediate_causes TEXT NOT NULL DEFAULT '',
  contributing_factors TEXT NOT NULL DEFAULT '',
  failed_or_missing_controls TEXT NOT NULL DEFAULT '',
  final_root_cause TEXT NOT NULL DEFAULT '',
  root_cause_category TEXT DEFAULT 'Procedures & Compliance',
  rp_submission_status TEXT NOT NULL DEFAULT 'Draft',
  rp_submitted_at TIMESTAMP,
  rgl_review_status TEXT NOT NULL DEFAULT 'Pending',
  rgl_review_comments TEXT DEFAULT '',
  rgl_reviewed_at TIMESTAMP,
  approval_date TEXT DEFAULT '',
  closure_date TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS five_whys (
  id SERIAL PRIMARY KEY,
  incident_report_id INTEGER NOT NULL REFERENCES incident_reports(id),
  why_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  evidence TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS key_findings (
  id SERIAL PRIMARY KEY,
  incident_report_id INTEGER NOT NULL REFERENCES incident_reports(id),
  finding_ref TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT DEFAULT '',
  significance TEXT NOT NULL DEFAULT 'Medium',
  recommended_action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS action_items (
  id SERIAL PRIMARY KEY,
  action_id TEXT NOT NULL UNIQUE,
  source_module TEXT NOT NULL DEFAULT 'Incident',
  source_record_id TEXT NOT NULL DEFAULT '',
  source_event_id INTEGER REFERENCES events(id),
  source_incident_report_id INTEGER REFERENCES incident_reports(id),
  source_finding_id INTEGER REFERENCES key_findings(id),
  observation_finding TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'Corrective',
  responsible_department_id INTEGER NOT NULL REFERENCES departments(id),
  responsible_person_id INTEGER NOT NULL REFERENCES users(id),
  responsible_group_leader_id INTEGER NOT NULL REFERENCES users(id),
  priority TEXT NOT NULL DEFAULT 'Medium',
  risk_classification TEXT NOT NULL DEFAULT 'Medium',
  target_date TEXT NOT NULL,
  rp_action_details TEXT DEFAULT '',
  completion_evidence TEXT DEFAULT '',
  rp_submission_date TEXT DEFAULT '',
  rgl_review_comments TEXT DEFAULT '',
  rgl_approval_decision TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open',
  actual_completion_date TEXT DEFAULT '',
  closure_date TEXT DEFAULT '',
  verification_evidence TEXT DEFAULT '',
  escalation_level INTEGER NOT NULL DEFAULT 0,
  last_reminder_date TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS hazard_reports (
  id SERIAL PRIMARY KEY,
  hazard_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  reported_by_user_id INTEGER NOT NULL REFERENCES users(id),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  sub_location_id INTEGER REFERENCES sub_locations(id),
  observation_type TEXT NOT NULL DEFAULT 'Unsafe Condition',
  hazard_classification TEXT NOT NULL DEFAULT 'Physical / Mechanical',
  description TEXT NOT NULL,
  risk_rating TEXT NOT NULL DEFAULT 'Medium',
  immediate_action TEXT DEFAULT '',
  recommended_action TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS inspection_events (
  id SERIAL PRIMARY KEY,
  inspection_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  inspection_type TEXT NOT NULL DEFAULT 'Routine HSE Inspection',
  scheduled_date TEXT NOT NULL,
  completed_date TEXT DEFAULT '',
  area_covered TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  lead_inspector_id INTEGER NOT NULL REFERENCES users(id),
  team_members TEXT NOT NULL DEFAULT '[]',
  checklist_name TEXT NOT NULL DEFAULT 'Comprehensive Workplace HSE Checklist',
  summary TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Planned',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS inspection_observations (
  id SERIAL PRIMARY KEY,
  observation_id TEXT NOT NULL UNIQUE,
  inspection_event_id INTEGER NOT NULL REFERENCES inspection_events(id),
  observation_date TEXT NOT NULL,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  sub_location_id INTEGER REFERENCES sub_locations(id),
  observation_type TEXT NOT NULL DEFAULT 'Unsafe Condition',
  hazard_classification TEXT NOT NULL DEFAULT 'Mechanical',
  description TEXT NOT NULL,
  risk_rating TEXT NOT NULL DEFAULT 'Medium',
  recommended_action TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  responsible_person_id INTEGER REFERENCES users(id),
  responsible_group_leader_id INTEGER REFERENCES users(id),
  target_date TEXT DEFAULT '',
  linked_action_id INTEGER REFERENCES action_items(id),
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  meeting_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'Monthly HSE Meeting',
  date_time TEXT NOT NULL,
  venue TEXT NOT NULL DEFAULT 'Main Conference Room / Teams',
  department_id INTEGER REFERENCES departments(id),
  chairperson_id INTEGER NOT NULL REFERENCES users(id),
  organizer_id INTEGER NOT NULL REFERENCES users(id),
  agenda TEXT NOT NULL DEFAULT '',
  topics_discussed TEXT DEFAULT '',
  minutes_of_meeting TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id),
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  department TEXT DEFAULT '',
  is_external BOOLEAN NOT NULL DEFAULT false,
  attended BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,
  training_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  training_type TEXT NOT NULL DEFAULT 'Planned',
  category TEXT NOT NULL DEFAULT 'Occupational Safety',
  trainer_name TEXT NOT NULL,
  planned_date TEXT NOT NULL,
  actual_date TEXT DEFAULT '',
  venue TEXT NOT NULL DEFAULT 'Training Center Room 1',
  department_id INTEGER NOT NULL REFERENCES departments(id),
  agenda TEXT DEFAULT '',
  learning_objectives TEXT DEFAULT '',
  validity_period_months INTEGER NOT NULL DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'Planned',
  evaluation_feedback TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS training_attendance (
  id SERIAL PRIMARY KEY,
  training_session_id INTEGER NOT NULL REFERENCES training_sessions(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  attended BOOLEAN NOT NULL DEFAULT false,
  score INTEGER DEFAULT 0,
  competency_result TEXT NOT NULL DEFAULT 'Pending',
  refresher_due_date TEXT DEFAULT '',
  feedback_notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_drills (
  id SERIAL PRIMARY KEY,
  drill_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  drill_type TEXT NOT NULL DEFAULT 'Fire Drill',
  planned_date TEXT NOT NULL,
  actual_date TEXT DEFAULT '',
  location_id INTEGER NOT NULL REFERENCES locations(id),
  scenario_description TEXT NOT NULL,
  objectives TEXT NOT NULL,
  drill_controller_id INTEGER NOT NULL REFERENCES users(id),
  evaluator_id INTEGER NOT NULL REFERENCES users(id),
  alarm_activation_time TEXT DEFAULT '10:00',
  evacuation_start_time TEXT DEFAULT '10:01',
  evacuation_completion_time TEXT DEFAULT '10:05',
  muster_completion_time TEXT DEFAULT '10:07',
  total_evacuation_minutes INTEGER DEFAULT 4,
  target_evacuation_minutes INTEGER NOT NULL DEFAULT 5,
  participant_count INTEGER NOT NULL DEFAULT 0,
  unaccounted_count INTEGER NOT NULL DEFAULT 0,
  performance_evaluation TEXT NOT NULL DEFAULT 'Satisfactory',
  key_observations TEXT DEFAULT '',
  findings TEXT DEFAULT '',
  lessons_learned TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Planned',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  document_id TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by_user_id INTEGER NOT NULL REFERENCES users(id),
  linked_module TEXT NOT NULL DEFAULT 'Repository',
  linked_record_id TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  user_email TEXT NOT NULL DEFAULT 'system',
  user_role TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  previous_values TEXT DEFAULT '',
  new_values TEXT DEFAULT '',
  comments TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ptw_permits (
  id SERIAL PRIMARY KEY,
  permit_number TEXT NOT NULL UNIQUE,
  permit_types TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  location_id INTEGER NOT NULL REFERENCES locations(id),
  sub_location_id INTEGER REFERENCES sub_locations(id),
  specific_location TEXT NOT NULL,
  equipment_number TEXT DEFAULT '',
  department_id INTEGER NOT NULL REFERENCES departments(id),
  contractor_name TEXT DEFAULT '',
  lead_man_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  workers_count INTEGER NOT NULL DEFAULT 1,
  work_description TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  jsa_reference TEXT DEFAULT '',
  tbt_conducted BOOLEAN NOT NULL DEFAULT false,
  tbt_notes TEXT DEFAULT '',
  emergency_arrangements TEXT DEFAULT '',
  checklists TEXT NOT NULL DEFAULT '[]',
  additional_hazards TEXT DEFAULT '',
  additional_controls TEXT DEFAULT '',
  isolations TEXT NOT NULL DEFAULT '{}',
  gas_testing TEXT NOT NULL DEFAULT '{}',
  receiver_user_id INTEGER REFERENCES users(id),
  receiver_name TEXT NOT NULL,
  receiver_designation TEXT DEFAULT '',
  receiver_signature_date TIMESTAMP,
  receiver_acknowledged BOOLEAN NOT NULL DEFAULT false,
  issuer_user_id INTEGER REFERENCES users(id),
  issuer_name TEXT DEFAULT '',
  issuer_designation TEXT DEFAULT '',
  issuer_signature_date TIMESTAMP,
  issuer_remarks TEXT DEFAULT '',
  ehs_user_id INTEGER REFERENCES users(id),
  ehs_name TEXT DEFAULT '',
  ehs_verified BOOLEAN NOT NULL DEFAULT false,
  ehs_remarks TEXT DEFAULT '',
  completion_status TEXT DEFAULT '',
  housekeeping_done BOOLEAN NOT NULL DEFAULT false,
  tools_personnel_removed BOOLEAN NOT NULL DEFAULT false,
  de_isolation_electrical TEXT DEFAULT 'N/A',
  de_isolation_mechanical TEXT DEFAULT 'N/A',
  de_isolation_utilities TEXT DEFAULT 'N/A',
  ccr_notified BOOLEAN NOT NULL DEFAULT false,
  ccr_operator_name TEXT DEFAULT '',
  handback_date TIMESTAMP,
  closed_by_user_id INTEGER REFERENCES users(id),
  closure_date TIMESTAMP,
  closure_remarks TEXT DEFAULT '',
  cancellation_reason TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ptw_extensions (
  id SERIAL PRIMARY KEY,
  permit_id INTEGER NOT NULL REFERENCES ptw_permits(id),
  day_number INTEGER NOT NULL,
  extension_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  site_reinspected BOOLEAN NOT NULL DEFAULT false,
  gas_test_verified TEXT DEFAULT 'N/A',
  receiver_name TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Approved',
  remarks TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS electrical_isolation_certificates (
  id SERIAL PRIMARY KEY,
  certificate_number TEXT NOT NULL UNIQUE,
  ptw_id INTEGER REFERENCES ptw_permits(id),
  ptw_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  location_id INTEGER REFERENCES locations(id),
  department_id INTEGER REFERENCES departments(id),
  work_location TEXT NOT NULL,
  request_date TEXT NOT NULL,
  request_time TEXT NOT NULL,
  equipment_to_isolate TEXT NOT NULL,
  equipment_tag TEXT DEFAULT '',
  work_description TEXT NOT NULL,
  requestor_name TEXT NOT NULL,
  requestor_designation TEXT DEFAULT '',
  requestor_signature TEXT DEFAULT '',
  requestor_signature_date TIMESTAMP,
  approved_by_name TEXT DEFAULT '',
  approved_by_designation TEXT DEFAULT '',
  approved_by_signature TEXT DEFAULT '',
  approved_by_date TIMESTAMP,
  fuses_removed BOOLEAN NOT NULL DEFAULT false,
  main_switched_off BOOLEAN NOT NULL DEFAULT false,
  racked_out BOOLEAN NOT NULL DEFAULT false,
  padlocks_fitted BOOLEAN NOT NULL DEFAULT false,
  tags_fitted BOOLEAN NOT NULL DEFAULT false,
  electrical_points TEXT NOT NULL DEFAULT '[]',
  electrical_competent_name TEXT DEFAULT '',
  electrical_competent_designation TEXT DEFAULT '',
  electrical_competent_signature TEXT DEFAULT '',
  electrical_operator_signature TEXT DEFAULT '',
  electrical_isolation_date TIMESTAMP,
  other_points TEXT NOT NULL DEFAULT '[]',
  other_competent_name TEXT DEFAULT '',
  other_competent_designation TEXT DEFAULT '',
  other_competent_signature TEXT DEFAULT '',
  other_isolation_date TEXT DEFAULT '',
  other_isolation_time TEXT DEFAULT '',
  work_completion_person TEXT DEFAULT '',
  work_completion_signature TEXT DEFAULT '',
  work_completion_date TEXT DEFAULT '',
  work_completion_time TEXT DEFAULT '',
  completion_approved_by_name TEXT DEFAULT '',
  completion_approved_by_designation TEXT DEFAULT '',
  completion_approved_by_signature TEXT DEFAULT '',
  completion_approved_by_date TIMESTAMP,
  de_isolation_name TEXT DEFAULT '',
  de_isolation_designation TEXT DEFAULT '',
  de_isolation_signature TEXT DEFAULT '',
  de_isolation_date TEXT DEFAULT '',
  de_isolation_time TEXT DEFAULT '',
  ccr_operator_signature TEXT DEFAULT '',
  ccr_operator_date TIMESTAMP,
  cancellation_reason TEXT DEFAULT '',
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
`;
