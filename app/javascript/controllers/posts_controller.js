// app/javascript/controllers/posts_controller.js
import { Controller } from "@hotwired/stimulus"
import { getAllRecords, addRecord, deleteRecord } from "indexeddb"

export default class extends Controller {
  static targets = ["postsContainer", "form"]

  connect() {
    this.loadPosts();
  }

  loadPosts() {
    getAllRecords().then(posts => {
      this.renderPosts(posts);
    });
  }

  renderPosts(posts) {
    this.postsContainerTarget.innerHTML = ''; // Clear existing posts

    posts.forEach(post => {
      const postElement = document.createElement('tr');
      postElement.className = 'post';
      postElement.innerHTML = `
        <td>${post.title}</td>
        <td>${new Date(post.created_at).toLocaleString()}</td>
        <td>Data: ${JSON.stringify(post)}</td>
      `;
      this.postsContainerTarget.appendChild(postElement);
    });
  }

  submit(event) {
    console.log("Submit event triggered")
    event.preventDefault();
    const formData = new FormData(this.formTarget);
    const title = formData.get('post[title]');

    const data = {
      title: title,
      created_at: new Date()
    };

    if (navigator.onLine) {
      console.log("Sending to server...")
      this.sendToServer(data);
    } else {
      console.log("Saving locally...")
      this.saveToIndexedDB(data);
    }
  }

  sendToServer(data) {
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
      this.element.dispatchEvent(new CustomEvent('synchronization-complete', { bubbles: true }));
      window.location.href = '/posts';
    })
    .catch(error => console.error('Error posting data:', error));
  }

  saveToIndexedDB(data) {
    addRecord(data).then(() => {
      console.log('Record added to IndexedDB');
      window.location.href = '/posts';
    });
  }
}
