import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { getIronSession } from "iron-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());

// ---------------------------
// SESSION CONFIG
// ---------------------------
interface SessionData {
  yahooAccessToken?: string;
  yahooRefreshToken?: string;
  yahooTokenExpiry?: number;
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || "change-me-use-a-32-char-secret!!",
  cookieName: "gridiron_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

function getSession(req: express.Request, res: express.Response) {
  return getIronSession<SessionData>(req, res, SESSION_OPTIONS);
}

// ---------------------------
// YAHOO OAUTH CONFIG
// ---------------------------
const YAHOO_CLIENT_ID = process.env.YAHOO_CLIENT_ID || "";
const YAHOO_CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET || "";
const YAHOO_AUTH_BASE = "https://api.login.yahoo.com/oauth2";
const YAHOO_API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

function getYahooRedirectUri(req: express.Request): string {
  // Use REPLIT_DEV_DOMAIN when available, otherwise fall back to host header
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDomain) return `https://${replitDomain}/api/auth/yahoo/callback`;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost:5000";
  return `${proto}://${host}/api/auth/yahoo/callback`;
}

async function refreshYahooToken(session: SessionData & { save: () => Promise<void> }): Promise<string | null> {
  if (!session.yahooRefreshToken) return null;
  try {
    const basic = Buffer.from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`).toString("base64");
    const res = await fetch(`${YAHOO_AUTH_BASE}/get_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        redirect_uri: "oob",
        refresh_token: session.yahooRefreshToken,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    session.yahooAccessToken = data.access_token;
    if (data.refresh_token) session.yahooRefreshToken = data.refresh_token;
    session.yahooTokenExpiry = Date.now() + data.expires_in * 1000;
    await session.save();
    return data.access_token;
  } catch {
    return null;
  }
}

async function getValidYahooToken(req: express.Request, res: express.Response): Promise<string | null> {
  const session = await getSession(req, res);
  if (!session.yahooAccessToken) return null;
  // Refresh if within 5 minutes of expiry
  if (session.yahooTokenExpiry && Date.now() > session.yahooTokenExpiry - 5 * 60 * 1000) {
    return refreshYahooToken(session as any);
  }
  return session.yahooAccessToken;
}

async function yahooFetch(token: string, endpoint: string): Promise<any> {
  const url = `${YAHOO_API_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}format=json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// Parse the deeply nested Yahoo Fantasy API JSON into flat league objects
function parseYahooLeagues(data: any): any[] {
  try {
    const users = data?.fantasy_content?.users;
    const user = users?.["0"]?.user;
    if (!Array.isArray(user)) return [];
    const games = user[1]?.games;
    if (!games) return [];
    const leagues: any[] = [];
    const count = games.count || 0;
    for (let i = 0; i < count; i++) {
      const game = games[String(i)]?.game;
      if (!Array.isArray(game)) continue;
      const gameInfo = game[0] || {};
      const leaguesData = game[1]?.leagues;
      if (!leaguesData) continue;
      const lCount = leaguesData.count || 0;
      for (let j = 0; j < lCount; j++) {
        const league = leaguesData[String(j)]?.league;
        if (!Array.isArray(league)) continue;
        const info = league[0] || {};
        leagues.push({
          league_key: info.league_key,
          league_id: info.league_id,
          name: info.name,
          num_teams: info.num_teams,
          scoring_type: info.scoring_type,
          current_week: info.current_week,
          season: info.season,
          game_code: gameInfo.code,
          game_name: gameInfo.name,
        });
      }
    }
    return leagues;
  } catch {
    return [];
  }
}

// Parse teams in a league from Yahoo API response
function parseYahooTeams(data: any): any[] {
  try {
    const teams: any[] = [];
    const teamsData = data?.fantasy_content?.league?.[1]?.teams;
    if (!teamsData) return [];
    const count = teamsData.count || 0;
    for (let i = 0; i < count; i++) {
      const team = teamsData[String(i)]?.team;
      if (!Array.isArray(team)) continue;
      const info: Record<string, any> = {};
      for (const item of (team[0] || [])) {
        if (item && typeof item === "object") Object.assign(info, item);
      }
      const managers = info.managers;
      const isOwned = info.is_owned_by_current_login === 1 || info.is_owned_by_current_login === "1";
      teams.push({
        team_key: info.team_key,
        team_id: info.team_id,
        name: info.name,
        is_mine: isOwned,
        managers,
      });
    }
    return teams;
  } catch {
    return [];
  }
}

// Parse roster players from Yahoo API response
function parseYahooRoster(data: any): any[] {
  try {
    const players: any[] = [];
    const rosterData = data?.fantasy_content?.team?.[1]?.roster;
    const playersData = rosterData?.players;
    if (!playersData) return [];
    const count = playersData.count || 0;
    for (let i = 0; i < count; i++) {
      const playerArr = playersData[String(i)]?.player;
      if (!Array.isArray(playerArr)) continue;
      const rawInfo = playerArr[0] || [];
      const info: Record<string, any> = {};
      for (const item of rawInfo) {
        if (item && typeof item === "object") {
          if (item.name) Object.assign(info, item.name); // {full, first, last, ascii_first, ascii_last}
          else Object.assign(info, item);
        }
      }
      const selectedPos = playerArr[1]?.selected_position;
      const selPosArr = Array.isArray(selectedPos) ? selectedPos : [];
      const slotPosition = selPosArr.find((x: any) => x?.position)?.position || "BN";
      players.push({
        player_key: info.player_key,
        player_id: info.player_id,
        name: info.full || `${info.first || ""} ${info.last || ""}`.trim(),
        position: info.display_position || info.eligible_positions?.[0]?.position || "N/A",
        team: info.editorial_team_abbr?.toUpperCase() || "FA",
        photoUrl: info.image_url || "",
        status: info.status || "Active",
        slot: slotPosition,
        opponent: info.editorial_opponent || "",
      });
    }
    return players;
  } catch {
    return [];
  }
}

// Initialize Gemini API client on server
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("GEMINI_API_KEY environment variable is missing. AI routes will fall back to heuristic analysis.");
}

// Helper to get AI instance safely
function getAiClient(): GoogleGenAI {
  if (!ai) {
    const currentKey = process.env.GEMINI_API_KEY;
    if (!currentKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI features");
    }
    ai = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// ---------------------------
// API ENDPOINTS
// ---------------------------

// ---------------------------
// YAHOO AUTH ROUTES
// ---------------------------

// GET /api/auth/yahoo — start OAuth flow
app.get("/api/auth/yahoo", (req, res) => {
  if (!YAHOO_CLIENT_ID) {
    return res.status(500).send("YAHOO_CLIENT_ID is not configured on the server.");
  }
  const redirectUri = getYahooRedirectUri(req);
  const params = new URLSearchParams({
    client_id: YAHOO_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid fspt-r",
  });
  res.redirect(`${YAHOO_AUTH_BASE}/request_auth?${params}`);
});

// GET /api/auth/yahoo/callback — handle OAuth callback
app.get("/api/auth/yahoo/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.redirect(`/?yahoo_error=${encodeURIComponent(String(error || "no_code"))}`);
  }
  try {
    const redirectUri = getYahooRedirectUri(req);
    const basic = Buffer.from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`).toString("base64");
    const tokenRes = await fetch(`${YAHOO_AUTH_BASE}/get_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        code: String(code),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Yahoo token exchange failed:", errText);
      return res.redirect(`/?yahoo_error=${encodeURIComponent("token_exchange_failed")}`);
    }
    const tokenData = await tokenRes.json() as any;
    const session = await getSession(req, res);
    session.yahooAccessToken = tokenData.access_token;
    session.yahooRefreshToken = tokenData.refresh_token;
    session.yahooTokenExpiry = Date.now() + (tokenData.expires_in || 3600) * 1000;
    await session.save();
    res.redirect("/?yahoo_connected=true");
  } catch (err: any) {
    console.error("Yahoo callback error:", err?.message);
    res.redirect(`/?yahoo_error=${encodeURIComponent("server_error")}`);
  }
});

// GET /api/auth/yahoo/status — is the user authenticated?
app.get("/api/auth/yahoo/status", async (req, res) => {
  try {
    const token = await getValidYahooToken(req, res);
    res.json({ connected: Boolean(token) });
  } catch {
    res.json({ connected: false });
  }
});

// GET /api/auth/yahoo/redirect-uri — return the redirect URI the user must whitelist in Yahoo
app.get("/api/auth/yahoo/redirect-uri", (req, res) => {
  res.json({ redirectUri: getYahooRedirectUri(req) });
});

// POST /api/auth/yahoo/logout — clear session
app.post("/api/auth/yahoo/logout", async (req, res) => {
  const session = await getSession(req, res);
  session.yahooAccessToken = undefined;
  session.yahooRefreshToken = undefined;
  session.yahooTokenExpiry = undefined;
  await session.save();
  res.json({ ok: true });
});

// GET /api/yahoo/leagues — fetch user's NFL fantasy leagues
app.get("/api/yahoo/leagues", async (req, res) => {
  try {
    const token = await getValidYahooToken(req, res);
    if (!token) return res.status(401).json({ error: "Not authenticated with Yahoo" });
    const data = await yahooFetch(token, "/users;use_login=1/games;game_keys=nfl/leagues");
    const leagues = parseYahooLeagues(data);
    res.json({ leagues });
  } catch (err: any) {
    console.error("Error in /api/yahoo/leagues:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to fetch leagues" });
  }
});

// GET /api/yahoo/teams/:leagueKey — fetch teams in a league
app.get("/api/yahoo/teams/:leagueKey", async (req, res) => {
  try {
    const token = await getValidYahooToken(req, res);
    if (!token) return res.status(401).json({ error: "Not authenticated with Yahoo" });
    const data = await yahooFetch(token, `/league/${req.params.leagueKey}/teams`);
    const teams = parseYahooTeams(data);
    res.json({ teams });
  } catch (err: any) {
    console.error("Error in /api/yahoo/teams:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to fetch teams" });
  }
});

// GET /api/yahoo/roster/:teamKey — fetch roster for a team
app.get("/api/yahoo/roster/:teamKey", async (req, res) => {
  try {
    const token = await getValidYahooToken(req, res);
    if (!token) return res.status(401).json({ error: "Not authenticated with Yahoo" });
    const data = await yahooFetch(token, `/team/${req.params.teamKey}/roster/players`);
    const players = parseYahooRoster(data);
    res.json({ players });
  } catch (err: any) {
    console.error("Error in /api/yahoo/roster:", err?.message);
    res.status(500).json({ error: err?.message || "Failed to fetch roster" });
  }
});

// ---------------------------
// GEMINI AI ROUTES
// ---------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 2. AI Trade Analyzer endpoint
app.post("/api/ai/trade-analysis", async (req, res) => {
  try {
    const { giving, receiving, leagueSettings } = req.body;

    if (!giving || !receiving) {
      return res.status(400).json({ error: "Missing giving or receiving player details" });
    }

    const aiClient = getAiClient();

    const prompt = `
You are an expert NFL/NBA Fantasy Sports Trade Analyst.
Analyze this proposed fantasy trade for a ${leagueSettings?.scoringFormat || "PPR"} league:

GIVING UP:
${JSON.stringify(giving, null, 2)}

RECEIVING IN RETURN:
${JSON.stringify(receiving, null, 2)}

Provide a rigorous evaluation. Assess point projection delta, injury risks, positional depth trade-offs, and strength of remaining schedule.
Return a structured JSON object strictly conforming to the requested schema.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite fantasy sports analyst. Be decisive, objective, and provide clear point-by-point logic.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: { type: Type.STRING, description: "Letter grade e.g. A+, A, B, C, F" },
            recommendation: { type: Type.STRING, description: "ACCEPT, REJECT, or COUNTER" },
            myPointDelta: { type: Type.NUMBER, description: "Net projected fantasy points change per week e.g. 3.5 or -1.2" },
            analysisSummary: { type: Type.STRING, description: "Detailed 2-3 sentence summary of trade impact" },
            keyFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 crucial bullet factors influencing decision"
            },
            positionalImpact: {
              type: Type.OBJECT,
              properties: {
                strengthGained: { type: Type.STRING },
                vulnerabilityCreated: { type: Type.STRING }
              },
              required: ["strengthGained", "vulnerabilityCreated"]
            },
            scheduleImpact: { type: Type.STRING },
            verdictDetail: { type: Type.STRING }
          },
          required: ["grade", "recommendation", "myPointDelta", "analysisSummary", "keyFactors", "positionalImpact", "scheduleImpact", "verdictDetail"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/ai/trade-analysis:", error?.message || error);
    res.status(500).json({
      error: "Failed to generate AI trade analysis",
      details: error?.message || String(error)
    });
  }
});

// 3. AI Start/Sit Advisor endpoint
app.post("/api/ai/start-sit", async (req, res) => {
  try {
    const { playerA, playerB, scoringFormat } = req.body;

    if (!playerA || !playerB) {
      return res.status(400).json({ error: "Player A and Player B are required" });
    }

    const aiClient = getAiClient();

    const prompt = `
Compare these two fantasy sports players for a Start/Sit decision this week (${scoringFormat || "PPR"} scoring):

PLAYER A:
${JSON.stringify(playerA, null, 2)}

PLAYER B:
${JSON.stringify(playerB, null, 2)}

Perform a live Google search for any recent injury news, practice participation updates (DNP/LP/FP), and matchup intel for ${playerA.name} and ${playerB.name}.
Compare matchup difficulties, defense vs position ranks, recent game trends, weather/venue script, and current injury status.
Identify who should be started in fantasy lineups.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a sharp fantasy football analytics expert specializing in start/sit decisions backed by grounded real-time injury and matchup search.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedPlayerId: { type: Type.STRING, description: "ID of player recommended to start" },
            confidenceScore: { type: Type.NUMBER, description: "Confidence rating from 50 to 99 percent" },
            analysisSummary: { type: Type.STRING, description: "Comprehensive breakdown of why one player edges out the other" },
            keyReasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            matchupComparison: { type: Type.STRING },
            weatherOrVenueFactor: { type: Type.STRING },
            injuryContextNote: { type: Type.STRING, description: "Live grounded search summary of injury statuses and practice reports" },
            injuryNewsItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  playerName: { type: Type.STRING },
                  team: { type: Type.STRING },
                  position: { type: Type.STRING },
                  status: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  sourceName: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  updatedAt: { type: Type.STRING }
                },
                required: ["id", "playerName", "status", "headline", "summary"]
              }
            }
          },
          required: ["recommendedPlayerId", "confidenceScore", "analysisSummary", "keyReasons", "matchupComparison", "weatherOrVenueFactor", "injuryContextNote"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);

    // Extract search grounding metadata sources
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = rawChunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({
        title: c.web.title,
        uri: c.web.uri
      }));

    res.json({
      ...data,
      groundingSources
    });
  } catch (error: any) {
    console.error("Error in /api/ai/start-sit:", error?.message || error);
    res.status(500).json({
      error: "Failed to generate AI Start/Sit advice",
      details: error?.message || String(error)
    });
  }
});

// 3b. AI Live Injury News Feed endpoint with Google Search Grounding
app.post("/api/ai/live-injury-news", async (req, res) => {
  try {
    const { playerA, playerB, playerNames } = req.body;

    const targetNames: string[] = playerNames || [];
    if (playerA?.name && !targetNames.includes(playerA.name)) targetNames.push(playerA.name);
    if (playerB?.name && !targetNames.includes(playerB.name)) targetNames.push(playerB.name);

    if (targetNames.length === 0) {
      targetNames.push("NFL key players injury updates practice reports");
    }

    const aiClient = getAiClient();

    const prompt = `
Search Google for the latest verified NFL injury reports, practice participation statuses (DNP, Limited, Full), game status designations (Active, Questionable, Doubtful, Out), and beat reporter news updates for:
${targetNames.join(", ")}

Return a JSON object with:
1. newsItems: list of injury feed items with id, playerName, team, position, status, headline, summary, sourceName, sourceUrl, updatedAt.
2. aiAnalysisContext: 2-3 sentence overview summarizing how these injury updates impact fantasy lineup & start/sit decisions.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a live fantasy sports injury analyst providing grounded real-time injury feeds.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newsItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  playerName: { type: Type.STRING },
                  team: { type: Type.STRING },
                  position: { type: Type.STRING },
                  status: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  sourceName: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  updatedAt: { type: Type.STRING }
                },
                required: ["id", "playerName", "status", "headline", "summary"]
              }
            },
            aiAnalysisContext: { type: Type.STRING }
          },
          required: ["newsItems", "aiAnalysisContext"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);

    // Extract grounding sources
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = rawChunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({
        title: c.web.title,
        uri: c.web.uri
      }));

    res.json({
      ...data,
      groundingSources
    });
  } catch (error: any) {
    console.error("Error in /api/ai/live-injury-news:", error?.message || error);
    res.status(500).json({
      error: "Failed to fetch live injury news feed",
      details: error?.message || String(error)
    });
  }
});

// 4. AI Coach Chat Endpoint
app.post("/api/ai/coach-chat", async (req, res) => {
  try {
    const { messages, userRoster, leagueSettings } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages array" });
    }

    const aiClient = getAiClient();

    const rosterSummary = userRoster ? userRoster.map((s: any) => `${s.slotName}: ${s.player?.name || 'EMPTY'} (${s.player?.position || ''} - ${s.player?.team || ''})`).join("\n") : "Roster not provided";

    const systemPrompt = `
You are 'GridironAI Coach', a world-class, high-energy, deeply analytical fantasy sports strategist.
You give actionable, stats-backed, expert fantasy advice for ${leagueSettings?.leagueName || "Fantasy League"} (${leagueSettings?.scoringFormat || "PPR"} scoring).

Current User Roster Overview:
${rosterSummary}

Keep your responses direct, engaging, well-formatted with bullet points, and highly relevant. Include stats like targets, touches, snap shares, matchup defense ranks, or game scripts where appropriate.
`;

    // Format last user message
    const lastUserMessage = messages[messages.length - 1]?.text || "Hello coach!";

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: lastUserMessage,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/ai/coach-chat:", error?.message || error);
    res.status(500).json({
      error: "Failed to communicate with AI Coach",
      details: error?.message || String(error)
    });
  }
});

// 4b. AI League Power Rankings Endpoint
app.post("/api/ai/power-rankings", async (req, res) => {
  try {
    const { userRoster, leagueTeams, leagueSettings } = req.body;

    const aiClient = getAiClient();

    const prompt = `
Analyze the user's fantasy roster vs overall league teams for ${leagueSettings?.leagueName || "Fantasy League"} (${leagueSettings?.scoringFormat || "PPR"} scoring).

User Roster:
${JSON.stringify(userRoster, null, 2)}

League Teams Comparison:
${JSON.stringify(leagueTeams, null, 2)}

Evaluate roster power across 6 core radar dimensions:
1. "Starters Power" (0-100)
2. "Bench Depth" (0-100)
3. "Scoring Consistency" (0-100)
4. "Schedule Ease" (0-100)
5. "Injury Resilience" (0-100)
6. "Ceiling Upside" (0-100)

Return a structured JSON object conforming strictly to the requested schema.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite fantasy sports analyst specializing in league power rankings, multi-dimensional roster evaluations, and radar chart metrics.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            userRank: { type: Type.NUMBER, description: "Rank of user team in league e.g. 1, 2, 3" },
            totalTeams: { type: Type.NUMBER, description: "Total teams e.g. 10" },
            tier: { type: Type.STRING, description: "e.g. Championship Favorite, Playoff Lock, Mid-Pack Contender, Rebuilding" },
            powerScore: { type: Type.NUMBER, description: "Overall 0-100 power score for user team e.g. 88.5" },
            radarMetrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  attribute: { type: Type.STRING, description: "Dimension name e.g. Starters Power, Bench Depth, Consistency, Schedule Ease, Injury Resilience, Ceiling Upside" },
                  userScore: { type: Type.NUMBER, description: "0-100 score for user" },
                  leagueAvgScore: { type: Type.NUMBER, description: "0-100 average across league" },
                  topTeamScore: { type: Type.NUMBER, description: "0-100 score for #1 ranked team" }
                },
                required: ["attribute", "userScore", "leagueAvgScore", "topTeamScore"]
              }
            },
            standingsRankings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.NUMBER },
                  teamName: { type: Type.STRING },
                  ownerName: { type: Type.STRING },
                  record: { type: Type.STRING },
                  projectedPoints: { type: Type.NUMBER },
                  powerRating: { type: Type.NUMBER },
                  primaryStrength: { type: Type.STRING },
                  biggestWeakness: { type: Type.STRING },
                  isUserTeam: { type: Type.BOOLEAN }
                },
                required: ["rank", "teamName", "record", "projectedPoints", "powerRating", "primaryStrength", "biggestWeakness", "isUserTeam"]
              }
            },
            aiSummary: { type: Type.STRING, description: "Detailed 3-4 sentence AI evaluation of user's team strengths and path to championship" },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 strategic bullet points to improve power ranking"
            }
          },
          required: ["userRank", "totalTeams", "tier", "powerScore", "radarMetrics", "standingsRankings", "aiSummary", "keyTakeaways"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/ai/power-rankings:", error?.message || error);
    res.status(500).json({
      error: "Failed to generate AI power rankings",
      details: error?.message || String(error)
    });
  }
});

// 4c. AI Sleeper Alerts Endpoint
app.post("/api/ai/sleeper-alerts", async (req, res) => {
  try {
    const { players, leagueSettings } = req.body;
    const aiClient = getAiClient();

    const prompt = `
Analyze the following bench and waiver players across the league to identify high-upside "AI Sleeper Alerts" based on recent snap count increases, target share trends, route participation, red zone usage, and matchup trends.

Players Data:
${JSON.stringify(players, null, 2)}

Identify top 4-6 sleeper candidates. For each sleeper candidate, assign an upside tier, snap count trend (3-week array e.g. [45, 62, 78]), target share trend (3-week array e.g. [12, 18, 26]), route participation %, a custom AI alert tag (e.g. "🔥 Snap Surge (+33%)", "⚡ Target Explosion", "🎯 RedZone Vulcan"), upside score (0-100), and a concise AI analysis explanation.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert NFL fantasy football metrics analyst specializing in identifying emerging sleeper breakout candidates using snap counts, target share spikes, and air yards.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sleepers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  playerId: { type: Type.STRING },
                  playerName: { type: Type.STRING },
                  position: { type: Type.STRING },
                  team: { type: Type.STRING },
                  upsideTier: { type: Type.STRING, description: "e.g. Elite Breakout, High-Volume Flex, Deep League Gem" },
                  upsideScore: { type: Type.NUMBER, description: "0-100 score e.g. 92" },
                  tag: { type: Type.STRING, description: "e.g. 🔥 +33% Snap Spike" },
                  snapTrend: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  targetShareTrend: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  routeParticipation: { type: Type.NUMBER },
                  rosteredPct: { type: Type.NUMBER },
                  ownerStatus: { type: Type.STRING, description: "e.g. On Your Bench, Free Agent, Team X Bench" },
                  reasoning: { type: Type.STRING, description: "2-3 sentence explanation of why they are about to explode" }
                },
                required: ["playerId", "playerName", "position", "team", "upsideTier", "upsideScore", "tag", "snapTrend", "targetShareTrend", "routeParticipation", "ownerStatus", "reasoning"]
              }
            },
            executiveSummary: { type: Type.STRING }
          },
          required: ["sleepers", "executiveSummary"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in /api/ai/sleeper-alerts:", error?.message || error);
    res.status(500).json({ error: "Failed to generate sleeper alerts", details: error?.message || String(error) });
  }
});

// 4d. AI Expert Analyst Consensus Engine Endpoint
app.post("/api/ai/analyst-consensus", async (req, res) => {
  try {
    const { players, selectedPosition } = req.body;
    const aiClient = getAiClient();

    const prompt = `
Analyze the following player data and top analyst ranking sources (FantasyPros ECR, ESPN Mike Clay, Establish The Run Evan Silva, PFF Analytics, Matthew Berry, Matt Harmon Yahoo) for position: ${selectedPosition || 'ALL'}.

Players Data:
${JSON.stringify(players ? players.slice(0, 15) : [], null, 2)}

Synthesize key expert consensus takeaways:
1. Executive Consensus Brief: 2-3 sentence overview of major expert agreement & positional shifts.
2. Unanimous "Must-Start" Upgrades: 2-3 players all top analysts unanimously recommend starting this week.
3. High Analyst Disagreement / Volatility Players: 2 players where top analysts strongly disagree (high variance), explaining why.
4. Top Expert "Love" Sleeper Pick: 1 high-upside player with strong backing from specialized analysts (e.g. Reception Perception or ETR).
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a master fantasy football expert consensus analyst aggregating insights from FantasyPros ECR, Mike Clay, Evan Silva, PFF, Matthew Berry, and Matt Harmon.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveBrief: { type: Type.STRING },
            unanimousStarts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  playerName: { type: Type.STRING },
                  position: { type: Type.STRING },
                  consensusReasoning: { type: Type.STRING }
                },
                required: ["playerName", "position", "consensusReasoning"]
              }
            },
            disagreementPlayers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  playerName: { type: Type.STRING },
                  position: { type: Type.STRING },
                  varianceReason: { type: Type.STRING },
                  bullCase: { type: Type.STRING },
                  bearCase: { type: Type.STRING }
                },
                required: ["playerName", "position", "varianceReason", "bullCase", "bearCase"]
              }
            },
            expertLoveSleeper: {
              type: Type.OBJECT,
              properties: {
                playerName: { type: Type.STRING },
                position: { type: Type.STRING },
                championAnalyst: { type: Type.STRING },
                breakoutCase: { type: Type.STRING }
              },
              required: ["playerName", "position", "championAnalyst", "breakoutCase"]
            }
          },
          required: ["executiveBrief", "unanimousStarts", "disagreementPlayers", "expertLoveSleeper"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in /api/ai/analyst-consensus:", error?.message || error);
    res.status(500).json({ error: "Failed to generate analyst consensus summary", details: error?.message || String(error) });
  }
});

// 5. AI Draft Recommendation Endpoint
app.post("/api/ai/draft-recommendation", async (req, res) => {
  try {
    const { availablePlayers, currentRound, pickNumber, userRoster, strategy } = req.body;

    const aiClient = getAiClient();

    const prompt = `
Suggest the top 3 best draft picks for Pick #${pickNumber} (Round ${currentRound}).
Strategy preference: ${strategy || "Best Player Available"}.

Top Available Players:
${JSON.stringify((availablePlayers || []).slice(0, 10), null, 2)}

User Current Picks:
${JSON.stringify(userRoster || [], null, 2)}

Provide recommendations with positional scarcity, value vs ADP, and strategy fit.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert fantasy draft master. Provide clear pick recommendations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topPickId: { type: Type.STRING },
            topPickReason: { type: Type.STRING },
            alternativePickId: { type: Type.STRING },
            positionScarcityAlert: { type: Type.STRING },
            strategyVerdict: { type: Type.STRING }
          },
          required: ["topPickId", "topPickReason", "alternativePickId", "positionScarcityAlert", "strategyVerdict"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in /api/ai/draft-recommendation:", error?.message || error);
    res.status(500).json({
      error: "Failed to generate draft advice",
      details: error?.message || String(error)
    });
  }
});

// 6. AI NFLfastr Team Matchup Analyzer endpoint
app.post("/api/ai/nflfastr-matchup", async (req, res) => {
  try {
    const { homeTeam, awayTeam } = req.body;

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: "homeTeam and awayTeam metrics are required" });
    }

    const aiClient = getAiClient();

    const prompt = `
You are an expert NFL quantitative analyst specializing in NFLfastr play-by-play analytics, Expected Points Added (EPA), Pass Rate Over Expected (PROE), Completion Percentage Over Expected (CPOE), and Defensive Success Rates.

Analyze this head-to-head matchup using the following NFLfastr team metrics:

HOME TEAM (${homeTeam.fullName}):
${JSON.stringify(homeTeam, null, 2)}

AWAY TEAM (${awayTeam.fullName}):
${JSON.stringify(awayTeam, null, 2)}

Evaluate:
1. Offensive EPA per play vs Defensive EPA allowed per play for both passing and rushing.
2. PROE, CPOE, Explosive Play Rates, and Pressure/Sack/Blitz interactions.
3. WR vs CB shadow coverage and primary alignment matchups (topReceivers vs topCornerbacks, target share, YPRR, passer rating allowed).
4. Identify specific game script forecasts and fantasy football implications (who gets game script boost, which unit holds the statistical edge).

Return a JSON object conforming strictly to the requested schema.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite NFLfastr quantitative analyst. Provide sharp, data-backed matchup insights.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectedWinner: { type: Type.STRING },
            projectedScore: { type: Type.STRING },
            gameScriptForecast: { type: Type.STRING },
            passExploitability: { type: Type.STRING },
            rushExploitability: { type: Type.STRING },
            pressureAndHavocImpact: { type: Type.STRING },
            fantasyKeyTakeaway: { type: Type.STRING },
            keyMatchupEdge: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER }
          },
          required: [
            "projectedWinner",
            "projectedScore",
            "gameScriptForecast",
            "passExploitability",
            "rushExploitability",
            "pressureAndHavocImpact",
            "fantasyKeyTakeaway",
            "keyMatchupEdge",
            "confidenceScore"
          ]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error in /api/ai/nflfastr-matchup:", error?.message || error);
    res.status(500).json({
      error: "Failed to generate NFLfastr AI matchup analysis",
      details: error?.message || String(error)
    });
  }
});

// ---------------------------
// VITE / STATIC SERVING
// ---------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fantasy Sports Command Center running at http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
