const axios = require("axios");

module.exports = async (req, res) => {
  const access_token = parseAccessToken(req);

  if (!access_token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching user data:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

// helper function to extract access_token from cookies
function parseAccessToken(req) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;

  const cookies = cookie.split(";").reduce((acc, pair) => {
    const [key, value] = pair.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});

  return cookies.access_token;
}
