import { getAllRecords, addRecord, deleteRecord, clearRecords } from "indexeddb";

const clearRecordsButton = document.querySelector('#clear-offline-records');

export function synchronizeData() {
  getAllRecords().then(posts => {
    if (posts.length > 0) {
      console.log('Syncing posts:', posts);
      syncPostsToServer(posts);
    }
  });
}

function syncPostsToServer(posts) {
  posts.forEach(post => {
    fetch('/posts', {
      method: 'POST',
      body: JSON.stringify({ post: post }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to sync');
      return response.json();
    })
    .then(data => {
      console.log('Post synced:', data);
      removePostFromIndexedDB(post.id)
      // Optionally, remove the post from IndexedDB if needed
    })
    .catch(error => console.error('Error syncing data:', error));
  });
}

if (clearRecordsButton) {
  clearRecordsButton.addEventListener('click', () => {
    clearRecords();
    window.location.reload();
  });
}

function removePostFromIndexedDB(postId) {
  deleteRecord(postId).then(() => {
    console.log(`Post ${postId} removed from IndexedDB`);
  });
}

// document.addEventListener('turbo:load', () => {
//   const form = document.querySelector('#post-form');

//   // Fetch all posts from IndexedDB and render them
//   getAllRecords().then(posts => {
//     renderPosts(posts);
//   });

//   // Function to render posts in the HTML
//   function renderPosts(posts) {
//     const container = document.querySelector('#posts-container');
//     container.innerHTML = ''; // Clear existing posts

//     posts.forEach(post => {
//       const postElement = document.createElement('tr');
//       postElement.className = 'post';
//       postElement.innerHTML = `
//         <td>${post.title}</td>
//         <td>${new Date(post.created_at).toLocaleString()}</td>
//         <td>Data: ${JSON.stringify(post)}</td>
//       `;
//       container.appendChild(postElement);
//     });
//   }
  
//   if (form) {
//     form.addEventListener('submit', (event) => {
//       event.preventDefault();

//       const formData = new FormData(form);
//       const title = formData.get('post[title]');
  
//       // Prepare the data object for IndexedDB
//       const data = {
//         title: title,
//         created_at: new Date() // capture the current date and time
//       };
  
//       // If online, send directly to server
//       if (navigator.onLine) {
//         fetch('/posts', {
//           method: 'POST',
//           body: JSON.stringify({ post: data }),
//           headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json',
//             'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
//           }
//         }).then(response => {
//           if (!response.ok) {
//             throw new Error('Network response was not ok');
//           }
//           return response.json();
//         })
//           .then(data => {
//             console.log('Server response:', data);
//             // Redirect to posts index page after successful online submission
//             window.location.href = '/posts';
//           })
//           .catch(error => console.error('Error posting data:', error));
//       } else {    
//         // Save to IndexedDB
//         addRecord(data).then(() => {
//           console.log('Record added to IndexedDB');
//           // Redirect to posts index page after successful offline submission
//           window.location.href = '/posts';
//         });  
//       }
//     });  
//   }
// });
  