import { Polar } from '@polar-sh/sdk';
import { env } from '@/env';

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
});

export async function createOrGetPolarCustomer(email: string, name?: string) {
  try {
    // First, try to find existing customer
    const existingCustomers = [];
    const iterator = await polarClient.customers.list({ email });
    for await (const customer of iterator) {
      existingCustomers.push(customer);
    }

    if (existingCustomers.length > 0) {
      // Customer already exists, return the first one
      return existingCustomers[0];
    }

    // Customer doesn't exist, create a new one
    const newCustomer = await polarClient.customers.create({
      email,
      name: name || email.split('@')[0], // Use name or fallback to email prefix
    });

    return newCustomer;
  } catch (error) {
    console.error('Error creating/getting Polar customer:', error);
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
    console.error('Error getting Polar customer:', error);
    return null;
  }
}
