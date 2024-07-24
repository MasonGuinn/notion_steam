// server.js

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv"
import express from "express"
import steamAPI from "steamapi"
import { Client } from "@notionhq/client"
import path from "path"

dotenv.config()

// Import SteamAPI
//let steamAPI;
//import('steamapi').then(module => {
//steamAPI = module.default;
//}).catch(err => {
//console.error('Failed to import steamapi:', err);
//});
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
app.use(express.static("public"))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }));

const notion = new Client({ auth: process.env.NOTION_KEY })

// TODO:
async function getSteamGames() {
  try {
    const steam = new steamAPI(process.env.STEAM_API_KEY);
    const games = await steam.getAppList();
    return games;
  } catch (error) {
    console.error('Error fetching Steam games:', error);
    throw error; // Throw error to handle it in calling function
  }
}

// TODO: Endpoint to fetch and display Steam games
app.get("/steam-games", async function (req, res) {
  try {
    const games = await getSteamGames();
    res.render("steam-games", { games }); // Render a view (steam-games.ejs) to display games
  } catch (error) {
    console.error('Error fetching and displaying Steam games:', error);
    res.status(500).send("Error fetching Steam games");
  }
});

// Endpoint to add a game to Notion database
app.post("/add-game", async function (req, res) {
  const { name, tags, description, date, text, id, url, number } = req.body;

  // Console log the date received from the client
  console.log('Received date:', date);

  try {
    // Validate and format the Date property
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date format:', date);
      return res.status(400).json({ message: "Invalid date format", error: "Invalid date format in request" });
    }
    const formattedDate = dateObj.toISOString();

    // Check if tags exist and ensure it's an array
    const tagsToSave = Array.isArray(tags) ? tags.map(tag => ({ name: tag })) : [];

    // Create the new game in Notion
    const newGame = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID, // Replace with your database ID
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        Tags: {
          multi_select: tagsToSave,
        },
        Description: {
          rich_text: [
            {
              text: {
                content: description,
              },
            },
          ],
        },
        Date: {
          date: {
            start: formattedDate,
          },
        },
        Text: {
          rich_text: [
            {
              text: {
                content: text,
              },
            },
          ],
        },
        ID: {
          rich_text: [
            {
              text: {
                content: id,
              },
            },
          ],
        },
        URL: {
          url: url,
        },
        Number: {
          number: parseInt(number),
        },
      },
    });

    res.status(200).json({ message: "Game added successfully!", data: newGame });
  } catch (error) {
    console.error('Error adding game to Notion:', error);
    res.status(500).json({ message: "Error adding game to Notion", error: error.message });
  }
});


// Serve the add-game.html file for root URL ("/")
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-game.html"));
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port)
})
