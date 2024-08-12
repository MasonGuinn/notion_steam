// Constants
const MAX_TAGS = 10;

// Object containing references to DOM elements
const elements = {
  tagInput: document.getElementById('tag'),
  tagContainer: document.getElementById('tagContainer'),
  addGameForm: document.getElementById('addGameForm'),
  gameSearch: document.getElementById('game-search'),
  gameOptions: document.getElementById('game-options'),
  nameInput: document.getElementById('name'),
  appIdInput: document.getElementById('id'),
  descriptionInput: document.getElementById('description'),
  dateInput: document.getElementById('date')
};

// Object containing API call functions
const api = {
  addGameToNotion: data => fetch('/add-game-to-notion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(response => response.json()),

  updateDatabaseId: id => fetch('/update-database-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ databaseId: id })
  }).then(response => response.json()),

  searchGames: name => fetch(`/search-games?name=${encodeURIComponent(name)}`).then(response => response.json()),

  getGameDetails: appId => fetch(`/game-details?appId=${appId}`).then(response => response.json())
};

// Initializes event listeners for the application
function initEventListeners() {
  elements.tagInput.addEventListener('keydown', handleTagInput);
  elements.addGameForm.addEventListener('submit', handleFormSubmit);
  document.addEventListener('DOMContentLoaded', fetchDatabaseId);
  elements.gameSearch.addEventListener('input', handleGameSearch);
}

// Function to get a random color from the array
function getUniqueColor() {
  const colors = [
    '#1F1F1F', '#2E8B57', '#4B0082', '#5F9EA0', '#6A5ACD',
    '#708090', '#800000', '#8B4513', '#2F4F4F', '#556B2F',
    '#6B8E23', '#483D8B', '#4A5D23', '#3A5F5A', '#2E8B57',
    '#A9A9A9', '#000080', '#003366', '#003300', '#800080'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Consolidated function to handle tag input, creation, and removal
function handleTagInput(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    const value = elements.tagInput.value.trim();
    const tags = elements.tagContainer.querySelectorAll('li.tags-input');

    // Check if the tag exists in the container
    if (value) {
      // Disable input field if the maximum number of tags is reached
      if (tags.length >= MAX_TAGS) {
        elements.tagInput.disabled = true;
        elements.tagInput.placeholder = "Max Tags Reached";
        return;
      }

      // Create and add new tag
      const tag = document.createElement('li');
      tag.className = 'tags-input';
      tag.textContent = value;

      // Set a random background color for the tag
      tag.style.backgroundColor = getUniqueColor();
      tag.style.color = '#fff'; // Ensure text is readable against the background color

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.textContent = 'X';
      deleteButton.addEventListener('click', () => {
        tag.remove();
        if (elements.tagContainer.querySelectorAll('li.tags-input').length < MAX_TAGS) {
          elements.tagInput.disabled = false;
          elements.tagInput.placeholder = "Enter categories, separate with commas";
        }
      });

      tag.appendChild(deleteButton);
      elements.tagContainer.appendChild(tag);
      elements.tagInput.value = '';

      // Update input field state
      if (elements.tagContainer.querySelectorAll('li.tags-input').length >= MAX_TAGS) {
        elements.tagInput.disabled = true;
        elements.tagInput.placeholder = "Max Tags Reached";
      }
    }
  }
}

// Handles form submission
function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.addGameForm);
  const data = Object.fromEntries(formData.entries());
  data.tags = Array.from(elements.tagContainer.querySelectorAll('li.tags-input'))
    .map(tag => tag.textContent.trim())
    .join(', ');

  api.addGameToNotion(data)
    .then(result => console.log('Success:', result))
    .catch(error => console.error('Error:', error));
}

// Updates the Notion database ID [TODO]
function updateDatabaseId(databaseId) {
  api.updateDatabaseId(databaseId)
    .then(data => {
      console.log('Database ID updated:', data);
      alert('Notion database ID has been updated successfully!');
    })
    .catch(error => console.error('Error updating database ID:', error));
}

// Handles game search functionality
function handleGameSearch() {
  const gameName = elements.gameSearch.value.trim();
  if (!gameName) {
    elements.gameSearch.setCustomValidity("Please enter a game name before searching.");
    elements.gameSearch.reportValidity();
    return;
  }

  api.searchGames(gameName)
    .then(games => {
      if (games.error) throw new Error(games.error);
      displayGameOptions(games);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error fetching game information: ' + error.message);
    });
}

// Displays game options after search
function displayGameOptions(games) {
  elements.gameOptions.innerHTML = '';
  if (games.length > 1) {
    games.forEach(game => {
      const button = document.createElement('button');
      button.textContent = `${game.name} (AppID: ${game.appid})`;
      button.onclick = () => handleGameSelection(game.appid);
      elements.gameOptions.appendChild(button);
    });
  } else if (games.length === 1) {
    handleGameSelection(games[0].appid);
  } else {
    throw new Error("No games found");
  }
}

// Handles the selection of a specific game
function handleGameSelection(appId) {
  api.getGameDetails(appId)
    .then(gameDetails => {
      elements.nameInput.value = gameDetails.name;
      elements.appIdInput.value = gameDetails.steam_appid;
      elements.descriptionInput.value = gameDetails.short_description;

      if (gameDetails.genres) {
        gameDetails.genres.forEach(genre => {
          elements.tagInput.value = genre.description;
          handleTagInput({ key: 'Enter', preventDefault: () => { } });
        });
      }

      const date = new Date(gameDetails.release_date.date);
      elements.dateInput.value = date.toISOString().slice(0, 10);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error fetching game details: ' + error.message);
    });
}

// Initialize event listeners
initEventListeners();
