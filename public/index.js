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
