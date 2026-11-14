export type OperatorNavTab = 'overview' | 'requests' | 'inventory' | 'knapsack' | 'routes' | 'audit_log';

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

export type ResourceCategory = 
  | 'POTABLE_WATER' 
  | 'FOOD_RATIONS' 
  | 'MEDICAL_SUPPLIES' 
  | 'SHELTER_AND_BEDDING' 
  | 'RESCUE_EQUIPMENT' 
  | 'POWER_AND_COMMUNICATION';

export interface ResourceItem {
  id: number;
  sku: string;
  name: string;
  category: ResourceCategory | string;
  unit: string;
  storage_location?: string | null;
  weight_per_unit_kg: number;
  priority_score: number;
  total_stock: number;
  available_stock: number;
  reserved_stock: number;
  created_at?: string;
  updated_at?: string;
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
  center_name?: string | null;
  center_code?: string | null;
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

export interface OperatorKPIs {
  total_requests: number;
  pending_requests: number;
  under_review_requests: number;
  approved_requests: number;
  partially_approved_requests: number;
  rejected_requests: number;
  dispatched_requests: number;
  completed_requests: number;
  dispatched_resources: number;
  total_centers?: number;
  incoming_requests?: number;
  available_inventory?: number;
  total_inventory?: number;
  low_stock_count?: number;
  center_name?: string | null;
  center_code?: string | null;
}

export interface LowStockAlert {
  id: number;
  sku: string;
  name: string;
  category: string;
  available_stock: number;
  total_stock: number;
  storage_location?: string | null;
  unit: string;
  deficit_status: string;
}

export interface InventoryTransactionRecord {
  id: number;
  resource_id: number;
  resource_name?: string | null;
  resource_sku?: string | null;
  operator_id?: number | null;
  operator_username?: string | null;
  transaction_type: 'RESTOCK' | 'ALLOCATION_RESERVATION' | 'DEALLOCATION' | 'DISPATCH' | 'ADJUSTMENT' | string;
  quantity: number;
  previous_available: number;
  new_available: number;
  notes?: string | null;
  created_at: string;
}

export interface AllocationLogRecord {
  id: number;
  request_id: number;
  request_number?: string | null;
  center_id?: number | null;
  center_name?: string | null;
  resource_id: number;
  resource_name?: string | null;
  resource_sku?: string | null;
  operator_id?: number | null;
  operator_username?: string | null;
  allocated_qty: number;
  previous_stock: number;
  remaining_stock: number;
  action_type: 'ALLOCATION' | 'DEALLOCATION' | 'REJECT_RELEASE' | 'DISPATCH' | string;
  notes?: string | null;
  timestamp: string;
}

export interface NotificationRecord {
  id: number;
  center_id?: number | null;
  center_name?: string | null;
  user_id?: number | null;
  request_id?: number | null;
  request_number?: string | null;
  title: string;
  message: string;
  notification_type: 'INFO' | 'REVIEW' | 'APPROVED' | 'PARTIAL_APPROVAL' | 'REJECTED' | 'DISPATCHED' | 'LOW_STOCK' | 'RESTOCKED' | string;
  is_read: boolean;
  created_at: string;
}

export interface ReliefCenterRecord {
  id: number;
  name: string;
  code: string;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  capacity?: number | null;
  current_occupancy?: number | null;
  status?: string | null;
}

export interface ItemAllocationInput {
  request_item_id: number;
  approved_qty: number;
}

export interface AllocationActionPayload {
  action: RequestStatus;
  allocations: ItemAllocationInput[];
  operator_notes?: string;
}

export interface KnapsackItemInputDTO {
  id: string;
  name: string;
  weight_kg: number;
  priority_score: number;
  quantity: number;
  category?: string;
}

export interface KnapsackRequestDTO {
  vehicle_id?: string;
  vehicle_name?: string;
  capacity_kg: number;
  items: KnapsackItemInputDTO[];
  include_dp_table?: boolean;
}

export interface KnapsackItemOutputDTO {
  id: string;
  name: string;
  weight_kg: number;
  priority_score: number;
  category?: string;
}

export interface KnapsackGroupSummaryDTO {
  id: string;
  name: string;
  category?: string;
  unit_weight_kg: number;
  priority_score: number;
  available_qty: number;
  selected_qty: number;
  total_weight_kg: number;
  total_priority: number;
}

export interface KnapsackResponseDTO {
  vehicle_id: string;
  vehicle_name: string;
  capacity_kg: number;
  total_weight_kg: number;
  remaining_capacity_kg: number;
  total_priority_score: number;
  utilization_percentage: number;
  selected_items: KnapsackItemOutputDTO[];
  unselected_items: KnapsackItemOutputDTO[];
  grouped_summary: KnapsackGroupSummaryDTO[];
  dp_explanation: Record<string, any>;
  step_by_step_trace: Array<{
    step: number;
    item_id: string;
    name: string;
    weight_kg: number;
    priority_score: number;
    decision: 'INCLUDED' | 'EXCLUDED';
    reason: string;
    capacity_after_kg: number;
  }>;
  dp_matrix_sample?: number[][];
  matrix_headers?: {
    row_labels: string[];
    col_weights: number[];
  };
  execution_time_ms: number;
  algorithm: string;
}

export interface ApprovedConsignmentDTO {
  id: number;
  request_number: string;
  center_id: number;
  center_name: string;
  center_code: string;
  status: string;
  disaster_type?: string;
  disaster_severity?: string;
  affected_location?: string;
  items: Array<{
    id: string;
    resource_id: number;
    sku: string;
    name: string;
    category: string;
    unit: string;
    weight_kg: number;
    priority_score: number;
    quantity: number;
    approved_qty: number;
    requested_qty: number;
  }>;
}

// ----------------- PHASE 8: DIJKSTRA ROUTE OPTIMIZATION TYPES -----------------

export interface DijkstraNodeDTO {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  node_type: string;
  description?: string;
}

export interface DijkstraEdgeDTO {
  id?: string;
  source: string;
  target: string;
  distance_km: number;
  condition_multiplier: number;
  is_blocked: boolean;
  risk_factor: number;
  road_name?: string;
  road_type?: string;
}

export interface DijkstraGraphDTO {
  nodes: DijkstraNodeDTO[];
  edges: DijkstraEdgeDTO[];
}

export interface DijkstraRequestDTO {
  start_node: string;
  end_node: string;
  avoid_high_risk?: boolean;
  metric?: 'weighted' | 'distance';
  include_step_trace?: boolean;
  compare_with_fewest_edges?: boolean;
  graph?: DijkstraGraphDTO;
}

export interface DijkstraStepTraceDTO {
  step_num: number;
  popped_node: string;
  node_name?: string;
  current_cost: number;
  action: string;
  relaxed_node?: string;
  tentative_cost?: number;
  detail: string;
}

export interface AlternativeRouteComparisonDTO {
  algorithm_name: string;
  path: string[];
  total_edges: number;
  total_distance_km: number;
  total_weighted_cost: number;
  explanation: string;
}

export interface DijkstraPathDetailDTO {
  from_node: string;
  to_node: string;
  from_name: string;
  to_name: string;
  road_name: string;
  road_type: string;
  distance_km: number;
  condition_multiplier: number;
  risk_factor: number;
  segment_cost?: number;
  cumulative_cost?: number;
  estimated_speed_kmh: number;
  segment_time_mins: number;
  hazard_warning?: string;
}

export interface DijkstraResponseDTO {
  start_node: string;
  end_node: string;
  is_reachable: boolean;
  path: string[];
  path_coordinates: [number, number][];
  path_details: DijkstraPathDetailDTO[];
  minimum_cost: number;
  cost_metric?: string;
  total_distance_km: number;
  total_weighted_cost: number;
  estimated_duration_minutes: number;
  estimated_fuel_liters?: number;
  estimated_operational_cost_inr?: number;
  algorithm: string;
  execution_time_ms: number;
  visited_nodes_count: number;
  hazard_warnings: string[];
  step_by_step_trace: DijkstraStepTraceDTO[];
  alternative_route_comparison?: AlternativeRouteComparisonDTO | null;
  disclaimer: string;
}

export interface DijkstraBenchmarkDTO {
  id: string;
  title: string;
  description: string;
  start_node: string;
  end_node: string;
  metric: 'weighted' | 'distance';
  avoid_high_risk: boolean;
  compare_with_fewest_edges: boolean;
  setup_action?: {
    block_road_ids?: string[];
  };
}

