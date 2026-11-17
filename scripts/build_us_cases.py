"""Build content/cases/us-patent/cases.json from official U.S. Reports PDFs.

Usage: python3 scripts/build_us_cases.py <pdf_cache_dir>
Downloads missing PDFs listed in content/cases/us-patent/sources.tsv, extracts the
Syllabus with pdftotext, cleans running heads, hyphenation and dropped fi/fl ligatures.
"""
import csv
import json
import re
import subprocess
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "content/cases/us-patent/sources.tsv"
OUT = ROOT / "content/cases/us-patent/cases.json"
WORDS = {w.strip().lower() for w in open("/usr/share/dict/words", encoding="utf-8")}
# Ligature losses that produce real-but-wrong words, fixed explicitly.
EXPLICIT = {"fled": "filed", "fle": "file", "fles": "files", "fling": "filing", "fnd": "find",
            "fnds": "finds", "fnding": "finding", "fndings": "findings", "frst": "first",
            "fve": "five", "fx": "fix", "fts": "fits", "sanof": "sanofi",
            "granfnanciera": "granfinanciera", "factfnder": "factfinder"}
END = re.compile(r"argued the cause|NOTICE: This opinion is subject to formal revision|\nOpinion of (the Court|[A-Z]+, J\.)\n")
RUNNING_HEAD = re.compile(
    r"^(Page Proof Pending Publication|OCTOBER TERM, \d{4}\.?|Syllabus\.?|Cite as: .*|\d+ U\. ?S\.?.*|\d{1,4}|Opinion of the Court)$"
)


def download(url: str, path: Path) -> None:
    if path.exists() and path.stat().st_size > 50000:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    path.write_bytes(urllib.request.urlopen(req, timeout=60).read())


def known_inflection(word: str) -> bool:
    for suffix, repl in (("ies", "y"), ("es", ""), ("s", ""), ("ed", ""), ("ed", "e"), ("ing", ""),
                         ("ing", "e"), ("ly", ""), ("er", ""), ("ers", "")):
        if word.endswith(suffix) and word[: -len(suffix)] + repl in WORDS:
            return True
    return False


def fix_word(word: str) -> str:
    lower = word.lower()
    if lower in EXPLICIT:
        fixed = EXPLICIT[lower]
        return fixed.capitalize() if word[0].isupper() else fixed
    if "f" not in lower or lower in WORDS or known_inflection(lower):
        return word
    for lig in ("fi", "fl", "ffi", "ffl"):
        for i, ch in enumerate(lower):
            if ch != "f":
                continue
            cand = lower[:i] + lig + lower[i + 1:]
            if cand in WORDS or known_inflection(cand):
                fixed = word[:i] + lig + word[i + 1:]
                return fixed
    return word


def clean_syllabus(text: str, caption_tokens: set[str]) -> list[str]:
    text = unicodedata.normalize("NFKC", text)
    docket = re.search(r"Argued[^\n]{0,60}?Decided[^\n]*\n", text)
    start = docket.end() - len("Syllabus") if docket else text.find("Syllabus")
    held = text.find("Held", start)
    end_match = END.search(text, held if held > 0 else start)
    if start < 0 or not end_match:
        raise ValueError("syllabus boundaries not found")
    para_start = text.rfind("\n\n", start, end_match.start())
    body = text[start + len("Syllabus"):para_start if end_match.group(0).startswith("argued") else end_match.start()]
    lines = []
    for raw in body.split("\n"):
        line = raw.strip()
        if RUNNING_HEAD.match(line):
            continue
        letters = [c for c in line if c.isalpha()]
        if letters and sum(c.isupper() for c in letters) / len(letters) > 0.8 and " v. " in line:
            continue
        lines.append(line)
    joined = "\n".join(lines)
    joined = re.sub(r"(\w)-\n(\w)", r"\1\2", joined)
    joined = re.sub(r"(\w)–\n(\w)", r"\1–\2", joined)
    joined = re.sub(r"\*Together with.*?(same court|Circuit)\.", "", joined, flags=re.S)
    paragraphs = [re.sub(r"\s*\n\s*", " ", p).strip() for p in re.split(r"\n\s*\n", joined)]
    paragraphs = [re.sub(r"[A-Za-z]+", lambda m: fix_word(m.group(0)), p) for p in paragraphs if p]
    return paragraphs


def main() -> None:
    cache = Path(sys.argv[1])
    cache.mkdir(parents=True, exist_ok=True)
    cases = []
    for row in csv.DictReader(open(SOURCES, encoding="utf-8"), delimiter="\t"):
        pdf = cache / f"{row['id']}.pdf"
        download(row["url"], pdf)
        text = subprocess.run(["pdftotext", str(pdf), "-"], capture_output=True, text=True).stdout
        paragraphs = clean_syllabus(text, set())
        cases.append({
            "no": row["id"],
            "label": f"{row['name']}, {row['cite']} ({row['year']})",
            "title": row["name"],
            "year": int(row["year"]),
            "citation": row["cite"],
            "court": "Supreme Court of the United States",
            "chapter": "美國聯邦最高法院",
            "section": None,
            "sourceUrl": row["url"],
            "paragraphs": paragraphs,
            "text": "\n".join(paragraphs),
        })
        print(f"{row['id']:12} {len(paragraphs):3} paragraphs {sum(map(len, paragraphs)):6} chars")
    data = {
        "law": "美國專利判例（聯邦最高法院）",
        "pcode": "US-PATENT-CASES",
        "amended": "2026-11",
        "source": "U.S. Reports (Library of Congress / GovInfo / supremecourt.gov) — Syllabus",
        "language": "en",
        "kind": "cases",
        "articles": cases,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
