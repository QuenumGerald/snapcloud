export async function POST(request: Request) {
  try {
    const { requirement } = await request.json();
    if (!requirement || typeof requirement !== "string") {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    const resp = await fetch(`${backendUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement }),
    });

    const data = await resp.json();
    return Response.json(data, { status: resp.status });
  } catch (error) {
    console.error("Error proxying generate:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
