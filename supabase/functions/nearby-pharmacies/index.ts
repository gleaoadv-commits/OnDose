const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon, radius = 10000 } = await req.json();

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'lat and lon are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Overpass API query for pharmacies within radius
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="pharmacy"](around:${radius},${lat},${lon});
        way["amenity"="pharmacy"](around:${radius},${lat},${lon});
        node["shop"="chemist"](around:${radius},${lat},${lon});
      );
      out body center 50;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    const pharmacies = data.elements.map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      const tags = el.tags || {};

      // Haversine distance
      const R = 6371;
      const dLat = ((elLat - lat) * Math.PI) / 180;
      const dLon = ((elLon - lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) * Math.cos((elLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return {
        id: el.id,
        name: tags.name || 'Farmácia',
        lat: elLat,
        lon: elLon,
        distance: Math.round(distance * 100) / 100,
        address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || null,
        phone: tags.phone || tags['contact:phone'] || null,
        openingHours: tags.opening_hours || null,
        isManipulacao: !!(tags.name && /manipula/i.test(tags.name)) || tags.dispensing === 'yes',
      };
    });

    pharmacies.sort((a: any, b: any) => a.distance - b.distance);

    return new Response(
      JSON.stringify({ pharmacies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
