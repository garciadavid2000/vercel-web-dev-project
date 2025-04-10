const axios = require("axios");
const querystring = require("querystring");

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

// Replace with your frontend URL
const FRONTEND_URL = "https://vercel-web-dev-project.vercel.app";

module.exports = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    res.writeHead(302, {
      Location: `${FRONTEND_URL}/?error=login_failed`,
    });
    return res.end();
  }

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
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    // Store tokens in cookies
    res.setHeader("Set-Cookie", [
      `access_token=${access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `refresh_token=${refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    ]);

    res.writeHead(302, {
      Location: `${FRONTEND_URL}/hof`,
    });
    res.end();
  } catch (error) {
    console.error("Error getting tokens:", error.response?.data || error);

    res.writeHead(302, {
      Location: `${FRONTEND_URL}/?error=token_error`,
    });
    res.end();
  }
};
