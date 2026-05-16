#!/bin/bash
# translate-kr.sh — Translate all missing /kr/ pages using Claude
# Usage: ./translate-kr.sh

CLAUDE=/Users/ryanyousefi/.vscode/extensions/anthropic.claude-code-2.1.128-darwin-arm64/resources/native-binary/claude
REPO=/Users/ryanyousefi/dananghotelguide
KR_DIR="$REPO/kr"
LOG="$REPO/translate-kr.log"
BASE_URL="https://www.dananghotelguide.com"

# Skip non-public files
SKIP_FILES="favicon-html-snippet.html site-preview.html"

PROMPT='You are translating an HTML page for dananghotelguide.com into Korean for Korean tourists visiting Da Nang, Vietnam.

TASK: Output a complete, valid HTML file that is the Korean version of the input HTML.

TRANSLATION RULES:
- Translate ALL visible text to natural, fluent Korean (합쇼체 formal polite)
- Translate: title tag content, meta description content, meta og:title content, meta og:description content, h1-h6, p, li, td, th, span, a text, button text, label, figcaption, blockquote, dt, dd, strong, em
- Translate img alt attributes and aria-label attributes
- Translate placeholder attributes
- Do NOT translate: hotel names (Hyatt, Marriott, Intercontinental, Melia, Furama, Pullman, Hilton, Novotel, Sheraton, Radisson, Naman, Premier Village, Muong Thanh, Mikazuki, TMS, Wyndham, Vinpearl, A La Carte, Azura, Brilliant, Fusion, Grand Mercure, Four Points, Tia Wellness, Silk Path, Arbora, Mandila)
- Do NOT translate place names: Da Nang, Hoi An, Ba Na Hills, My Khe, Non Nuoc, Son Tra, Han River, An Bang, Nha Trang, Phu Quoc, Hanoi, Ho Chi Minh City, Vietnam
- Do NOT translate: Booking.com, Agoda, Awin, affiliate link text parameters
- Keep ALL HTML tags, CSS classes, JS code, affiliate URLs, image src, data attributes IDENTICAL
- Write natural Korean for travelers, not literal word-for-word translation

SEO CHANGES (apply to <head>):
- Change <html lang="en"> to <html lang="ko">
- Update <link rel="canonical"> href to use /kr/ URL
- Remove existing <link rel="alternate"> tags and replace with:
  <link rel="alternate" hreflang="en" href="ENGLISH_URL">
  <link rel="alternate" hreflang="ko" href="KOREAN_URL">
  <link rel="alternate" hreflang="x-default" href="ENGLISH_URL">
- Change <meta property="og:locale" content="en_US"> to content="ko_KR"
- Change <meta property="og:url"> content to /kr/ URL
- Add <meta property="og:locale:alternate" content="en_US">

LINK FIXING (in href attributes only):
- href="filename.html" → href="/kr/filename.html"
- href="index.html" → href="/kr/"
- href="/filename.html" → href="/kr/filename.html"
- External http/https links: leave unchanged
- Affiliate links (booking.com, agoda, awin): leave unchanged
- Never produce /kr/kr/ in any URL

OUTPUT: Return ONLY the complete HTML file content, starting with <!DOCTYPE html> and ending with </html>. No explanations, no markdown fences.'

translate_file() {
    local filename="$1"
    local src="$REPO/$filename"
    local dest="$KR_DIR/$filename"

    # Skip if already exists
    if [ -f "$dest" ]; then
        echo "[SKIP] $filename (already exists)" | tee -a "$LOG"
        return 0
    fi

    # Check file exists
    if [ ! -f "$src" ]; then
        echo "[ERROR] Source not found: $filename" | tee -a "$LOG"
        return 1
    fi

    echo "[START] $filename" | tee -a "$LOG"

    # Get filename without extension for URL building
    local basename="${filename%.html}"
    local en_url="$BASE_URL/$filename"
    local kr_url="$BASE_URL/kr/$filename"

    # Translate using claude
    local full_prompt="$PROMPT

The English URL for this page is: $en_url
The Korean URL for this page is: $kr_url

Translate the following HTML:"

    local output
    output=$(cat "$src" | "$CLAUDE" --print --model claude-haiku-4-5-20251001 "$full_prompt" 2>>"$LOG")
    local exit_code=$?

    if [ $exit_code -ne 0 ] || [ -z "$output" ]; then
        echo "[ERROR] Translation failed for $filename (exit $exit_code)" | tee -a "$LOG"
        return 1
    fi

    # Strip any markdown fences if present
    output=$(echo "$output" | sed 's/^```html$//' | sed 's/^```$//')

    echo "$output" > "$dest"
    echo "[DONE] $filename → kr/$filename" | tee -a "$LOG"
    return 0
}

# Get list of files to process
mkdir -p "$KR_DIR"
echo "=== Translation run started at $(date) ===" > "$LOG"

success=0
failed=0
skipped=0

for htmlfile in "$REPO"/*.html; do
    filename=$(basename "$htmlfile")

    # Skip excluded files
    skip=0
    for skip_name in $SKIP_FILES; do
        if [ "$filename" = "$skip_name" ]; then
            skip=1
            break
        fi
    done
    [ $skip -eq 1 ] && continue

    # Skip if already in kr/
    if [ -f "$KR_DIR/$filename" ]; then
        skipped=$((skipped + 1))
        continue
    fi

    translate_file "$filename"
    if [ $? -eq 0 ]; then
        success=$((success + 1))
    else
        failed=$((failed + 1))
    fi

    # Small delay to avoid rate limiting
    sleep 1
done

echo "" | tee -a "$LOG"
echo "=== Translation complete ===" | tee -a "$LOG"
echo "Success: $success" | tee -a "$LOG"
echo "Failed: $failed" | tee -a "$LOG"
echo "Skipped (already existed): $skipped" | tee -a "$LOG"
