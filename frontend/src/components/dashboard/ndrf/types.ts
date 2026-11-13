export type NDRFNavTab = 'overview' | 'new_request' | 'tracking' | 'profile' | 'guidelines';

export type DisasterType = 'FLOOD' | 'CYCLONE' | 'EARTHQUAKE' | 'LANDSLIDE' | 'TSUNAMI' | 'FIRE' | 'OTHER';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RequestStatus = 
  | 'PENDING' 
  | 'UNDER_REVIEW' 
  | 'PARTIALLY_APPROVED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'DISPATCHED' 
  | 'COMPLETED';

export interface ResourceItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  weight_per_unit_kg: number;
  priority_score: number;
  total_stock: number;
  available_stock: number;
  reserved_stock: number;
}

export interface RequestItemInput {
  resource_id: number;
  requested_qty: number;
  resource?: ResourceItem;
}

export interface RequestItemRecord {
  id: number;
  request_id: number;
  resource_id: number;
  requested_qty: number;
  approved_qty: number;
  dispatched_qty: number;
  remaining_qty?: number;
  resource?: ResourceItem;
}

export interface RequisitionRecord {
  id: number;
  request_number: string;
  center_id: number;
  status: RequestStatus;
  urgency_level: UrgencyLevel;
  affected_count: number;
  num_families: number;
  children_elderly_count: number;
  medical_assistance_count: number;
  disaster_type: string;
  disaster_severity: string;
  affected_location?: string;
  special_instructions?: string;
  operator_notes?: string;
  created_at: string;
  updated_at: string;
  items: RequestItemRecord[];
}

export interface DashboardKPIs {
  total_requests: number;
  pending_requests: number;
  under_review_requests: number;
  approved_requests: number;
  partially_approved_requests: number;
  rejected_requests: number;
  dispatched_requests: number;
  completed_requests: number;
  dispatched_resources: number;
  center_name?: string | null;
  center_code?: string | null;
}

export interface ReliefCenterProfile {
  id: number;
  name: string;
  code: string;
  location_name: string;
  latitude: number;
  longitude: number;
  disaster_type: DisasterType;
  severity_level: SeverityLevel;
  affected_population: number;
  contact_person?: string | null;
  contact_phone?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DisasterAssessmentInput {
  disaster_type: DisasterType;
  disaster_severity: SeverityLevel;
  affected_population: number;
  num_families: number;
  children_elderly_count: number;
  medical_assistance_count: number;
  affected_location: string;
  special_instructions: string;
}

export interface SphereEstimateResult {
  resource_id: number;
  quantity: number;
  rationale: string;
  category: string;
  unit: string;
}
