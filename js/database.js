// Data structure in Firebase Realtime Database:
// /students: { studentId: { name: "...", qrCode: "...", parentEmail: "..." } }
// /scanLogs: {
//   "scan_id_1": { studentId: "...", timestamp: "...", type: "IN/OUT" },
//   "scan_id_2": { ... }
// }
// /users: { uid: { email: "...", role: "...", studentId (for parents): "..." } }

// Function to add/update student
async function saveStudent(studentId, name, parentEmail) {
    try {
        await database.ref(`students/${studentId}`).set({
            name: name,
            parentEmail: parentEmail || '', // Store empty string if no parent email
            qrCode: studentId // Assuming QR code content is the student ID
        });
        console.log(`Student ${name} (${studentId}) saved successfully.`);
        return true;
    } catch (error) {
        console.error("Error saving student:", error);
        return false;
    }
}

// Function to get a student by ID
async function getStudent(studentId) {
    try {
        const snapshot = await database.ref(`students/${studentId}`).once('value');
        return snapshot.val(); // Returns null if not found
    } catch (error) {
        console.error("Error getting student:", error);
        return null;
    }
}

// Function to log a scan event (IN/OUT)
async function logScan(studentId, type) {
    const timestamp = new Date().toISOString(); // ISO 8601 format for easy sorting
    const scanRef = database.ref('scanLogs').push(); // Generate unique key for each scan
    const scanId = scanRef.key;

    try {
        await scanRef.set({
            studentId: studentId,
            timestamp: timestamp,
            type: type // 'IN' or 'OUT'
        });
        console.log(`Scan logged for ${studentId}: ${type} at ${timestamp}`);

        // Call the data retention function immediately after logging
        manageScanLogRetention();
        return { success: true, timestamp: timestamp, scanId: scanId };
    } catch (error) {
        console.error("Error logging scan:", error);
        return { success: false, error: error.message };
    }
}

// Function to get scan history for a student (e.g., for Parent Dashboard)
async function getStudentScanHistory(studentId) {
    try {
        // Calculate timestamp for 15 days ago
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();

        const snapshot = await database.ref('scanLogs')
            .orderByChild('studentId')
            .equalTo(studentId)
            .orderByChild('timestamp') // Order by timestamp to easily filter by date
            .startAt(fifteenDaysAgo) // Only fetch records from the last 15 days
            .once('value');

        const logs = [];
        snapshot.forEach(childSnapshot => {
            logs.push(childSnapshot.val());
        });
        return logs;
    } catch (error) {
        console.error("Error fetching student scan history:", error);
        return [];
    }
}

// --- Data Retention Logic: Deletes scan logs older than 15 days ---
async function manageScanLogRetention() {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    try {
        // Query for logs with timestamps older than 15 days
        const snapshot = await database.ref('scanLogs')
            .orderByChild('timestamp')
            .endAt(fifteenDaysAgo.toISOString())
            .once('value');

        const updates = {};
        let count = 0;
        snapshot.forEach(childSnapshot => {
            // Mark for deletion by setting value to null
            updates[childSnapshot.key] = null;
            count++;
        });

        if (count > 0) {
            // Perform a multi-path update to delete all found old logs efficiently
            await database.ref('scanLogs').update(updates);
            console.log(`Deleted ${count} old scan logs.`);
        } else {
            console.log("No old scan logs to delete (or none older than 15 days).");
        }
    } catch (error) {
        console.error("Error managing scan log retention:", error);
    }
}

// Function to get all students (for Admin Dashboard)
async function getAllStudents() {
    try {
        const snapshot = await database.ref('students').once('value');
        const students = [];
        snapshot.forEach(childSnapshot => {
            students.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return students;
    } catch (error) {
        console.error("Error getting all students:", error);
        return [];
    }
}

// Function to get all users (for Admin Dashboard - fetches roles stored in DB)
async function getAllUsers() {
    try {
        const snapshot = await database.ref('users').once('value');
        const users = [];
        snapshot.forEach(childSnapshot => {
            // Include the UID as 'uid' property in the user object
            users.push({ uid: childSnapshot.key, ...childSnapshot.val() });
        });
        return users;
    } catch (error) {
        console.error("Error getting all users:", error);
        return [];
    }
}

// Note: In a larger application, you might use ES6 modules (import/export).
// For simplicity in this PWA structure, these functions are declared globally.
