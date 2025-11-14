/*
import {config} from "zod/v4";
import {fetchWithAuth} from "@/utils/fetchWithAuth";

/!**
 * Get Sikka credentials from tenant config API
 *!/
async function getSikkaCredentials() {
  try {
    console.log(' Fetching Sikka credentials from tenant config...');
    const res = await fetchWithAuth(${API_BASE}/api/tenants/config);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          'Tenant configuration not found. Please ensure you are logged in and have selected a practice.'
        );
      }
      throw new Error(Failed to fetch tenant config: );
    }

    const response = await res.json();
    console.log(' Tenant config response:', response);

    if (!response.success || !response.data) {
      throw new Error('Failed to load tenant configuration');
    }

    const data = response.data;
    const sikka = data.integrations?.sikka;

    if (!sikka || !sikka.appId || !sikka.appKey) {
      throw new Error(
        'Sikka credentials not configured. Please configure them in Keycloak group attributes:\n' +
        '- sikka_app_id\n' +
        '- sikka_app_key\n' +
        '- sikka_refresh_key'
      );
    }

    console.log(' Sikka credentials loaded successfully');
    return {
      appId: sikka.appId,
      appKey: sikka.appKey,
      refreshKey: sikka.refreshKey || sikka.appKey, // Use appKey as fallback
    };
  } catch (error) {
    console.error(' Error fetching Sikka credentials:', error);
    throw new Error(
      'Unable to load Sikka credentials. Please configure them in Keycloak group attributes.'
    );
  }
}
*/
