"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default function DashboardSummary() {
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentData = async (model, days = 7) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recent?model=${model}&days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setRecentData(data);
      } else {
        console.error("Failed to fetch recent data:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching recent data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentData("Characters", 7); // Fetch recent characters created in the last 7 days
  }, []);

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Recent Characters</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : recentData.length > 0 ? (
            <ul>
              {recentData.map((record, index) => (
                <li key={index}>
                  <strong>{record.name}</strong> (Created on:{" "}
                  {new Date(record.createdAt).toLocaleDateString()})
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent records found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
