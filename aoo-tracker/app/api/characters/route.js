import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    logger.info("[API] Fetching all characters with details...");

    const characters = await prisma.characters.findMany({
      include: {
        faction: true,
        mdjHistory: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get the most recent MDJ entry
        },
        storyHistory: {
          orderBy: { modifiedAt: "desc" },
          take: 1, // Get the most recent story modification
        },
      },
    });

    logger.info(`[API] Retrieved ${characters.length} characters.`);

    const charactersWithMDJ = characters.map((character) => {
      logger.debug(`[API] Processing character: ${JSON.stringify(character, null, 2)}`);

      const mostRecentMDJ = character.mdjHistory.length > 0
        ? character.mdjHistory[0].mdj
        : "Ce personnage est trop éloigné pour l'entendre parler.";

      const mostRecentStory = character.storyHistory.length > 0
        ? character.storyHistory[0].story
        : "Je préfère garder cela pour moi.";

      logger.debug(`[API] Processing next character`);
      return {
        ...character,
        mostRecentMDJ,
        mostRecentStory,
      };
    });

    logger.info(`[API] Successfully processed all characters.`);
    return new Response(JSON.stringify(charactersWithMDJ), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`[API] Error fetching characters: ${error.message}`, { stack: error.stack });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    logger.debug(`[API] Received character data: ${JSON.stringify(body)}`);

    const { targetId, name, rank, popularity, faction, role, portraitUrl } = body;

    if (!name || !targetId) {
      logger.warn("[API] Missing required fields: name or targetId");
      return new Response(JSON.stringify({ error: "Missing required fields: name or targetId" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const factionName = faction || "Unknown";

    // Check or create the faction
    let factionId;
    const existingFaction = await prisma.factions.findUnique({
      where: { name: factionName },
    });

    if (existingFaction) {
      factionId = existingFaction.id;
      logger.info(`[API] Found existing faction with ID ${factionId}`);
    } else {
      const newFaction = await prisma.factions.create({
        data: { name: factionName },
      });
      factionId = newFaction.id;
      logger.info(`[API] Created new faction with ID ${factionId}`);
    }

    // Check for existing character
    const existingCharacter = await prisma.characters.findUnique({
      where: { targetId },
    });

    if (existingCharacter) {
      logger.debug(`[API] Duplicate character detected: ${JSON.stringify(existingCharacter)}`);
      return new Response(JSON.stringify({ error: "Duplicate character", existingCharacter }), {
        status: 409,
        headers: corsHeaders(),
      });
    }

    // Create new character
    const newCharacter = await prisma.characters.create({
      data: {
        targetId,
        name,
        rank,
        popularity,
        role,
        portraitUrl,
        factionId,
      },
    });

    // Add initial MDJ to history if provided
    if (mdj) {
      await prisma.mdjHistory.create({
        data: {
          characterId: newCharacter.id,
          mdj,
        },
      });
    }

    // Add initial story to history if provided
    if (story) {
      await prisma.characterHistory.create({
        data: {
          characterId: newCharacter.id,
          story,
        },
      });
    }

    logger.info(`[API] Created new character: ${JSON.stringify(newCharacter)}`);
    return new Response(JSON.stringify(newCharacter), {
      headers: corsHeaders(),
    });
  } catch (error) {
    logger.error(`[API] Error creating character: ${error.message}`, { stack: error.stack });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

export async function PATCH(req, context) {
  try {
    logger.info("[API] Starting to update character details...");

    // Await `params` from `context` for dynamic routes
    const params = await context.params;
    const { id: targetId } = params;

    if (!targetId) {
      logger.warn("[API] Missing targetId in the request");
      return new Response(JSON.stringify({ error: "Missing targetId in the request" }), {
        status: 400,
      });
    }

    const parsedTargetId = parseInt(targetId, 10);
    if (isNaN(parsedTargetId)) {
      logger.warn("[API] Invalid targetId format");
      return new Response(JSON.stringify({ error: "Invalid targetId format" }), {
        status: 400,
      });
    }

    // Log parsedTargetId
    logger.debug(`[API] Parsed targetId: ${parsedTargetId}`);

    // Parse the body for updates
    const updates = await req.json();
    const { rank, popularity, role } = updates;

    if (!rank && !popularity && !role) {
      logger.warn("[API] No valid attributes to update");
      return new Response(JSON.stringify({ error: "No valid attributes to update" }), {
        status: 400,
      });
    }

    // Fetch existing character
    const character = await prisma.characters.findUnique({
      where: { targetId: parsedTargetId },
    });

    if (!character) {
      logger.warn(`[API] Character with targetId ${parsedTargetId} not found`);
      return new Response(JSON.stringify({ error: "Character not found" }), {
        status: 404,
      });
    }

    // Prepare change logs
    const changeLogs = [];
    if (rank && rank !== character.rank) {
      changeLogs.push({
        characterId: character.id,
        attribute: "rank",
        oldValue: character.rank,
        newValue: rank,
      });
    }
    if (popularity && popularity !== character.popularity) {
      changeLogs.push({
        characterId: character.id,
        attribute: "popularity",
        oldValue: character.popularity,
        newValue: popularity,
      });
    }
    if (role && role !== character.role) {
      changeLogs.push({
        characterId: character.id,
        attribute: "role",
        oldValue: character.role,
        newValue: role,
      });
    }

    // Log the changes for debugging
    logger.debug(`[API] Change logs prepared: ${JSON.stringify(changeLogs, null, 2)}`);

    // Update the character
    const updatedCharacter = await prisma.characters.update({
      where: { targetId: parsedTargetId },
      data: { rank, popularity, role },
    });

    // Save change logs
    if (changeLogs.length > 0) {
      await prisma.characterLog.createMany({
        data: changeLogs.map((log) => ({
          ...log,
          changedAt: new Date(),
        })),
      });
    }

    logger.info(`[API] Successfully updated character: ${updatedCharacter.name}`);
    return new Response(JSON.stringify(updatedCharacter), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`[API] Error updating character: ${error.message}`, { stack: error.stack });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function OPTIONS(req) {
  return new Response(null, {
    headers: corsHeaders(),
    status: 204,
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}
