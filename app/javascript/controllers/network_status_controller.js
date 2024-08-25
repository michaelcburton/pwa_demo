// network_status_controller.js
import { Controller } from "@hotwired/stimulus"
import { synchronizeData } from "../sync"

export default class extends Controller {
    connect() {
        this.handleNetworkChange = this.handleNetworkChange.bind(this);
        window.addEventListener('online', this.handleNetworkChange);
        window.addEventListener('offline', this.handleNetworkChange);

        const savedStatus = localStorage.getItem('networkStatus');
        if (savedStatus === 'offline') {
            this.simulateOfflineMode();
        } else {
            this.simulateOnlineMode();
        }

        this.updateStatusIndicator();
    }

    disconnect() {
        window.removeEventListener('online', this.handleNetworkChange);
        window.removeEventListener('offline', this.handleNetworkChange);
    }

    handleNetworkChange() {
        if (navigator.onLine) {
            console.log('Network status: online');
            synchronizeData();
        } else {
            console.log('Network status: offline');
        }
        this.updateStatusIndicator();
    }

    updateStatusIndicator() {
        const statusText = this.element.querySelector('#status-text');
        const statusIndicator = this.element.querySelector('#connectivity-status');

        if (navigator.onLine) {
            statusText.textContent = 'Online';
            statusIndicator.style.backgroundColor = 'green';
        } else {
            statusText.textContent = 'Offline';
            statusIndicator.style.backgroundColor = 'red';
        }
    }

    simulateOfflineMode() {
        localStorage.setItem('networkStatus', 'offline');
        navigator.__defineGetter__('onLine', function() { return false; });
        this.handleNetworkChange();
    }

    simulateOnlineMode() {
        localStorage.setItem('networkStatus', 'online');
        navigator.__defineGetter__('onLine', function() { return true; });
        this.handleNetworkChange();
    }
}
