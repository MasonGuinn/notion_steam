// Import required modules and configure environment variables
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";
import express from "express";
import steamAPI from "steamapi";
import { Client } from "@notionhq/client";
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
  // Extract the game name from the query parameters and convert it to lowercase for case-insensitive search
  const searchTerm = req.query.name.toLowerCase();
  console.log('Searching for game:', searchTerm);

  try {
    // Initialize Steam API client using the API key from environment variables
    const steam = new steamAPI(process.env.STEAM_API_KEY);

    // Fetch the list of all games from the Steam API
    const allGames = await steam.getAppList();

    // Filter the list of games to find those with names matching the search term
    const matchingGames = allGames.filter(game =>
      game.name.toLowerCase() === searchTerm
    );

    // Check if any matching games were found
    if (matchingGames.length > 0) {
      // If matches are found, log and return the list of matching games as JSON
      console.log('Matching games found:', matchingGames);
      res.json(matchingGames);
    } else {
      // If no matches are found, log the result and return a 404 status with an error message
      console.log('No matches found in Steam API');
      res.status(404).json({ error: "No matches found" });
    }
  } catch (error) {
    // Catch any errors during the fetch operation, log the error, and return a 500 status with an error message
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
    res.json({
      ...gameDetails,
      release_date: gameDetails.release_date
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: "Error fetching game details" });
  }
});

// Endpoint to add a game to the Notion database
app.post("/add-game-to-notion", async function (req, res) {
  // Extract data from the request body
  const { name, tags, description, date, id } = req.body;

  console.log('Received date:', date);

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

    // Ensure tags is an array and format it for Notion
    const tagsToSave = Array.isArray(tags) ? tags.map(tag => ({ name: tag })) : [];

    // Create a new page in the Notion database
    const newGame = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID }, // Specify the Notion database ID
      properties: {
        // Map the incoming data to Notion properties
        Name: { title: [{ text: { content: name } }] }, // Title of the game
        Number: { number: parseInt(id) }, // Numeric value associated with the game
        Tags: { multi_select: tagsToSave }, // Tags associated with the game (was categories, now fixed to tagsToSave)
        Date: { date: { start: formattedDate } }, // Formatted date
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
