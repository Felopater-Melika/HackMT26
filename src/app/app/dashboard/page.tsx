import { Nav } from "@/components/Nav";

export default function DashboardPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Nav />
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="rounded-lg bg-white p-8 shadow-sm">
					<h1 className="mb-4 font-bold text-3xl text-gray-900">Dashboard</h1>
					<p className="text-gray-600">
						This is the Dashboard page. View your medication overview and
						statistics here.
					</p>
				</div>
			</div>
		</div>
	);
}

