// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"
import { addRecord, getAllRecords, clearRecords } from './indexeddb';

// Example of adding a record when a form is submitted
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#your-form-id');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Save to IndexedDB
    addRecord(data).then(() => {
      console.log('Record added to IndexedDB');
    });

    // Optionally, you can also send the data to the server if online
    if (navigator.onLine) {
      fetch('/your_server_endpoint', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      });
    }
  });
});
