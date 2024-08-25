// Initialize the database
const db = new Dexie('MyAppDatabase');

// Define a schema
db.version(1).stores({
  posts: '++id, title, created_at'
});

// Function to add a record
function addRecord(data) {
  return db.posts.add({
    title: data['title'],
    created_at: new Date()
  });
}

// Function to get all records
function getAllRecords() {
  return db.posts.toArray();
}

// Function to clear all records
function clearRecords() {
  return db.posts.clear();
}

// Function to delete a record from the 'posts' table
function deleteRecord(postId) {
  return db.posts.delete(postId);
}

// Export functions for use in other parts of the app
export { addRecord, getAllRecords, clearRecords, deleteRecord, db };
