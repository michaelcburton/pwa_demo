// app/javascript/controllers/network_status_controller.js
import { Controller } from "@hotwired/stimulus";
import { checkOnlineStatus } from "network";

export default class extends Controller {
  static targets = ["status", "quality", "testButton"]

  connect() {
    this.updateOnlineStatus();
    window.addEventListener('online',  () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  updateOnlineStatus() {
    checkOnlineStatus(isOnline => {
      console.log("Online:", isOnline)
      if (isOnline) {
        this.statusTarget.textContent = 'Online'
        this.statusTarget.className = 'online'
      } else {
        this.statusTarget.textContent = 'Offline'
        this.statusTarget.className = 'offline'
      }
    })
  }

  testConnectionQuality() {
    const startTime = (new Date()).getTime();
    const image = new Image();
    image.onload = () => {
      const endTime = (new Date()).getTime();
      const duration = (endTime - startTime);
      const speed = Math.round(512 / duration); // Assuming image size is 512KB
      const quality = speed < 1 ? 'Poor' : speed < 5 ? 'Moderate' : 'Good';
      this.qualityTarget.textContent = `${quality} (${speed} KB/ms)`;
    };
    image.onerror = () => {
      this.qualityTarget.textContent = 'Unable to determine';
    };
    image.src = "/test_image.jpg"
  }

  testButtonClick() {
    this.testConnectionQuality();
  }
}
