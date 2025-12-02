// src/app/settings/facilities/facilityAPI.ts

import { fetchWithAuth } from "@/utils/fetchWithAuth";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const facilityAPI = {
  async getAll() {
    const res = await fetchWithAuth(`${API_BASE}/api/facilities`);
    if (!res.ok) {
      let message = `Failed to fetch facilities (${res.status})`;
      try {
        message = (await res.text()) || message;
      } catch {}
      throw new Error(message);
    }
    // Avoid .json() on empty body
    const text = await res.text();
    if (!text) return { success: false, data: [], message: "Empty response" };
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, data: [], message: "Invalid JSON response" };
    }
  },
  async getStatistics() {
    const res = await fetchWithAuth(`${API_BASE}/api/facilities?stats=1`);
    if (!res.ok) {
      let message = `Failed to fetch statistics (${res.status})`;
      try {
        message = (await res.text()) || message;
      } catch {}
      if (res.status === 401) {
        return { success: false, data: {}, message: "Unauthorized. Please log in again." };
      }
      return { success: false, data: {}, message };
    }
    const text = await res.text();
    if (!text) return { success: false, data: {}, message: "Empty response" };
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, data: {}, message: "Invalid JSON response" };
    }
  },
  async create(facility: Record<string, any>) {
    const res = await fetchWithAuth(`${API_BASE}/api/facilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facility),
    });
    if (!res.ok) {
      let message = `Failed to create facility (${res.status})`;
      try {
        message = (await res.text()) || message;
      } catch {}
      throw new Error(message);
    }
    const text = await res.text();
    if (!text) return { success: false, data: {}, message: "Empty response" };
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, data: {}, message: "Invalid JSON response" };
    }
  },
  async update(id: string | number, facility: Record<string, any>) {
    const res = await fetchWithAuth(`${API_BASE}/api/facilities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facility),
    });
    if (!res.ok) {
      let message = `Failed to update facility (${res.status})`;
      try {
        message = (await res.text()) || message;
      } catch {}
      throw new Error(message);
    }
    const text = await res.text();
    if (!text) return { success: false, data: {}, message: "Empty response" };
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, data: {}, message: "Invalid JSON response" };
    }
  },
  async delete(id: string | number) {
    const res = await fetchWithAuth(`${API_BASE}/api/facilities/${id}`, {
      method: "DELETE" });
    if (!res.ok) {
      let message = `Failed to delete facility (${res.status})`;
      try {
        message = (await res.text()) || message;
      } catch {}
      throw new Error(message);
    }
    const text = await res.text();
    if (!text) return { success: false, data: {}, message: "Empty response" };
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, data: {}, message: "Invalid JSON response" };
    }
  },
};
