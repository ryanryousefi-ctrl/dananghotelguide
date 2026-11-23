#!/usr/bin/env node
// Phase 2 fact-check corrections. Distances below are from hotel and booking-site listings (Meliá, Accor/Mercure, Hotels.com, Expedia, Trip.com), checked 2026-11-23.
// They contradict earlier "next to / opposite / five minutes' walk from Dragon Bridge" and "3 km airport" statements. Only objective location/distance statements are changed.
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const FIX = {
  'novotel-da-nang-han-river.html': [
    ['Rooftop pool, Dragon Bridge views, from $75/night.', 'Rooftop pool, Han River views, from $75/night.'],
    ['directly opposite Dragon Bridge and approximately 5 km from My Khe Beach and 3 km from Da Nang Airport.', 'in central Da Nang, about 1 km from Han Market, roughly 2 to 3 km from Dragon Bridge and about 4.5 km from Da Nang Airport (distances vary by source).'],
    ['“Directly opposite Dragon Bridge, 3km from the airport.”', '“On the Han River, about 1 km from Han Market.”'],
    ['<div class="hr-snap-val">Dragon Bridge views</div>', '<div class="hr-snap-val">Han River views</div>'],
    ['<div class="hr-snap-val">3 km, fastest in the city</div>', '<div class="hr-snap-val">About 4.5 km</div>'],
    ['stands on the Han River, directly opposite Dragon Bridge.', 'stands on the west bank of the Han River in the city centre, about 1 km from Han Market.'],
    ['On Friday and Saturday nights, the Bridge breathes fire, and you can watch it from the hotel.', 'On Friday and Saturday nights Dragon Bridge breathes fire; it is a short taxi ride from here, roughly 2 to 3 km.'],
    ['The airport is 3km away and 8 minutes by Grab, which is the shortest airport transfer of any quality hotel in Da Nang, and Han Market is 10 minutes', 'The airport is roughly 4.5 km away, a short Grab ride, and Han Market is about 10 minutes'],
    ['upper floors facing the river put Dragon Bridge in the frame with the Han River below', 'upper floors facing the river look over the Han River below'],
    ['room with Dragon Bridge view', 'room with Han River view'],
    ['<h2 class="hr-h2">Dragon Bridge Location</h2>', '<h2 class="hr-h2">Han River Location</h2>'],
    ['Dragon Bridge is a five-minute walk, and the hotel sits directly opposite it on the Han River, close enough to watch the weekend fire-breathing show without leaving the property. Combined with the 3km, 8-minute airport transfer,', 'Han Market is about 10 minutes on foot and the river promenade is close; Dragon Bridge and its weekend fire show are a short taxi ride away, roughly 2 to 3 km. Combined with an airport transfer of roughly 4.5 km,'],
    ['3km, eight minutes by Grab, the fastest transfer of any quality Da Nang hotel.', 'About 4.5 km, a short Grab ride, one of the shorter transfers of any quality Da Nang hotel.'],
    ['A five-minute walk, with the fire-breathing show visible from the hotel on weekend nights.', 'A short taxi ride (roughly 2 to 3 km) to the bridge and its weekend fire show.'],
    ['Han River, city centre, directly opposite Dragon Bridge, with Han Market 10 minutes on foot and the airport just 3km away.', 'Han River, city centre, with Han Market about 10 minutes on foot, Dragon Bridge roughly 2 to 3 km away and the airport about 4.5 km away.'],
    ['<strong>Dragon Bridge:</strong> 5 min walk</span><span class="hr-loc-chip"><strong>Airport:</strong> 3 km</span>', '<strong>Dragon Bridge:</strong> short taxi ride</span><span class="hr-loc-chip"><strong>Airport:</strong> ~4.5 km</span>'],
  ],
  'grand-mercure-da-nang.html': [
    ['approximately 4 km from My Khe Beach and 3 km from the airport.', 'approximately 4 km from My Khe Beach and roughly a 10-minute drive from the airport.'],
    ['<div class="hr-snap-val">3 km, fastest in the city</div>', '<div class="hr-snap-val">About 10 min by car</div>'],
    ['Dragon Bridge is a five-minute walk and Han Market is ten minutes on foot.', 'Han Market is about ten minutes on foot and Dragon Bridge is a short taxi ride (around 2 km).'],
    ['Dragon Bridge and Han Market are both within a short walk, and the airport transfer at 3km is one of the fastest in the city.', 'Han Market is a short walk, Dragon Bridge a short taxi ride, and the airport transfer, roughly ten minutes by car, is among the shorter ones in the city.'],
    ['Dragon Bridge\'s fire-breathing show on Friday and Saturday evenings is a five-minute walk away, and Accor', 'Dragon Bridge\'s fire-breathing show on Friday and Saturday evenings is a short taxi ride away, and Accor'],
    ['3km, eight minutes by Grab, the most useful proximity in the city for frequent travelers or anyone on an early flight.', 'Roughly ten minutes by car, a useful proximity for frequent travelers or anyone on an early flight.'],
    ['A five-minute walk to the bridge and its weekend fire show, Han Market ten minutes on foot.', 'A short taxi ride to the bridge and its weekend fire show, Han Market about ten minutes on foot.'],
    ['with Dragon Bridge a 5-minute walk, Han Market 10 minutes, and the airport just 3km away.', 'with Han Market about 10 minutes on foot, Dragon Bridge a short taxi ride (around 2 km) and the airport roughly a 10-minute drive.'],
    ['<strong>Dragon Bridge:</strong> 5 min walk</span><span class="hr-loc-chip"><strong>Airport:</strong> 3 km</span>', '<strong>Dragon Bridge:</strong> short taxi ride</span><span class="hr-loc-chip"><strong>Airport:</strong> ~10 min drive</span>'],
    ['When the airport is 3km away and Dragon Bridge is a five-minute walk,', 'When the airport is a short drive away and Han Market is a ten-minute walk,'],
  ],
  'brilliant-hotel-da-nang.html': [
    ['a city-centre budget pick next to Dragon Bridge, with a rooftop pool and Han Market on foot.', 'a city-centre budget pick about 1.2 km from Dragon Bridge, with a rooftop pool and Han Market on foot.'],
    ['Dragon Bridge location, rooftop pool, Han River views,', 'Han Market and Dragon Bridge within walking distance, rooftop pool, Han River views,'],
    ['steps from Dragon Bridge. About 5 km from My Khe Beach and 4 km from Da Nang Airport.', 'about 0.3 km from Han Market and roughly 1.2 km (a 10 to 13 minute walk) from Dragon Bridge. About 5 km from My Khe Beach and a few km from Da Nang Airport.'],
    ['“Dragon Bridge is next door. From the rooftop pool, you\'re looking right at it.”', '“A three-minute walk from Han Market, about ten minutes on foot from Dragon Bridge.”'],
    ['sits directly next to Dragon Bridge, the most photographed structure in Da Nang,', 'sits about a 10 to 13 minute walk from Dragon Bridge, the most photographed structure in Da Nang,'],
    ['<h2 class="hr-h2">Dragon Bridge, Next Door</h2>', '<h2 class="hr-h2">Dragon Bridge, a Short Walk Away</h2>'],
    ['sits right next to Dragon Bridge, which makes it the easiest base in the city for catching', 'is about a 10 to 13 minute walk from Dragon Bridge, an easy base for catching'],
    ['Next door to the bridge, the best hotel base in the city for catching the weekend f', 'A short walk from the bridge, an easy hotel base for catching the weekend f'],
    ['Han River, city centre, right next to Dragon Bridge, with Han Market and the city\'s food scene walkable from the door.', 'Han River, city centre, about a 10 to 13 minute walk from Dragon Bridge, with Han Market (about three minutes on foot) and the city\'s food scene walkable from the door.'],
    ['Yes, specifically for the Dragon Bridge position and the rooftop pool view.', 'Yes, specifically for the walkable Han Market and Dragon Bridge position and the rooftop view.'],
    ['Han Market is five minutes away,', 'Han Market is about three minutes away on foot,'],
  ],
  'melia-vinpearl-da-nang.html': [
    ['Dragon Bridge is a five-minute walk, Han Market is five minutes on foot, and Vincom Mall', 'Han Market is about 1.3 km away (roughly a 12-minute walk), Dragon Bridge about 1.8 km (roughly 18 minutes on foot), and Vincom Mall'],
    ['Both the bridge and Han Market are five minutes on foot, removing most of the logistical friction of a city stay.', 'Han Market is roughly a 12-minute walk and the bridge about 18 minutes on foot, with Vincom Plaza right beside the hotel, removing much of the logistical friction of a city stay.'],
    ['with Dragon Bridge and Han Market both five minutes on foot and Vincom Mall directly adjacent.', 'with Han Market about 1.3 km away (roughly a 12-minute walk), Dragon Bridge about 1.8 km away (roughly an 18-minute walk) and Vincom Mall directly adjacent.'],
    ['<strong>Dragon Bridge:</strong> 5 min walk', '<strong>Dragon Bridge:</strong> ~18 min walk'],
  ],
};
let bad = 0, n = 0;
for (const [f, list] of Object.entries(FIX)) { const p = path.join(ROOT, f); let s = fs.readFileSync(p, 'utf8'); for (const [a, b] of list) { if (!s.includes(a)) { console.log('MISSING in', f, ':', a.slice(0, 70)); bad++; continue; } s = s.split(a).join(b); n++; } fs.writeFileSync(p, s); }
console.log('replacements', n, 'missing', bad);
