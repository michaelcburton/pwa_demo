// app/javascript/controllers/posts_controller.js
import { Controller } from "@hotwired/stimulus"
import { getAllRecords, addRecord, deleteRecord } from "indexeddb"
import { checkOnlineStatus } from "network";

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
    console.log("Submit event triggered");
    event.preventDefault();
    const formData = new FormData(this.formTarget);
    
    // Prepare data object for post and its items
    const data = {
      title: formData.get('post[title]'),
      items_attributes: this.collectItemsData(formData),
      created_at: new Date()
    };

    checkOnlineStatus(isOnLine => {
      debugger;
      if (isOnLine) {
        console.log("Sending to server...");
        this.sendToServer(data);
      } else {
        console.log("Saving locally...");
        this.saveToIndexedDB(data);
      }
    })
  }

  collectItemsData(formData) {
    const itemsData = {};
    // Assuming the name attributes are something like 'post[items_attributes][0][description]'
    // Iterate over all entries in formData
    formData.forEach((value, key) => {
      // Regex to extract indices and property names for items_attributes
      let match = key.match(/^post\[items_attributes\]\[(\d+)\]\[(\w+)\]$/);
      if (match) {
        const index = match[1];
        const prop = match[2];
        if (!itemsData[index]) itemsData[index] = {};
        itemsData[index][prop] = value;
      }
    });
    return itemsData;
  }

  sendToServer(data) {
    console.log("Final data being sent to server:", JSON.stringify({ post: data }));
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
