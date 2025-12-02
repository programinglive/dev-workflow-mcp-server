import { NextResponse } from "next/server";

export async function GET() {
    // Return placeholder data - database integration not available in static deployment
    const summary = {
        totalTasks: 0,
        taskTypes: {},
        lastActive: null,
        recentTasks: [],
        updatedAt: null,
    };
    return NextResponse.json({ summary });
}
