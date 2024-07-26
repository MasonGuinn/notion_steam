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
  // Trim the input value
  const trimmedValue = tagValue.trim();

  // If the input is empty, do nothing
  if (trimmedValue === '') return;

  // Get the current number of tags
  const tags = categoryTagsContainer.querySelectorAll('li.category-tag');
  const tagCount = tags.length;

  // Check if the maximum number of tags is reached
  if (tagCount >= MAX_CATEGORIES) {
    // Disable the input and show a message
    categoryInput.disabled = true;
    categoryInput.placeholder = "Max Categories Reached";
    return;
  }

  // Create and append the tag element
  const tag = document.createElement('li');
  tag.className = 'category-tag';
  // Set the tag text to the trimmed value
  tag.textContent = trimmedValue;

  // Add a delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.textContent = 'X';

  // Append the delete button to the tag
  tag.appendChild(deleteButton);
  categoryTagsContainer.appendChild(tag);

  //  Add an event listener to delete the tag if clicked
  deleteButton.addEventListener('click', function () {
    tag.remove();
    // Only update state if the number of tags falls below the max
    if (categoryTagsContainer.querySelectorAll('li.category-tag').length < MAX_CATEGORIES) {
      categoryInput.disabled = false;
      categoryInput.placeholder = "Enter categories, separate with commas";
    }
  });

  // Clear input field
  categoryInput.value = '';

  // Update input field state if max categories are reached
  if (categoryTagsContainer.querySelectorAll('li.category-tag').length >= MAX_CATEGORIES) {
    categoryInput.disabled = true;
    categoryInput.placeholder = "Max Categories Reached";
  }
}

function handleGameSearch() {
  const gameName = document.getElementById('game-search').value.trim();
  const container = document.getElementById('game-options');
  const nameInput = document.getElementById('name');
  const appIdInput = document.getElementById('appId');
  const descriptionInput = document.getElementById('description');

  // Validate the input
  if (!gameName) {
    document.getElementById('game-search').setCustomValidity("Please enter a game name before searching.");
    document.getElementById('game-search').reportValidity();
    return;
  }

  // Perform the search
  fetch(`/search-games?name=${encodeURIComponent(gameName)}`)
    .then(response => response.json())
    .then(games => {
      console.log('Games returned from server:', games);

      if (games.error) {
        throw new Error(games.error);
      }

      // Clear previous options
      if (container) {
        container.innerHTML = '';
      } else {
        console.error('Game options container not found');
        return;
      }

      if (games.length > 1) {
        // Display multiple game options
        games.forEach(game => {
          const button = document.createElement('button');
          button.textContent = `${game.name} (AppID: ${game.appid})`;
          button.onclick = () => handleGameSelection(game.appid);
          container.appendChild(button);
        });
      } else if (games.length === 1) {
        // Automatically select the single game
        handleGameSelection(games[0].appid);
      } else {
        throw new Error("No games found");
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error fetching game information: ' + error.message);
    });

  function handleGameSelection(appId) {
    fetch(`/game-details?appId=${appId}`)
      .then(response => response.json())
      .then(gameDetails => {
        nameInput.value = gameDetails.name;
        appIdInput.value = gameDetails.steam_appid;
        descriptionInput.value = gameDetails.short_description;
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error fetching game details: ' + error.message);
      });
  }
}
