import auth from "@/lib/auth";

function logAuthRoute(
	method: string,
	originalUrl: string,
	segments: string[],
	reconstructedPath: string,
	status?: number,
) {
	console.log("[auth route]", {
		method,
		originalUrl,
		segments,
		reconstructedPath,
		status,
	});
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ all?: string[] }> },
) {
	const { all = [] } = await params;
	const url = new URL(request.url);
	url.pathname = `/api/auth/${all.join("/")}`;
	const res = await auth.handler(new Request(url, request));
	logAuthRoute("GET", request.url, all, url.pathname, (res as Response).status);
	return res;
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ all?: string[] }> },
) {
	const { all = [] } = await params;
	const url = new URL(request.url);
	url.pathname = `/api/auth/${all.join("/")}`;
	const res = await auth.handler(new Request(url, request));
	logAuthRoute(
		"POST",
		request.url,
		all,
		url.pathname,
		(res as Response).status,
	);
	return res;
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ all?: string[] }> },
) {
	const { all = [] } = await params;
	const url = new URL(request.url);
	url.pathname = `/api/auth/${all.join("/")}`;
	const res = await auth.handler(new Request(url, request));
	logAuthRoute("PUT", request.url, all, url.pathname, (res as Response).status);
	return res;
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ all?: string[] }> },
) {
	const { all = [] } = await params;
	const url = new URL(request.url);
	url.pathname = `/api/auth/${all.join("/")}`;
	const res = await auth.handler(new Request(url, request));
	logAuthRoute(
		"PATCH",
		request.url,
		all,
		url.pathname,
		(res as Response).status,
	);
	return res;
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ all?: string[] }> },
) {
	const { all = [] } = await params;
	const url = new URL(request.url);
	url.pathname = `/api/auth/${all.join("/")}`;
	const res = await auth.handler(new Request(url, request));
	logAuthRoute(
		"DELETE",
		request.url,
		all,
		url.pathname,
		(res as Response).status,
	);
	return res;
}
