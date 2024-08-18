// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"
import { addRecord, getAllRecords, clearRecords } from './indexeddb';

// Example of adding a record when a form is submitted
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#post-form');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    // const data = Object.fromEntries(formData.entries());
    const title = formData.get('title');

    // Prepare the data object for IndexedDB
    const data = {
      title: title,
      created_at: new Date() // capture the current date and time
    };

    // Save to IndexedDB
    addRecord(data).then(() => {
      console.log(data)
      console.log('Record added to IndexedDB');
    });

    // Optionally, send the data to the server if online
    // if (navigator.onLine) {
    //   fetch('/posts', { // assuming the Rails route is '/posts'
    //     method: 'POST',
    //     body: JSON.stringify({ post: data }), // wrap the data in a 'post' object to match Rails conventions
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
    //     }
    //   }).then(response => response.json())
    //     .then(data => console.log('Server response:', data))
    //     .catch(error => console.error('Error posting data:', error));
    // }
  });
});
