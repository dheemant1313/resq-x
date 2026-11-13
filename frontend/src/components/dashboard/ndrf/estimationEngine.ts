import type { DisasterAssessmentInput, ResourceItem, SphereEstimateResult } from './types';

/**
 * SPHERE HUMANITARIAN CHARTER POPULATION-BASED ESTIMATION ENGINE
 * Computes advisory baseline relief resource recommendations according to international
 * disaster relief standards (Sphere Handbook 2018).
 * 
 * IMPORTANT: These are algorithmic advisory baselines and MUST be reviewed and calibrated
 * by Field Coordinators according to ground reality.
 */
export function calculateSphereEstimates(
  assessment: DisasterAssessmentInput,
  availableResources: ResourceItem[]
): SphereEstimateResult[] {
  const population = Math.max(0, assessment.affected_population);
  const families = Math.max(1, assessment.num_families || Math.ceil(population / 4.5));
  const vulnerable = Math.max(0, assessment.children_elderly_count);
  const medicalCount = Math.max(0, assessment.medical_assistance_count);

  const results: SphereEstimateResult[] = [];

  // Helper to find resource by SKU or Category keyword
  const findItem = (predicate: (item: ResourceItem) => boolean) => availableResources.find(predicate);

  // 1. POTABLE WATER JERRYCANS (20L)
  // Sphere baseline: 15L/person/day. For initial 72-hr ration: 2-3 Jerrycans per family
  const waterItem = findItem(r => r.sku === 'WTR-CAN-01' || r.category === 'POTABLE_WATER');
  if (waterItem) {
    const qty = Math.max(10, Math.ceil(families * 2.5));
    results.push({
      resource_id: waterItem.id,
      quantity: qty,
      category: 'POTABLE_WATER',
      unit: waterItem.unit,
      rationale: `Sphere Baseline: 15L/person/day 72-hr emergency stock (~2.5 20L Jerrycans per family for ${families} families)`
    });
  }

  // 2. READY-TO-EAT FOOD RATION PACKS (Cartons)
  // 1 carton contains 10 high-calorie meal packs. Baseline: ~3 meals/person/day for 3 days = 1 carton per person or 3 per family
  const foodItem = findItem(r => r.sku === 'FOD-RAT-01' || r.category === 'FOOD_RATIONS');
  if (foodItem) {
    const qty = Math.max(15, Math.ceil(families * 3));
    results.push({
      resource_id: foodItem.id,
      quantity: qty,
      category: 'FOOD_RATIONS',
      unit: foodItem.unit,
      rationale: `Sphere Food Basket: 2,100 kcal/person/day (~3 cartons RTE rations per family for ${families} families)`
    });
  }

  // 3. EMERGENCY TRAUMA FIRST AID KITS
  // Baseline: 1 Comprehensive Trauma Kit per 25-30 casualties/medical assistance cases (min 2 kits)
  const medItem = findItem(r => r.sku === 'MED-TRM-01' || r.category === 'MEDICAL_SUPPLIES');
  if (medItem) {
    const qty = Math.max(2, Math.ceil(medicalCount / 25) || 5);
    results.push({
      resource_id: medItem.id,
      quantity: qty,
      category: 'MEDICAL_SUPPLIES',
      unit: medItem.unit,
      rationale: `Sphere Trauma Triage: 1 trauma kit per 25 individuals requiring medical assistance (${medicalCount} registered casualties)`
    });
  }

  // 4. ALL-WEATHER FAMILY TENTS
  // Baseline: 1 tent per family in High/Critical severity disasters (or 50% displacement ratio)
  const tentItem = findItem(r => r.sku === 'SHL-TNT-01' || (r.category === 'SHELTER_AND_BEDDING' && r.name.toLowerCase().includes('tent')));
  if (tentItem) {
    const displacementRatio = assessment.disaster_severity === 'CRITICAL' ? 0.75 : assessment.disaster_severity === 'HIGH' ? 0.45 : 0.20;
    const qty = Math.max(5, Math.ceil(families * displacementRatio));
    results.push({
      resource_id: tentItem.id,
      quantity: qty,
      category: 'SHELTER_AND_BEDDING',
      unit: tentItem.unit,
      rationale: `Sphere Shelter Guidelines: ~${Math.round(displacementRatio * 100)}% displacement planning baseline for ${assessment.disaster_severity} severity (${families} families)`
    });
  }

  // 5. THERMAL BLANKETS (Packs of 10)
  // Baseline: 1 blanket per vulnerable child/elderly person + 2 per family
  const blanketItem = findItem(r => r.sku === 'SHL-BLK-02' || (r.category === 'SHELTER_AND_BEDDING' && r.name.toLowerCase().includes('blanket')));
  if (blanketItem) {
    const totalBlankets = vulnerable + (families * 2);
    const packs = Math.max(5, Math.ceil(totalBlankets / 10));
    results.push({
      resource_id: blanketItem.id,
      quantity: packs,
      category: 'SHELTER_AND_BEDDING',
      unit: blanketItem.unit,
      rationale: `Sphere Non-Food Items: 1 thermal blanket per vulnerable individual (${vulnerable} children/elderly) + 2 per family (in 10-packs)`
    });
  }

  // 6. EMERGENCY SATELLITE PHONES / SOLAR CHARGER
  const satItem = findItem(r => r.sku === 'PWR-SAT-02' || r.category === 'POWER_AND_COMMUNICATION');
  if (satItem) {
    const qty = Math.max(1, Math.min(6, Math.ceil(population / 3000)));
    results.push({
      resource_id: satItem.id,
      quantity: qty,
      category: 'POWER_AND_COMMUNICATION',
      unit: satItem.unit,
      rationale: `Emergency Telecom Standards: Dedicated emergency satellite link per relief sector`
    });
  }

  return results;
}
