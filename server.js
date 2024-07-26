// server.js

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv"
import express from "express"
import steamAPI from "steamapi"
import { Client } from "@notionhq/client"
import path from "path"

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
app.use(express.static("public"))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }));

const notion = new Client({ auth: process.env.NOTION_KEY })

// Endpoint to search for games by name
app.get("/search-games", async function (req, res) {
  const searchTerm = req.query.name.toLowerCase();
  console.log('Searching for game:', searchTerm);
  try {
    const steam = new steamAPI(process.env.STEAM_API_KEY);
    const allGames = await steam.getAppList();

    const matchingGames = allGames.filter(game =>
      game.name.toLowerCase() === searchTerm
    );

    if (matchingGames.length > 0) {
      console.log('Matching games found:', matchingGames);
      res.json(matchingGames);
    } else {
      console.log('No matches found in Steam API');
      res.status(404).json({ error: "No matches found" });
    }
  } catch (error) {
    console.error('Error fetching game info:', error);
    res.status(500).json({ error: "Error fetching game information" });
  }
});


// Endpoint to get detailed information about a specific game
app.get("/game-details", async function (req, res) {
  const appId = req.query.appId;
  try {
    const steam = new steamAPI(process.env.STEAM_API_KEY);
    const gameDetails = await steam.getGameDetails(appId);
    res.json(gameDetails);
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: "Error fetching game details" });
  }
});

// Endpoint to add a game to Notion database
app.post("/add-game-to-notion", async function (req, res) {
  const { name, tags, description, date, text, id, url, number } = req.body;

  console.log('Received date:', date);

  try {
    // Validate and format the Date property
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date format:', date);
      return res.status(400).json({ message: "Invalid date format", error: "Invalid date format in request" });
    }
    const formattedDate = dateObj.toISOString();

    // Ensure tags is an array
    const tagsToSave = Array.isArray(tags) ? tags.map(tag => ({ name: tag })) : [];

    // Create the new game entry in Notion
    const newGame = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Tags: { multi_select: tagsToSave },
        Description: { rich_text: [{ text: { content: description } }] },
        Date: { date: { start: formattedDate } },
        Text: { rich_text: [{ text: { content: text } }] },
        ID: { rich_text: [{ text: { content: id } }] },
        URL: { url: url },
        Number: { number: parseInt(number) },
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
