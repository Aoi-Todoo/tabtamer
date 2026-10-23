const API_BASE = "http://localhost:3000";

const form = document.querySelector("#save-form");
const titleInput = document.querySelector("#page-title");
const urlInput = document.querySelector("#page-url");
const collectionSelect = document.querySelector("#collection");
const tagsInput = document.querySelector("#tags");
const noteInput = document.querySelector("#note");
const saveButton = document.querySelector("#save-button");
const statusMessage = document.querySelector("#status");
const libraryLink = document.querySelector("#open-library");

let activeTab;

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

async function loadPopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  libraryLink.href = `${API_BASE}/#live-library`;

  if (tab?.url && /^https?:\/\//i.test(tab.url)) {
    urlInput.value = tab.url;
    titleInput.value = tab.title || new URL(tab.url).hostname;
  } else {
    urlInput.value = "";
    titleInput.value = "";
    showStatus("Open a regular website tab to save it.", true);
  }

  try {
    const library = await readJson(await fetch(`${API_BASE}/api/library`, { cache: "no-store" }));
    const collections = [...new Set([...(library.builtInCollections || []), ...(library.collections || [])])];
    collectionSelect.replaceChildren(...collections.map((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      return option;
    }));
    const preferred = await chrome.storage.local.get("lastCollection");
    if (preferred.lastCollection && collections.includes(preferred.lastCollection)) {
      collectionSelect.value = preferred.lastCollection;
    }
  } catch {
    collectionSelect.replaceChildren(new Option("TabTamer server unavailable", ""));
    collectionSelect.disabled = true;
    saveButton.disabled = true;
    showStatus("Start TabTamer at localhost:3000, then reopen this extension.", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeTab?.url || !/^https?:\/\//i.test(urlInput.value)) {
    showStatus("Open a regular website tab to save it.", true);
    return;
  }

  saveButton.disabled = true;
  showStatus("Saving…");
  const collection = collectionSelect.value;
  const payload = {
    title: titleInput.value.trim() || activeTab.title || urlInput.value,
    href: urlInput.value.trim(),
    collection,
    tags: tagsInput.value.split(",").map((tag) => tag.trim()).filter(Boolean),
    note: noteInput.value.trim(),
    icon: "folder",
  };

  try {
    await readJson(await fetch(`${API_BASE}/api/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }));
    await chrome.storage.local.set({ lastCollection: collection });
    showStatus(`Saved to ${collection}.`);
    tagsInput.value = "";
    noteInput.value = "";
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "Could not save this page.", true);
  } finally {
    saveButton.disabled = false;
  }
});

loadPopup().catch(() => showStatus("Could not read this tab. Try opening the extension again.", true));
