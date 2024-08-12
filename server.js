// Import required modules and configure environment variables
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";
import express from "express";
import steamAPI from "steamapi";
import { Client } from "@notionhq/client";
import fs from 'fs/promises'
import path from "path";

// Load environment variables from .env file
dotenv.config();

// Setup file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
app.use(express.static("public")); // Serve static files from the 'public' directory
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded request bodies

// Initialize Notion client with API key from environment variables
const notion = new Client({ auth: process.env.NOTION_KEY });

// Endpoint to search for games by name
app.get("/search-games", async function (req, res) {
  const searchTerm = req.query.name.toLowerCase();
  console.log('Searching for game:', searchTerm);

  try {
    const appListPath = path.join(__dirname, 'public', 'GetAppList');
    const appListData = await fs.readFile(appListPath, 'utf8');
    const allGames = JSON.parse(appListData).applist.apps;

    const matchingGames = allGames.filter(game =>
      game.name.toLowerCase() === searchTerm
    );

    if (matchingGames.length > 0) {
      console.log('Matching games found:', matchingGames);
      res.json(matchingGames);
    } else {
      console.log('No matches found in local app list');
      res.status(404).json({ error: "No matches found" });
    }
  } catch (error) {
    console.error('Error reading or parsing local app list:', error);
    res.status(500).json({ error: "Error fetching game information" });
  }
});

// Endpoint to get detailed information about a specific game
app.get("/game-details", async function (req, res) {
  const appId = req.query.appId;
  try {
    const steam = new steamAPI(false);
    const gameDetails = await steam.getGameDetails(appId);

    // Extract tags from the genres or categories
    const tags = gameDetails.genres ? gameDetails.genres.map(genre => genre.description) : [];
    console.log('Tags:', tags);

    res.json({
      ...gameDetails,
      release_date: gameDetails.release_date,
      tags: tags
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: "Error fetching game details" });
  }
});

app.post("/add-game-to-notion", async function (req, res) {
  // Extract data from the request body
  const { name, tags, description, date, id } = req.body;

  console.log('Received name:', name);
  console.log('Received date:', date);
  console.log('Received tags:', tags);
  console.log('Received description:', description);
  console.log('Received id:', id);

  // Parse tags from the comma-separated string and remove trailing 'X'
  let tagsArray = tags.split(',').map(tag => tag.trim().replace(/X$/, ''));

  // Convert tags to the format required by Notion
  const tagsToSave = tagsArray.map(tag => ({ name: tag }));

  try {
    // Validate and format the Date property
    const dateObj = new Date(date);

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      // Log and respond with an error if the date format is invalid
      console.error('Invalid date format:', date);
      return res.status(400).json({ message: "Invalid date format", error: "Invalid date format in request" });
    }

    // Convert date to ISO string format required by Notion
    const formattedDate = dateObj.toISOString();

    // Create a new page in the Notion database
    const newGame = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID }, // Specify the Notion database ID
      properties: {
        // Map the incoming data to Notion properties
        Name: { title: [{ text: { content: name } }] }, // Title of the game
        AppID: { number: parseInt(id) }, // Numeric value associated with the game
        Tags: { multi_select: tagsToSave }, // Tags associated with the game
        Created: { date: { start: formattedDate } }, // Formatted date
        Description: { rich_text: [{ text: { content: description } }] }, // Description of the game
      },
    });

    // Respond with a success message and the created game entry data
    res.status(200).json({ message: "Game added successfully!", data: newGame });
  } catch (error) {
    // Log and respond with an error message if something goes wrong
    console.error('Error adding game to Notion:', error);
    res.status(500).json({ message: "Error adding game to Notion", error: error.message });
  }
});

// Serve the add-game.html file for root URL ("/")
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-game.html"));
});

// Listen for incoming requests on the specified port
const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
