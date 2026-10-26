import { PermitType, PtwChecklistItem, PtwIsolations, PtwGasTesting } from '../types/index.ts';

export const PERMIT_TYPE_CONFIG: Record<
  PermitType,
  {
    code: string;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    requiresGasTest: boolean;
    requiresIsolation: boolean;
    description: string;
  }
> = {
  'Cold Work': {
    code: 'CW',
    label: 'Cold Work',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    requiresGasTest: false,
    requiresIsolation: false,
    description: 'General maintenance, piping, cleaning, civil or mechanical work without heat or spark generation.',
  },
  'Hot Work': {
    code: 'HW',
    label: 'Hot Work',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    requiresGasTest: false, // Per PCL HSE specification, dedicated Gas Testing Record page is exclusive to Confined Space Entry
    requiresIsolation: true,
    description: 'Welding, torch cutting, brazing, grinding, open flames, sparks, or heat-generating activities.',
  },
  'Confined Space Entry': {
    code: 'CSE',
    label: 'Confined Space Entry',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    requiresGasTest: true, // Gas Testing Record page appears ONLY when CSE is selected
    requiresIsolation: true,
    description: 'Entry into tanks, silos, vessels, ducts, cyclones, pits, or enclosed spaces with restricted access.',
  },
  'Lifting Activity': {
    code: 'LA',
    label: 'Lifting Activity',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    requiresGasTest: false,
    requiresIsolation: false,
    description: 'Crane operations, mobile cranes, chain blocks, heavy rigging, or critical tandem lifts.',
  },
  'Work at Height': {
    code: 'WAH',
    label: 'Work at Height',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    requiresGasTest: false,
    requiresIsolation: false,
    description: 'Work above 1.8 metres (6 feet), scaffolding, MEWPs, roofs, or suspended baskets.',
  },
};

// ----------------------------------------------------------------------------------------
// 4.1 General Safety Checks (Applicable to all jobs)
// ----------------------------------------------------------------------------------------
export const GENERAL_PRE_WORK_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'GEN-01',
    category: 'General Safety Checks',
    label: 'Work scope, plant area, and specific work location verified on site',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-02',
    category: 'General Safety Checks',
    label: 'JSA / Risk Assessment reviewed and control measures communicated to crew',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-03',
    category: 'General Safety Checks',
    label: 'Toolbox Talk (TBT) conducted with the work crew and attendance recorded',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-04',
    category: 'General Safety Checks',
    label: 'Workers are competent, authorized, medically fit, and task-briefed',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-05',
    category: 'General Safety Checks',
    label: 'Required PPE identified, inspected, and made available (Helmet, Safety Shoes, Glasses, Hi-Vis)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-06',
    category: 'General Safety Checks',
    label: 'Work area inspected and safe, illuminated, unobstructed access and egress maintained',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-07',
    category: 'General Safety Checks',
    label: 'Tools and equipment inspected, undamaged, calibrated, and suitable for the task',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-08',
    category: 'General Safety Checks',
    label: 'Emergency arrangements, muster points, eyewash/showers, and communication established',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-09',
    category: 'General Safety Checks',
    label: 'Housekeeping and barricading requirements addressed with warning signage posted',
    status: 'No',
    isMandatory: true,
  },
];

// ----------------------------------------------------------------------------------------
// 4.2 Permit-Specific Checklists
// ----------------------------------------------------------------------------------------

// CW — Cold Work
export const COLD_WORK_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'CW-01',
    category: 'Cold Work',
    label: 'Cold-work-specific precautions reviewed; confirmed no open flame or spark-generating tools in use',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CW-02',
    category: 'Cold Work',
    label: 'Applicable maintenance, mechanical, piping, or civil task controls verified and secured',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CW-03',
    category: 'Cold Work',
    label: 'Pressurized process, pneumatic, or hydraulic lines depressurized, vented, and drained',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CW-04',
    category: 'Cold Work',
    label: 'Adjacent piping, instrumentation lines, and cable trays shielded from physical impact',
    status: 'No',
    isMandatory: false,
  },
  {
    id: 'CW-05',
    category: 'Cold Work',
    label: 'Containment trays or absorbent pads positioned for potential oil, lube, or chemical leaks',
    status: 'No',
    isMandatory: false,
  },
];

// HW — Hot Work
export const HOT_WORK_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'HW-01',
    category: 'Hot Work',
    label: 'Hot work authorized; surrounding area inspected within 10 metres (35 ft) radius',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-02',
    category: 'Hot Work',
    label: 'Combustible and flammable materials removed or protected with fire-resistant blankets / tarpaulins',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-03',
    category: 'Hot Work',
    label: 'Certified, inspected portable fire extinguishers (DCP/CO2) stationed directly adjacent to work',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-04',
    category: 'Hot Work',
    label: 'Dedicated, trained Fire Watch appointed with alarm horn stationed continuously during work',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-05',
    category: 'Hot Work',
    label: 'Welding, cutting, grinding, and spark-containment precautions verified (leads, torch, flashback arrestors)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-06',
    category: 'Hot Work',
    label: 'Spark containment blankets rigged to prevent sparks or slag dropping to lower plant elevations',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-07',
    category: 'Hot Work',
    label: 'Post-work fire watch commitment agreed (minimum 30–60 minutes continuous monitoring after hot work stops)',
    status: 'No',
    isMandatory: true,
  },
];

// CSE — Confined Space Entry
export const CONFINED_SPACE_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'CSE-01',
    category: 'Confined Space Entry',
    label: 'Confined space entry authorized; space inspected, verified clean, and entry conditions verified',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-02',
    category: 'Confined Space Entry',
    label: 'Applicable positive mechanical/electrical isolation, blinding, and zero-energy confirmed (LOTO)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-03',
    category: 'Confined Space Entry',
    label: 'Atmospheric gas testing verified on Gas Testing Record page: O2 (19.5-23.5%), LEL (<10%), CO (<25ppm), H2S (<10ppm)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-04',
    category: 'Confined Space Entry',
    label: 'Continuous forced mechanical ventilation operational; duct routed to floor and stagnant dead zones',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-05',
    category: 'Confined Space Entry',
    label: 'Dedicated Standby Person / Hole Watch stationed at entrance with entry/exit log board and radio',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-06',
    category: 'Confined Space Entry',
    label: 'Rescue arrangements staged: rescue tripod, retrieval winch, full-body harness, lifeline, and EEBD',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-07',
    category: 'Confined Space Entry',
    label: 'Intrinsically safe / 24V low-voltage explosion-proof lighting and portable tools used inside space',
    status: 'No',
    isMandatory: false,
  },
];

// LA — Lifting Activity
export const LIFTING_ACTIVITY_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'LA-01',
    category: 'Lifting Activity',
    label: 'Lifting plan and lift-risk assessment prepared, reviewed, and verified within safe working load (SWL)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-02',
    category: 'Lifting Activity',
    label: 'Crane, lifting appliances, wire ropes, shackles, and rigging gear inspected with valid color-code certification',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-03',
    category: 'Lifting Activity',
    label: 'Safe working load (SWL) and equipment capacity verified against heaviest anticipated load',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-04',
    category: 'Lifting Activity',
    label: 'Ground stability verified; crane outriggers 100% extended on load-spreading pads; swing radius barricaded',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-05',
    category: 'Lifting Activity',
    label: 'Competent, certified crane operator, qualified rigger, and dedicated signalman/banksman appointed',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-06',
    category: 'Lifting Activity',
    label: 'Tag lines (minimum 2) attached to suspended load; overhead power lines checked (>5m clearance)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-07',
    category: 'Lifting Activity',
    label: 'Wind speed checked with anemometer (must be below 20 knots / 10 m/s manufacturer limits)',
    status: 'No',
    isMandatory: false,
  },
];

// WAH — Work at Height
export const WORK_AT_HEIGHT_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'WAH-01',
    category: 'Work at Height',
    label: 'Suitable access equipment provided; scaffolding inspected with valid GREEN Scafftag or certified MEWP',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-02',
    category: 'Work at Height',
    label: 'Fall prevention and fall-arrest measures enforced; full-body harness with dual shock-absorbing lanyards worn',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-03',
    category: 'Work at Height',
    label: 'Certified anchorage point (>5,000 lbs / 22 kN rated) or horizontal lifeline verified overhead for 100% tie-off',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-04',
    category: 'Work at Height',
    label: 'Working platform fully planked, zero gaps, with top-rail (1m), mid-rail (0.5m), and toe-boards (15cm)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-05',
    category: 'Work at Height',
    label: 'Dropped-object prevention implemented: tool tethers/pouches used; safety nets/toe-boards in place',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-06',
    category: 'Work at Height',
    label: 'Ground exclusion drop-zone directly below elevated work demarcated with warning signs & barricade',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-07',
    category: 'Work at Height',
    label: 'Weather conditions, wind gusts, and lightning risk evaluated; emergency rescue plan established',
    status: 'No',
    isMandatory: false,
  },
];

// ----------------------------------------------------------------------------------------
// 4.3 Dynamic Checklist Generator (Strictly filtered by selected types)
// ----------------------------------------------------------------------------------------
export function generateChecklistForPermitTypes(
  selectedTypes: PermitType[],
  existingChecklist?: PtwChecklistItem[]
): PtwChecklistItem[] {
  const existingMap = new Map<string, PtwChecklistItem>();
  if (Array.isArray(existingChecklist)) {
    for (const item of existingChecklist) {
      existingMap.set(item.id, item);
    }
  }

  const masterList: PtwChecklistItem[] = [];
  const addedIds = new Set<string>();

  const addItem = (template: PtwChecklistItem) => {
    if (addedIds.has(template.id)) return;
    addedIds.add(template.id);
    const existing = existingMap.get(template.id);
    if (existing) {
      masterList.push({
        ...template,
        status: existing.status || 'No',
        notes: existing.notes || '',
      });
    } else {
      masterList.push({
        ...template,
        status: 'No', // Never auto-mark as Yes
        notes: '',
      });
    }
  };

  // 1. General Safety Checks always included for all permits
  GENERAL_PRE_WORK_CHECKLIST.forEach(addItem);

  // 2. Add category-specific checklists strictly according to selected permit types
  if (selectedTypes.includes('Cold Work')) {
    COLD_WORK_CHECKLIST.forEach(addItem);
  }
  if (selectedTypes.includes('Hot Work')) {
    HOT_WORK_CHECKLIST.forEach(addItem);
  }
  if (selectedTypes.includes('Confined Space Entry')) {
    CONFINED_SPACE_CHECKLIST.forEach(addItem);
  }
  if (selectedTypes.includes('Lifting Activity')) {
    LIFTING_ACTIVITY_CHECKLIST.forEach(addItem);
  }
  if (selectedTypes.includes('Work at Height')) {
    WORK_AT_HEIGHT_CHECKLIST.forEach(addItem);
  }

  // 3. Keep any custom items the user previously added
  if (Array.isArray(existingChecklist)) {
    for (const item of existingChecklist) {
      if (!addedIds.has(item.id) && item.category === 'Additional Site Checks') {
        masterList.push(item);
        addedIds.add(item.id);
      }
    }
  }

  return masterList;
}

// ----------------------------------------------------------------------------------------
// 3. Date, Time and 12-Hour Permit Validity Validation Helpers
// ----------------------------------------------------------------------------------------

export interface PtwValidityResult {
  valid: boolean;
  durationHours: number;
  error?: string;
}

/**
 * Parses a date-time string in "YYYY-MM-DD HH:mm" or ISO format into a Date object.
 */
export function parsePtwDateTime(dtStr: string): Date | null {
  if (!dtStr) return null;
  const trimmed = dtStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (match) {
    const [, y, m, d, hh, mm] = match;
    const year = parseInt(y, 10);
    const month = parseInt(m, 10) - 1;
    const day = parseInt(d, 10);
    const hour = parseInt(hh, 10);
    const minute = parseInt(mm, 10);
    const date = new Date(year, month, day, hour, minute, 0, 0);
    if (!isNaN(date.getTime())) return date;
  }
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Formats a Date object to "YYYY-MM-DD HH:mm".
 */
export function formatPtwDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

/**
 * Calculates duration in hours between validFrom and validTo.
 * Correctly accounts for permits crossing midnight.
 */
export function calculatePermitDurationHours(validFromStr?: string, validToStr?: string): number {
  if (!validFromStr || !validToStr) return 0;
  const from = parsePtwDateTime(validFromStr);
  const to = parsePtwDateTime(validToStr);
  if (!from || !to) return 0;
  const diffMs = to.getTime() - from.getTime();
  if (diffMs <= 0) return 0;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * Returns the maximum allowable Valid To timestamp (exactly 12 hours after Valid From).
 */
export function getMaxValidTo(validFromStr: string): string {
  const from = parsePtwDateTime(validFromStr);
  if (!from) return '';
  const maxTo = new Date(from.getTime() + 12 * 60 * 60 * 1000);
  return formatPtwDateTime(maxTo);
}

/**
 * Validates that:
 * 1. Both validFrom and validTo are valid dates and times.
 * 2. validTo is strictly later than validFrom.
 * 3. The duration does not exceed 12 hours (maximum allowable validity).
 * 4. Permits crossing midnight are correctly calculated.
 * 5. No shift-end restrictions are applied.
 */
export function validatePtwValidity(validFromStr?: string, validToStr?: string): PtwValidityResult {
  if (!validFromStr || !validFromStr.trim()) {
    return { valid: false, durationHours: 0, error: 'Valid From date and time are required.' };
  }
  if (!validToStr || !validToStr.trim()) {
    return { valid: false, durationHours: 0, error: 'Valid To date and time are required.' };
  }

  const from = parsePtwDateTime(validFromStr);
  const to = parsePtwDateTime(validToStr);

  if (!from) {
    return { valid: false, durationHours: 0, error: 'Invalid Valid From format. Expected "YYYY-MM-DD HH:mm".' };
  }
  if (!to) {
    return { valid: false, durationHours: 0, error: 'Invalid Valid To format. Expected "YYYY-MM-DD HH:mm".' };
  }

  const fromMs = from.getTime();
  const toMs = to.getTime();

  if (toMs <= fromMs) {
    return {
      valid: false,
      durationHours: 0,
      error: 'Valid To must be strictly later than Valid From.',
    };
  }

  const diffMs = toMs - fromMs;
  const durationHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  if (durationHours > 12.0) {
    return {
      valid: false,
      durationHours,
      error: `Permit validity duration is ${durationHours} hours, which exceeds the maximum allowable limit of 12 hours.`,
    };
  }

  return {
    valid: true,
    durationHours,
  };
}

/**
 * Validates daily extension validity (Day 2 to 7) ensuring it does not exceed 12 hours.
 */
export function validateExtensionValidity(extensionDate: string, startTime: string, endTime: string): PtwValidityResult {
  if (!extensionDate || !startTime || !endTime) {
    return { valid: false, durationHours: 0, error: 'Extension Date, Start Time, and End Time are required.' };
  }

  const fromStr = `${extensionDate} ${startTime}`;
  let toStr = `${extensionDate} ${endTime}`;

  // If endTime is less than or equal to startTime, extension crosses midnight into the next day
  const from = parsePtwDateTime(fromStr);
  let to = parsePtwDateTime(toStr);

  if (from && to && to.getTime() <= from.getTime()) {
    const nextDay = new Date(to.getTime() + 24 * 60 * 60 * 1000);
    toStr = formatPtwDateTime(nextDay);
  }

  return validatePtwValidity(fromStr, toStr);
}

export const DEFAULT_ISOLATIONS: PtwIsolations = {
  electrical: { required: 'N/A', equipmentTag: '', lockNumber: '', isolatedBy: '', verifiedBy: '', permitRef: '' },
  mechanical: { required: 'N/A', equipmentTag: '', lockNumber: '', isolatedBy: '', verifiedBy: '', permitRef: '' },
  utilities: { required: 'N/A', equipmentTag: '', lockNumber: '', isolatedBy: '', verifiedBy: '', permitRef: '' },
  production: { required: 'N/A', equipmentTag: '', lockNumber: '', isolatedBy: '', verifiedBy: '', permitRef: '' },
};

export const DEFAULT_GAS_TESTING: PtwGasTesting = {
  testedBy: '',
  testTime: '',
  oxygen: '',
  lel: '',
  co: '',
  h2s: '',
  result: 'Safe to Enter',
  notes: '',
};
