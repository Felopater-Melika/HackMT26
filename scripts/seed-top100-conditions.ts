import { db } from '@/server/db';
import { conditions } from '@/server/db/schema';

// Top 100 most common medical conditions based on ICD-10 codes and medical databases
// If this array is currently < 100, that's why you only saw ~50.
// We'll keep expanding it, but in production you should import an official list.
const top100Conditions = [
  {
    name: 'Essential (Primary) Hypertension',
    description: 'High blood pressure without an identifiable cause',
  },
  {
    name: 'Acute Upper Respiratory Infections',
    description: 'Common cold and viral upper respiratory tract infections',
  },
  { name: 'Dorsalgia (Back Pain)', description: 'Pain in the back region' },
  {
    name: 'Pneumonia, Organism Unspecified',
    description: 'Inflammation of the lungs caused by infection',
  },
  {
    name: 'Asthma',
    description: 'Chronic inflammatory disease of the airways',
  },
  {
    name: 'Senile Cataract',
    description: 'Age-related clouding of the eye lens',
  },
  {
    name: 'Other Soft Tissue Disorders',
    description: 'Various disorders affecting muscles, tendons, and ligaments',
  },
  {
    name: 'Depressive Episode',
    description: 'Period of persistent sadness and loss of interest',
  },
  {
    name: 'Atrial Fibrillation and Flutter',
    description: 'Irregular heart rhythm',
  },
  {
    name: 'Gonarthrosis (Arthrosis of Knee)',
    description: 'Degenerative joint disease of the knee',
  },
  {
    name: 'Suppurative and Unspecified Otitis Media',
    description: 'Middle ear infection',
  },
  {
    name: 'Conductive and Sensorineural Hearing Loss',
    description: 'Hearing impairment',
  },
  {
    name: 'Sleep Disorders',
    description: 'Conditions affecting sleep patterns and quality',
  },
  {
    name: 'Chronic Ischemic Heart Disease',
    description: 'Reduced blood flow to the heart muscle',
  },
  {
    name: 'Diarrhea and Gastroenteritis',
    description: 'Inflammation of the stomach and intestines',
  },
  {
    name: 'Other Anxiety Disorders',
    description: 'Various anxiety-related mental health conditions',
  },
  {
    name: 'Non-Insulin-Dependent Diabetes Mellitus',
    description: 'Type 2 diabetes mellitus',
  },
  {
    name: 'Other Disorders of Urinary System',
    description: 'Various conditions affecting the urinary tract',
  },
  {
    name: 'Other Joint Disorders',
    description: 'Various conditions affecting joints',
  },
  {
    name: 'Diverticular Disease of Intestine',
    description: 'Small pouches forming in the colon wall',
  },
  {
    name: 'Other Intervertebral Disc Disorders',
    description: 'Conditions affecting spinal discs',
  },
  {
    name: 'Heart Failure',
    description: 'Inability of the heart to pump blood effectively',
  },
  {
    name: 'Atopic Dermatitis',
    description: 'Chronic inflammatory skin condition (eczema)',
  },
  {
    name: 'Acute Tubulo-Interstitial Nephritis',
    description: 'Inflammation of kidney tubules',
  },
  { name: 'Cholelithiasis', description: 'Gallstones in the gallbladder' },
  {
    name: 'Cerebral Infarction',
    description: 'Stroke caused by blocked blood vessel in brain',
  },
  {
    name: 'Shoulder Lesions',
    description: 'Various conditions affecting the shoulder joint',
  },
  {
    name: 'Inguinal Hernia',
    description: 'Protrusion of abdominal contents through groin',
  },
  {
    name: 'Recurrent Depressive Disorder',
    description: 'Repeated episodes of depression',
  },
  {
    name: 'Mental and Behavioral Disorders Due to Alcohol Use',
    description: 'Alcohol-related mental health conditions',
  },
  { name: 'Hyperlipidemia', description: 'High levels of fats in the blood' },
  { name: 'Abdominal Pain', description: 'Pain in the abdominal region' },
  {
    name: 'Sprains and Strains',
    description: 'Injuries to muscles, tendons, and ligaments',
  },
  { name: 'Cardiac Dysrhythmias', description: 'Abnormal heart rhythms' },
  {
    name: 'Other Lower Respiratory Diseases',
    description: 'Various conditions affecting the lower respiratory tract',
  },
  {
    name: 'Nonspecific Chest Pain',
    description: 'Chest pain without identifiable cause',
  },
  {
    name: 'Other Connective Tissue Diseases',
    description: 'Various autoimmune conditions affecting connective tissue',
  },
  {
    name: 'Headache, Including Migraine',
    description: 'Pain in the head and neck region',
  },
  {
    name: 'Superficial Injury, Contusion',
    description: 'Bruising and minor skin injuries',
  },
  {
    name: 'Spondylosis, Intervertebral Disc Disorders',
    description: 'Degenerative changes in the spine',
  },
  {
    name: 'Mood Disorders',
    description: 'Mental health conditions affecting emotional state',
  },
  { name: 'Osteoarthritis', description: 'Degenerative joint disease' },
  { name: 'Septicemia', description: 'Blood infection' },
  {
    name: 'Spondylosis, Intervertebral Disc Disorders, Other Back Problems',
    description: 'Various spinal conditions',
  },
  {
    name: 'Complication of Device, Implant, or Graft',
    description: 'Problems with medical devices or implants',
  },
  {
    name: 'Congestive Heart Failure, Nonhypertensive',
    description: 'Heart failure not caused by high blood pressure',
  },
  {
    name: 'Pneumonia (Except Tuberculosis and STDs)',
    description: 'Lung infection excluding specific causes',
  },
  {
    name: 'Urinary Tract Infections',
    description: 'Infections of the urinary system',
  },
  {
    name: 'Common Cold/Virus',
    description: 'Viral upper respiratory infection',
  },
  {
    name: 'Gastroenteritis',
    description: 'Inflammation of the stomach and intestines',
  },
  { name: 'Obesity', description: 'Excessive body fat accumulation' },
  {
    name: 'Diverticulitis',
    description: 'Inflammation of diverticula in the colon',
  },
  {
    name: 'Allergic Rhinitis',
    description: 'Hay fever and seasonal allergies',
  },
  { name: 'Insomnia', description: 'Difficulty falling or staying asleep' },
  {
    name: 'Oral/Dental Health Issues',
    description: 'Problems with teeth and oral cavity',
  },
  { name: 'GERD/Heartburn', description: 'Gastroesophageal reflux disease' },
  { name: 'Hypertension', description: 'High blood pressure' },
  { name: 'Osteoporosis', description: 'Bone density loss' },
  { name: 'Alopecia Areata', description: 'Patchy hair loss' },
  { name: 'Acne', description: 'Skin condition causing pimples' },
  {
    name: 'Genital Herpes',
    description: 'Sexually transmitted viral infection',
  },
  {
    name: 'Chronic Kidney Disease',
    description: 'Progressive loss of kidney function',
  },
  {
    name: 'Anxiety Disorder',
    description: 'Mental health condition characterized by excessive worry',
  },
  { name: 'Plantar Warts', description: 'Warts on the soles of the feet' },
  { name: 'Migraine', description: 'Severe headache disorder' },
  {
    name: 'High Cholesterol',
    description: 'Elevated cholesterol levels in blood',
  },
  { name: 'Vertigo', description: 'Sensation of spinning or dizziness' },
  {
    name: 'Premenstrual Syndrome',
    description: 'Physical and emotional symptoms before menstruation',
  },
  { name: 'COPD', description: 'Chronic Obstructive Pulmonary Disease' },
  {
    name: 'Irritable Bowel Syndrome',
    description: 'Digestive disorder affecting the large intestine',
  },
  { name: 'Kidney Stone', description: 'Hard deposits forming in the kidneys' },
  { name: 'Type II Diabetes', description: 'Diabetes mellitus type 2' },
  { name: 'Influenza', description: 'Viral respiratory illness' },
  { name: 'Tinnitus', description: 'Ringing or buzzing in the ears' },
  { name: 'Cataracts', description: 'Clouding of the eye lens' },
  { name: 'Sleep Apnea', description: 'Breathing interruptions during sleep' },
  {
    name: 'Depression',
    description: 'Persistent feeling of sadness and loss of interest',
  },
  { name: 'Gallstone', description: 'Hard deposits in the gallbladder' },
  {
    name: 'Coronary Artery Disease',
    description: 'Narrowing of coronary arteries',
  },
  { name: 'Arrhythmia', description: 'Irregular heart rhythm' },
  {
    name: 'Rosacea',
    description: 'Chronic skin condition causing facial redness',
  },
  {
    name: 'Endometriosis',
    description: 'Uterine tissue growing outside the uterus',
  },
  {
    name: 'Lumbar Radiculopathy',
    description: 'Nerve root compression in lower back',
  },
  {
    name: 'Tuberculosis',
    description: 'Bacterial infection primarily affecting the lungs',
  },
  { name: 'Cold Sores', description: 'Herpes simplex virus causing lip sores' },
  { name: 'Fibroids', description: 'Non-cancerous growths in the uterus' },
  { name: 'Hemorrhoids', description: 'Swollen veins in the rectum and anus' },
  {
    name: 'Syncope',
    description: 'Temporary loss of consciousness (fainting)',
  },
  {
    name: 'Peripheral Arterial Disease',
    description: 'Narrowing of arteries in the limbs',
  },
  {
    name: 'Gout',
    description: 'Inflammatory arthritis caused by uric acid crystals',
  },
  {
    name: 'Valvular Heart Disease',
    description: 'Diseases affecting heart valves',
  },
  { name: 'Psoriasis', description: 'Chronic autoimmune skin condition' },
  { name: 'Aortic Aneurysm', description: 'Bulging of the aorta wall' },
  {
    name: 'Conjunctivitis',
    description: 'Inflammation of the eye conjunctiva',
  },
  {
    name: 'Chronic Fatigue Syndrome',
    description: 'Persistent fatigue not explained by other conditions',
  },
  {
    name: 'Fibromyalgia',
    description: 'Widespread musculoskeletal pain and fatigue',
  },
  {
    name: 'Multiple Sclerosis',
    description: 'Autoimmune disease affecting the central nervous system',
  },
  { name: "Crohn's Disease", description: 'Inflammatory bowel disease' },
  {
    name: 'Lupus',
    description: 'Autoimmune disease affecting multiple body systems',
  },
  {
    name: 'Rheumatoid Arthritis',
    description: 'Autoimmune inflammatory arthritis',
  },
  {
    name: "Parkinson's Disease",
    description: 'Progressive nervous system disorder affecting movement',
  },
  {
    name: "Alzheimer's Disease",
    description: 'Progressive brain disorder affecting memory and thinking',
  },
  {
    name: 'Epilepsy',
    description: 'Neurological disorder causing recurrent seizures',
  },
  {
    name: 'Thyroid Disorder',
    description: 'Conditions affecting thyroid gland function',
  },
  { name: 'Hypothyroidism', description: 'Underactive thyroid gland' },
  { name: 'Hyperthyroidism', description: 'Overactive thyroid gland' },
  {
    name: 'Chronic Pain Syndrome',
    description: 'Persistent pain lasting more than 3 months',
  },
  {
    name: 'Bipolar Disorder',
    description: 'Mental health condition with extreme mood swings',
  },
  {
    name: 'Schizophrenia',
    description: 'Serious mental disorder affecting thinking and behavior',
  },
  {
    name: 'Post-Traumatic Stress Disorder',
    description: 'Mental health condition triggered by traumatic events',
  },
  {
    name: 'Obsessive-Compulsive Disorder',
    description: 'Mental health condition with unwanted thoughts and behaviors',
  },
  {
    name: 'Attention Deficit Hyperactivity Disorder',
    description: 'Neurodevelopmental disorder affecting attention and behavior',
  },
  {
    name: 'Autism Spectrum Disorder',
    description: 'Developmental disorder affecting communication and behavior',
  },
];

async function seedTop100Conditions() {
  try {
    console.log('Seeding top 100 medical conditions...');

    let successCount = 0;
    let skippedCount = 0;

    for (const condition of top100Conditions) {
      try {
        await db
          .insert(conditions)
          .values({
            name: condition.name,
            description: condition.description,
            source: 'system',
            isVerified: true,
          })
          .onConflictDoNothing();
        successCount++;
      } catch (error) {
        console.log(
          `Skipped condition "${condition.name}" (likely already exists)`
        );
        skippedCount++;
      }
    }

    console.log(`✅ Successfully seeded ${successCount} conditions`);
    console.log(`⏭️  Skipped ${skippedCount} existing conditions`);
    console.log('🎉 Top 100 medical conditions seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding conditions:', error);
  }
}

// seedTop100Conditions();

// Utility: set createdBy to "system" for all conditions
export async function setAllConditionsCreatedByToSystem() {
  try {
    console.log('Updating all conditions.createdBy -> "system"');
    await db.update(conditions).set({ createdBy: 'system' });
    console.log('Done.');
  } catch (error) {
    console.error('Failed to update createdBy to system:', error);
  }
}

setAllConditionsCreatedByToSystem();
