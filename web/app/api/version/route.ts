import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
    try {
        const packageJsonPath = join(process.cwd(), "..", "package.json");
        const packageJson = await readFile(packageJsonPath, "utf-8");
        const { version } = JSON.parse(packageJson);
        return NextResponse.json({ version });
    } catch (error) {
        console.error("Error fetching version:", error);
        return NextResponse.json({ error: "Failed to fetch version" }, { status: 500 });
    }
}
