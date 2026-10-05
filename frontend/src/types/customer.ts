export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  is_active?: boolean;
}
