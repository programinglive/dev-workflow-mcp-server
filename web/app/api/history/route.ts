import { NextRequest, NextResponse } from "next/server";
import { getHistoryForUser } from "@/lib/db";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user") || "default";
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    try {
        const history = getHistoryForUser(userId, { page, pageSize, startDate, endDate });
        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
