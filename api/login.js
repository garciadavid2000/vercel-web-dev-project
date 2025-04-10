const querystring = require("querystring");

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";

module.exports = async (req, res) => {
  const params = querystring.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: "user-top-read user-read-recently-played",
  });

  res.writeHead(302, {
    Location: `${SPOTIFY_AUTH_URL}?${params}`,
  });
  res.end();
};