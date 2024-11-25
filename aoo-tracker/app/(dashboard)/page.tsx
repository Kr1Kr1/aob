"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter hook
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  } from "@/components/ui/table"; // Ensure this path matches your project structure

export default function DashboardPage() {
    const [events, setEvents] = useState([]);
    const [sortOrder, setSortOrder] = useState("desc"); // Default sort order to descending
    const router = useRouter();
    const [menuEventId, setMenuEventId] = useState(null); // Track which row menu is open
  
    useEffect(() => {
      // Fetch events from the API
      fetch("/api/events")
        .then((res) => res.json())
        .then((data) => {
          // Sort events by calculatedDate in descending order (most recent first)
          const sortedData = [...data].sort((a, b) =>
            new Date(b.calculatedDate) - new Date(a.calculatedDate)
          );
          setEvents(sortedData);
        })
        .catch((err) => console.error("Error fetching events:", err));
    }, []);
  
    const handleSort = () => {
      const sortedEvents = [...events].sort((a, b) => {
        const dateA = new Date(a.calculatedDate);
        const dateB = new Date(b.calculatedDate);
        return sortOrder === "asc" ? dateB - dateA : dateA - dateB;
      });
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      setEvents(sortedEvents);
    };
  
    const handleEdit = (id) => {
      router.push(`/events/${id}`); // Navigate to the edit page for the event
    };
  
    const handleDelete = (id) => {
      if (confirm("Are you sure you want to delete this event?")) {
        // Perform delete operation
        fetch(`/api/events/${id}`, {
          method: "DELETE",
        })
          .then((res) => {
            if (res.ok) {
              setEvents(events.filter((event) => event.id !== id));
            }
          })
          .catch((err) => console.error("Error deleting event:", err));
      }
    };
  
    const handleCreate = () => {
      router.push("/events/create"); // Navigate to the "Create Event" page
    };
  
    const getRowClassName = (event) => {
      if (event.source === "manual") return "bg-blue-100"; // Light blue for manual events
      if (event.fromCol?.includes("Glenefal")) return "bg-green-100"; // Light green for Glenefal
      return ""; // Default (no color)
    };
  
    return (
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Events</h1>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleCreate}
          >
            Create Event
          </button>
        </div>
  
        {/* Table to display events */}
        <Table className="border border-gray-400">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">Event</TableHead>
              <TableHead className="px-4 py-2">Details</TableHead>
              <TableHead className="px-4 py-2">From</TableHead>
              <TableHead className="px-4 py-2">With Whom</TableHead>
              <TableHead
                className="px-4 py-2 cursor-pointer"
                onClick={handleSort}
              >
                Calculated Date{" "}
                <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
              </TableHead>
              <TableHead className="px-4 py-2">Territory</TableHead>
              <TableHead className="px-4 py-2">Source</TableHead>
              <TableHead className="px-4 py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className={getRowClassName(event)}>
                <TableCell className="px-4 py-2">{event.event}</TableCell>
                <TableCell className="px-4 py-2">{event.details || "-"}</TableCell>
                <TableCell className="px-4 py-2">{event.fromCol}</TableCell>
                <TableCell className="px-4 py-2">{event.withWhom || "-"}</TableCell>
                <TableCell className="px-4 py-2">
                  {event.calculatedDate
                    ? new Date(event.calculatedDate).toLocaleString() // Format calculatedDate
                    : "-"}
                </TableCell>
                <TableCell className="px-4 py-2">{event.territory || "-"}</TableCell>
                <TableCell className="px-4 py-2">{event.source}</TableCell>
                <TableCell className="px-4 py-2 relative">
                  {event.source === "manual" && (
                    <div>
                      <button
                        className="text-blue-500"
                        onClick={() =>
                          setMenuEventId(menuEventId === event.id ? null : event.id)
                        }
                      >
                        ...
                      </button>
                      {menuEventId === event.id && (
                        <div className="absolute bg-white border rounded shadow p-2">
                          <button
                            className="block text-left text-sm w-full px-2 py-1 hover:bg-gray-100"
                            onClick={() => handleEdit(event.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="block text-left text-sm w-full px-2 py-1 hover:bg-gray-100 text-red-500"
                            onClick={() => handleDelete(event.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
