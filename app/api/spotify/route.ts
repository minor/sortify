// app/api/spotify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

interface Track {
  track: {
    name: string;
    uri: string;
  };
}

interface RequestBody {
  playlistId: string;
  tracks: Track[];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${(session as any).accessToken}`,
      },
    });
    
    const playlists = await playlistsResponse.json();
    return NextResponse.json(playlists);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: RequestBody = await request.json();
    const { playlistId, tracks } = body;
    
    // Sort tracks alphabetically by name
    const sortedTracks = [...tracks].sort((a, b) => 
      a.track.name.toLowerCase().localeCompare(b.track.name.toLowerCase())
    );

    // Create new track order
    const uris = sortedTracks.map(item => item.track.uri);
    
    // Replace all tracks in the playlist with the sorted order
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${(session as any).accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris }),
    });

    if (!response.ok) {
      throw new Error('Failed to update playlist');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder playlist' }, { status: 500 });
  }
}