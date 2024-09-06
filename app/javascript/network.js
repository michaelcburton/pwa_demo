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
    console.log("Checking Online Status")

    const timeout = 5000;  // Timeout for the fetch request in milliseconds
    const url = 'https://httpbin.org/get';  // Lightweight, CORS-enabled API

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchTimeout = setTimeout(() => controller.abort(), timeout);

    fetch(url, { method: 'GET', signal, cache: 'no-store' })
        .then(response => {
            clearTimeout(fetchTimeout);
            callback(response.ok);  // Response should be ok (status 204)
        })
        .catch(() => {
            clearTimeout(fetchTimeout);
            callback(false);  // Failed to fetch (likely offline)
        });
}

export { checkOnlineStatus };