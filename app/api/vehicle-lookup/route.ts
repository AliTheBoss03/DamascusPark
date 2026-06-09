import { NextRequest, NextResponse } from "next/server";
import { lookupVehicle, verifyRegistration } from "@/lib/services/syrian-transport-api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const plate = searchParams.get("plate");
  const mode = (searchParams.get("mode") ?? "full") as "full" | "verify";

  if (!plate) {
    return NextResponse.json({ error: "plate query parameter is required" }, { status: 400 });
  }

  if (mode === "verify") {
    const result = await verifyRegistration(plate);
    return NextResponse.json(result);
  }

  const result = await lookupVehicle(plate);
  return NextResponse.json(result);
}
