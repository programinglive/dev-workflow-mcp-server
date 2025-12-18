import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const sidCookie = cookieStore.get('connect.sid');

        // Pass SID (even if undefined, script has fallback)
        const sid = sidCookie ? sidCookie.value : '';

        const scriptPath = path.join(process.cwd(), 'scripts', 'db-query-history.js');
        const env = { ...process.env };

        // Execute node script, passing SID as argument
        const { stdout, stderr } = await execPromise(`node "${scriptPath}" "${sid}"`, { env });

        try {
            // Find start of JSON by looking for specific signature
            const jsonStart = stdout.indexOf('{"history":');
            const jsonEnd = stdout.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No valid history JSON found in output');
            }

            const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
            const data = JSON.parse(jsonStr);

            if (data.error) {
                console.error('History Script Error:', data.error);
                return NextResponse.json(data, { status: 500 });
            }
            return NextResponse.json(data);
        } catch (e: any) {
            console.error('History API Parse Error:', e.message);
            console.error('STDOUT:', stdout);
            console.error('STDERR:', stderr);
            return NextResponse.json({
                error: 'Failed to parse script output',
                details: e.message,
                stdoutSnippet: stdout.slice(0, 200)
            }, { status: 500 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
