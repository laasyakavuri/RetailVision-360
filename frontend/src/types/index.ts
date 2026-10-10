export interface DashboardSummary {
  total_shelf_audits: number;
  total_detected_objects: number;
  potential_stockout_alerts: number;
  open_operational_tasks: number;
  open_checkout_discrepancies: number;
  completed_verifications: number;
  unresolved_high_priority_alerts: number;
  cv_model_available: boolean;
  cv_model_name: string;
  gemini_available: boolean;
  gemini_model_name: string;
  is_demo_active: boolean;
}

export interface SystemStatus {
  backend_running: boolean;
  database: string;
  database_connected: boolean;
  cv_model: {
    name: string;
    available: boolean;
    device: string;
    mode: string;
  };
  gemini: {
    configured: boolean;
    model: string;
    available: boolean;
  };
  storage: {
    uploads_dir: string;
    annotations_dir: string;
  };
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  category: string;
  barcode?: string;
  unit_price: number;
  expected_shelf_qty: number;
  min_threshold: number;
  reference_image?: string;
  is_active: boolean;
  created_at: string;
  inventory?: InventoryRecord;
}

export interface InventoryRecord {
  id: number;
  product_id: number;
  recorded_shelf_qty: number;
  recorded_backroom_qty: number;
  recent_sales_qty: number;
  sales_rate_per_hour: number;
  reorder_threshold: number;
  last_updated: string;
  source: string;
}

export interface PlanogramPosition {
  row_index: number;
  col_index: number;
  product_id?: number;
  expected_facings: number;
  min_occupancy_ratio: number;
}

export interface Planogram {
  id: number;
  name: string;
  store_id: number;
  aisle: string;
  shelf: string;
  rows: number;
  cols: number;
  occupancy_threshold: number;
  target_facing_count: number;
  is_active: boolean;
  created_at: string;
  positions: PlanogramPosition[];
}

export interface DetectionRecord {
  id: number;
  class_name: string;
  confidence: number;
  bbox_x1: number;
  bbox_y1: number;
  bbox_x2: number;
  bbox_y2: number;
  matched_product_id?: number;
  match_confidence: number;
  match_status: string;
}

export interface ShelfAudit {
  id: number;
  audit_code: string;
  timestamp: string;
  aisle: string;
  shelf: string;
  planogram_id?: number;
  raw_image_path?: string;
  annotated_image_path?: string;
  total_detected_objects: number;
  occupancy_rate: number;
  status: string;
  inference_duration_ms: number;
  model_name: string;
  is_demo: boolean;
  notes?: string;
  detections: DetectionRecord[];
}

export interface PlanogramCompareResult {
  planogram_id: number;
  audit_id: number;
  compliance_score: number;
  expected_total_facings: number;
  observed_total_objects: number;
  missing_facings_count: number;
  unexpected_objects_count: number;
  facing_discrepancies: Array<{
    row: number;
    col: number;
    type: string;
    expected: number;
    observed: number;
    product_id?: number;
    message: string;
  }>;
  status: 'COMPLIANT' | 'MINOR_DEVIATION' | 'CRITICAL_MISMATCH';
}

export interface PriorityBreakdown {
  gap_severity_score: number;
  sales_velocity_score: number;
  backroom_stock_score: number;
  task_age_score: number;
  evidence_confidence_score: number;
  total_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REQUIRES_VERIFICATION';
  weights: Record<string, number>;
  rationale: string[];
  missing_info: string[];
}

export interface OperationalTask {
  id: number;
  task_code: string;
  audit_id: number;
  planogram_id?: number;
  product_id?: number;
  aisle: string;
  shelf: string;
  problem_type: string;
  priority_level: string;
  priority_score: number;
  priority_breakdown_json?: string;
  recommended_action: string;
  trigger_thresholds: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'ACTION_TAKEN' | 'VERIFIED_RESOLVED' | 'VERIFICATION_FAILED' | 'DISMISSED';
  assigned_to?: string;
  employee_notes?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  product_name?: string;
}

export interface TaskStatusHistoryItem {
  id: number;
  task_id: number;
  previous_status: string;
  new_status: string;
  changed_by: string;
  notes?: string;
  timestamp: string;
}

export interface TaskVerificationResult {
  task_id: number;
  audit_id: number;
  before_count: number;
  after_count: number;
  target_count: number;
  result: 'SATISFIED' | 'UNMET' | 'INCONCLUSIVE';
  notes: string;
  verified_at: string;
}

export interface CheckoutLineItem {
  id?: number;
  sku: string;
  product_name: string;
  quantity_scanned: number;
  unit_price: number;
  weight_expected: number;
}

export interface CheckoutSession {
  id: number;
  session_code: string;
  checkout_location: string;
  register_id: string;
  timestamp: string;
  total_scanned_items: number;
  total_scanned_amount: number;
  total_weight_expected: number;
  total_weight_measured: number;
  reconciliation_status: string;
  notes?: string;
  is_demo: boolean;
  items: CheckoutLineItem[];
}

export interface Alert {
  id: number;
  alert_code: string;
  alert_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  source_entity_type?: string;
  source_entity_id?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  resolved_at?: string;
  is_demo: boolean;
}

export interface StoreZoneActivity {
  zone_id: number;
  name: string;
  type: string;
  dwell_target_sec: number;
  current_visitors: number;
  avg_dwell_sec: number;
  congestion: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender: 'user' | 'assistant';
  content: string;
  action_metadata_json?: string;
  action_metadata?: {
    action_type: string;
    target: string;
    label: string;
  };
  created_at: string;
}

export interface ChatConversation {
  id: number;
  title: string;
  created_at: string;
  messages: ChatMessage[];
}
