console.log("[content.js] Script injected");
const baseURL = "https://age-of-olympia.net/infos.php?targetId=";

const fetchGameData = async () => {
    try {
      const response = await fetch("https://age-of-olympia.net/index.php?menu", {
        credentials: "include",
      });
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
  
      const stats = doc.querySelector("#statsElement")?.innerText || "Stats indisponibles";
      console.log("[content.js] Fetched stats:", stats);
  
      // Send stats to the background script for storage
      chrome.runtime.sendMessage({
        type: "SAVE_STATS",
        data: { stats, time: new Date().toISOString() },
      });
    } catch (error) {
      console.error("[content.js] Error fetching game data:", error);
    }
  };

const checkLogin = () => {
  console.log("[content.js] checkLogin");
  const isLoggedIn = !!document.querySelector("#menu") && !!document.querySelector("#infos");
  console.log(`[content.js] isLoggedIn is ${isLoggedIn}`);

  try {
    if (isLoggedIn) {
      const playerName = document.querySelector("#infos .player-info a")?.innerText || "Unknown Player";
      console.log(`[content.js] playerName is ${playerName}`);

      chrome.runtime.sendMessage({
        type: "LOGIN_STATUS",
        loggedIn: true,
        data: { playerName },
      });
    } else {
      chrome.runtime.sendMessage({ type: "LOGIN_STATUS", loggedIn: false });
    }
  } catch (error) {
    console.error("[content.js] Error sending message to background script:", error);
  }
};  

const fetchLogsPage = async () => {
try {
    const territoryName = await fetchTerritoryName();
    const response = await fetch("https://age-of-olympia.net/logs.php", {
    credentials: "include",
    });

    if (!response.ok) {
    console.error("[content.js] Failed to fetch logs page:", response.statusText);
    return;
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Extract logs from the table
    const rows = doc.querySelectorAll("table tr");
    const logs = Array.from(rows).slice(1).map((row) => {
    const event = row.querySelector("td:nth-child(1) span")?.innerText || "Unknown Event";
    const details = row.querySelector("td:nth-child(1) .logs-hidden")?.innerText.trim() || "";
    const from = row.querySelector("td:nth-child(2)")?.innerText.trim() || "Unknown";
    const withWhom = row.querySelector("td:nth-child(3)")?.innerText.trim() || "None";
    const date = row.querySelector("td:nth-child(4)")?.innerText.trim() || "Unknown Date";

    return { event, details, from, withWhom, date, territory: territoryName, source: "extension" };
    });

    console.log("[content.js] Extracted logs:", logs);
    return logs;
} catch (error) {
    console.error("[content.js] Error fetching logs:", error);
    return [];
}
};

const fetchTerritoryName = async () => {
  try {
      const response = await fetch("https://age-of-olympia.net/map.php?local", {
          credentials: "include",
      });

      if (!response.ok) {
          console.error("[content.js] Failed to fetch territory name:", response.statusText);
          return "Unknown Territory";
      }

      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      const territoryName = doc.querySelector("h1 font")?.innerText.trim() || "Unknown Territory";
      console.log("[content.js] Extracted territory name:", territoryName);

      return territoryName;
  } catch (error) {
      console.error("[content.js] Error fetching territory name:", error);
      return "Unknown Territory";
  }
};

async function fetchCharacter(id) {
  console.log(`Fetching character with ID: ${id}`);
  try {
    const response = await fetch(`${baseURL}${id}`);
    if (!response.ok) {
      console.log(`Character with ID ${id} not found (response not OK).`);
      return null;
    }
    const text = await response.text();

    // Check if the response contains the error message
    if (text.includes("error player id")) {
      console.log(`Character with ID ${id} returned 'error player id'. Stopping fetch.`);
      return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const name = doc.querySelector("#infos-player h1")?.innerText || null;
    const rank = doc.querySelector("#infos-player div:nth-child(2)")?.innerText.split(" - ")[1] || null;
    const popularity = doc.querySelector("a[href*='reputation']")?.innerText || null;
    const faction = doc.querySelector("a[href*='faction']")?.innerText || null;
    const role = doc.querySelector("#infos-player div:nth-child(3)")?.innerText.split("(<i>")[1]?.split("</i>)")[0] || null;
    const portraitUrl = doc.querySelector(".infos-portrait img")?.getAttribute("src") || null;
    const description = doc.querySelector(".infos-text")?.innerText || null;

    console.log(`Character with ID ${id} parsed successfully:`, { name, rank, popularity });
    return {
      targetId: id,
      name,
      rank,
      popularity,
      faction,
      role,
      portraitUrl,
      description,
    };
  } catch (error) {
    console.error(`Error fetching character with ID ${id}:`, error);
    return null;
  }
}

async function fetchAllCharacters(startId = 1) {
  console.log("Starting to fetch all characters...");
  let id = startId;
  const characters = [];
  while (true) {
    console.log(`Processing character with ID ${id}...`);
    const character = await fetchCharacter(id);
    if (!character) {
      console.log(`No more characters found after ID ${id - 1}. Stopping.`);
      break;
    }
    characters.push(character);
    console.log(`Character with ID ${id} added to the list.`);
    id++;
  }
  console.log("Finished fetching characters:", characters);
  return characters;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[content.js] Received message:", message);

  if (message.type === "FETCH_LOGS") {
      console.log("[content.js] Fetching logs...");
      fetchLogsPage().then((logs) => {
          console.log("[content.js] Sending logs back to background script");
          sendResponse({ logs });
      }).catch((error) => {
          console.error("[content.js] Error fetching logs:", error);
          sendResponse({ error: "Failed to fetch logs" });
      });
      return true;
  }

  if (message.type === "FETCH_ALL_CHARACTERS") {
    console.log("[content.js] Fetching all characters...");
    fetchAllCharacters()
      .then((characters) => {
        console.log("[content.js] Sending characters back to background script");
        sendResponse({ characters });
      })
      .catch((error) => {
        console.error("[content.js] Error fetching characters:", error);
        sendResponse({ error: "Failed to fetch characters" });
      });
    return true;
  }
});

document.addEventListener("DOMContentLoaded", checkLogin);
// setInterval(checkLogin, 5000);
