#!/bin/bash
# translate-parallel.sh — Parallel translation using claude CLI
# Strips scripts/styles/comments before sending to reduce tokens (~30% savings)
# Safe to re-run anytime — skips already-translated files
# Auto-retries rate-limited files with backoff
# Auto-pushes to GitHub when all done

CLAUDE=/Users/ryanyousefi/.vscode/extensions/anthropic.claude-code-2.1.128-darwin-arm64/resources/native-binary/claude
REPO=/Users/ryanyousefi/dananghotelguide
KR_DIR="$REPO/kr"
LOG="$REPO/translate-parallel.log"
N_PARALLEL=2
MAX_RETRIES=3
GITHUB_TOKEN="REDACTED"

mkdir -p "$KR_DIR"
echo "=== Parallel translation started at $(date) ===" >> "$LOG"

SKIP_FILES=("favicon-html-snippet.html" "site-preview.html")

should_skip() {
    local f="$1"
    for skip in "${SKIP_FILES[@]}"; do
        [ "$f" = "$skip" ] && return 0
    done
    return 1
}

translate_one() {
    local filename="$1"
    local src="$REPO/$filename"
    local dest="$KR_DIR/$filename"
    local en_url="https://www.dananghotelguide.com/$filename"
    local kr_url="https://www.dananghotelguide.com/kr/$filename"

    local attempt=0
    while [ $attempt -lt $MAX_RETRIES ]; do
        attempt=$((attempt + 1))
        [ $attempt -gt 1 ] && echo "[RETRY $attempt] $filename" >> "$LOG" && sleep $((attempt * 15))

        echo "[START] $filename" >> "$LOG"

        local output
        output=$(python3 - "$src" "$en_url" "$kr_url" <<'PYEOF'
import sys, re, subprocess, os

src_path = sys.argv[1]
en_url = sys.argv[2]
kr_url = sys.argv[3]
claude = os.environ['CLAUDE']
log = os.environ['LOG']

with open(src_path) as f:
    html = f.read()

# Extract and replace blocks with placeholders
blocks = {}
counter = [0]

def save_block(m):
    key = f'__BLOCK_{counter[0]}__'
    blocks[key] = m.group(0)
    counter[0] += 1
    return key

lean = re.sub(r'<script[\s\S]*?</script>', save_block, html, flags=re.I)
lean = re.sub(r'<style[\s\S]*?</style>', save_block, lean, flags=re.I)
lean = re.sub(r'<!--[\s\S]*?-->', save_block, lean)

prompt = f"""You are translating this HTML page to Korean for Korean tourists visiting Da Nang Vietnam.

OUTPUT: Return ONLY the complete HTML file, starting with <!DOCTYPE html>. No markdown, no explanation.
The placeholders like __BLOCK_0__ __BLOCK_1__ etc must be kept EXACTLY as-is — do not translate or remove them.

RULES:
1. Change <html lang="en"> to <html lang="ko">
2. Translate ALL visible text to natural fluent Korean (합쇼체): title, meta description, meta og:title, meta og:description, h1-h6, p, li, td, th, span, a link text, button text, figcaption, blockquote, dt, dd, strong, em, img alt, aria-label, placeholder attributes
3. Do NOT translate: hotel names (Hyatt Marriott Intercontinental Melia Furama Pullman Hilton Novotel Sheraton Radisson Naman Premier Village Muong Thanh Mikazuki TMS Wyndham Vinpearl A La Carte Azura Brilliant Fusion Grand Mercure Four Points Tia Wellness Silk Path Arbora Mandila), place names (Da Nang Hoi An Ba Na Hills My Khe Non Nuoc Son Tra Han River An Bang Nha Trang Phu Quoc), Booking.com Agoda
4. Keep ALL CSS classes JS code affiliate URLs image src data attributes IDENTICAL
5. SEO changes in <head>:
   - Change canonical href to: {kr_url}
   - Remove existing alternate tags, add:
     <link rel="alternate" hreflang="en" href="{en_url}">
     <link rel="alternate" hreflang="ko" href="{kr_url}">
     <link rel="alternate" hreflang="x-default" href="{en_url}">
   - Set og:locale to ko_KR
   - Set og:url to: {kr_url}
   - Add: <meta property="og:locale:alternate" content="en_US">
6. Fix internal href links: filename.html → /kr/filename.html, index.html → /kr/, never produce /kr/kr/"""

result = subprocess.run(
    [claude, '--print', '--model', 'claude-haiku-4-5-20251001', prompt],
    input=lean,
    capture_output=True,
    text=True
)

with open(log, 'a') as lf:
    if result.stderr:
        lf.write(result.stderr + '\n')

out = result.stdout.strip()
if not out or 'usage limit' in out.lower() or not out.startswith('<!'):
    sys.exit(1)

# Strip markdown fences
out = re.sub(r'^```[a-z]*\n?', '', out)
out = re.sub(r'\n?```$', '', out)

# Re-inject original blocks
for key, val in blocks.items():
    out = out.replace(key, val)

print(out)
PYEOF
)

        local exit_code=$?
        if [ $exit_code -eq 0 ] && [ -n "$output" ]; then
            echo "$output" > "$dest"
            echo "[DONE] $filename" >> "$LOG"
            return 0
        fi
    done

    echo "[FAILED] $filename after $MAX_RETRIES attempts" >> "$LOG"
    return 1
}

export -f translate_one
export CLAUDE REPO KR_DIR LOG

# Build list of files to translate
files_to_translate=()
for htmlfile in "$REPO"/*.html; do
    filename=$(basename "$htmlfile")
    should_skip "$filename" && continue
    [ -f "$KR_DIR/$filename" ] && continue
    files_to_translate+=("$filename")
done

total=${#files_to_translate[@]}
echo "Files to translate: $total" | tee -a "$LOG"

if [ $total -eq 0 ]; then
    echo "Nothing to translate — all files already done." | tee -a "$LOG"
else
    # Run in parallel using a proper job pool
    pids=()
    for filename in "${files_to_translate[@]}"; do
        while [ ${#pids[@]} -ge $N_PARALLEL ]; do
            new_pids=()
            for pid in "${pids[@]}"; do
                if kill -0 "$pid" 2>/dev/null; then
                    new_pids+=("$pid")
                fi
            done
            pids=("${new_pids[@]}")
            [ ${#pids[@]} -ge $N_PARALLEL ] && sleep 5
        done

        translate_one "$filename" &
        pids+=($!)
    done

    wait
fi

echo "=== All done at $(date) ===" >> "$LOG"
done_count=$(ls "$KR_DIR"/*.html 2>/dev/null | wc -l | tr -d ' ')
failed_count=$(grep -c "FAILED" "$LOG" 2>/dev/null || echo 0)
echo "Total Korean HTML files: $done_count | Failed: $failed_count" | tee -a "$LOG"

# Auto-push to GitHub if we translated anything
if [ $total -gt 0 ] && [ $done_count -gt 0 ]; then
    echo "Pushing to GitHub..." | tee -a "$LOG"
    cd "$REPO"
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/ryanryousefi-ctrl/dananghotelguide.git"
    git add kr/
    git commit -m "Add/update Korean translations ($(date '+%Y-%m-%d'))" 2>/dev/null || echo "Nothing new to commit"
    git push origin main && echo "Pushed to GitHub." | tee -a "$LOG"
fi
