import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Helper function to get auth headers from the request
function getAuthHeaders(req?: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (req) {
    // Try to get from cookies first, then from incoming request headers
    const token = req.cookies.get("token")?.value || 
                  req.cookies.get("authToken")?.value ||
                  req.headers.get("authorization");
    const orgId = req.cookies.get("orgId")?.value || 
                  req.headers.get("x-org-id") ||
                  req.headers.get("orgid");
    const facilityId = req.cookies.get("facilityId")?.value || 
                       req.headers.get("x-facility-id");
    const role = req.cookies.get("role")?.value || 
                 req.headers.get("x-role");

    if (token) {
      headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    if (orgId) {
      headers["orgId"] = orgId;
    }
    if (facilityId) {
      headers["X-Facility-Id"] = facilityId;
    }
    if (role) {
      headers["X-Role"] = role;
    }
  }

  return headers;
}

export async function GET(req: NextRequest) {
  try {
    // Get all practices (which includes nested settings)
    const practicesResponse = await fetch(`${API_BASE_URL}/api/practices`, {
      method: "GET",
      headers: getAuthHeaders(req),
    });

    if (!practicesResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch practices" },
        { status: practicesResponse.status }
      );
    }

    const practicesData = await practicesResponse.json();
    
    if (!practicesData.success || !practicesData.data || practicesData.data.length === 0) {
      return NextResponse.json(
        { success: false, message: "No practice found" },
        { status: 404 }
      );
    }

    // Use first practice as default
    const defaultPractice = practicesData.data[0];

    // Extract practice settings and add the practice name
    const practiceSettings = {
      ...defaultPractice.practiceSettings,
      name: defaultPractice.name || ""
    };

    return NextResponse.json(
      { 
        success: true, 
        message: "Practice settings retrieved successfully",
        data: practiceSettings 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Practice settings GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeaders = getAuthHeaders(req);

    // Get all practices to find the default one
    const practicesResponse = await fetch(`${API_BASE_URL}/api/practices`, {
      method: "GET",
      headers: authHeaders,
    });

    if (!practicesResponse.ok) {
      const errorText = await practicesResponse.text();
      return NextResponse.json(
        { success: false, message: "Failed to fetch practices", error: errorText },
        { status: practicesResponse.status }
      );
    }

    const practicesData = await practicesResponse.json();
    
    if (!practicesData.success || !practicesData.data || practicesData.data.length === 0) {
      return NextResponse.json(
        { success: false, message: "No practice found" },
        { status: 404 }
      );
    }

    // Use first practice as default
    const defaultPractice = practicesData.data[0];
    const defaultPracticeId = defaultPractice.id;

    // Extract practice name and settings from body
    const { name, ...settingsBody } = body;

    // Create a complete practice object preserving all existing fields
    const updatedPractice = {
      ...defaultPractice,
      name: name || defaultPractice.name,
      practiceSettings: {
        ...defaultPractice.practiceSettings,
        enablePatientPractice: settingsBody.enablePatientPractice ?? defaultPractice.practiceSettings?.enablePatientPractice
      }
    };

    const updateResponse = await fetch(
      `${API_BASE_URL}/api/practices/${defaultPracticeId}`,
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(updatedPractice),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return NextResponse.json(
        { success: false, message: "Failed to update practice settings", error: errorText },
        { status: updateResponse.status }
      );
    }

    const data = await updateResponse.json();
    return NextResponse.json(data, { status: updateResponse.status });
  } catch (error) {
    console.error("Practice settings POST error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
