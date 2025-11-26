import { NextRequest, NextResponse } from "next/server";
import { resolveDocContent, getAvailableDocs } from "@/lib/docs";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rawDocKey = searchParams.get("doc");
    const availableDocs = getAvailableDocs();

    if (!rawDocKey) {
        return NextResponse.json({ docs: availableDocs });
    }

    const docKey = rawDocKey.trim();
    const resolvedKey = availableDocs.find((key) => key.toLowerCase() === docKey.toLowerCase());

    if (!resolvedKey) {
        return NextResponse.json(
            { error: "Document not found", requested: docKey, available: availableDocs },
            { status: 404 }
        );
    }

    const result = await resolveDocContent(resolvedKey);
    if (!result.exists) {
        return NextResponse.json(
            { error: "Document asset is missing" },
            { status: 500 }
        );
    }

    return NextResponse.json({ doc: resolvedKey, content: result.content, format: result.format });
}
