# What you do in the Trip.com dashboard

Never edit, shorten or re-type a generated link. Copy it exactly as shown (use the copy button). Do not click links repeatedly to "test reporting".

## Step 1: five representative links (Phase 2)

1. Open `data/tripcom/link-worksheet-sample.csv` (5 rows).
2. In the dashboard open **Affiliate Tools > Affiliate Links** (name may differ slightly) and, for each row, paste the value from column `paste_into_link_generator` and generate the link.
   - If the generator does not accept that URL (for example it rejects a date-less hotel URL), stop and write exactly what it said in `notes`. Do not work around it.
3. Paste the generated link, unchanged, into column `affiliate_url`. Fill `generated_on` (YYYY-MM-DD).
4. Open the generated link once in a normal browser window. Write the property or page you actually land on in `property_seen_on_trip_com` and set `opens_correct_property` to `yes` or `no`.
   - Row "Brilliant Hotel" must land on **Brilliant Hotel**, not Brilliant Majestic.
   - Row "Marriott" is the open question: note which listing (resort 993558 or villas 7362595) appears.
5. Tell me the result or run: `node scripts/tripcom/worksheet.js import --sample` then `node scripts/tripcom/link-profile.js derive`.

What I will check from those five: the real format (host, path, parameters, where the IDs are), whether dates appear, which domain was produced, and whether the destination is readable from the URL.

## Step 2: pilot links (six)

`data/tripcom/link-worksheet-pilot.csv` (Hyatt Regency, InterContinental, Brilliant, Furama, Four Points, Da Nang city list). Same procedure; import with `--pilot`. Only after the profile is approved.

## Step 3: remaining links (106 destinations in total)

`data/tripcom/link-worksheet.csv`. About 1.5-2 hours in the dashboard unless support offers bulk generation. Import, then `node scripts/tripcom/readiness.js`.

## Step 4: send the support questions (section 4 of ATTRIBUTION-VALIDATION.md)

From the registered email, to affiliation@trip.com, with the account ID. Paste their answers into `account-readiness.json` evidence fields.

## Step 5: during the pilot

- Check **Booking performance / Booking report** daily at first (T+1) and the **Commission report** on the 5th of each month.
- Record any genuine booking in `data/tripcom/pilot-evidence.json` (date, hotel, stay dates, amount). Never book through the pilot links yourself.
