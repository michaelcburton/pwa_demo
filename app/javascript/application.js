// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"
import { addRecord, getAllRecords, clearRecords } from './indexeddb';

// Example of adding a record when a form is submitted
document.addEventListener('turbo:load', () => {
  const toggleButton = document.querySelector('#toggle-online');
  const statusText = document.querySelector('#status-text');
  const statusIndicator = document.querySelector('#connectivity-status');
  const clearRecordsButton = document.querySelector('#clear-offline-records');

  function updateStatusIndicator() {
    if (navigator.onLine) {
      statusText.textContent = 'Online';
      statusIndicator.style.backgroundColor = 'green';
    } else {
      statusText.textContent = 'Offline';
      statusIndicator.style.backgroundColor = 'red';
    }
  }

  // Initially update status on page load
  updateStatusIndicator();

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      if (navigator.onLine) {
        simulateOfflineMode();
      } else {
        simulateOnlineMode();
      }
      updateStatusIndicator(); // Update the indicator each time the button is clicked
    });
  }

  function simulateOfflineMode() {
    navigator.__defineGetter__('onLine', function () { return false; });
    const offlineEvent = new Event('offline');
    window.dispatchEvent(offlineEvent);
    console.log('Simulated offline mode');
  }

  function simulateOnlineMode() {
    navigator.__defineGetter__('onLine', function () { return true; });
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);
    console.log('Simulated online mode');
  }

  if (clearRecordsButton) {
    clearRecordsButton.addEventListener('click', () => {
      clearRecords();
      window.location.reload();
    });
  }

  // Function to render posts in the HTML
  function renderPosts(posts) {
    const container = document.querySelector('#posts-container');
    container.innerHTML = ''; // Clear existing posts

    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.className = 'post';
      postElement.innerHTML = `<h2>${post.title}</h2><p>Created at: ${new Date(post.created_at).toLocaleString()}</p><p>Data: ${JSON.stringify(post)}`;
      container.appendChild(postElement);
    });
  }

  // Fetch all posts from IndexedDB and render them
  getAllRecords().then(posts => {
    renderPosts(posts);
  });

  const form = document.querySelector('#post-form');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      // const data = Object.fromEntries(formData.entries());
      const title = formData.get('post[title]');
  
      // Prepare the data object for IndexedDB
      const data = {
        title: title,
        created_at: new Date() // capture the current date and time
      };
  
      // Save to IndexedDB
      addRecord(data).then(() => {
        console.log('Record added to IndexedDB');
      });
  
      // Optionally, send the data to the server if online
      if (navigator.onLine) {
        fetch('/posts', {
          method: 'POST',
          body: JSON.stringify({ post: data }),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          }
        }).then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
          .then(data => {
            console.log('Server response:', data);
            // Redirect to posts index page after successful online submission
            window.location.href = '/posts'; // Adjust the URL if necessary
          })
          .catch(error => console.error('Error posting data:', error));
      }
    });  
  }
});
