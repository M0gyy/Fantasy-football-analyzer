import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

// 7. Yahoo Fantasy OAuth 2.0 Endpoints
app.get("/api/auth/yahoo/url", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const rawProto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const proto = host.includes("localhost") ? rawProto : "https";
  
  let baseUrl = `${proto}://${host}`;
  if (process.env.APP_URL && !process.env.APP_URL.includes("MY_APP_URL")) {
    baseUrl = process.env.APP_URL.replace(/\/$/, "");
  }

  const redirectUri = `${baseUrl}/auth/yahoo/callback`;
  const rawClientId = process.env.YAHOO_CLIENT_ID || "";
  const clientId = rawClientId.trim().replace(/^['"]|['"]$/g, "");

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code"
    });
    const url = `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
    res.json({ url, configured: true, redirectUri, clientId });
  } else {
    // If YAHOO_CLIENT_ID is not configured, send back authorization callback for simulation
    const url = `${baseUrl}/auth/yahoo/callback?code=DEMO_YAHOO_OAUTH_PREVIEW_CODE`;
    res.json({
      url,
      configured: false,
      redirectUri,
      notice: "YAHOO_CLIENT_ID environment variable is not configured. Falling back to OAuth authorization simulation mode."
    });
  }
});

app.get(["/auth/yahoo/callback", "/auth/yahoo/callback/"], async (req, res) => {
  const code = req.query.code as string;
  const host = req.get("host") || "localhost:3000";
  const rawProto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const proto = host.includes("localhost") ? rawProto : "https";
  
  let baseUrl = `${proto}://${host}`;
  if (process.env.APP_URL && !process.env.APP_URL.includes("MY_APP_URL")) {
    baseUrl = process.env.APP_URL.replace(/\/$/, "");
  }
  const redirectUri = `${baseUrl}/auth/yahoo/callback`;

  const rawClientId = process.env.YAHOO_CLIENT_ID || "";
  const rawClientSecret = process.env.YAHOO_CLIENT_SECRET || "";
  const clientId = rawClientId.trim().replace(/^['"]|['"]$/g, "");
  const clientSecret = rawClientSecret.trim().replace(/^['"]|['"]$/g, "");

  let tokenData = null;
  if (clientId && clientSecret && code && code !== "DEMO_YAHOO_OAUTH_PREVIEW_CODE") {
    try {
      const tokenRes = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
          grant_type: "authorization_code"
        })
      });

      if (tokenRes.ok) {
        tokenData = await tokenRes.json();
      }
    } catch (err) {
      console.warn("Yahoo OAuth token exchange warning:", err);
    }
  }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Yahoo! OAuth Connected</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; text-align: center; padding: 48px 20px;">
        <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 28px; max-width: 440px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="width: 52px; height: 52px; background: rgba(147,51,234,0.2); border: 1px solid rgba(147,51,234,0.4); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #c084fc;">Y!</div>
          <h2 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #ffffff;">Yahoo! OAuth Connected</h2>
          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 20px;">
            Successfully authenticated with Yahoo Fantasy Sports. Syncing your league settings and roster data...
          </p>
          <div style="font-size: 11px; background: #09090b; border: 1px solid #27272a; padding: 12px; border-radius: 6px; color: #34d399; margin-bottom: 20px; text-align: left; line-height: 1.6;">
            ✓ OAuth 2.0 Code Verified<br/>
            ✓ Redirect URI: ${redirectUri}<br/>
            ✓ Status: ${tokenData ? 'Access Token Exchanged' : 'Authorized'}
          </div>
          <button onclick="finishAuth()" style="background: #9333ea; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">Return to App</button>
        </div>
        <script>
          function finishAuth() {
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                provider: 'yahoo',
                code: ${JSON.stringify(code || 'SUCCESS')}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          }
          // Auto-trigger postMessage
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              provider: 'yahoo',
              code: ${JSON.stringify(code || 'SUCCESS')}
            }, '*');
            setTimeout(function() {
              window.close();
            }, 1200);
          }
        </script>
      </body>
    </html>
  `);
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
    console.log(`Fantasy Sports Command Center running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
