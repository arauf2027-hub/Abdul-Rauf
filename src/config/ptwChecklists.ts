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
    description: 'General maintenance, piping, cleaning, civil or mechanical work with no heat/spark generation.',
  },
  'Hot Work': {
    code: 'HW',
    label: 'Hot Work',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    requiresGasTest: true,
    requiresIsolation: true,
    description: 'Welding, torch cutting, brazing, grinding, or activities generating sparks, open flames, or heat.',
  },
  'Confined Space Entry': {
    code: 'CSE',
    label: 'Confined Space Entry',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    requiresGasTest: true,
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
    description: 'Crane operations, mobile cranes, chain blocks, forklift heavy rigging, or critical tandem lifts.',
  },
  'Work at Height': {
    code: 'WAH',
    label: 'Work at Height',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    requiresGasTest: false,
    requiresIsolation: false,
    description: 'Elevated work above 1.8 meters (6 ft), scaffolding, MEWPs, roofs, or suspended baskets.',
  },
};

// 1. General Pre-Work Safety Verification (Always included for all permits)
export const GENERAL_PRE_WORK_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'GEN-01',
    category: 'General Pre-Work Verification',
    label: 'Work area inspected and cleared of unnecessary personnel & operational hazards',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-02',
    category: 'General Pre-Work Verification',
    label: 'Risk Assessment / Job Safety Analysis (JSA) reviewed and communicated with work crew',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-03',
    category: 'General Pre-Work Verification',
    label: 'Daily Tool Box Talk (TBT) conducted and attendance recorded',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-04',
    category: 'General Pre-Work Verification',
    label: 'Personnel are medically fit, qualified, competent, and inducted for the task',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-05',
    category: 'General Pre-Work Verification',
    label: 'Mandatory standard PPE inspected and worn (Safety Helmet, Glasses, High-Vis, Safety Shoes)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'GEN-06',
    category: 'General Pre-Work Verification',
    label: 'Access and egress routes are clear, illuminated, stable, and unobstructed',
    status: 'No',
  },
  {
    id: 'GEN-07',
    category: 'General Pre-Work Verification',
    label: 'Hand and power tools inspected, in sound condition, and properly tagged',
    status: 'No',
  },
  {
    id: 'GEN-08',
    category: 'General Pre-Work Verification',
    label: 'Work perimeter barricaded with warning signage displayed ("Authorized Entry Only")',
    status: 'No',
  },
  {
    id: 'GEN-09',
    category: 'General Pre-Work Verification',
    label: 'Housekeeping maintained, waste collection containers provided on site',
    status: 'No',
  },
  {
    id: 'GEN-10',
    category: 'General Pre-Work Verification',
    label: 'Emergency arrangements verified (nearest emergency muster point, eyewash/shower, radio/phone)',
    status: 'No',
    isMandatory: true,
  },
];

// 2. Cold Work Checks
export const COLD_WORK_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'CW-01',
    category: 'Cold Work',
    label: 'Non-sparking hand tools or explosion-proof electric tools provided where required',
    status: 'No',
  },
  {
    id: 'CW-02',
    category: 'Cold Work',
    label: 'Machine guards, covers, and interlocks identified and properly secured',
    status: 'No',
  },
  {
    id: 'CW-03',
    category: 'Cold Work',
    label: 'Adjacent piping, instrumentation lines, and cable trays shielded from physical impact',
    status: 'No',
  },
  {
    id: 'CW-04',
    category: 'Cold Work',
    label: 'Pressurized pneumatic, hydraulic, or process lines depressurized, drained, and depressor tags hung',
    status: 'No',
  },
  {
    id: 'CW-05',
    category: 'Cold Work',
    label: 'Containment trays or absorbent pads positioned for potential oil/chemical leaks or flushing',
    status: 'No',
  },
];

// 3. Hot Work Checks
export const HOT_WORK_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'HW-01',
    category: 'Hot Work',
    label: 'Dedicated, trained Fire Watch appointed with air horn / alarm whistle stationed continuously',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-02',
    category: 'Hot Work',
    label: 'Combustible and flammable materials cleared or wet-down within 10 meters (35 ft) radius',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-03',
    category: 'Hot Work',
    label: 'Fire-resistant containment blankets / fire tarpaulins rigged to capture falling sparks/slag',
    status: 'No',
  },
  {
    id: 'HW-04',
    category: 'Hot Work',
    label: 'Certified, inspected portable fire extinguishers (DCP & CO2) stationed directly adjacent to work',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-05',
    category: 'Hot Work',
    label: 'Gas test conducted for flammable / explosive vapors (<1% LEL verified before hot work begins)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'HW-06',
    category: 'Hot Work',
    label: 'Welding machine grounded directly to workpiece; leads, torch, and ground clamp in prime condition',
    status: 'No',
  },
  {
    id: 'HW-07',
    category: 'Hot Work',
    label: 'Gas cutting cylinders secured upright on trolley with flash-back arrestors fitted on regulator & torch',
    status: 'No',
  },
  {
    id: 'HW-08',
    category: 'Hot Work',
    label: 'Post-work fire watch commitment agreed: site monitored for minimum 30-60 mins after hot work stops',
    status: 'No',
    isMandatory: true,
  },
];

// 4. Confined Space Entry Checks
export const CONFINED_SPACE_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'CSE-01',
    category: 'Confined Space Entry',
    label: 'Atmospheric gas testing verified & recorded: O2 (19.5-23.5%), LEL (<10%), CO (<25ppm), H2S (<10ppm)',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-02',
    category: 'Confined Space Entry',
    label: 'Standby Person / Hole Watch continuously stationed at entrance with calibrated gas meter & radio',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-03',
    category: 'Confined Space Entry',
    label: 'Forced mechanical ventilation / air blower operating and duct routed to floor/dead zones',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-04',
    category: 'Confined Space Entry',
    label: 'Entry & Exit Man-count log sheet mounted at manhole with maximum permitted inside count posted',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-05',
    category: 'Confined Space Entry',
    label: 'Full-body recovery harness donned with lifeline attached to rated rescue tripod/winch',
    status: 'No',
  },
  {
    id: 'CSE-06',
    category: 'Confined Space Entry',
    label: 'Emergency Escape Breathing Apparatus (EEBD) or rescue self-rescuer positioned at entrance',
    status: 'No',
  },
  {
    id: 'CSE-07',
    category: 'Confined Space Entry',
    label: 'All positive energy and piping isolations locked, blinded, tagged, and zero energy confirmed',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'CSE-08',
    category: 'Confined Space Entry',
    label: 'Intrinsically safe / 24V low-voltage explosion-proof lighting and portable tools used inside space',
    status: 'No',
  },
];

// 5. Lifting Activity Checks
export const LIFTING_ACTIVITY_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'LA-01',
    category: 'Lifting Activity',
    label: 'Crane, hoist, web slings, shackles & wire ropes have valid third-party inspection color coding',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-02',
    category: 'Lifting Activity',
    label: 'Crane operator and dedicated Rigger / Banksman are third-party certified and wearing high-vis vests',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-03',
    category: 'Lifting Activity',
    label: 'Lifting plan prepared, reviewed with team, and verified within safe working load (SWL) chart limit',
    status: 'No',
  },
  {
    id: 'LA-04',
    category: 'Lifting Activity',
    label: 'Crane outriggers 100% fully extended on certified timber/steel load-spreading pads on firm ground',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-05',
    category: 'Lifting Activity',
    label: '360-degree crane counterweight swing radius & entire drop zone barricaded with red danger tape',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'LA-06',
    category: 'Lifting Activity',
    label: 'Tag lines (minimum 2) attached to suspended load to guide movement without hand touch',
    status: 'No',
  },
  {
    id: 'LA-07',
    category: 'Lifting Activity',
    label: 'Overhead power cables and overhead hazards checked; minimum 5m safe clearance maintained',
    status: 'No',
  },
  {
    id: 'LA-08',
    category: 'Lifting Activity',
    label: 'Wind speed checked with anemometer (must be below 20-25 knots / 10 m/s manufacturer limits)',
    status: 'No',
  },
];

// 6. Work at Height Checks
export const WORK_AT_HEIGHT_CHECKLIST: PtwChecklistItem[] = [
  {
    id: 'WAH-01',
    category: 'Work at Height',
    label: 'Full-body safety harness with dual shock-absorbing lanyards inspected and 100% tie-off enforced',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-02',
    category: 'Work at Height',
    label: 'Certified anchorage point (>5,000 lbs / 22 kN rated) or horizontal lifeline verified overhead',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-03',
    category: 'Work at Height',
    label: 'Scaffolding inspected with current valid GREEN Scafftag displayed and signed by competent inspector',
    status: 'No',
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
    label: 'Safety net or catch fan installed below elevated platform to catch falling objects or debris',
    status: 'No',
  },
  {
    id: 'WAH-06',
    category: 'Work at Height',
    label: 'Tool lanyards, pouches, and tethering cords used for all hand tools, radios, and loose equipment',
    status: 'No',
  },
  {
    id: 'WAH-07',
    category: 'Work at Height',
    label: 'Ground exclusion drop-zone directly below elevated work demarcated with warning signs & barricade',
    status: 'No',
    isMandatory: true,
  },
  {
    id: 'WAH-08',
    category: 'Work at Height',
    label: 'Weather conditions, wind gusts, and lightning risk evaluated; work prohibited in wet/stormy conditions',
    status: 'No',
  },
];

/**
 * Dynamically builds or updates the unified checklist based on the user's selected permit types.
 * Retains any answers/notes the user has already entered for existing items.
 * Does NOT auto-mark safety checks as completed.
 */
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

  // 1. General Pre-Work items always included
  GENERAL_PRE_WORK_CHECKLIST.forEach(addItem);

  // 2. Add category-specific checklists according to selected permit types
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
