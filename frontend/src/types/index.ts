export type UserRole = 'ADMIN' | 'OPERATOR' | 'RELIEF_CENTER';

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  center_id?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ReliefCenter {
  id: number;
  name: string;
  code: string;
  location_name: string;
  latitude: number;
  longitude: number;
  disaster_type: string;
  severity_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affected_population: number;
  contact_person?: string;
  contact_phone?: string;
  status: string;
}

export interface ResourceItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  weight_per_unit_kg: number;
  priority_score: number;
  total_stock: number;
  reserved_stock: number;
  available_stock: number;
}

export interface KnapsackItem {
  id: string;
  name: string;
  weight_kg: number;
  priority_score: number;
  quantity?: number;
  category?: string;
}

export interface KnapsackOptimizationResult {
  vehicle_id: string;
  vehicle_name: string;
  capacity_kg: number;
  total_weight_kg: number;
  total_priority_score: number;
  utilization_percentage: number;
  selected_items: KnapsackItem[];
  unselected_items: KnapsackItem[];
  dp_matrix_sample?: number[][];
  execution_time_ms: number;
}

export interface DijkstraRouteResult {
  start_node: string;
  end_node: string;
  is_reachable: boolean;
  path: string[];
  path_details: Array<{
    from_node: string;
    to_node: string;
    road_name: string;
    distance_km: number;
    condition_multiplier: number;
    risk_factor: number;
    estimated_speed_kmh: number;
    segment_time_mins: number;
    hazard_warning?: string | null;
  }>;
  total_distance_km: number;
  total_weighted_cost: number;
  estimated_duration_minutes: number;
  hazard_warnings: string[];
  execution_time_ms: number;
}
