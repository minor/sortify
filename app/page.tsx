"use client";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Playlist {
  id: string;
  name: string;
  tracks: {
    total: number;
  };
}

export default function Home() {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/spotify");
      const data = await response.json();
      setPlaylists(data.items || []);
    } catch (err) {
      setError("Failed to fetch playlists");
    } finally {
      setLoading(false);
    }
  };

  const sortPlaylist = async (playlistId: string) => {
    try {
      setLoading(true);
      setError("");

      // First, fetch all tracks from the playlist
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );
      const tracksData = await tracksResponse.json();

      // Send tracks to be sorted
      const response = await fetch("/api/spotify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlistId,
          tracks: tracksData.items,
        }),
      });

      if (!response.ok) throw new Error("Failed to sort playlist");

      setSuccess("Playlist successfully sorted!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to sort playlist");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Spotify Playlist Organizer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Sign in with your Spotify account to organize your playlists.
            </p>
            <Button onClick={() => signIn("spotify")} className="w-full">
              Sign in with Spotify
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Spotify Playlist Organizer</h1>
          <Button onClick={() => signOut()} variant="outline">
            Sign Out
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {playlists.length === 0 ? (
          <Button onClick={fetchPlaylists} disabled={loading}>
            {loading ? "Loading..." : "Load My Playlists"}
          </Button>
        ) : (
          <div className="grid gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{playlist.name}</CardTitle>
                    <Button
                      onClick={() => sortPlaylist(playlist.id)}
                      disabled={loading}
                    >
                      Sort Alphabetically
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {playlist.tracks.total} tracks
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
