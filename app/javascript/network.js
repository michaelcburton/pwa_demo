const checkOnlineStatus = async () => {
    try {
        const online = await fetch("/1x1.png");
        return online.status >= 200 && online.status < 300; // either true or false
    } catch (err) {
        return false; // definitely offline
    }
};
