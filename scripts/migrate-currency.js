import { db } from '../app/lib/firebase.js';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const migrate = async () => {
  console.log('Starting currency migration...');

  try {
    const groupsRef = collection(db, 'groups');
    const snapshot = await getDocs(groupsRef);

    if (snapshot.empty) {
      console.log('No groups found.');
      process.exit(0);
    }

    console.log(`Found ${snapshot.size} groups. Checking for missing currency field...`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const groupDoc of snapshot.docs) {
      const data = groupDoc.data();

      if (!data.currency) {
        try {
          const groupRef = doc(db, 'groups', groupDoc.id);
          await updateDoc(groupRef, {
            currency: 'USD'
          });
          console.log(`[UPDATE] Group ${groupDoc.id}: Added currency: 'USD'`);
          updatedCount++;
        } catch (err) {
          console.error(`[ERROR] Failed to update group ${groupDoc.id}:`, err.message);
          errorCount++;
        }
      } else {
        skippedCount++;
      }
    }

    console.log('--------------------------------------------------');
    console.log('Migration complete.');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors:  ${errorCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  }

  process.exit(0);
};

migrate();