"""Token usage report for this project across Claude Code, Codex and Gemini (agy).

Usage:
  python3 scripts/usage.py                         # report from all known sources
  python3 scripts/usage.py --gemini-dir <dir> ...  # also ingest agy JSON outputs into the ledger
  python3 scripts/usage.py --markdown              # print a Markdown table (for docs/usage.md)

Sources:
  Claude  ~/.claude/projects/<project-slug>/*.jsonl (+ subagents/), assistant `usage` per reply
  Codex   ~/.codex/sessions/**/*.jsonl whose session cwd is this project, last `total_token_usage`
  Gemini  agy `--output-format json` files carry `usage`; they live in temporary scratchpads,
          so they are copied (usage only, no content) into docs/usage/gemini-ledger.jsonl
"""

from __future__ import annotations

import argparse
import glob
import json
import os
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "docs/usage/gemini-ledger.jsonl"
HOME = Path.home()


def claude_slug(path: Path) -> str:
    # Claude Code names project dirs by replacing every non-alphanumeric char with "-".
    return "".join(c if c.isascii() and c.isalnum() else "-" for c in str(path))


def claude_usage() -> Counter:
    base = HOME / ".claude/projects" / claude_slug(ROOT)
    totals, seen = Counter(), set()
    for f in glob.glob(str(base / "**/*.jsonl"), recursive=True):
        for line in open(f, errors="ignore"):
            try:
                msg = json.loads(line).get("message")
            except (json.JSONDecodeError, AttributeError):
                continue
            if not isinstance(msg, dict) or msg.get("role") != "assistant" or msg.get("id") in seen:
                continue
            seen.add(msg.get("id"))
            usage = msg.get("usage") or {}
            totals["replies"] += 1
            totals["input"] += usage.get("input_tokens") or 0
            totals["cache_write"] += usage.get("cache_creation_input_tokens") or 0
            totals["cache_read"] += usage.get("cache_read_input_tokens") or 0
            totals["output"] += usage.get("output_tokens") or 0
    return totals


def codex_session(path: str) -> tuple[str | None, dict | None]:
    cwd, last = None, None
    for line in open(path, errors="ignore"):
        try:
            payload = json.loads(line).get("payload", {})
        except (json.JSONDecodeError, AttributeError):
            continue
        if not isinstance(payload, dict):
            continue
        cwd = cwd or payload.get("cwd")
        if payload.get("type") == "token_count" and payload.get("info"):
            last = payload["info"].get("total_token_usage")
    return cwd, last


def codex_usage() -> Counter:
    totals = Counter()
    for f in glob.glob(str(HOME / ".codex/sessions/**/*.jsonl"), recursive=True):
        cwd, last = codex_session(f)
        if not cwd or not last or not cwd.startswith(str(ROOT)):
            continue
        totals["sessions"] += 1
        totals["input"] += last.get("input_tokens", 0) - last.get("cached_input_tokens", 0)
        totals["cache_read"] += last.get("cached_input_tokens", 0)
        totals["output"] += last.get("output_tokens", 0)
        totals["reasoning"] += last.get("reasoning_output_tokens", 0)
    return totals


def read_ledger() -> dict:
    if not LEDGER.exists():
        return {}
    rows = (json.loads(line) for line in LEDGER.read_text().splitlines() if line.strip())
    return {row["key"]: row for row in rows}


def ingest_gemini(dirs: list[str]) -> int:
    ledger = read_ledger()
    added = 0
    for d in dirs:
        for f in glob.glob(os.path.join(d, "**/*.json"), recursive=True):
            try:
                data = json.load(open(f))
            except (json.JSONDecodeError, UnicodeDecodeError, OSError):
                continue
            if not isinstance(data, dict) or not isinstance(data.get("usage"), dict):
                continue
            key = data.get("conversation_id") or f
            if key in ledger:
                continue
            ledger[key] = {"key": key, "file": os.path.basename(f), "usage": data["usage"],
                           "seconds": data.get("duration_seconds")}
            added += 1
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    LEDGER.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in ledger.values()))
    return added


def gemini_usage() -> Counter:
    totals = Counter()
    for row in read_ledger().values():
        u = row["usage"]
        totals["calls"] += 1
        totals["input"] += u.get("input_tokens", 0)
        totals["cache_read"] += u.get("cache_read_tokens", 0)
        totals["output"] += u.get("output_tokens", 0)
        totals["reasoning"] += u.get("thinking_tokens", 0)
    return totals


def m(n: int) -> str:
    return f"{n / 1e6:.2f}M" if n >= 1e5 else f"{n / 1e3:.0f}k"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gemini-dir", action="append", default=[])
    ap.add_argument("--markdown", action="store_true")
    args = ap.parse_args()
    if args.gemini_dir:
        print(f"ingested {ingest_gemini(args.gemini_dir)} new Gemini calls into {LEDGER.relative_to(ROOT)}")

    c, x, g = claude_usage(), codex_usage(), gemini_usage()
    rows = [
        ("Claude", f"{c['replies']} replies", c["input"] + c["cache_write"], c["cache_read"], c["output"], 0),
        ("Codex", f"{x['sessions']} sessions", x["input"], x["cache_read"], x["output"], x["reasoning"]),
        ("Gemini", f"{g['calls']} calls", g["input"], g["cache_read"], g["output"], g["reasoning"]),
    ]
    header = ["模型", "次數", "新輸入", "快取讀取", "輸出", "其中推理", "合計"]
    lines = [header, ["---"] * len(header)] if args.markdown else [header]
    grand = Counter()
    for name, count, inp, cache, out, reason in rows:
        total = inp + cache + out  # reasoning tokens are already counted inside output
        grand.update({"inp": inp, "cache": cache, "out": out, "total": total})
        lines.append([name, count, m(inp), m(cache), m(out), m(reason) if reason else "—", m(total)])
    lines.append(["**合計**" if args.markdown else "TOTAL", "", m(grand["inp"]), m(grand["cache"]),
                  m(grand["out"]), "", m(grand["total"])])
    for line in lines:
        print("| " + " | ".join(line) + " |" if args.markdown else "  ".join(f"{v:>14}" for v in line))


if __name__ == "__main__":
    main()
