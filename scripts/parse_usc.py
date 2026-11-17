"""Parse 35 U.S.C. (govinfo USCODE annual edition HTML) into the LawGo articles.json format."""
import html
import json
import re
import sys

SOURCE_URL = "https://www.govinfo.gov/content/pkg/USCODE-2024-title35/html/USCODE-2024-title35.htm"


def clean(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", "", fragment)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse(source: str) -> list[dict]:
    doc = open(source, encoding="utf-8").read()
    token = re.compile(
        r'<h2 class="part-head">(?P<part>.*?)</h2>'
        r'|<h3 class="chapter-head">(?P<chapter>.*?)</h3>'
        r'|<h3 class="section-head">(?P<section>.*?)</h3>'
        r'|<p class="(?P<cls>statutory-body[^"]*)">(?P<body>.*?)</p>'
        r'|<p class="source-credit">',
        re.S,
    )
    part = chapter = None
    articles: list[dict] = []
    current = None
    for m in token.finditer(doc):
        if m.group("part"):
            part = clean(m.group("part"))
        elif m.group("chapter"):
            chapter = clean(m.group("chapter"))
        elif m.group("section"):
            head = clean(m.group("section"))
            hm = re.match(r"§\s*(\d+[A-Za-z]?(?:-\d+)?)\.\s*(.*)", head)
            if not hm:
                current = None
                continue
            current = {
                "no": hm.group(1),
                "label": f"35 U.S.C. § {hm.group(1)}",
                "title": hm.group(2).strip(),
                "chapter": part,
                "section": chapter,
                "paragraphs": [],
            }
            articles.append(current)
        elif m.group("cls") and current is not None:
            current["paragraphs"].append(clean(m.group("body")))
        elif current is not None and m.group(0).startswith("<p class=\"source-credit\""):
            current = None
    for a in articles:
        a["text"] = "\n".join(a["paragraphs"])
    return articles


def main() -> None:
    source, out = sys.argv[1], sys.argv[2]
    articles = parse(source)
    data = {
        "law": "美國專利法 35 U.S.C.",
        "pcode": "USC-35",
        "amended": "2024 edition",
        "amendedRoc": "United States Code, 2024 Edition",
        "source": SOURCE_URL,
        "language": "en",
        "articles": articles,
    }
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    empty = [a["no"] for a in articles if not a["text"]]
    print(len(articles), "sections; empty:", empty)


if __name__ == "__main__":
    main()
