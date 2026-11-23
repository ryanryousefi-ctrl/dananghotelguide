'use strict';
// Short table wording condensed from data/hotels/research2 (sources + dates there). NV = not verified.
const NV = 'Not verified';
module.exports = {
  NV,
  family: { // [multi-bedroom / family rooms, children's facilities]
    'a-la-carte-da-nang': ['One-bedroom apartments with kitchenettes', "Kids' club listed"], 'brilliant-hotel-da-nang': [NV, NV], 'four-points-sheraton-da-nang': [NV, 'Kids Zone (complimentary) and kids\' pool'],
    'furama-resort-da-nang': ['Villas, some with private pools (bedroom counts not verified)', "Kids' club"], 'grand-mercure-da-nang': ['Family suites (details not verified)', "Kids' pool (per listings)"],
    'hilton-da-nang': ['Family connecting rooms; one-bedroom suites', "Children's pool"], 'hyatt-regency-da-nang': [NV, 'Camp Hyatt kids\' club; kids\' pool with slide'],
    'intercontinental-da-nang': ['Two- and three-bedroom villas and residences', 'Planet Trekkers kids\' club (complimentary, ages 4-12)'], 'marriott-resort-da-nang': [NV, "Kids' club and children's pool (per listings)"],
    'melia-da-nang': ['Connecting Level Premium rooms', 'Kidsdom kids\' club; water slide'], 'melia-vinpearl-da-nang': ['Apartment-style family rooms (per listings)', "Kids' club; childcare service"],
    'muong-thanh-luxury-da-nang': [NV, NV], 'naman-retreat-da-nang': ['Suites of 1-3 bedrooms; 3-bedroom pool villas', "Kids' club; babysitting"], 'novotel-da-nang-han-river': ['Apartments of 1-3 bedrooms', "Kids' pool"],
    'premier-village-da-nang': ['Villas of up to 4 bedrooms, each with a private pool', "Kids' pool and game room (per listings)"], 'pullman-da-nang': ['Two-bedroom family suite; family connecting rooms', "Cwing kids' club"],
    'radisson-blu-da-nang': [NV, "Kids' club (per listings)"], 'sheraton-grand-da-nang': ['Suites (bedroom counts not verified)', "Kids' club; water-play area"], 'tia-wellness-resort-da-nang': ['Two- and three-bedroom pool villas', 'Kids Wellness Club'],
    'tms-hotel-da-nang': [NV, "Children's club; children's pool"], 'wyndham-soleil-da-nang': ['Three-bedroom duplexes and one-bedroom family suites (per listings)', "Kids' club; children's pool"],
  },
  lounge: {
    'grand-mercure-da-nang': 'Privilege Lounge; high-floor Deluxe rooms include access (per listings)', 'hilton-da-nang': 'Executive Lounge, 27th floor (breakfast inclusion not confirmed)', 'hyatt-regency-da-nang': 'Club lounge: breakfast, all-day drinks, evening drinks (per listings)',
    'intercontinental-da-nang': 'Club lounge: breakfast, afternoon tea, evening cocktails', 'melia-da-nang': 'The Level: private check-in, afternoon tea, evening drinks', 'melia-vinpearl-da-nang': 'Executive lounge (per Trip.com)',
    'novotel-da-nang-han-river': 'Premier Lounge, 29th floor: breakfast, afternoon tea, evening canapés', 'radisson-blu-da-nang': 'Executive Lounge, 20th floor', 'wyndham-soleil-da-nang': 'Listed by Trip.com only (not verified)',
    'pullman-da-nang': 'None found on official pages', 'naman-retreat-da-nang': 'None (B Lounge is a bar)', 'tia-wellness-resort-da-nang': 'None (villa-only resort)', 'furama-resort-da-nang': 'Business lounge only; no club lounge found',
  },
};
