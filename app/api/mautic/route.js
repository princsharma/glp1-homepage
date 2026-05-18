import { NextResponse } from "next/server";

// Server-side proxy for Mautic standalone form submissions.
// Avoids CORS by POSTing from the server instead of the browser.

const MAUTIC_BASE_URL = "https://mautic.taskor.io";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const formId = typeof body.formId === "number" ? body.formId : null;
    const payload =
      body.payload && typeof body.payload === "object" ? body.payload : null;

    if (!formId) {
      return NextResponse.json(
        { success: false, message: "Missing formId." },
        { status: 400 },
      );
    }
    if (!payload || typeof payload.email !== "string" || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Missing email." },
        { status: 400 },
      );
    }

    const formData = new URLSearchParams();
    formData.set("mauticform[formId]", String(formId));
    formData.set("mauticform[messenger]", "1");
    formData.set("mauticform[return]", "");

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null || value === "") continue;
      formData.set(`mauticform[${key}]`, String(value));
    }

    const res = await fetch(`${MAUTIC_BASE_URL}/form/submit?formId=${formId}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      redirect: "manual",
    });

    const ok = res.ok || (res.status >= 300 && res.status < 400);
    return NextResponse.json({ success: ok, status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
