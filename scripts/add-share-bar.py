#!/usr/bin/env python3
"""Add social share bar to all pages missing it, and upgrade 4-button variants to 5-button."""
import os, re, glob

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SHARE_CSS = """
/* ── SHARE BAR ── */
.shr-bar{position:fixed;right:1.5rem;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:.45rem;z-index:95;background:#0D3535;border-radius:3rem;padding:.8rem .55rem;box-shadow:0 4px 24px rgba(0,0,0,.25),0 1px 4px rgba(0,0,0,.12)}
.shr-label{font-size:.55rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.35);font-family:'Satoshi',system-ui,sans-serif;writing-mode:vertical-lr;transform:rotate(180deg);margin-bottom:.15rem}
.shr-btn{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.07);color:rgba(255,255,255,.75);text-decoration:none;transition:background .15s,transform .15s,color .15s;flex-shrink:0}
.shr-btn:hover{background:#C8604A;color:#fff;transform:scale(1.1)}
.shr-btn svg{width:16px;height:16px;fill:currentColor}
@media(max-width:1200px){.shr-bar{right:1rem}}
@media(max-width:900px){.shr-bar{display:none}}
"""

SHARE_HTML = """<!-- SHARE BAR -->
<aside class="shr-bar" aria-label="Share this page">
  <span class="shr-label">Share</span>
  <a class="shr-btn" id="shr-x" href="#" target="_blank" rel="noopener noreferrer" aria-label="Share on X / Twitter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
  <a class="shr-btn" id="shr-fb" href="#" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
  <a class="shr-btn" id="shr-rd" href="#" target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg></a>
  <a class="shr-btn" id="shr-wa" href="#" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></a>
  <a class="shr-btn" id="shr-li" href="#" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
</aside>
<style>""" + SHARE_CSS + """</style>
<script>
(function(){
  var d=document,u=encodeURIComponent(location.href);
  var m=d.querySelector('meta[property="og:title"]');
  var t=encodeURIComponent(m?m.content:d.title);
  d.getElementById('shr-x').href='https://twitter.com/intent/tweet?url='+u+'&text='+t;
  d.getElementById('shr-fb').href='https://www.facebook.com/sharer/sharer.php?u='+u;
  d.getElementById('shr-rd').href='https://www.reddit.com/submit?url='+u+'&title='+t;
  d.getElementById('shr-wa').href='https://wa.me/?text='+t+'%20'+u;
  d.getElementById('shr-li').href='https://www.linkedin.com/shareArticle?mini=true&url='+u+'&title='+t;
})();
</script>"""

# Reddit button HTML to insert (for upgrading 4-button pages)
REDDIT_BTN = '  <a class="shr-btn" id="shr-rd" href="#" target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg></a>'

REDDIT_SCRIPT_LINE = "  d.getElementById('shr-rd').href='https://www.reddit.com/submit?url='+u+'&title='+t;"

# Skip utility/non-content pages
SKIP = {'favicon-html-snippet.html', 'site-preview.html', 'search.html'}

added = []
upgraded = []
skipped = []

html_files = sorted(glob.glob(os.path.join(REPO, '*.html')))

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname in SKIP:
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    has_reddit = 'shr-rd' in content or 'reddit' in content
    has_share = 'shr-wa' in content or 'whatsapp' in content

    if has_reddit:
        # Already has 5-button variant - skip
        continue
    elif has_share and not has_reddit:
        # Has 4-button variant - upgrade: add Reddit button + script line
        # Insert Reddit button after Facebook button
        fb_btn_pattern = r'(<a class="shr-btn" id="shr-fb"[^>]*>.*?</a>)'
        match = re.search(fb_btn_pattern, content, re.DOTALL)
        if match:
            content = content[:match.end()] + '\n' + REDDIT_BTN + content[match.end():]
            # Add Reddit script line after fb script line
            content = content.replace(
                "getElementById('shr-fb').href=",
                "getElementById('shr-fb').href="
            )
            # Insert reddit script after fb line
            content = re.sub(
                r"(d\.getElementById\('shr-fb'\)\.href=[^\n]+\n)",
                r"\1" + REDDIT_SCRIPT_LINE + "\n",
                content
            )
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            upgraded.append(fname)
    else:
        # Missing entirely - inject before </body>
        if '</body>' not in content:
            skipped.append(fname + ' (no </body>)')
            continue
        injection = '\n' + SHARE_HTML + '\n'
        content = content.replace('</body>', injection + '</body>', 1)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        added.append(fname)

print(f"Added share bar to {len(added)} pages")
print(f"Upgraded to 5-button on {len(upgraded)} pages")
print(f"Skipped: {skipped}")
print("\nAdded:", added[:10], '...' if len(added) > 10 else '')
print("Upgraded:", upgraded)
