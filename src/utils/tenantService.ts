export interface AccessibleTenantsResponse {
  hasFullAccess: boolean;
  tenants: string[];
  requiresSelection: boolean;
}

export const getAccessibleTenants = async (token: string): Promise<AccessibleTenantsResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  const response = await fetch(`${apiUrl}/api/tenants/accessible`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch accessible tenants');
  }

  const data = await response.json();
  return data.data;
};

export const getSelectedTenant = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedTenant');
};

export const setSelectedTenant = (tenantName: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selectedTenant', tenantName);
};

export const clearSelectedTenant = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('selectedTenant');
};
