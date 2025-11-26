import { NextRequest, NextResponse } from "next/server";
import { getSummaryForUser } from "@/lib/db";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user") || "default";

    try {
        const summary = getSummaryForUser(userId);
        return NextResponse.json({ summary });
    } catch (error) {
        console.error("Error fetching summary:", error);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}
