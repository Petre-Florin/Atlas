import { NextResponse } from "next/server";
import { getFullExport } from "@/lib/export";

export async function GET() {
  const data = await getFullExport();

  if (!data) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const filename = `atlas-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
