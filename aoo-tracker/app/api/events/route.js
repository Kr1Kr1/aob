import { PrismaClient } from "@prisma/client";
import { parseDate } from "@/lib/dateUtils";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Extract query parameters for offset and limit
    const url = new URL(req.url);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    console.log(`[API] Fetching events with offset=${offset}, limit=${limit}`);

    // Fetch events with pagination
    const events = await prisma.events.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        calculatedDate: "desc", // Ensure consistent ordering
      },
    });

    // Count total events for pagination metadata
    const totalEvents = await prisma.events.count();

    // Return the events and metadata
    return new Response(
      JSON.stringify({
        events,
        total: totalEvents,
        offset,
        limit,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("[API] Error fetching events:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("[API] Parsed request body:", body);
    const { event, details, fromCol, withWhom, date, territory, source = "Manual" } = body;

    if (!event || !fromCol || !date || !territory) {
      console.error("[API] Missing required fields in the request:", {
        event,
        fromCol,
        date,
        territory,
      });
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const calculatedDate = parseDate(date);
    console.log("[API] Parsed calculatedDate:", calculatedDate);

    if (!calculatedDate) {
      console.error("[API] Failed to parse date:", date);
      return new Response(JSON.stringify({ error: "Invalid date format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Log the values being passed to `findFirst`
    console.log("[API] Checking for duplicates with:", {
      event,
      territory,
      calculatedDate,
      fromCol,
    });

    // Check for duplicates
    const existingEvent = await prisma.events.findFirst({
      where: {
        event,
        territory,
        calculatedDate, // Compare calculated timestamp
        fromCol,
      },
    });

    if (existingEvent) {
      console.log("[API] Duplicate event detected:", existingEvent);
      return new Response(JSON.stringify({ error: "Duplicate event", existingEvent }), {
        status: 409, // Conflict
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Log the values being passed to `create`
    console.log("[API] Creating new event with:", {
      event,
      details,
      fromCol,
      withWhom,
      date,
      calculatedDate,
      territory,
      source,
    });

    // Create new event
    const newEvent = await prisma.events.create({
      data: {
        event,
        details,
        fromCol,
        withWhom,
        date, // Store the raw "Aujourd'hui à ..." date
        calculatedDate, // Store the parsed timestamp
        territory,
        source,
      },
    });

    return new Response(JSON.stringify(newEvent), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[API] Error processing the request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
