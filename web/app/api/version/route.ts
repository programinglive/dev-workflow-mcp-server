import { NextResponse } from "next/server";

// Version is updated during build/release process
const PACKAGE_VERSION = "1.5.1";

export async function GET() {
    return NextResponse.json({ version: PACKAGE_VERSION });
}
