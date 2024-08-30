// app/javascript/controllers/network_status_controller.js
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["status", "quality", "testButton"]

  connect() {
    this.updateOnlineStatus();
    window.addEventListener('online',  () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  updateOnlineStatus() {
    const online = navigator.onLine;
    this.statusTarget.textContent = online ? 'Online' : 'Offline';
    this.statusTarget.className = online ? 'online' : 'offline';
    if (online) {
      this.testConnectionQuality();
    }
  }

  testConnectionQuality() {
    const startTime = (new Date()).getTime();
    const image = new Image();
    image.onload = () => {
      const endTime = (new Date()).getTime();
      const duration = (endTime - startTime);
      const speed = Math.round(512 / duration); // Assuming image size is 512KB
      const quality = speed < 1 ? 'Poor' : speed < 5 ? 'Moderate' : 'Good';
      this.qualityTarget.textContent = `Quality: ${quality} (${speed} KB/ms)`;
    };
    image.onerror = () => {
      this.qualityTarget.textContent = 'Quality: Unable to determine';
    };
    image.src = "/test_image.jpg?" + Date.now(); // Ensure the image is not cached
  }

  testButtonClick() {
    this.testConnectionQuality();
  }
}
