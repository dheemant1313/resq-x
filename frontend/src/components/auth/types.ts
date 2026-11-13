export type RoleType = 'RELIEF_CENTER' | 'OPERATOR' | 'ADMIN';

export type AuthStage = 
  | 'role_selection' 
  | 'login' 
  | 'register_ndrf' 
  | 'forgot_password' 
  | 'operator_locked' 
  | 'authenticated';

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  role: RoleType;
  username: string;
  center_id: number | null;
}
