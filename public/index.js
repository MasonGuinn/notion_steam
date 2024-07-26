// index.js

const categoryInput = document.getElementById('category');
const categoryTagsContainer = document.getElementById('categoryTags');
const MAX_CATEGORIES = 10; // Maximum number of categories allowed

categoryInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    addCategoryTag(this.value);
    this.value = '';
  }
});

function addCategoryTag(tagValue) {
  const trimmedValue = tagValue.trim();

  // Check if the maximum limit is reached
  const tags = categoryTagsContainer.querySelectorAll('li.category-tag');
  if (tags.length >= MAX_CATEGORIES) {
    categoryInput.disabled = true;
    categoryInput.placeholder = "Max Categories Reached";
    return;
  }

  if (trimmedValue !== '') {
    const tag = document.createElement('li');
    tag.className = 'category-tag';
    tag.textContent = trimmedValue;
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'X';
    deleteButton.addEventListener('click', function () {
      tag.remove();
      // After deleting a tag, re-enable input if necessary
      if (tags.length < MAX_CATEGORIES) {
        categoryInput.disabled = false;
        categoryInput.placeholder = "Enter categories, separate with commas";
      }
    });
    tag.appendChild(deleteButton);
    categoryTagsContainer.appendChild(tag);
  }

  // Disable input if maximum categories reached after adding a tag
  if (tags.length + 1 >= MAX_CATEGORIES) {
    categoryInput.disabled = true;
    categoryInput.placeholder = "Max Categories Reached";
  }
}

function fetchGameInfo() {
  const gameName = document.getElementById('game-search').value;
  fetch(`/game-info?name=${encodeURIComponent(gameName)}`)
    .then(response => response.json())
    .then(games => {
      if (games.error) {
        throw new Error(games.error);
      }
      displayGameOptions(games);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error fetching game information: ' + error.message);
    });
}

function displayGameOptions(games) {
  const container = document.getElementById('game-options');
  container.innerHTML = '';
  games.forEach(game => {
    const button = document.createElement('button');
    button.textContent = `${game.name} (AppID: ${game.appid})`;
    button.onclick = () => selectGame(game.appid);
    container.appendChild(button);
  });
}

function selectGame(appId) {
  fetch(`/game-details?appId=${appId}`)
    .then(response => response.json())
    .then(gameDetails => {
      // Populate form fields with gameDetails
      document.getElementById('name').value = gameDetails.name;
      document.getElementById('appId').value = gameDetails.steam_appid;
      document.getElementById('description').value = gameDetails.short_description;
      // Add more fields as needed
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error fetching game details: ' + error.message);
    });
}