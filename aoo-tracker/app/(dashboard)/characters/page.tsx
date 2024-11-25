"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function CharactersPage() {
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    // Fetch characters from the API
    fetch("/api/characters")
      .then((res) => res.json())
      .then((data) => setCharacters(data))
      .catch((err) => console.error("Error fetching characters:", err));
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Characters</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {characters.map((character) => (
          <Card key={character.id} className="relative">
            <CardHeader>
              <CardTitle>{character.name}</CardTitle>
              <CardDescription>
                Faction: {character.faction?.name || "Unknown"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <p>Role: {character.role || "Unknown Role"}</p>
                <p>Rank: {character.rank || "Unknown Rank"}</p>
              </div>
            </CardContent>
            {character.avatarUrl && (
              <img
                src={character.avatarUrl}
                alt={`${character.name}'s avatar`}
                className="absolute top-0 right-0 w-16 h-16 rounded-full shadow-lg m-4"
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
