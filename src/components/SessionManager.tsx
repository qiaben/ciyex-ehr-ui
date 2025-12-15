/**
 * SessionManager.tsx - Complete Working Session Timeout Manager
 * 
 * Properly integrates with Keycloak and respects configured session timeouts (5-30 minutes)
 * Auto-refreshes tokens before expiry and logs out on inactivity
 */

"use client";

import React, { useEffect, useRef } from "react";
import { clearAuth } from "@/utils/authUtils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Decode JWT payload without verification
 */
function decodeJwt(token: string | null): Record<string, any> | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

/**
 * Refresh token using Keycloak refresh token endpoint
 * This keeps the token valid for another 5 minutes
 */
async function refreshKeycloakToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("refreshToken") || getCookie("refreshToken");
    
    if (!refreshToken) {
      console.log("No refresh token available");
      return false;
    }

    // Call Keycloak refresh endpoint through backend proxy
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      return false;
    }

    const data = await response.json();
    
    // Update tokens in localStorage
    if (data?.access_token || data?.data?.access_token) {
      const accessToken = data.access_token || data.data.access_token;
      localStorage.setItem("token", accessToken);
      
      if (data.refresh_token || data.data.refresh_token) {
        localStorage.setItem("refreshToken", data.refresh_token || data.data.refresh_token);
      }
      
      console.log("✅ Keycloak token refreshed successfully");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error refreshing Keycloak token:", error);
    return false;
  }
}

/**
 * Perform keep-alive to backend
 * Resets the server-side session timer
 */
async function keepAliveSession(): Promise<boolean> {
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return false;

    const response = await fetch(`${API_BASE}/api/session/keep-alive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Keep-alive request failed:", error);
    return false;
  }
}

export default function SessionManager() {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const refreshCheckId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    /**
     * Get configured session timeout in minutes from localStorage
     * Falls back to 5 minutes if not set
     */
    const getSessionTimeoutMinutes = (): number => {
      try {
        const orgId = localStorage.getItem("orgId") || "default";
        const key = `sessionTimeoutMinutes_${orgId}`;
        
        // Check both possible keys
        let timeout = localStorage.getItem(key) || localStorage.getItem("sessionTimeoutMinutes");
        
        if (!timeout) {
          console.log("No timeout configured, using 5-minute default");
          return 5;
        }

        const minutes = parseInt(timeout, 10);
        if (minutes >= 5 && minutes <= 30) {
          console.log(`✅ Using configured timeout: ${minutes} minutes`);
          return minutes;
        }

        console.warn(`Invalid timeout ${minutes}, using 5-minute default`);
        return 5;
      } catch (error) {
        console.error("Error getting timeout:", error);
        return 5;
      }
    };

    /**
     * Logout and redirect to sign-in
     */
    const logout = () => {
      console.log("⏱️ Session expired, redirecting to sign-in");
      try {
        clearAuth();
      } catch (e) {
        console.error("Error clearing auth:", e);
      }

      try {
        window.location.href = "/signin";
      } catch (e) {
        console.error("Error redirecting:", e);
      }
    };

    /**
     * Advanced token refresh scheduler.
     * - Schedules refresh to run before token expiry and before session timeout ends.
     * - Adds simple retry behavior on failure.
     */
    let refreshTimeout: NodeJS.Timeout | null = null;
    let refreshRetries = 0;

    const scheduleTokenRefresh = (sessionTimeoutMs: number) => {
      // Clear existing schedule
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const payload = decodeJwt(token);
        const nowMs = Date.now();
        let refreshAtMs = nowMs + sessionTimeoutMs - 60 * 1000; // default: 1 minute before session timeout

        if (payload && payload.exp) {
          const expMs = payload.exp * 1000;
          // refresh 30s before token expiry
          const tokenRefreshMs = expMs - 30 * 1000;
          // choose earlier of tokenRefreshMs and refreshAtMs so token is refreshed before either threshold
          refreshAtMs = Math.min(refreshAtMs, tokenRefreshMs);
        }

        const delay = Math.max(5 * 1000, refreshAtMs - nowMs); // at least 5s delay

        refreshTimeout = setTimeout(async () => {
          const ok = await attemptRefreshWithRetry();
          if (ok) {
            refreshRetries = 0;
            // reschedule after successful refresh using latest token + session timeout
            const ms = getSessionTimeoutMinutes() * 60 * 1000;
            scheduleTokenRefresh(ms);
          } else {
            // if refresh failed permanently, keep trying periodically until session timeout
            const retryDelay = Math.min(30 * 1000, sessionTimeoutMs / 6);
            refreshTimeout = setTimeout(() => scheduleTokenRefresh(sessionTimeoutMs), retryDelay);
          }
        }, delay);
      } catch (e) {
        console.error("Error scheduling token refresh:", e);
      }
    };

    const attemptRefreshWithRetry = async (): Promise<boolean> => {
      try {
        const ok = await refreshKeycloakToken();
        if (ok) return true;
      } catch (e) {
        console.debug("refresh attempt error", e);
      }

      // retry logic
      refreshRetries++;
      if (refreshRetries <= 4) {
        const backoff = 5000 * refreshRetries; // 5s,10s,15s...
        await new Promise((r) => setTimeout(r, backoff));
        return attemptRefreshWithRetry();
      }

      console.warn("Token refresh failed after retries");
      return false;
    };

    /**
     * Reset the session timeout timer
     * Called on user activity or when timeout configuration changes
     */
    const resetSessionTimer = async () => {
      try {
        // Refresh Keycloak token if needed
        await checkAndRefreshToken();

        // Send keep-alive to backend
        await keepAliveSession();

        // Clear existing timeout
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }

        // Set new timeout based on configured duration
        const timeoutMinutes = getSessionTimeoutMinutes();
        const timeoutMs = timeoutMinutes * 60 * 1000;

        console.log(`⏱️ Session timeout reset: will expire in ${timeoutMinutes} minutes`);

        timeoutId.current = setTimeout(() => {
          console.log("❌ Session timeout reached");
          logout();
        }, timeoutMs);

        // Also schedule token refresh relative to token expiry and session timeout
        scheduleTokenRefresh(timeoutMs);

        // Update last activity timestamp
        try {
          sessionStorage.setItem("lastActivity", String(Date.now()));
        } catch (e) {
          // SessionStorage might not be available
        }
        
        // Keep-alive heartbeat: call backend periodically (every ~1/3 of timeout) to reset server-side activity
        try {
          if (refreshCheckId.current) clearInterval(refreshCheckId.current);
          const heartbeatMs = Math.max(60 * 1000, Math.floor(timeoutMs / 3));
          refreshCheckId.current = setInterval(() => {
            keepAliveSession().catch(() => {});
          }, heartbeatMs);
        } catch (e) {
          console.debug("Failed to schedule keep-alive interval", e);
        }
      } catch (error) {
        console.error("Error resetting timer:", error);
      }
    };

    /**
     * Activity event listener
     * Resets timeout when user interacts with the page
     */
    const handleActivity = () => {
      resetSessionTimer();
    };

    /**
     * Handle timeout configuration changes
     * When settings are saved, localStorage is updated and we need to reload the timer
     */
    const handleConfigChange = (event: Event) => {
      console.log("📝 Configuration changed, resetting timeout");
      resetSessionTimer();
    };

    /**
     * Initial setup
     */
    console.log("🚀 SessionManager initialized");
    // Try to fetch server-side practice settings and store locally before starting timer
    const fetchServerTimeout = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/settings/practice/settings`);
        if (!resp.ok) return;
        const body = await resp.json();
        const timeout = body?.data?.sessionTimeoutMinutes;
        if (timeout && Number.isInteger(timeout) && timeout >= 5 && timeout <= 30) {
          try {
            const orgId = localStorage.getItem("orgId") || "default";
            const key = `sessionTimeoutMinutes_${orgId}`;
            localStorage.setItem(key, String(timeout));
            localStorage.setItem("sessionTimeoutMinutes", String(timeout));
            // Notify other tabs/components
            window.dispatchEvent(new Event("tokenExpiryUpdated"));
            console.log(`Fetched server timeout: ${timeout} minutes`);
          } catch (e) {
            console.error("Failed to persist server timeout locally", e);
          }
        }
      } catch (e) {
        console.debug("Could not fetch server timeout", e);
      }
    };

    fetchServerTimeout().finally(() => resetSessionTimer());

    // Activity events to track user interaction
    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Listen for visibility changes (tab switch)
    document.addEventListener("visibilitychange", handleActivity);

    // Listen for storage changes (configuration updates from other tabs)
    window.addEventListener("storage", handleConfigChange);

    // Listen for custom token expiry update event (from settings page)
    window.addEventListener("tokenExpiryUpdated", handleConfigChange);

    // Token refresh check - every 2 minutes, check if Keycloak token needs refresh
    refreshCheckId.current = setInterval(checkAndRefreshToken, 2 * 60 * 1000);

    /**
     * Cleanup
     */
    return () => {
      // Clear timers
      if (timeoutId.current) clearTimeout(timeoutId.current);
      if (refreshCheckId.current) clearInterval(refreshCheckId.current);

      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleActivity);
      window.removeEventListener("storage", handleConfigChange);
      window.removeEventListener("tokenExpiryUpdated", handleConfigChange);

      console.log("🛑 SessionManager cleaned up");
    };
  }, []);

  return null;
}
