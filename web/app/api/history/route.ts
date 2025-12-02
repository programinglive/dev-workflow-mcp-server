import { NextResponse } from "next/server";

export async function GET() {
    // Return placeholder data - database integration not available in static deployment
    return NextResponse.json({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1
    });
}
