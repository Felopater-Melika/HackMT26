import auth from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const ENABLE_AUTO_REDIRECT = true;

export default async function Home() {
	if (ENABLE_AUTO_REDIRECT) {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (session) {
			redirect("/app");
		} else {
			redirect("/app/signin");
		}
	}

	return (
		<div className="p-8">
			<h1 className="mb-4 font-bold text-2xl">Cliniq Care</h1>
		</div>
	);
}
