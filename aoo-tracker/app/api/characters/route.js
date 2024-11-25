import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const characters = await prisma.characters.findMany({
      include: {
        faction: true, // Include related faction details
      },
    });
    return new Response(JSON.stringify(characters), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[API] Error fetching characters:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

export async function POST(req) {
    try {
      const body = await req.json();
      console.log("[API] Received character data:", body);
  
      const { targetId, name, rank, popularity, faction, role, portraitUrl, description } = body;
  
      if (!name || !targetId || !faction) {
        return new Response(JSON.stringify({ error: "Missing required fields: name, targetId, or faction" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
  
      // Check or create the faction
      let factionId;
      const existingFaction = await prisma.factions.findUnique({
        where: { name: faction },
      });
  
      if (existingFaction) {
        factionId = existingFaction.id;
        console.log(`[API] Found existing faction with ID ${factionId}`);
      } else {
        const newFaction = await prisma.factions.create({
          data: { name: faction },
        });
        factionId = newFaction.id;
        console.log(`[API] Created new faction with ID ${factionId}`);
      }
  
      // Check for existing character
      const existingCharacter = await prisma.characters.findUnique({
        where: { targetId },
      });
  
      if (existingCharacter) {
        console.log("[API] Duplicate character detected:", existingCharacter);
        return new Response(JSON.stringify({ error: "Duplicate character", existingCharacter }), {
          status: 409, // Conflict
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
  
      // Create new character if it doesn't exist
      const newCharacter = await prisma.characters.create({
        data: {
          targetId,
          name,
          rank,
          popularity,
          role,
          portraitUrl,
          description,
          factionId,
        },
      });
  
      return new Response(JSON.stringify(newCharacter), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("[API] Error creating character:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }
  
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
