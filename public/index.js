const categoryInput = document.getElementById('category');
const categoryTagsContainer = document.getElementById('categoryTags');
const MAX_CATEGORIES = 10;

categoryInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    addCategoryTag(this.value);
    this.value = '';
  }
});

function addCategoryTag(tagValue) {
  const trimmedValue = tagValue.trim();
  const tags = categoryTagsContainer.querySelectorAll('li.category-tag');

  if (tags.length >= MAX_CATEGORIES) {
    categoryInput.disabled = true;
    categoryInput.placeholder = "Max Categories Reached";
    return;
  }

  if (trimmedValue !== '') {
    const tag = createTagElement(trimmedValue);
    categoryTagsContainer.appendChild(tag);
  }

  if (tags.length + 1 >= MAX_CATEGORIES) {
    categoryInput.disabled = true;
    categoryInput.placeholder = "Max Categories Reached";
  }
}

function createTagElement(tagValue) {
  const tag = document.createElement('li');
  tag.className = 'category-tag';
  tag.textContent = tagValue;
  const deleteButton = createDeleteButton(tag);
  tag.appendChild(deleteButton);
  return tag;
}

function createDeleteButton(tag) {
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = 'X';
  deleteButton.addEventListener('click', function () {
    tag.remove();
    if (categoryTagsContainer.querySelectorAll('li.category-tag').length < MAX_CATEGORIES) {
      categoryInput.disabled = false;
      categoryInput.placeholder = "Enter categories, separate with commas";
    }
  });
  return deleteButton;
}

function searchGames() {
  const gameName = document.getElementById('game-search').value.trim();
  if (!gameName) {
    document.getElementById('game-search').setCustomValidity("Please enter a game name before searching.");
    document.getElementById('game-search').reportValidity();
    return;
  }

  fetch(`/search-games?name=${encodeURIComponent(gameName)}`)
    .then(response => response.json())
    .then(games => {
      console.log('Games returned from server:', games);
      if (games.error) {
        throw new Error(games.error);
      }
      if (games.length > 1) {
        displayGameOptions(games);
      } else if (games.length === 1) {
        selectGame(games[0].appid);
      } else {
        throw new Error("No games found");
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error fetching game information: ' + error.message);
    });
}

function displayGameOptions(games) {
  const container = document.getElementById('game-options');
  if (container) {
    container.innerHTML = '';
    games.forEach(game => {
      const button = document.createElement('button');
      button.textContent = `${game.name} (AppID: ${game.appid})`;
      button.onclick = () => selectGame(game.appid);
      container.appendChild(button);
    });
  } else {
    console.error('Game options container not found');
  }
}

function selectGame(appId) {
  fetch(`/game-details?appId=${appId}`)
    .then(response => response.json())
    .then(gameDetails => {
      document.getElementById('name').value = gameDetails.name;
      document.getElementById('appId').value = gameDetails.steam_appid;
      document.getElementById('description').value = gameDetails.short_description;
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error fetching game details: ' + error.message);
    });
}