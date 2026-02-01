import { db } from "@/server/db";
import { allergies } from "@/server/db/schema";

// Top 20 most common medication allergies
const top20MedicationAllergies = [
	{
		name: "Penicillin",
		description: "Allergy to penicillin and related antibiotics (amoxicillin, ampicillin)",
	},
	{
		name: "Sulfonamides (Sulfa drugs)",
		description: "Allergy to sulfonamide antibiotics and related medications",
	},
	{
		name: "Aspirin",
		description: "Allergy or sensitivity to aspirin (acetylsalicylic acid)",
	},
	{
		name: "NSAIDs (Ibuprofen, Naproxen)",
		description: "Allergy to non-steroidal anti-inflammatory drugs",
	},
	{
		name: "Codeine",
		description: "Allergy to codeine and related opioid pain medications",
	},
	{
		name: "Morphine",
		description: "Allergy to morphine and related opioid analgesics",
	},
	{
		name: "Cephalosporins",
		description: "Allergy to cephalosporin antibiotics (cephalexin, ceftriaxone)",
	},
	{
		name: "Fluoroquinolones",
		description: "Allergy to fluoroquinolone antibiotics (ciprofloxacin, levofloxacin)",
	},
	{
		name: "Tetracyclines",
		description: "Allergy to tetracycline antibiotics (doxycycline, minocycline)",
	},
	{
		name: "Macrolides",
		description: "Allergy to macrolide antibiotics (azithromycin, erythromycin, clarithromycin)",
	},
	{
		name: "ACE Inhibitors",
		description: "Allergy or adverse reaction to ACE inhibitors (lisinopril, enalapril)",
	},
	{
		name: "Statins",
		description: "Allergy or intolerance to statin medications (atorvastatin, simvastatin)",
	},
	{
		name: "Insulin",
		description: "Allergy to insulin preparations",
	},
	{
		name: "Contrast Dye (Iodine-based)",
		description: "Allergy to iodinated contrast media used in imaging",
	},
	{
		name: "Local Anesthetics (Lidocaine)",
		description: "Allergy to local anesthetics like lidocaine, novocaine",
	},
	{
		name: "General Anesthetics",
		description: "Allergy to general anesthesia medications",
	},
	{
		name: "Anticonvulsants",
		description: "Allergy to seizure medications (phenytoin, carbamazepine, lamotrigine)",
	},
	{
		name: "Muscle Relaxants",
		description: "Allergy to muscle relaxant medications (cyclobenzaprine, baclofen)",
	},
	{
		name: "Latex",
		description: "Allergy to latex (relevant for medical procedures and equipment)",
	},
	{
		name: "Metformin",
		description: "Allergy or intolerance to metformin diabetes medication",
	},
];

async function seedMedicationAllergies() {
	try {
		console.log("Seeding top 20 medication allergies...");

		let successCount = 0;
		let skippedCount = 0;

		for (const allergy of top20MedicationAllergies) {
			try {
				await db
					.insert(allergies)
					.values({
						name: allergy.name,
						description: allergy.description,
						source: "system",
						isVerified: true,
					})
					.onConflictDoNothing();
				successCount++;
			} catch (error) {
				console.log(
					`Skipped allergy "${allergy.name}" (likely already exists)`,
				);
				skippedCount++;
			}
		}

		console.log(`✅ Successfully seeded ${successCount} allergies`);
		console.log(`⏭️  Skipped ${skippedCount} existing allergies`);
		console.log("🎉 Medication allergies seeding completed!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error seeding allergies:", error);
		process.exit(1);
	}
}

seedMedicationAllergies();

// Utility: set createdBy to "system" for all allergies
export async function setAllAllergiesCreatedByToSystem() {
	try {
		console.log('Updating all allergies.createdBy -> "system"');
		await db.update(allergies).set({ createdBy: "system" });
		console.log("Done.");
	} catch (error) {
		console.error("Failed to update createdBy to system:", error);
	}
}

// Export the seed function
export { seedMedicationAllergies };
