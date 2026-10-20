export const initialMasterData = {
  "departments": [
    {
      "id": 1,
      "name": "EHS & Sustainability",
      "code": "EHS",
      "description": "Environment, Health, Safety & Sustainability",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 2,
      "name": "Operations & Manufacturing",
      "code": "OPS",
      "description": "Production lines and plant operations",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 3,
      "name": "Plant Maintenance",
      "code": "MNT",
      "description": "Mechanical and electrical maintenance engineering",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 4,
      "name": "Logistics & Warehouse",
      "code": "LOG",
      "description": "Warehousing, material handling and shipping",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 5,
      "name": "Quality Assurance & Lab",
      "code": "QAL",
      "description": "Chemical testing, QC laboratory and assurance",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 6,
      "name": "Facilities & Utilities",
      "code": "FAC",
      "description": "Boilers, HVAC, water treatment and facility services",
      "createdAt": "2026-10-15T04:40:54.752Z"
    }
  ],
  "locations": [
    {
      "id": 1,
      "name": "Plant Alpha - Heavy Manufacturing",
      "code": "PLT-A",
      "locationType": "Plant",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 2,
      "name": "Plant Beta - Chemical & Finishing",
      "code": "PLT-B",
      "locationType": "Plant",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 3,
      "name": "Central Distribution Warehouse",
      "code": "CDW-01",
      "locationType": "Warehouse",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 4,
      "name": "Engineering & Innovation Hub",
      "code": "ENG-01",
      "locationType": "Engineering",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 5,
      "name": "Corporate Operations Facility",
      "code": "CORP-01",
      "locationType": "Office",
      "createdAt": "2026-10-15T04:40:54.752Z"
    }
  ],
  "subLocations": [
    {
      "id": 1,
      "locationId": 1,
      "name": "Assembly Hall 1",
      "code": "AH-1",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 2,
      "locationId": 1,
      "name": "Chemical Storage Yard",
      "code": "CSY-1",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 3,
      "locationId": 1,
      "name": "High-Bay Storage Bay 3",
      "code": "HBS-3",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 4,
      "locationId": 1,
      "name": "Boiler & Turbine House",
      "code": "BTH-1",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 5,
      "locationId": 1,
      "name": "Loading Dock A",
      "code": "LDA-1",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "id": 6,
      "locationId": 1,
      "name": "Maintenance Workshop",
      "code": "MWS-1",
      "createdAt": "2026-10-15T04:40:54.752Z"
    }
  ],
  "users": [
    {
      "id": 3,
      "uid": "rgl_seed_2",
      "email": "rgl.maintenance@company.internal",
      "fullName": "Elena Rostova (RGL)",
      "role": "rgl",
      "departmentId": 3,
      "locationId": 1,
      "jobTitle": "Plant Engineering Lead",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z",
      "department": {
        "id": 3,
        "name": "Plant Maintenance",
        "code": "MNT",
        "description": "Mechanical and electrical maintenance engineering",
        "createdAt": "2026-10-15T04:40:54.752Z"
      },
      "location": {
        "id": 1,
        "name": "Plant Alpha - Heavy Manufacturing",
        "code": "PLT-A",
        "locationType": "Plant",
        "createdAt": "2026-10-15T04:40:54.752Z"
      }
    },
    {
      "id": 4,
      "uid": "rp_seed_1",
      "email": "rp.officer@company.internal",
      "fullName": "David Chen (RP)",
      "role": "rp",
      "departmentId": 1,
      "locationId": 1,
      "jobTitle": "HSE Specialist & Lead Investigator",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z",
      "department": {
        "id": 1,
        "name": "EHS & Sustainability",
        "code": "EHS",
        "description": "Environment, Health, Safety & Sustainability",
        "createdAt": "2026-10-15T04:40:54.752Z"
      },
      "location": {
        "id": 1,
        "name": "Plant Alpha - Heavy Manufacturing",
        "code": "PLT-A",
        "locationType": "Plant",
        "createdAt": "2026-10-15T04:40:54.752Z"
      }
    },
    {
      "id": 5,
      "uid": "rp_seed_2",
      "email": "rp.line@company.internal",
      "fullName": "Rachel Green (RP)",
      "role": "rp",
      "departmentId": 2,
      "locationId": 1,
      "jobTitle": "Production Shift Supervisor",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z",
      "department": {
        "id": 2,
        "name": "Operations & Manufacturing",
        "code": "OPS",
        "description": "Production lines and plant operations",
        "createdAt": "2026-10-15T04:40:54.752Z"
      },
      "location": {
        "id": 1,
        "name": "Plant Alpha - Heavy Manufacturing",
        "code": "PLT-A",
        "locationType": "Plant",
        "createdAt": "2026-10-15T04:40:54.752Z"
      }
    },
    {
      "id": 6,
      "uid": "viewer_seed",
      "email": "viewer.audit@company.internal",
      "fullName": "Thomas Wright (Viewer)",
      "role": "viewer",
      "departmentId": 5,
      "locationId": 1,
      "jobTitle": "Internal Auditor & Compliance Observer",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z",
      "department": {
        "id": 5,
        "name": "Quality Assurance & Lab",
        "code": "QAL",
        "description": "Chemical testing, QC laboratory and assurance",
        "createdAt": "2026-10-15T04:40:54.752Z"
      },
      "location": {
        "id": 1,
        "name": "Plant Alpha - Heavy Manufacturing",
        "code": "PLT-A",
        "locationType": "Plant",
        "createdAt": "2026-10-15T04:40:54.752Z"
      }
    },
    {
      "id": 1,
      "uid": "YyR4lJlnOZRuwSE4uZrJapRWydu2",
      "email": "numairaman71@gmail.com",
      "fullName": "System Administrator (Numair)",
      "role": "admin",
      "departmentId": 1,
      "locationId": 1,
      "jobTitle": "Corporate EHS Director & System Admin",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z",
      "department": {
        "id": 1,
        "name": "EHS & Sustainability",
        "code": "EHS",
        "description": "Environment, Health, Safety & Sustainability",
        "createdAt": "2026-10-15T04:40:54.752Z"
      },
      "location": {
        "id": 1,
        "name": "Plant Alpha - Heavy Manufacturing",
        "code": "PLT-A",
        "locationType": "Plant",
        "createdAt": "2026-10-15T04:40:54.752Z"
      }
    },
    {
      "id": 2,
      "uid": "rgl_seed_1",
      "email": "rgl.operations@company.internal",
      "fullName": "Marcus Vance (RGL)",
      "role": "rp",
      "departmentId": 1,
      "locationId": null,
      "jobTitle": "HSE AM",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z",
      "department": {
        "id": 1,
        "name": "EHS & Sustainability",
        "code": "EHS",
        "description": "Environment, Health, Safety & Sustainability",
        "createdAt": "2026-10-15T04:40:54.752Z"
      },
      "location": null
    }
  ],
  "organization": {
    "id": 1,
    "name": "Power Cement Limited ",
    "logoUrl": "",
    "trirMultiplier": 200000,
    "ltifrMultiplier": 1000000,
    "totalHoursWorked": 750000,
    "createdAt": "2026-10-15T04:40:54.752Z",
    "updatedAt": "2026-10-15T06:47:03.618Z"
  },
  "systemConfig": [
    {
      "key": "company_name",
      "value": "Apex Industrial Group",
      "description": "Organization Display Name",
      "updatedAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "key": "incident_closure_requires_capa",
      "value": "true",
      "description": "Require all associated CAPAs to be closed before incident final closure",
      "updatedAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "key": "mandatory_whys_count",
      "value": "5",
      "description": "Minimum required 5-Whys in incident investigation report",
      "updatedAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "key": "mandatory_findings_count",
      "value": "2",
      "description": "Minimum required key findings in incident investigation report",
      "updatedAt": "2026-10-15T04:40:54.752Z"
    },
    {
      "key": "reminder_escalation_days",
      "value": "3",
      "description": "Days past due before action escalation level increases",
      "updatedAt": "2026-10-15T04:40:54.752Z"
    }
  ],
  "currentUser": {
    "id": 3,
    "uid": "rgl_seed_2",
    "email": "rgl.maintenance@company.internal",
    "fullName": "Elena Rostova (RGL)",
    "role": "rgl",
    "departmentId": 3,
    "locationId": 1,
    "jobTitle": "Plant Engineering Lead",
    "isActive": true,
    "createdAt": "2026-10-15T04:41:02.303Z"
  }
};

export const initialIncidents = [
  {
    "id": 3,
    "eventId": "EVT-2026-000003",
    "title": "Fire Break Out ",
    "eventType": "Near Miss",
    "occurrenceDate": "2026-10-15",
    "occurrenceTime": "09:30",
    "reportedAt": "2026-10-15T07:04:29.325Z",
    "reportedByUserId": 1,
    "departmentId": 2,
    "locationId": 2,
    "subLocationId": null,
    "eventCategory": "Safety",
    "actualConsequence": "Near Miss",
    "potentialConsequence": "LTI ",
    "immediateActionsTaken": " The fire was extinguished by the fire tender. No injuries; all persons are safe",
    "personsInvolved": "",
    "witnesses": "",
    "injuryOrEnvironmentalDetails": "",
    "initialRiskClassification": "High",
    "potentialRiskClassification": "High",
    "status": "Reported",
    "assignedRglId": null,
    "assignedRpId": null,
    "investigationDueDate": "",
    "createdAt": "2026-10-15T07:04:29.325Z",
    "updatedAt": "2026-10-15T07:04:29.325Z",
    "department": {
      "id": 2,
      "name": "Operations & Manufacturing",
      "code": "OPS",
      "description": "Production lines and plant operations",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    "location": {
      "id": 2,
      "name": "Plant Beta - Chemical & Finishing",
      "code": "PLT-B",
      "locationType": "Plant",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    "reportedBy": {
      "id": 1,
      "uid": "YyR4lJlnOZRuwSE4uZrJapRWydu2",
      "email": "numairaman71@gmail.com",
      "fullName": "System Administrator (Numair)",
      "role": "admin",
      "departmentId": 1,
      "locationId": 1,
      "jobTitle": "Corporate EHS Director & System Admin",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z"
    },
    "assignedRgl": null,
    "assignedRp": null
  },
  {
    "id": 2,
    "eventId": "EVT-2026-000002",
    "title": "Fire Break Out ",
    "eventType": "Near Miss",
    "occurrenceDate": "2026-10-15",
    "occurrenceTime": "09:30",
    "reportedAt": "2026-10-15T07:04:29.275Z",
    "reportedByUserId": 1,
    "departmentId": 2,
    "locationId": 2,
    "subLocationId": null,
    "eventCategory": "Safety",
    "actualConsequence": "Near Miss",
    "potentialConsequence": "LTI ",
    "immediateActionsTaken": " The fire was extinguished by the fire tender. No injuries; all persons are safe",
    "personsInvolved": "",
    "witnesses": "",
    "injuryOrEnvironmentalDetails": "",
    "initialRiskClassification": "High",
    "potentialRiskClassification": "High",
    "status": "Reported",
    "assignedRglId": null,
    "assignedRpId": null,
    "investigationDueDate": "",
    "createdAt": "2026-10-15T07:04:29.275Z",
    "updatedAt": "2026-10-15T07:04:29.275Z",
    "department": {
      "id": 2,
      "name": "Operations & Manufacturing",
      "code": "OPS",
      "description": "Production lines and plant operations",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    "location": {
      "id": 2,
      "name": "Plant Beta - Chemical & Finishing",
      "code": "PLT-B",
      "locationType": "Plant",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    "reportedBy": {
      "id": 1,
      "uid": "YyR4lJlnOZRuwSE4uZrJapRWydu2",
      "email": "numairaman71@gmail.com",
      "fullName": "System Administrator (Numair)",
      "role": "admin",
      "departmentId": 1,
      "locationId": 1,
      "jobTitle": "Corporate EHS Director & System Admin",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z"
    },
    "assignedRgl": null,
    "assignedRp": null
  },
  {
    "id": 1,
    "eventId": "EVT-2026-000001",
    "title": "Fire Outbreak in ISOTECH Residential containers",
    "eventType": "Fire or Explosion",
    "occurrenceDate": "2026-10-11",
    "occurrenceTime": "19:24",
    "reportedAt": "2026-10-15T06:59:17.454Z",
    "reportedByUserId": 1,
    "departmentId": 2,
    "locationId": 1,
    "subLocationId": null,
    "eventCategory": "Safety",
    "actualConsequence": "None",
    "potentialConsequence": "LTI/Fatality",
    "immediateActionsTaken": "The fire was extinguished by the fire tender. No injuries; all persons are safe",
    "personsInvolved": "",
    "witnesses": "",
    "injuryOrEnvironmentalDetails": "",
    "initialRiskClassification": "Medium",
    "potentialRiskClassification": "High",
    "status": "Reported",
    "assignedRglId": null,
    "assignedRpId": null,
    "investigationDueDate": "",
    "createdAt": "2026-10-15T06:59:17.454Z",
    "updatedAt": "2026-10-15T06:59:17.454Z",
    "department": {
      "id": 2,
      "name": "Operations & Manufacturing",
      "code": "OPS",
      "description": "Production lines and plant operations",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    "location": {
      "id": 1,
      "name": "Plant Alpha - Heavy Manufacturing",
      "code": "PLT-A",
      "locationType": "Plant",
      "createdAt": "2026-10-15T04:40:54.752Z"
    },
    "reportedBy": {
      "id": 1,
      "uid": "YyR4lJlnOZRuwSE4uZrJapRWydu2",
      "email": "numairaman71@gmail.com",
      "fullName": "System Administrator (Numair)",
      "role": "admin",
      "departmentId": 1,
      "locationId": 1,
      "jobTitle": "Corporate EHS Director & System Admin",
      "isActive": true,
      "createdAt": "2026-10-15T04:41:02.303Z"
    },
    "assignedRgl": null,
    "assignedRp": null
  }
];
