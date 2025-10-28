import { env } from "@/env";
import { Polar } from "@polar-sh/sdk";

const polarClient = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
});

export async function createOrGetPolarCustomer(email: string, name?: string) {
	try {
		const existingCustomers = [];
		const iterator = await polarClient.customers.list({ email });
		for await (const customer of iterator) {
			existingCustomers.push(customer);
		}

		if (existingCustomers.length > 0) {
			return existingCustomers[0];
		}

		const newCustomer = await polarClient.customers.create({
			email,
			name: name || email.split("@")[0],
		});

		return newCustomer;
	} catch (error) {
		console.error("Error creating/getting Polar customer:", error);
		throw error;
	}
}

export async function getPolarCustomer(email: string) {
	try {
		const customers = [];
		const iterator = await polarClient.customers.list({ email });
		for await (const customer of iterator) {
			customers.push(customer);
		}

		return customers.length > 0 ? customers[0] : null;
	} catch (error) {
		console.error("Error getting Polar customer:", error);
		return null;
	}
}
