export interface User {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  role: 'admin' | 'rgl' | 'rp' | 'viewer';
  departmentId: number | null;
  locationId: number | null;
  jobTitle: string | null;
  isActive: boolean;
  department?: Department;
  location?: Location;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Location {
  id: number;
  name: string;
  code: string;
  locationType: string;
}

export interface SubLocation {
  id: number;
  locationId: number;
  name: string;
  code: string;
}

export interface Organization {
  id: number;
  name: string;
  logoUrl?: string;
  trirMultiplier: number;
  ltifrMultiplier: number;
  totalHoursWorked: number;
}

export interface EventItem {
  id: number;
  eventId: string;
  title: string;
  description?: string;
  eventType: string;
  occurrenceDate: string;
  occurrenceTime: string;
  reportedAt: string;
  reportedByUserId: number;
  departmentId: number;
  locationId: number;
  subLocationId?: number | null;
  eventCategory: string;
  actualConsequence: string;
  potentialConsequence: string;
  immediateActionsTaken: string;
  personsInvolved?: string;
  witnesses?: string;
  injuryOrEnvironmentalDetails?: string;
  initialRiskClassification: 'Low' | 'Medium' | 'High' | 'Critical';
  potentialRiskClassification: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Reported' | 'Under Investigation' | 'Under Review' | 'Approved' | 'Closed';
  assignedRglId?: number | null;
  assignedRpId?: number | null;
  investigationDueDate?: string;
  department?: Department;
  location?: Location;
  reportedBy?: User;
  assignedRgl?: User;
  assignedRp?: User;
}

export interface WhyItem {
  id?: number;
  whyNumber: number;
  question: string;
  answer: string;
  evidence?: string;
}

export interface FindingItem {
  id?: number;
  findingRef: string;
  description: string;
  evidence?: string;
  significance: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendedAction: string;
}

export interface IncidentReport {
  id: number;
  reportId: string;
  eventId: number;
  assignedRpId: number;
  reviewingRglId: number;
  status: 'Open' | 'Under Review' | 'Returned for Correction' | 'Approved' | 'Closed';
  investigationStartDate: string;
  investigationDueDate: string;
  sequenceOfEvents: string;
  immediateCauses: string;
  contributingFactors: string;
  failedOrMissingControls: string;
  finalRootCause: string;
  rootCauseCategory: string;
  rpSubmissionStatus: string;
  rpSubmittedAt?: string | null;
  rglReviewStatus: string;
  rglReviewComments?: string;
  rglReviewedAt?: string | null;
  approvalDate?: string;
  closureDate?: string;
  whys: WhyItem[];
  findings: FindingItem[];
  assignedRp?: User;
  reviewingRgl?: User;
}

export interface ActionItem {
  id: number;
  actionId: string;
  sourceModule: string;
  sourceRecordId: string;
  sourceEventId?: number | null;
  sourceIncidentReportId?: number | null;
  sourceFindingId?: number | null;
  observationFinding: string;
  recommendedAction: string;
  actionType: 'Corrective' | 'Preventive' | 'Improvement';
  responsibleDepartmentId: number;
  responsiblePersonId: number;
  responsibleGroupLeaderId: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  riskClassification: 'Low' | 'Medium' | 'High' | 'Critical';
  targetDate: string;
  rpActionDetails?: string;
  completionEvidence?: string;
  rpSubmissionDate?: string;
  rglReviewComments?: string;
  rglApprovalDecision?: string;
  status: 'Open' | 'In Progress' | 'Submitted for Review' | 'Returned for Correction' | 'Approved' | 'Closed';
  actualCompletionDate?: string;
  closureDate?: string;
  verificationEvidence?: string;
  escalationLevel: number;
  lastReminderDate?: string;
  isOverdue?: boolean;
  overdueDays?: number;
  department?: Department;
  responsiblePerson?: User;
  responsibleGroupLeader?: User;
}

export interface InspectionEvent {
  id: number;
  inspectionId: string;
  title: string;
  inspectionType: string;
  scheduledDate: string;
  completedDate?: string;
  areaCovered: string;
  departmentId: number;
  locationId: number;
  leadInspectorId: number;
  teamMembers: string;
  checklistName: string;
  summary?: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Closed';
  observationsCount?: number;
  highRiskCount?: number;
  department?: Department;
  location?: Location;
  leadInspector?: User;
}

export interface InspectionObservation {
  id: number;
  observationId: string;
  inspectionEventId: number;
  observationDate: string;
  locationId: number;
  subLocationId?: number | null;
  observationType: string;
  hazardClassification: string;
  description: string;
  riskRating: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendedAction: string;
  departmentId: number;
  responsiblePersonId?: number | null;
  responsibleGroupLeaderId?: number | null;
  targetDate?: string;
  linkedActionId?: number | null;
  status: string;
  department?: Department;
  responsiblePerson?: User;
  responsibleGroupLeader?: User;
}

export interface HazardReport {
  id: number;
  hazardId: string;
  title: string;
  reportedByUserId: number;
  departmentId: number;
  locationId: number;
  subLocationId?: number | null;
  observationType: string;
  hazardClassification: string;
  description: string;
  riskRating: 'Low' | 'Medium' | 'High' | 'Critical';
  severity?: number;
  likelihood?: number;
  immediateAction?: string;
  recommendedAction?: string;
  status: 'Open' | 'In Progress' | 'Closed';
  reportedBy?: User;
  department?: Department;
  location?: Location;
}

export interface Meeting {
  id: number;
  meetingId: string;
  title: string;
  meetingType: string;
  dateTime: string;
  venue: string;
  departmentId?: number | null;
  chairpersonId: number;
  organizerId: number;
  agenda: string;
  topicsDiscussed?: string;
  minutesOfMeeting?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  attendeesCount?: number;
  actualAttendedCount?: number;
  actionsCount?: number;
  chairperson?: User;
  organizer?: User;
  department?: Department;
}

export interface MeetingAttendee {
  id: number;
  meetingId: number;
  userId?: number | null;
  name: string;
  email?: string;
  department?: string;
  isExternal: boolean;
  attended: boolean;
  user?: User;
}

export interface TrainingSession {
  id: number;
  trainingId: string;
  title: string;
  trainingType: string;
  category: string;
  trainerName: string;
  plannedDate: string;
  actualDate?: string;
  venue: string;
  departmentId: number;
  agenda?: string;
  learningObjectives?: string;
  validityPeriodMonths: number;
  status: 'Planned' | 'Completed' | 'Cancelled';
  evaluationFeedback?: string;
  plannedParticipants?: number;
  actualParticipants?: number;
  passedParticipants?: number;
  completionRate?: number;
  department?: Department;
}

export interface TrainingAttendance {
  id: number;
  trainingSessionId: number;
  userId: number;
  attended: boolean;
  score?: number;
  competencyResult: 'Pending' | 'Pass' | 'Fail' | 'Needs Refresher';
  refresherDueDate?: string;
  feedbackNotes?: string;
  user?: User;
}

export interface EmergencyDrill {
  id: number;
  drillId: string;
  title: string;
  drillType: string;
  plannedDate: string;
  actualDate?: string;
  locationId: number;
  scenarioDescription: string;
  objectives: string;
  drillControllerId: number;
  evaluatorId: number;
  alarmActivationTime?: string;
  evacuationStartTime?: string;
  evacuationCompletionTime?: string;
  musterCompletionTime?: string;
  totalEvacuationMinutes?: number;
  targetEvacuationMinutes: number;
  participantCount: number;
  unaccountedCount: number;
  performanceEvaluation: 'Satisfactory' | 'Needs Improvement' | 'Unsatisfactory';
  keyObservations?: string;
  findings?: string;
  lessonsLearned?: string;
  status: 'Planned' | 'Completed' | 'Evaluated' | 'Closed';
  actionsCount?: number;
  openActionsCount?: number;
  location?: Location;
  drillController?: User;
  evaluator?: User;
}

export interface DocumentItem {
  id: number;
  documentId: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedByUserId: number;
  linkedModule: string;
  linkedRecordId: string;
  description?: string;
  tags?: string;
  createdAt: string;
  uploadedBy?: User;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  recordType: string;
  recordId: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditEventItem {
  id: number;
  userId?: number | null;
  userEmail: string;
  userRole: string;
  action: string;
  module: string;
  recordType: string;
  recordId: string;
  previousValues?: string;
  newValues?: string;
  comments?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// PERMIT-TO-WORK (PTW) MODULE TYPES
// -------------------------------------------------------------
export type PermitType = 'Cold Work' | 'Hot Work' | 'Confined Space Entry' | 'Lifting Activity' | 'Work at Height';

export type PermitStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Suspended'
  | 'Extended'
  | 'Work Completed'
  | 'Closed'
  | 'Cancelled';

export interface PtwChecklistItem {
  id: string;
  category: string;
  label: string;
  status: 'Yes' | 'No' | 'N/A';
  notes?: string;
  isMandatory?: boolean;
}

export interface PtwIsolationItem {
  required: 'Yes' | 'No' | 'N/A';
  equipmentTag?: string;
  lockNumber?: string;
  isolatedBy?: string;
  verifiedBy?: string;
  permitRef?: string;
}

export interface PtwIsolations {
  electrical: PtwIsolationItem;
  mechanical: PtwIsolationItem;
  utilities: PtwIsolationItem;
  production: PtwIsolationItem;
}

export interface PtwGasTesting {
  testedBy?: string;
  testTime?: string;
  oxygen?: string; // % (19.5 - 23.5)
  lel?: string;    // % (<10)
  co?: string;     // ppm (<25)
  h2s?: string;    // ppm (<10)
  result?: 'Safe to Enter' | 'Safe for Hot Work' | 'Unsafe';
  notes?: string;
}

export interface PtwExtension {
  id: number;
  permitId: number;
  dayNumber: number; // 2 through 7
  extensionDate: string;
  startTime: string;
  endTime: string;
  siteReinspected: boolean;
  gasTestVerified: string;
  receiverName: string;
  issuerName: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  remarks?: string;
  createdAt?: string;
}

export interface PtwPermit {
  id: number;
  permitNumber: string;
  permitTypes: PermitType[];
  status: PermitStatus;
  locationId: number;
  subLocationId?: number | null;
  specificLocation: string;
  equipmentNumber: string;
  departmentId: number;
  contractorName: string;
  leadManName: string;
  contactNumber: string;
  workersCount: number;
  workDescription: string;
  issueDate: string;
  validFrom: string;
  validTo: string;
  jsaReference: string;
  tbtConducted: boolean;
  tbtNotes: string;
  emergencyArrangements: string;
  checklists: PtwChecklistItem[];
  additionalHazards: string;
  additionalControls: string;
  isolations: PtwIsolations;
  gasTesting: PtwGasTesting;
  receiverUserId?: number | null;
  receiverName: string;
  receiverDesignation: string;
  receiverSignatureDate?: string | null;
  receiverAcknowledged: boolean;
  issuerUserId?: number | null;
  issuerName?: string;
  issuerDesignation?: string;
  issuerSignatureDate?: string | null;
  issuerRemarks?: string;
  ehsUserId?: number | null;
  ehsName?: string;
  ehsVerified: boolean;
  ehsRemarks?: string;
  completionStatus?: string;
  housekeepingDone: boolean;
  toolsPersonnelRemoved: boolean;
  deIsolationElectrical: 'Yes' | 'No' | 'N/A';
  deIsolationMechanical: 'Yes' | 'No' | 'N/A';
  deIsolationUtilities: 'Yes' | 'No' | 'N/A';
  ccrNotified: boolean;
  ccrOperatorName: string;
  handbackDate?: string | null;
  closedByUserId?: number | null;
  closureDate?: string | null;
  closureRemarks?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  // Joins
  location?: Location;
  subLocation?: SubLocation;
  department?: Department;
  receiver?: User;
  issuer?: User;
  extensions?: PtwExtension[];
}

export type EicStatus =
  | 'Draft'
  | 'Submitted for Approval'
  | 'Approved'
  | 'Approved / Authorized'
  | 'Isolation Confirmed'
  | 'Work in Progress'
  | 'Work Completed'
  | 'De-isolation Confirmed'
  | 'Cancelled';

export interface ElectricalIsolationPoint {
  id?: string;
  location: string;
  breakerNo: string;
  action: 'Open' | 'Lock' | '';
  padlockNo: string;
  tagOut: 'Yes' | 'No' | '';
}

export interface OtherIsolationPoint {
  id?: string;
  controlMechanism: string;
  location: string;
  inletOutletDrain: 'I' | 'O' | 'D' | '';
  blanked: 'Yes' | 'No' | '';
  valves: 'Open' | 'Closed' | '';
  padlockNo: string;
  taggedOut: 'Yes' | 'No' | '';
}

export interface ElectricalIsolationCertificate {
  id: number;
  certificateNumber: string;
  ptwId?: number | null;
  ptwNumber?: string;
  status: EicStatus;
  locationId?: number | null;
  departmentId?: number | null;

  // 1.0 Work Details
  workLocation: string;
  requestDate: string;
  requestTime: string;
  equipmentToIsolate: string;
  equipmentTag?: string;
  workDescription: string;

  // 2.0 Isolation Requisition
  requestorName: string;
  requestorDesignation: string;
  requestorSignature?: string;
  requestorSignatureDate?: string | null;
  approvedByName?: string;
  approvedByDesignation?: string;
  approvedBySignature?: string;
  approvedByDate?: string | null;

  // 3.0 Details of Electrical Isolation
  // 3.1 Verification checkboxes
  fusesRemoved: boolean;
  mainSwitchedOff: boolean;
  rackedOut: boolean;
  padlocksFitted: boolean;
  tagsFitted: boolean;
  // 3.2 Electrical Isolation Point Register
  electricalPoints: ElectricalIsolationPoint[];
  // 3.3 Confirmation by Competent Person
  electricalCompetentName?: string;
  electricalCompetentDesignation?: string;
  electricalCompetentSignature?: string;
  electricalOperatorSignature?: string;
  electricalIsolationDate?: string | null;

  // 4.0 Other Types of Isolation
  otherPoints: OtherIsolationPoint[];
  // 4.2 Isolation Confirmation
  otherCompetentName?: string;
  otherCompetentDesignation?: string;
  otherCompetentSignature?: string;
  otherIsolationDate?: string;
  otherIsolationTime?: string;

  // 5.0 Completion of the Work
  // 5.1 Work Completion Declaration
  workCompletionPerson?: string;
  workCompletionSignature?: string;
  workCompletionDate?: string;
  workCompletionTime?: string;
  // 5.2 Completion Approval
  completionApprovedByName?: string;
  completionApprovedByDesignation?: string;
  completionApprovedBySignature?: string;
  completionApprovedByDate?: string | null;

  // 6.0 Confirmation of De-Isolation
  // 6.1 De-Isolation Declaration
  deIsolationName?: string;
  deIsolationDesignation?: string;
  deIsolationSignature?: string;
  deIsolationDate?: string;
  deIsolationTime?: string;
  ccrOperatorSignature?: string;
  ccrOperatorDate?: string | null;

  cancellationReason?: string;
  createdById?: number | null;
  createdAt: string;
  updatedAt: string;

  // Joins
  location?: Location;
  department?: Department;
  createdBy?: User;
  ptw?: PtwPermit;
}

