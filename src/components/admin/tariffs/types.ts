
// Типи для тарифних планів та обмежень
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface TariffPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number | null;
  is_permanent: boolean;
  currency: {
    code: string;
    name: string;
    id?: string;
  };
}

export interface LimitationType {
  id: string;
  name: string;
  description: string;
}

export interface PlanLimitation {
  id: string;
  limitation_type: LimitationType;
  value: number;
}

export interface LimitationTypeResponse {
  limitation_types: {
    name: string;
    description: string;
  };
  value: number;
}
