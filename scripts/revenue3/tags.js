'use strict';
// setting: beach|city ; style: resort|hotel|villa ; budget: value|upscale|luxury (star category, NOT rates) ; audience ; priorities
// Editorial classification of our reviews (same tags as the Phase 2 finder).
module.exports = {
  'a-la-carte-da-nang': ['beach', 'hotel', 'value', ['couples', 'solo'], ['pool', 'beachfront']],
  'brilliant-hotel-da-nang': ['city', 'hotel', 'value', ['solo', 'couples'], ['walkable']],
  'four-points-sheraton-da-nang': ['beach', 'hotel', 'value', ['families', 'business'], ['beachfront']],
  'furama-resort-da-nang': ['beach', 'resort', 'upscale', ['families', 'couples'], ['pool', 'quiet', 'beachfront']],
  'grand-mercure-da-nang': ['city', 'hotel', 'upscale', ['business', 'couples'], ['walkable', 'pool']],
  'hilton-da-nang': ['city', 'hotel', 'upscale', ['business', 'couples'], ['lounge', 'walkable']],
  'hyatt-regency-da-nang': ['beach', 'resort', 'luxury', ['families', 'couples'], ['pool', 'quiet', 'beachfront']],
  'intercontinental-da-nang': ['beach', 'resort', 'luxury', ['couples'], ['quiet', 'lounge', 'beachfront']],
  'marriott-resort-da-nang': ['beach', 'villa', 'luxury', ['couples', 'families'], ['pool', 'quiet', 'beachfront']],
  'melia-da-nang': ['beach', 'resort', 'upscale', ['couples'], ['quiet', 'lounge', 'beachfront']],
  'melia-vinpearl-da-nang': ['city', 'hotel', 'upscale', ['couples', 'families'], ['pool', 'walkable']],
  'muong-thanh-luxury-da-nang': ['beach', 'hotel', 'value', ['families', 'solo'], ['beachfront']],
  'naman-retreat-da-nang': ['beach', 'villa', 'luxury', ['couples'], ['pool', 'quiet', 'beachfront']],
  'novotel-da-nang-han-river': ['city', 'hotel', 'value', ['business', 'solo'], ['lounge', 'walkable']],
  'premier-village-da-nang': ['beach', 'villa', 'luxury', ['families', 'couples'], ['pool', 'quiet', 'beachfront']],
  'pullman-da-nang': ['beach', 'resort', 'upscale', ['families', 'couples'], ['pool', 'beachfront']],
  'radisson-blu-da-nang': ['beach', 'resort', 'upscale', ['families'], ['pool', 'beachfront']],
  'sheraton-grand-da-nang': ['beach', 'resort', 'upscale', ['families'], ['pool', 'beachfront']],
  'tia-wellness-resort-da-nang': ['beach', 'resort', 'luxury', ['couples', 'wellness'], ['quiet', 'beachfront']],
  'tms-hotel-da-nang': ['beach', 'hotel', 'value', ['couples', 'solo'], ['pool', 'beachfront']],
  'wyndham-soleil-da-nang': ['beach', 'hotel', 'value', ['couples'], ['beachfront']],
};
