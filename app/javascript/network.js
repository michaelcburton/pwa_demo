// const checkOnlineStatus = async () => {
//     try {
//         const online = await fetch("/1x1.png");
//         return online.status >= 200 && online.status < 300; // either true or false
//     } catch (err) {
//         return false; // definitely offline
//     }
// };

// network.js

function checkOnlineStatus(callback) {
    const img = new Image();
    const timeout = 5000;  // Timeout for the request in milliseconds

    img.onerror = img.onabort = function() {
        callback(false);
    };
    img.onload = function() {
        callback(true);
    };
    img.src = "/1x1.png";  // Append current time to prevent caching

    // Set a timeout to handle cases where the request gets stuck or delayed
    setTimeout(function() {
        if (!img.complete) {
            callback(false);
        }
    }, timeout);
}

export { checkOnlineStatus };