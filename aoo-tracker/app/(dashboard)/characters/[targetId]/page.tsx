"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const CharacterDetailsPage = ({ params }) => {
  const router = useRouter();
  const { targetId } = params;
  const [character, setCharacter] = useState(null);
  const [mdjHistory, setMdjHistory] = useState([]);
  const [storyHistory, setStoryHistory] = useState(null);

  useEffect(() => {
    // Fetch character details
    fetch(`/api/characters/${targetId}`)
      .then((res) => res.json())
      .then((data) => setCharacter(data))
      .catch((err) => console.error("Error fetching character details:", err));

    // Fetch MDJ history
    fetch(`/api/characters/${targetId}/mdj`)
      .then((res) => res.json())
      .then((data) => setMdjHistory(data))
      .catch((err) => console.error("Error fetching MDJ history:", err));

    // Fetch story history
    fetch(`/api/characters/${targetId}/history`)
      .then((res) => res.json())
      .then((data) => setStoryHistory(data[0]))
      .catch((err) => console.error("Error fetching story history:", err));
  }, [targetId]);

  if (!character) {
    return <p>Loading character details...</p>;
  }

  return (
    <div className="container mx-auto p-8">
      <button
        className="mb-4 text-blue-500 hover:underline"
        onClick={() => router.back()}
      >
        &larr; Back to Characters
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Character Details */}
        <Card>
          <CardHeader>
            <CardTitle>{character.name}</CardTitle>
            <CardDescription>
              Role: {character.role || "Unknown Role"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Target ID:</strong> {character.targetId}
            </p>
            <p>
              <strong>Rank:</strong> {character.rank || "Unknown Rank"}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {character.description || "No description available"}
            </p>
          </CardContent>
          <CardFooter>
            {storyHistory ? (
              <div>
                <p>
                  <strong>Last Story Modified:</strong>{" "}
                  {new Date(storyHistory.modifiedAt).toLocaleDateString()}
                </p>
                <p>{storyHistory.story || "No story available."}</p>
              </div>
            ) : (
              <p>No story history available for this character.</p>
            )}
          </CardFooter>
        </Card>

        {/* Right Column: MDJ History */}
        <Card>
          <CardHeader>
            <CardTitle>MDJ History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {mdjHistory.length > 0 ? (
                mdjHistory.map((entry) => (
                  <li key={entry.id} className="mb-2">
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    <p>{entry.mdj}</p>
                  </li>
                ))
              ) : (
                <p>No MDJ history available for this character.</p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CharacterDetailsPage;
