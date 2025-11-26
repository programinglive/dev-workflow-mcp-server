import { NextResponse } from "next/server";

export async function GET() {
    try {
        const packageName = "@programinglive/dev-workflow-mcp-server";
        const response = await fetch(
            `https://api.npmjs.org/downloads/point/last-month/${packageName}`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!response.ok) {
            return NextResponse.json({ downloads: 0 }, { status: 200 });
        }

        const data = await response.json();
        return NextResponse.json({ downloads: data.downloads || 0 });
    } catch (error) {
        console.error("Error fetching npm downloads:", error);
        return NextResponse.json({ downloads: 0 }, { status: 200 });
    }
}
