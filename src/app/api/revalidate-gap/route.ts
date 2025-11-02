import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN;

export async function POST(request: NextRequest) {
	if (REVALIDATE_TOKEN) {
		const authHeader = request.headers.get("authorization");
		const expectedHeader = `Bearer ${REVALIDATE_TOKEN}`;
		if (authHeader !== expectedHeader) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch (error) {
		return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
	}

	const jobId = (payload as { jobId?: number | string }).jobId;
	if (jobId === undefined || jobId === null || jobId === "") {
		return NextResponse.json({ error: "jobId is required" }, { status: 400 });
	}

	const tag = `gap-report-${jobId}`;
	revalidateTag(tag);

	return NextResponse.json({ revalidated: true, tag });
}

