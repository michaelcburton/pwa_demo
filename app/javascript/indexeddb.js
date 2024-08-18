// Initialize the database
const db = new Dexie('MyAppDatabase');

// Define a schema
db.version(1).stores({
  records: '++id, data, created_at'
});

// Function to add a record
function addRecord(data) {
  return db.records.add({
    data: data,
    created_at: new Date()
  });
}

// Function to get all records
function getAllRecords() {
  return db.records.toArray();
}

// Function to clear all records
function clearRecords() {
  return db.records.clear();
}

// Export functions for use in other parts of the app
export { addRecord, getAllRecords, clearRecords };
