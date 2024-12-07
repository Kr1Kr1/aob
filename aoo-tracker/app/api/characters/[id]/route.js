import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger"; // Custom logger

const prisma = new PrismaClient();

export async function GET(req, context) {
  try {
    logger.info("[API] Starting to fetch character details...");
    
    // Await params destructuring
    const params = await context.params;
    const { id: targetId } = params;

    if (!targetId) {
      logger.warn("[API] Missing targetId in the request");
      return new Response(JSON.stringify({ error: "Missing targetId in the request" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const parsedTargetId = parseInt(targetId, 10);
    if (isNaN(parsedTargetId)) {
      logger.warn("[API] Invalid targetId format");
      return new Response(JSON.stringify({ error: "Invalid targetId format" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Log parsedTargetId
    logger.debug(`[API] Parsed targetId: ${parsedTargetId}`);

    // Fetch character details from the database
    const character = await prisma.characters.findUnique({
      where: { targetId: parsedTargetId },
      include: {
        faction: true,
        mdjHistory: {
          orderBy: { createdAt: "desc" },
          take: 1, // Include most recent MDJ
        },
        storyHistory: {
          orderBy: { modifiedAt: "desc" },
          take: 1, // Include most recent story
        },
      },
    });

    if (!character) {
      logger.warn(`[API] Character with targetId ${parsedTargetId} not found`);
      return new Response(JSON.stringify({ error: "Character not found" }), {
        status: 404,
        headers: corsHeaders(),
      });
    }

    // Log character data structure for debugging
    logger.debug(`[API] Character data retrieved: ${JSON.stringify(character, null, 2)}`);

    // Handle potential issues with nested data
    const mostRecentMDJ = character.mdjHistory?.[0]?.mdj || "Ce personnage est trop éloigné pour l'entendre parler.";
    const mostRecentStory = character.storyHistory?.[0]?.story || "Je préfère garder cela pour moi.";

    logger.debug(`[API] Most recent MDJ: ${mostRecentMDJ}`);
    logger.debug(`[API] Most recent Story: ${mostRecentStory}`);

    // Construct response object
    const response = {
      ...character,
      mostRecentMDJ,
      mostRecentStory,
    };

    // Log successful fetch
    logger.info(`[API] Successfully fetched character: ${character.name}`);
    return new Response(JSON.stringify(response), {
      headers: corsHeaders(),
    });
  } catch (error) {
    logger.error(`[API] Error fetching character details: ${error.message}`, { stack: error.stack });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500, headers: corsHeaders(),
    });
  }
}

// OPTIONS: Handle CORS preflight
export async function OPTIONS(req) {
  return new Response(null, {
    headers: corsHeaders(),
    status: 204, // No content
  });
}

// CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}
