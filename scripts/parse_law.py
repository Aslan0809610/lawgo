import re, json, sys, html
src, out = sys.argv[1], sys.argv[2]
t = open(src, encoding='utf-8').read()
body = t[t.find('<div class="law-reg-content">') if '<div class="law-reg-content">' in t else 0:]
tok = re.compile(r'<div class="h3 (char-\d)">\s*(.*?)</div>|<a href="LawSingle\.aspx\?pcode=J0070007&flno=([\w-]+)" name="[^"]*">(.*?)</a></div><div class="col-data"><div class="law-article">(.*?)</div>(?:<br\s*/?>)?</div>\s*</div></div>', re.S)
chapter = section = None; arts = []
for m in tok.finditer(body):
    if m.group(1):
        name = re.sub(r'\s+', ' ', html.unescape(m.group(2))).strip()
        if m.group(1) == 'char-2': chapter, section = name, None
        else: section = name
        continue
    lines = re.findall(r'<div class="(line-\d+)[^"]*">(.*?)</div>', m.group(5) + '</div>', re.S)
    paras = []
    for cls, txt in lines:
        txt = html.unescape(re.sub(r'<[^>]+>', '', txt)).strip()
        if cls == 'line-0000': paras.append([txt])
        else: (paras[-1] if paras else paras.append([]) or paras[-1]).append(txt)
    no = m.group(3)
    arts.append({"no": no, "label": re.sub(r'\s+',' ',m.group(4)).strip(), "chapter": chapter, "section": section,
                 "paragraphs": ["".join(p) for p in paras], "text": "\n".join("".join(p) for p in paras)})
json.dump({"law": "專利法", "pcode": "J0070007", "amended": "2022-05-04", "amendedRoc": "民國111年05月04日",
           "source": "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=J0070007", "articles": arts},
          open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(arts), arts[0]['label'], arts[-1]['label'])
print(sorted(set((a['chapter'], a['section']) for a in arts), key=str)[:40])
