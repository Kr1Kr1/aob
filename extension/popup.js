chrome.runtime.sendMessage({ type: "GET_LOGIN_STATUS" }, (response) => {
    console.log("Login status response:", response);
    const statusDiv = document.getElementById("status");
    const playerInfoDiv = document.getElementById("player-info");
    const playerNameSpan = document.getElementById("player-name");
  
    if (response?.loggedIn) {
      statusDiv.style.display = "none";
      playerInfoDiv.style.display = "block";
      playerNameSpan.textContent = response.playerName || "Unknown Player";
    } else {
      statusDiv.textContent = "User not logged in.";
      playerInfoDiv.style.display = "none";
    }

  });

document.getElementById("fetchLogs").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "FETCH_LOGS" });
});

document.getElementById("fetchAllCharacters").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "FETCH_ALL_CHARACTERS" }, (response) => {
    if (response.error) {
      console.error("[popup.js] Error fetching characters:", response.error);
    } else {
      console.log("[popup.js] Characters fetched:", response.characters);
    }
  });
});
