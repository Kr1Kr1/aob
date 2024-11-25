let loginState = { loggedIn: false, playerName: null, playerAvatar: null };

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[background.js] Received message:", message);
  
    switch (message.type) {
        case "LOGIN_STATUS":
            if (message.loggedIn !== undefined) {
                loginState.loggedIn = message.loggedIn;

                if (message.loggedIn) {
                    loginState.playerName = message.data?.playerName || "Unknown Player";
                    console.log(`[background.js] Logged in as ${loginState.playerName}`);
                } else {
                    console.log("[background.js] User is not logged in.");
                }
            } else {
                console.warn("[background.js] LOGIN_STATUS message missing 'loggedIn' property");
            }
            break;

        case "GET_LOGIN_STATUS":
            console.log("[background.js] Received GET_LOGIN_STATUS request");
            sendResponse(loginState);
            return true;

        case "SAVE_STATS":
            chrome.storage.local.get({ history: [] }, (data) => {
                const updatedHistory = [...data.history, message.data];
                chrome.storage.local.set({ history: updatedHistory }, () => {
                    console.log("[background.js] Stats saved:", message.data);
                });
            });
            break;

        case "FETCH_LOGS":
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0) {
                    console.error("[background.js] No active tab found");
                    return;
                }

                chrome.tabs.sendMessage(tabs[0].id, { type: "FETCH_LOGS" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("[background.js] Error communicating with content script:", chrome.runtime.lastError.message);
                        return;
                    }

                    if (response?.logs) {
                        console.log("[background.js] Logs received from content script:", response.logs);

                        response.logs.forEach(async (log) => {
                            const { event, details, from, withWhom, date, territory, source } = log;

                            if (!event || !from || !date) {
                                console.warn("[background.js] Skipping invalid log:", log);
                                return;
                            }

                            try {
                                const res = await fetch("http://localhost:3000/api/events", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        event,
                                        details,
                                        fromCol: from, // Map `from` to `fromCol` as per API
                                        withWhom,
                                        date,
                                        territory,
                                        source
                                    }),
                                });

                                if (res.ok) {
                                    console.log("[background.js] Log successfully sent to API:", log);
                                } else {
                                    console.error("[background.js] Failed to send log to API:", log, await res.text());
                                }
                            } catch (error) {
                                console.error("[background.js] Error sending log to API:", error);
                            }
                        });
                    } else if (response?.error) {
                        console.error("[background.js] Error received from content script:", response.error);
                    } else {
                        console.error("[background.js] No logs received from content script");
                    }
                });
            });
            break;

        case "FETCH_ALL_CHARACTERS":
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0) {
                    console.error("[background.js] No active tab found");
                    return;
                }

                chrome.tabs.sendMessage(tabs[0].id, { type: "FETCH_ALL_CHARACTERS" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("[background.js] Error communicating with content script:", chrome.runtime.lastError.message);
                        return;
                    }

                    if (response?.characters) {
                        console.log("[background.js] Characters received from content script:", response.characters);

                        response.characters.forEach(async (character) => {
                            try {
                                const res = await fetch("http://localhost:3000/api/characters", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(character),
                                });

                                if (res.ok) {
                                    console.log("[background.js] Character successfully sent to API:", character);
                                } else {
                                    console.error("[background.js] Failed to send character to API:", character, await res.text());
                                }
                            } catch (error) {
                                console.error("[background.js] Error sending character to API:", error);
                            }
                        });
                    } else if (response?.error) {
                        console.error("[background.js] Error received from content script:", response.error);
                    } else {
                        console.error("[background.js] No characters received from content script");
                    }
                });
            });
            break;

        default:
            console.warn(`[background.js] Unknown message type: ${message.type}`);
    }
});
