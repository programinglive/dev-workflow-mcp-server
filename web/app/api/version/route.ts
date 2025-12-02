import { NextResponse } from "next/server";

// Version is updated during build/release process
const PACKAGE_VERSION = "1.4.11";

export async function GET() {
    return NextResponse.json({ version: PACKAGE_VERSION });
}
