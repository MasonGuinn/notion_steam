# Steam and Notion integration

## Use web form to add game to existing Notion database

### File structure

On the frontend:

- `public/add-game.html`, which represents the app's webpage content. Users will interact with the HTML elements in this page.
- `public/style.css` contains the styles for `public/add-game.html`.

On the backend:

- `server.js`, which serves `index.html` and defines the endpoints used in the client-side JS code.

### Running locally

#### 1. Set up your local project

```zsh
# Clone this repository locally
git clone https://github.com/MasonGuinn/notion_steam.git

# Switch into this project
cd notion_steam

# Install the dependencies
npm install
```

#### 2. Set your environment variables in a `.env` file

A `.env.example` file has been included and can be renamed `.env`. Update the environment variables below:

```zsh
NOTION_KEY=<your-notion-api-key>
NOTION_DATABASE_ID=<notion-page-id>
```

`NOTION_KEY`: Create a new integration in the [integrations dashboard](https://www.notion.com/my-integrations) and retrieve the API key from the integration's `Secrets` page.

`NOTION_DATABASE_ID`: Use the ID of any Notion database you want to add data to. This database will be the parent of all content created through this integration.

The database ID is the 32 character string at the end of any page URL.
![A Notion page URL with the ID highlighted](./public/assets//page_id.png)

#### 3. Give the integration access to your page

Your Notion integration will need permission to create new databases, etc. To provide access, do the following:

1. Go to the page in your workspace.
2. Click the `•••` (more menu) on the top-right corner of the page.
3. Scroll to the bottom of the menu and click `Add connections`.
4. Search for and select your integration in the `Search for connections...` menu.

Once selected, your integration will have permission to read/write content on the page.

#### 4. Run code

Run the following command:

```zsh
node server.js
```

Check the terminal response to see which port to use when viewing the app locally in your browser of choice (`localhost:<port>`).


### FUTURE UPDATES:
You will be able to simply select the game you want to add to your Notion database and the name, description, date, price, and more will be automatically filled in. This is the "Steam" part of the integration. 