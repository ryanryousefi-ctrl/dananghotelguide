#!/usr/bin/env python3
"""
SEO improvements: FAQ sections, ATF quick-answer banners, and internal links
for 10 Da Nang Hotel Guide pages.
"""

import re
import os

BASE = '/Users/ryanyousefi/dananghotelguide/'

def read_file(path):
    with open(path, 'rb') as f:
        return f.read().decode('utf-8', errors='replace')

def write_file(path, content):
    with open(path, 'wb') as f:
        f.write(content.encode('utf-8'))

def build_atf_html(sentence):
    return (
        '\n<div style="background:var(--ocean-pale,#EAF4F4);border-bottom:1px solid var(--sand-dark,#D9CDBB);padding:.9rem clamp(1.25rem,5vw,3rem);">'
        '\n<div style="max-width:1160px;margin:0 auto;">'
        '\n<p style="font-size:.9rem;color:var(--ink-soft,#3C3C38);line-height:1.6;margin:0;"><strong>Quick answer:</strong> '
        + sentence +
        '</p>\n</div>\n</div>'
    )

def build_faq_html(topic, questions):
    """Build full FAQ section HTML.
    questions: list of (question_text, answer_text) tuples
    """
    details_html = ''
    for q, a in questions:
        details_html += (
            '\n<details style="border-bottom:1px solid var(--sand-dark,#D9CDBB);">'
            '<summary style="font-size:.95rem;font-weight:600;color:var(--ink,#1A1A18);padding:1rem 0;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">'
            + q +
            '<span style="font-size:1.2rem;color:var(--ocean,#1B5C5C);flex-shrink:0;margin-left:1rem;">+</span>'
            '</summary>'
            '<p style="font-size:.9rem;color:var(--ink-soft,#3C3C38);line-height:1.8;padding:.5rem 0 1rem;max-width:65ch;">'
            + a +
            '</p></details>'
        )

    topic_title, topic_em = topic.split('::', 1) if '::' in topic else (topic, 'FAQ')

    return (
        '\n<section style="background:var(--sand,#F6F1E9);padding:clamp(2rem,5vw,3.5rem) clamp(1.25rem,5vw,3rem);border-top:1px solid var(--sand-dark,#D9CDBB);" id="faq">'
        '\n<div style="max-width:760px;margin:0 auto;">'
        '\n<p style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:var(--ocean,#1B5C5C);margin-bottom:.6rem;">Common Questions</p>'
        '\n<h2 style="font-family:\'Instrument Serif\',Georgia,serif;font-size:clamp(1.5rem,3vw,2.1rem);color:var(--ink,#1A1A18);line-height:1.1;letter-spacing:-.025em;margin-bottom:1.8rem;">'
        + topic_title +
        ': <em style="color:var(--ocean,#1B5C5C);font-style:italic">'
        + topic_em +
        '</em></h2>'
        '\n<div style="border-top:1px solid var(--sand-dark,#D9CDBB);">'
        + details_html +
        '\n</div>'
        '\n</div>'
        '\n</section>'
    )

# ---------------------------------------------------------------------------
# PAGE 1: da-nang-itinerary.html
# ---------------------------------------------------------------------------

def process_itinerary():
    path = BASE + 'da-nang-itinerary.html'
    content = read_file(path)
    changes = []

    # 1. ATF quick answer - insert after breadcrumb </nav>
    bc_pos = content.find('aria-label="Breadcrumb"')
    nav_end_pos = content.find('</nav>', bc_pos) + len('</nav>')
    atf = build_atf_html(
        "3-7 day Da Nang itinerary. This page includes a day-by-day breakdown for 3, 5, and 7 days, costs, and the essential day trips to Hoi An and Ba Na Hills."
    )
    content = content[:nav_end_pos] + atf + content[nav_end_pos:]
    changes.append("Added ATF quick answer")

    # 2. FAQ section - insert before <footer
    faq = build_faq_html(
        "Da Nang Itinerary::FAQ",
        [
            (
                "How many days do you need in Da Nang?",
                "3 days is the realistic minimum to cover My Khe Beach, Dragon Bridge, the Marble Mountains, and one half-day in Hoi An. 5 days allows you to add Ba Na Hills, Son Tra Peninsula, and a proper morning in Hoi An. 7 days is comfortable for a complete visit with no rushing - add Hue by train (1.5 hours), a cooking class in Hoi An, and full days on the beach."
            ),
            (
                "What is the best day trip from Da Nang?",
                "Hoi An is the undisputed best day trip from Da Nang - 30km south (40 minutes by Grab), UNESCO Ancient Town, exceptional food, and completely different in atmosphere. Leave by 7:30am to arrive before the crowds, explore until noon, and return by afternoon. Ba Na Hills is the second-best day trip - a full day, best on a weekday in low season."
            ),
            (
                "Is Da Nang worth visiting?",
                "Yes. Da Nang offers a genuinely rare combination - a good urban beach (My Khe, 20km), multiple 5-star resorts at Southeast Asian prices ($140-200/night for properties that would cost $350 in Phuket), easy day trips to two UNESCO World Heritage sites (Hoi An and Hue), and year-round direct flights from most Asian hubs. The main limitation is a modest nightlife scene compared to Bangkok or Bali."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (3 questions)")

    # 3. Internal links - add da-nang-vs-hoi-an and da-nang-budget-guide
    # da-nang-vs-hoi-an: inject near "Hoi An" mention in prose body
    # Find a good Hoi An mention in the day 3 section
    hoi_an_pos = content.find("Day 3 is Hoi An")
    if hoi_an_pos != -1:
        old = "Day 3 is Hoi An, which deserves its own entry entirely"
        new = 'Day 3 is <a href="da-nang-vs-hoi-an.html">Hoi An</a>, which deserves its own entry entirely'
        if old in content:
            content = content.replace(old, new, 1)
            changes.append("Added internal link to da-nang-vs-hoi-an.html")

    # da-nang-budget-guide: find budget/cost mention
    old2 = "Check the <a href=\"best-time-to-visit-da-nang.html\">full weather guide</a>"
    new2 = 'Check the <a href="best-time-to-visit-da-nang.html">full weather guide</a> or the <a href="da-nang-budget-guide.html">Da Nang budget guide</a>'
    if old2 in content:
        content = content.replace(old2, new2, 1)
        changes.append("Added internal link to da-nang-budget-guide.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 2: da-nang-transport-guide.html
# ---------------------------------------------------------------------------

def process_transport():
    path = BASE + 'da-nang-transport-guide.html'
    content = read_file(path)
    changes = []

    # 1. ATF quick answer
    bc_pos = content.find('aria-label="Breadcrumb"')
    nav_end_pos = content.find('</nav>', bc_pos) + len('</nav>')
    atf = build_atf_html(
        "Complete Da Nang transport guide: airport transfers, Grab, motorbike hire, buses, and the 40-minute taxi to Hoi An. All costs in USD and VND."
    )
    content = content[:nav_end_pos] + atf + content[nav_end_pos:]
    changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "Da Nang Transport::FAQ",
        [
            (
                "How do I get from Da Nang Airport to the city?",
                "The easiest option is Grab (Vietnam's Uber equivalent) - $2-4 to My Khe Beach, 10-15 minutes. Official taxis from the airport rank are reliable but 20-30% more expensive. Metered taxi to the hotel strip costs 80,000-120,000 VND ($3.20-4.80). There is no public bus that serves tourists efficiently. Pre-arranged hotel pickup is available at most hotels for $8-15."
            ),
            (
                "Can I take a taxi from Da Nang to Hoi An?",
                "Yes. Grab is the most reliable option: 220,000-320,000 VND ($8.80-12.80) one way, 40 minutes. Traditional metered taxis cost similar. Shared minivan services (100,000-150,000 VND) are available from tourist areas but departure times are inconsistent. Renting a motorbike for the full day gives the most flexibility: 120,000 VND/day plus fuel, but it's a 30km ride each way on a busy coastal road."
            ),
            (
                "Is it safe to ride a motorbike in Da Nang?",
                "Manageable with experience, not recommended for first-time Southeast Asia riders. Da Nang traffic is significantly lighter and better organised than Hanoi or Ho Chi Minh City, but the city roads are wide with fast-moving vehicles. The Son Tra Peninsula loop road is genuinely beautiful and light on traffic, making it the best motorbike route for less-experienced riders. Always use a helmet and have a Vietnamese phone number for emergencies."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (3 questions)")

    # 3. Internal links
    # da-nang-airport-guide: find airport mention
    old1 = "Da Nang International Airport (DAD) is 3km"
    new1 = '<a href="da-nang-airport-guide.html">Da Nang International Airport (DAD)</a> is 3km'
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal link to da-nang-airport-guide.html")

    # da-nang-vs-hoi-an: find Hoi An day-trip mention
    old2 = "See <a href=\"da-nang-itinerary.html#day3\">Day 3 of the itinerary guide</a> for the full logistics."
    new2 = 'See <a href="da-nang-itinerary.html#day3">Day 3 of the itinerary guide</a> or the <a href="da-nang-vs-hoi-an.html">Da Nang vs Hoi An comparison</a> for the full logistics.'
    if old2 in content:
        content = content.replace(old2, new2, 1)
        changes.append("Added internal link to da-nang-vs-hoi-an.html")

    # da-nang-budget-guide: find a costs mention
    old3 = "Route 1 goes to Hàn Market for 7,000 VND."
    new3 = 'Route 1 goes to Hàn Market for 7,000 VND. For a full cost breakdown, see the <a href="da-nang-budget-guide.html">Da Nang budget guide</a>.'
    if old3 in content:
        content = content.replace(old3, new3, 1)
        changes.append("Added internal link to da-nang-budget-guide.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 3: da-nang-digital-nomad-guide.html
# ---------------------------------------------------------------------------

def process_nomad():
    path = BASE + 'da-nang-digital-nomad-guide.html'
    content = read_file(path)
    changes = []

    # 1. ATF quick answer
    bc_pos = content.find('aria-label="Breadcrumb"')
    nav_end_pos = content.find('</nav>', bc_pos) + len('</nav>')
    atf = build_atf_html(
        "Da Nang digital nomad guide 2026: co-working spaces, internet speeds, monthly costs, visa options, and where to stay long-term. Based on real expat experience."
    )
    content = content[:nav_end_pos] + atf + content[nav_end_pos:]
    changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "Da Nang for Digital Nomads::FAQ",
        [
            (
                "Is Da Nang good for digital nomads?",
                "Yes - consistently ranked in the global top 10 for nomad quality of life. The combination of fast and reliable internet (100-300 Mbps fibre is standard), 20+ co-working spaces, low monthly costs ($700-1,200/month all-in for a comfortable setup), a large English-speaking expat community, year-round weather, and direct international flights makes it genuinely competitive with Bali, Chiang Mai, and Lisbon at a lower price point."
            ),
            (
                "How much does it cost to live in Da Nang as a digital nomad?",
                "Budget end: $700-900/month covers a studio apartment, local food, motorbike hire, and fast internet. Comfortable middle: $1,200-1,600/month adds a better apartment near the beach, eating out regularly at mid-range restaurants, and gym membership. High end: $2,000-3,000/month for a beachfront apartment or villa with a private pool, dining at international restaurants, and lifestyle costs matching mid-tier Southeast Asian expat living."
            ),
            (
                "What visa do I need for Da Nang as a nomad?",
                "Most Western passport holders can get a 90-day e-visa ($25, online application) which covers a single entry. This can be extended once for 90 more days at an immigration office. After that, a visa run (usually to Bangkok or Singapore) is required. Vietnam does not have a dedicated nomad visa as of 2026, but the e-visa allows legal working remotely on a tourist entry - enforcement of remote work on tourist visas is essentially zero. Long-term residency requires a business visa or sponsored employment."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (3 questions)")

    # 3. Internal links
    # living-in-da-nang-expat-guide: find expat community mention
    old1 = "join the <a href=\"https://www.facebook.com/groups/expatsindanangcity/\" target=\"_blank\" rel=\"noopener\">Expats in Da Nang City</a> Facebook group."
    new1 = 'join the <a href="https://www.facebook.com/groups/expatsindanangcity/" target="_blank" rel="noopener">Expats in Da Nang City</a> Facebook group. The <a href="living-in-da-nang-expat-guide.html">Da Nang expat guide</a> covers longer-term living in detail.'
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal link to living-in-da-nang-expat-guide.html")

    # da-nang-budget-guide: find cost of living mention
    old2 = "a cost of living that lets you do six months here for what a single month costs in London, Sydney, or New York."
    new2 = 'a <a href="da-nang-budget-guide.html">cost of living</a> that lets you do six months here for what a single month costs in London, Sydney, or New York.'
    if old2 in content:
        content = content.replace(old2, new2, 1)
        changes.append("Added internal link to da-nang-budget-guide.html")

    # da-nang-vs-hoi-an: find Hoi An mention
    old3 = "See the <a href=\"#visa\">visa section</a> for what applies to you."
    new3 = 'See the <a href="#visa">visa section</a> for what applies to you. Many nomads split time between Da Nang and <a href="da-nang-vs-hoi-an.html">Hoi An</a>, 40 minutes south.'
    if old3 in content:
        content = content.replace(old3, new3, 1)
        changes.append("Added internal link to da-nang-vs-hoi-an.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 4: dining.html
# ---------------------------------------------------------------------------

def process_dining():
    path = BASE + 'dining.html'
    content = read_file(path)
    changes = []

    # 1. ATF quick answer - insert after breadcrumb </nav>
    bc_pos = content.find('aria-label="Breadcrumb"')
    nav_end_pos = content.find('</nav>', bc_pos) + len('</nav>')
    atf = build_atf_html(
        "Da Nang dining guide: where to eat, best local dishes, restaurant areas, and prices. Written by a Da Nang resident."
    )
    content = content[:nav_end_pos] + atf + content[nav_end_pos:]
    changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "Da Nang Dining::FAQ",
        [
            (
                "What food is Da Nang famous for?",
                "Mi Quang (turmeric noodle with pork, shrimp, and herbs), banh mi (Da Nang's version uses a wider bread with more generous filling than Saigon-style), banh xeo (sizzling rice crepe with pork and bean sprouts), and fresh seafood grilled on the beachfront. The city also has a strong cafe culture and excellent banh trang cuon thit heo (rice paper rolls with pork belly)."
            ),
            (
                "Where is the best area to eat in Da Nang?",
                "An Thuong neighbourhood behind My Khe Beach has the highest concentration of quality restaurants per block - Korean BBQ, Vietnamese seafood, international options, and cafes all within walking distance. For local Vietnamese food at local prices, the streets around Han Market (Han Thuyen, Ong Ich Khiem) have excellent street-food options. The beachfront strip (Vo Nguyen Giap) has seafood restaurants with sea views."
            ),
            (
                "How much does food cost in Da Nang?",
                "Local Vietnamese: 40,000-80,000 VND ($1.60-3.20) for a full meal with drink. Tourist-area restaurants: 150,000-350,000 VND ($6-14) per person. Seafood restaurants: 300,000-800,000 VND ($12-32) per person depending on what you order. Hotel restaurants: 400,000-1,200,000 VND ($16-48) per person. The quality-to-price ratio at the local end is among the best in Southeast Asia."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (3 questions)")

    # 3. Internal links - inject into prose body
    # best-cafes-da-nang: find cafe mention
    old1 = "The city also has a strong cafe culture"
    new1 = 'The city also has a strong <a href="best-cafes-da-nang.html">cafe culture</a>'
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal link to best-cafes-da-nang.html")

    # da-nang-budget-guide: find price/budget mention in FAQ answer (post-insert)
    old2 = "The quality-to-price ratio at the local end is among the best in Southeast Asia."
    new2 = 'The quality-to-price ratio at the local end is among the best in Southeast Asia. See the full <a href="da-nang-budget-guide.html">Da Nang budget guide</a> for a complete cost breakdown.'
    if old2 in content:
        content = content.replace(old2, new2, 1)
        changes.append("Added internal link to da-nang-budget-guide.html")

    # da-nang-hoi-an-markets-guide: find market mention in body prose
    old3 = "the streets around Han Market (Han Thuyen, Ong Ich Khiem) have excellent street-food options."
    new3 = 'the streets around Han Market (Han Thuyen, Ong Ich Khiem) have excellent street-food options. For market shopping and street food across both cities, see the <a href="da-nang-hoi-an-markets-guide.html">Da Nang and Hoi An markets guide</a>.'
    if old3 in content:
        content = content.replace(old3, new3, 1)
        changes.append("Added internal link to da-nang-hoi-an-markets-guide.html")

    # things-to-do-in-da-nang and da-nang-first-time-visitors: find a natural mention in body
    # Look for something in the actual article body (not FAQ) about the broader city
    old4 = "The 2025 Guide lists 44 restaurants in Da Nang:"
    new4 = 'The 2025 Guide lists 44 restaurants in Da Nang (for activities beyond dining see <a href="things-to-do-in-da-nang.html">things to do in Da Nang</a>):'
    if old4 in content:
        content = content.replace(old4, new4, 1)
        changes.append("Added internal link to things-to-do-in-da-nang.html")

    old5 = "Da Nang entered the MICHELIN Guide universe in 2023,"
    new5 = 'Da Nang entered the MICHELIN Guide universe in 2023 - if you\'re planning your first visit, start with the <a href="da-nang-first-time-visitors.html">Da Nang first-time visitor guide</a>.'
    if old5 in content:
        content = content.replace(old5, new5, 1)
        changes.append("Added internal link to da-nang-first-time-visitors.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 5: da-nang-vs-phu-quoc.html
# ---------------------------------------------------------------------------

def process_vs_phu_quoc():
    path = BASE + 'da-nang-vs-phu-quoc.html'
    content = read_file(path)
    changes = []

    # 1. ATF quick answer - insert after breadcrumb </nav>
    bc_pos = content.find('aria-label="Breadcrumb"')
    nav_end_pos = content.find('</nav>', bc_pos) + len('</nav>')
    atf = build_atf_html(
        "Da Nang vs Phu Quoc: two of Vietnam's best beach destinations compared on beach quality, hotels, prices, and who each suits best."
    )
    content = content[:nav_end_pos] + atf + content[nav_end_pos:]
    changes.append("Added ATF quick answer")

    # 2. FAQ section - extract from existing FAQPage schema and render visibly
    # Schema already extracted:
    faq = build_faq_html(
        "Da Nang vs Phu Quoc::FAQ",
        [
            (
                "Is Da Nang or Phu Quoc better for beaches?",
                "Phu Quoc wins on raw beach quality - the western beaches (Long Beach, Sao Beach) have exceptional soft white sand and clear turquoise water. Da Nang's My Khe Beach is excellent by urban beach standards but doesn't match Phu Quoc's sand quality. However, Da Nang's beach has better infrastructure, more swimming options by month, and far more activity options nearby."
            ),
            (
                "Is Da Nang or Phu Quoc cheaper?",
                "Da Nang is generally cheaper. Phu Quoc's hotel market is dominated by large luxury resorts that have pushed up average accommodation costs. Food and transport are similarly priced in local restaurants, but Phu Quoc's tourism infrastructure is more resort-centric, meaning costs escalate faster if you're eating or doing activities through your hotel."
            ),
            (
                "Is Da Nang better than Phu Quoc for a first-time Vietnam visit?",
                "Da Nang, because it gives you the beach combined with a real Vietnamese city, proximity to two UNESCO World Heritage Sites (Hoi An and My Son), and a broader range of activities. Phu Quoc is more of a resort island - beautiful, but offering less immersion in Vietnamese culture and fewer activity options beyond the beach."
            ),
            (
                "Which has better weather - Da Nang or Phu Quoc?",
                "They have opposite monsoon seasons, which is the key planning factor. Da Nang is best February-August, with October-December being wet and rough. Phu Quoc is best November-April (dry season), with May-October being wet. If you're visiting Vietnam in November-January, Phu Quoc is the better beach choice. In March-September, Da Nang wins."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added visible FAQ section (4 questions extracted from FAQPage schema)")

    # 3. All required links already exist per earlier check - confirmed
    changes.append("Internal links: all required links already present in page")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 6: intercontinental-vs-hyatt-da-nang.html
# ---------------------------------------------------------------------------

def process_ic_vs_hyatt():
    path = BASE + 'intercontinental-vs-hyatt-da-nang.html'
    content = read_file(path)
    changes = []

    # 1. ATF quick answer
    bc_pos = content.find('aria-label="Breadcrumb"')
    nav_end_pos = content.find('</nav>', bc_pos) + len('</nav>')
    atf = build_atf_html(
        "InterContinental vs Hyatt Regency Danang: honest comparison of Da Nang's two most-reviewed luxury hotels on location, pools, dining, price, and value."
    )
    content = content[:nav_end_pos] + atf + content[nav_end_pos:]
    changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "InterContinental vs Hyatt Danang::FAQ",
        [
            (
                "Is InterContinental or Hyatt better in Da Nang?",
                "Depends entirely on what you want. The InterContinental is more spectacular - clifftop location, private bay, MICHELIN dining, funicular - but it's isolated from the city and nearly twice the price ($380+ vs $180+). The Hyatt Regency is on Non Nuoc Beach, more accessible, has a superior pool complex, and offers significantly better value. Most visitors who want a beach holiday are better served by the Hyatt; visitors who want the best available experience regardless of price should choose the InterContinental."
            ),
            (
                "Which hotel is better value - InterContinental or Hyatt Regency Danang?",
                "The Hyatt Regency at $180-250/night offers better value for most travellers. At that price point, you get direct Non Nuoc beachfront access, five pools, a full-service spa, multiple restaurants, and World of Hyatt loyalty benefits. The InterContinental at $380-900/night is justified only if the dramatic setting and ultra-luxury experience are your priority - it's not overpriced for what it delivers, but the Hyatt delivers more per dollar for beach-focused holidays."
            ),
            (
                "Can you visit InterContinental Danang for a day?",
                "Yes - the InterContinental offers day passes to its beach club and pool facilities, typically $50-80/person depending on credit towards food and drink. This is a popular option for guests staying at nearby hotels who want to experience the property without paying full room rates."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (3 questions)")

    # 3. Internal link: da-nang-hotel-prices-by-month
    # Find price range in the comparison table
    old1 = "<td>Price range</td>\n        <td>$250–$600 / night</td>\n        <td class=\"win\">$165–$380 / night</td>"
    new1 = '<td>Price range (<a href="da-nang-hotel-prices-by-month.html">varies by season</a>)</td>\n        <td>$250–$600 / night</td>\n        <td class="win">$165–$380 / night</td>'
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal link to da-nang-hotel-prices-by-month.html")
    else:
        # Try simpler search
        old1b = "$250–$600 / night"
        if old1b in content:
            # Find context
            pos = content.find(old1b)
            # Insert link nearby by adding after the table
            old1c = "<td>Price range</td>"
            new1c = '<td>Price range (<a href="da-nang-hotel-prices-by-month.html">varies by season</a>)</td>'
            if old1c in content:
                content = content.replace(old1c, new1c, 1)
                changes.append("Added internal link to da-nang-hotel-prices-by-month.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 7: hyatt-vs-marriott-da-nang.html
# ---------------------------------------------------------------------------

def process_hyatt_vs_marriott():
    path = BASE + 'hyatt-vs-marriott-da-nang.html'
    content = read_file(path)
    changes = []

    # 1. ATF: insert after <main> (no breadcrumb nav on this page)
    # Insert after the cmp-hero section closes / before cmp-body opens
    # Actually insert right after <main>
    old_main = '<main>\n\n<section class="cmp-hero">'
    new_main = ('<main>\n' +
                build_atf_html("Hyatt Regency vs Marriott Da Nang: comparing two of the best luxury beach resorts on Non Nuoc/My An Beach - pools, rooms, dining, beach, and which to book.") +
                '\n\n<section class="cmp-hero">')
    if old_main in content:
        content = content.replace(old_main, new_main, 1)
        changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "Hyatt vs Marriott Da Nang::FAQ",
        [
            (
                "Is Hyatt or Marriott better in Da Nang?",
                "Very close. Both sit on the same Non Nuoc/My An beach strip, operate to similar 5-star standards, and attract similar clientele. The Hyatt Regency has a slight edge on pool infrastructure (5 pools vs Marriott's 5) and is the more established property. The Marriott is marginally newer and has slightly more spacious common areas. Loyalty programme preference (World of Hyatt vs Marriott Bonvoy) is often the deciding factor."
            ),
            (
                "Which earns better points - Hyatt Regency or Marriott Da Nang?",
                "Depends on your programme. Marriott Bonvoy is a larger programme with more redemption options globally, but World of Hyatt points typically have a higher per-point value. Both properties earn and redeem at standard rates for their respective programmes. The Hyatt Regency is typically a Category 5-6 property; the Marriott is a Category 6-7."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (2 questions)")

    # 3. Internal link: sheraton-grand-da-nang
    # Add to the "More Comparisons" section
    old1 = '<a href="luxury-hotels-da-nang.html" class="cmp-link-btn">All Luxury Hotels</a>'
    new1 = ('<a href="luxury-hotels-da-nang.html" class="cmp-link-btn">All Luxury Hotels</a>\n'
            '      <a href="sheraton-grand-da-nang.html" class="cmp-link-btn">Sheraton Grand Danang</a>')
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal link to sheraton-grand-da-nang.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 8: melia-vs-radisson-blu-da-nang.html
# ---------------------------------------------------------------------------

def process_melia_vs_radisson():
    path = BASE + 'melia-vs-radisson-blu-da-nang.html'
    content = read_file(path)
    changes = []

    # 1. ATF: insert after <main>
    old_main = '<main>\n<section class="cmp-hero">'
    new_main = ('<main>\n' +
                build_atf_html("Melia Danang vs Radisson Blu Resort: comparing two popular 5-star Da Nang beach hotels on price, design, beach, pools, and who each suits.") +
                '\n<section class="cmp-hero">')
    if old_main in content:
        content = content.replace(old_main, new_main, 1)
        changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "Melia vs Radisson Blu Danang::FAQ",
        [
            (
                "Is Melia or Radisson Blu better in Da Nang?",
                "They serve slightly different niches. The Melia Danang is on My Khe Beach's central strip (An Thuong area), more design-forward, minimalist aesthetic, adults-skewing clientele. The Radisson Blu is further south on the Non Nuoc strip, larger footprint, longer beach access, slightly lower prices, more family-friendly. If design and location near An Thuong restaurants matter, Melia. If beach frontage and value matter, Radisson Blu."
            ),
            (
                "How much is Melia Danang vs Radisson Blu?",
                "Melia Danang typically ranges from $140-380/night depending on season. Radisson Blu Resort Danang from $130-350/night. Both are competitively priced for their category - roughly 20-30% less expensive than the Hyatt Regency or Sheraton Grand."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (2 questions)")

    # 3. Internal links: melia-da-nang.html, radisson-blu-da-nang.html
    # Add to the verdicts/comparisons links area
    old1 = '<a href="non-nuoc-beach-da-nang.html" class="cmp-link-btn">All Non Nuoc Hotels</a>'
    new1 = ('<a href="non-nuoc-beach-da-nang.html" class="cmp-link-btn">All Non Nuoc Hotels</a>\n'
            '    <a href="melia-da-nang.html" class="cmp-link-btn">Melia Danang Review</a>\n'
            '    <a href="radisson-blu-da-nang.html" class="cmp-link-btn">Radisson Blu Review</a>')
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal links to melia-da-nang.html and radisson-blu-da-nang.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 9: pullman-vs-sheraton-da-nang.html
# ---------------------------------------------------------------------------

def process_pullman_vs_sheraton():
    path = BASE + 'pullman-vs-sheraton-da-nang.html'
    content = read_file(path)
    changes = []

    # 1. ATF: insert after <main>
    old_main = '<main>\n<section class="cmp-hero">'
    new_main = ('<main>\n' +
                build_atf_html("Pullman Danang vs Sheraton Grand Danang: comparing two popular Da Nang luxury beach resorts on location, beach, pools, family amenities, and price.") +
                '\n<section class="cmp-hero">')
    if old_main in content:
        content = content.replace(old_main, new_main, 1)
        changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "Pullman vs Sheraton Grand Danang::FAQ",
        [
            (
                "Is Pullman or Sheraton Grand better in Da Nang?",
                "For families with children, Sheraton Grand wins clearly - 7 pools, waterslides, a dedicated kids' club. For couples and adults, Pullman is more central on My Khe and slightly more stylish. Sheraton Grand is larger and more expensive; Pullman is smaller and more manageable for shorter stays. If the choice is purely for beach access, both are excellent - Pullman sits on My Khe's busier northern section, Sheraton Grand is slightly further south."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (1 question)")

    # 3. Internal links: pullman-da-nang.html, sheraton-grand-da-nang.html
    old1 = '<a href="non-nuoc-beach-da-nang.html" class="cmp-link-btn">All Non Nuoc Hotels</a>'
    new1 = ('<a href="non-nuoc-beach-da-nang.html" class="cmp-link-btn">All Non Nuoc Hotels</a>\n'
            '    <a href="pullman-da-nang.html" class="cmp-link-btn">Pullman Danang Review</a>\n'
            '    <a href="sheraton-grand-da-nang.html" class="cmp-link-btn">Sheraton Grand Review</a>\n'
            '    <a href="family-hotels-da-nang.html" class="cmp-link-btn">Family Hotels Da Nang</a>')
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal links to pullman-da-nang.html, sheraton-grand-da-nang.html, family-hotels-da-nang.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# PAGE 10: furama-vs-pullman-da-nang.html
# ---------------------------------------------------------------------------

def process_furama_vs_pullman():
    path = BASE + 'furama-vs-pullman-da-nang.html'
    content = read_file(path)
    changes = []

    # 1. ATF: insert after <main>
    old_main = '<main>\n<section class="cmp-hero">'
    new_main = ('<main>\n' +
                build_atf_html("Furama Resort vs Pullman Danang: comparing two popular My Khe Beach hotels on garden size, pools, location, family value, and price.") +
                '\n<section class="cmp-hero">')
    if old_main in content:
        content = content.replace(old_main, new_main, 1)
        changes.append("Added ATF quick answer")

    # 2. FAQ section before <footer
    faq = build_faq_html(
        "Furama vs Pullman Danang::FAQ",
        [
            (
                "Is Furama or Pullman better in Da Nang?",
                "Pullman has a stronger location on My Khe's northern strip near restaurants and nightlife, and more modern facilities. Furama is on a larger plot with beautiful tropical gardens, and is marginally more affordable - a good choice for families who want garden space and greenery over a slick modern aesthetic. Pullman is better for couples; Furama is better for families who want space."
            ),
        ]
    )
    footer_pos = content.find('<footer')
    content = content[:footer_pos] + faq + '\n' + content[footer_pos:]
    changes.append("Added FAQ section (1 question)")

    # 3. Internal links: furama-resort-da-nang.html, pullman-da-nang.html
    old1 = '<a href="my-khe-beach-da-nang.html" class="cmp-link-btn">My Khe Beach Guide</a>'
    new1 = ('<a href="my-khe-beach-da-nang.html" class="cmp-link-btn">My Khe Beach Guide</a>\n'
            '    <a href="furama-resort-da-nang.html" class="cmp-link-btn">Furama Resort Review</a>\n'
            '    <a href="pullman-da-nang.html" class="cmp-link-btn">Pullman Danang Review</a>\n'
            '    <a href="family-hotels-da-nang.html" class="cmp-link-btn">Family Hotels Da Nang</a>')
    if old1 in content:
        content = content.replace(old1, new1, 1)
        changes.append("Added internal links to furama-resort-da-nang.html, pullman-da-nang.html, family-hotels-da-nang.html")

    write_file(path, content)
    return changes

# ---------------------------------------------------------------------------
# Run all processors
# ---------------------------------------------------------------------------

processors = [
    ("da-nang-itinerary.html", process_itinerary),
    ("da-nang-transport-guide.html", process_transport),
    ("da-nang-digital-nomad-guide.html", process_nomad),
    ("dining.html", process_dining),
    ("da-nang-vs-phu-quoc.html", process_vs_phu_quoc),
    ("intercontinental-vs-hyatt-da-nang.html", process_ic_vs_hyatt),
    ("hyatt-vs-marriott-da-nang.html", process_hyatt_vs_marriott),
    ("melia-vs-radisson-blu-da-nang.html", process_melia_vs_radisson),
    ("pullman-vs-sheraton-da-nang.html", process_pullman_vs_sheraton),
    ("furama-vs-pullman-da-nang.html", process_furama_vs_pullman),
]

print("=" * 60)
print("SEO IMPROVEMENTS - Da Nang Hotel Guide")
print("=" * 60)

for filename, func in processors:
    print(f"\n[{filename}]")
    try:
        changes = func()
        for c in changes:
            print(f"  + {c}")
    except Exception as e:
        print(f"  ERROR: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("DONE")
print("=" * 60)
