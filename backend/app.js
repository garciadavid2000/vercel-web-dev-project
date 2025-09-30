require("dotenv").config();
const express = require("express");
const path = require("path");
const axios = require("axios");
const querystring = require("querystring");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const port = 3000;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "https://vercel-web-dev-project.vercel.app",
      "https://vercel-web-dev-project-t1hb.vercel.app"
    ],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

app.get("/api/login", (req, res) => {
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: "user-top-read user-read-recently-played",
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${params}`);
});

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.get('/test', (req, res) => {
  res.send('About route 🎉 ')
})

app.get("/api/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("https://vercel-web-dev-project-t1hb.vercel.app/?error=login_failed");

  try {
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    // Set access_token and refresh_token as cookies
    res.cookie("access_token", response.data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
      domain: '.vercel.app'
    });
    res.cookie("refresh_token", response.data.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: '.vercel.app'
    });
    res.redirect("https://vercel-web-dev-project-t1hb.vercel.app/hof");
  } catch (error) {
    console.error(
      "Error getting tokens:",
      error.response ? error.response.data : error
    );
    res.redirect("https://vercel-web-dev-project-t1hb.vercel.app/?error=token_error");
  }
});

function getAccessToken(req) {
  return req.cookies.access_token;
}

app.get("/api/top-tracks", async (req, res) => {
  const access_token = getAccessToken(req);
  if (!access_token) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const { limit = 5, time_range = "medium_term" } = req.query;
  
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/me/top/tracks`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { limit, time_range },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching top tracks:", error.response ? error.response.data : error);
    res.status(500).send("Error fetching top tracks");
  }
});

app.get("/api/top-artists", async (req, res) => {
  const access_token = getAccessToken(req);
  if (!access_token)
    return res.status(401).json({ message: "Not authenticated" });
    
  const { limit = 5, time_range = "medium_term" } = req.query;
  
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/me/top/artists`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { limit, time_range },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching top artists:", error.response ? error.response.data : error);
    res.status(500).send("Error fetching top artists");
  }
});

app.get("/api/recently-played", async (req, res) => {
  const access_token = getAccessToken(req);
  if (!access_token)
    return res.status(401).json({ message: "Not authenticated" });

  try {
    const response = await axios.get(
      `${SPOTIFY_API_URL}/me/player/recently-played?limit=50`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching recently played tracks:", error.response ? error.response.data : error);
    res.status(500).send("Error fetching recently played tracks");
  }
});

app.get("/api/user", async (req, res) => {
  const access_token = getAccessToken(req);
  if (!access_token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

app.get("/api/search", async (req, res) => {
  const access_token = getAccessToken(req);
  if (!access_token)
    return res.status(401).json({ message: "Not authenticated" });

  const { query, type } = req.query;
  if (!query || !type) {
    return res.status(400).json({ error: "Query and type are required" });
  }

  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/search`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: {
        q: query,
        type: type,
        limit: 10,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error searching Spotify:", error);
    res.status(500).send("Error performing search");
  }
});

app.get("/api/track/:id", async (req, res) => {
  const access_token = getAccessToken(req);
  const trackId = req.params.id;
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching track by ID:", error);
    res.status(500).json({ error: "Failed to fetch track details" });
  }
});

app.get("/api/artist/:id", async (req, res) => {
  const access_token = getAccessToken(req);
  const artistId = req.params.id;
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching artist by ID:", error);
    res.status(500).json({ error: "Failed to fetch artist details" });
  }
});

app.get("/api/artists", async (req, res) => {
  const access_token = getAccessToken(req);
  const artistIds = req.query.ids;
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/artists`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { ids: artistIds },
    });
    res.json(response.data.artists);
  } catch (error) {
    console.error("Error fetching artist by ID:", error);
    res.status(500).json({ error: "Failed to fetch artist details" });
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: req.app.get("env") === "development" ? err : {},
  });
});

app.get("/api/logout", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.redirect("https://vercel-web-dev-project-t1hb.vercel.app/");
});

app.get("/api/artist/:id/top-tracks", async (req, res) => {
  const access_token = getAccessToken(req);
  const artistId = req.params.id;
  const market = req.query.market || "US";
  try {
    const response = await axios.get(
      `${SPOTIFY_API_URL}/artists/${artistId}/top-tracks`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { market },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching artist top tracks:",
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: "Failed to fetch artist top tracks" });
  }
});

app.get("/api/album/:id", async (req, res) => {
  const access_token = getAccessToken(req);
  const albumId = req.params.id;
  try {
    const response = await axios.get(`${SPOTIFY_API_URL}/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching album by ID:",
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: "Failed to fetch album details" });
  }
});

app.get("/api/album/:id/tracks", async (req, res) => {
  const access_token = getAccessToken(req);
  const albumId = req.params.id;
  const { limit = 20, offset = 0, market = "US" } = req.query;
  try {
    const response = await axios.get(
      `${SPOTIFY_API_URL}/albums/${albumId}/tracks`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { limit, offset, market },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching album tracks:",
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: "Failed to fetch album tracks" });
  }
});

app.get("/api/artist/:id/albums", async (req, res) => {
  const access_token = getAccessToken(req);
  const artistId = req.params.id;
  const { limit = 5, market = "US", include_groups = "album" } = req.query;

  try {
    const response = await axios.get(
      `${SPOTIFY_API_URL}/artists/${artistId}/albums`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { limit, market, include_groups },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching artist albums:",
      error.response ? error.response.data : error
    );
    res.status(500).json({ error: "Failed to fetch artist albums" });
  }
});

app.listen(process.env.PORT || port, () => {
  console.log(`App is listening on port: ${port}, https://vercel-web-dev-project.vercel.app:${port}`);
});

module.exports = app;