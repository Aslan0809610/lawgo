# 法條通 LawGo — 設計文件

類 Duolingo 的法條學習工具。第一門課：**中華民國專利法**（民國111年5月4日修正版，全 168 條，含 60-1、97-1～97-4、157-1～157-4）。
之後要能加入其他法律（商標法、著作權法…），所以內容和程式分開，一門法律就是一個 course。

---

## 1. 載體

**手機優先的 PWA 網頁 App**（React + Vite + TypeScript），不需要後端。

| 考量 | 選擇 |
|---|---|
| 手機、電腦都能用，不用上架 | PWA，可「加入主畫面」，離線可用 |
| 免伺服器、免帳號 | 進度存在瀏覽器 localStorage，可匯出／匯入 JSON 備份 |
| 部署 | 靜態網站，GitHub Pages / Cloudflare Pages（用 HashRouter） |
| 之後上架 | 需要時再用 Capacitor 包成 iOS / Android App，程式不用重寫 |
| 多法律擴充 | 內容全部是 JSON，放 `content/`，新增法律＝新增一個資料夾 |

視覺：自己的風格（深靛藍＋金色，法律感），**不要模仿 Duolingo 的綠色和貓頭鷹**。吉祥物先用簡單的法槌圖示即可。

---

## 2. 玩法

### 2.1 學習路徑
- 一門課 → 多個**單元（Unit）** → 每單元 2～4 個**課（Lesson）**。單元大致照法條章節排（見 `content/courses/patent/course.json`）。
- 首頁是一條上下捲動、左右蛇行的路徑，每個節點是一課。狀態：鎖住／可玩／已完成（皇冠 1～3 級）。
- 解鎖規則：前一課皇冠 ≥ 1 就解鎖下一課；單元內所有課皇冠 ≥ 1 時，解鎖該單元的**單元挑戰**（從整個單元題庫混出 15 題）。
- 皇冠等級決定題目難度：0 級→難度 1–2；1 級→1–3；2 級以上→2–3。

### 2.2 一回合（Session）
- 每回合 10 題（題庫不夠就全部），優先抽「沒做過」和「答錯過」的題目。
- **愛心 5 顆**（每回合重新給滿，這是讀書工具，不做時間鎖）。答錯扣 1 顆，那題排到回合最後重做，直到答對。
- 愛心歸零 → 回合失敗，可以重來，不加皇冠。
- 每題作答後，下方滑出回饋面板：對（綠）／錯（紅）＋解說＋**條文卡**（可展開看原條文，答案所依據的句子高亮）。
- 完成回合：+10 XP；全對再 +5 XP；皇冠 +1（最多 3）。結算頁顯示 XP、正確率、用時。

### 2.3 題型（5 種）
| 題型 | 畫面 | 例子 |
|---|---|---|
| `true_false` 是非 | 一句敘述＋⭕／❌ 兩個大按鈕 | 「新型專利須經實體審查才能取得專利權。」❌ |
| `single_choice` 單選（含情境題） | 題幹＋4 個選項卡 | 「甲於 2026/3/1 在學術研討會發表其發明，最晚何時申請仍可主張寬限期？」 |
| `cloze` 克漏字 | 條文句子挖空，下方字詞塊點選填入 | 「發明專利權期限，自{申請日}起算{二十}年屆滿。」 |
| `match` 配對 | 左右兩欄各 4 項，點左再點右配對 | 發明／新型／設計 ↔ 20 年／10 年／15 年 |
| `order` 排序 | 打散的步驟，依序點選排好 | 申請 → 早期公開 → 申請實體審查 → 審定 → 公告 |

- 選項、配對、排序在畫面上都要隨機打亂。
- 配對題：配錯會閃紅，該題判定為「答錯」，但要讓使用者配完。

### 2.4 複習（間隔重複）
- 每題有 Leitner 盒子 0～5。第一次就答對 → 盒子 +1；答錯 → 回到盒子 1。
- 下次到期間隔（天）：`[0, 1, 2, 4, 7, 15]`，依盒子編號。
- 「複習」分頁：抽到期的題目（最多 10 題，只抽已解鎖的課），玩法和一般回合相同。
- 「錯題本」：列出目前在盒子 1 的題目，可點開看條文。

### 2.5 特別模式
- **期限大挑戰**：只抽 `tags` 含 `deadline` 的題目（專利法考試最愛考期間：12 個月優先權、3 年實審、20／10／15 年期限、寬限期 12／6 個月…），限時 60 秒，答越多越好，記錄最高分。

### 2.6 每日目標與連勝
- 每日目標 XP（預設 20，可選 10／20／30／50）。當天達標就算連勝一天（用本地日期）。
- 頂部列顯示：🔥 連勝天數、⭐ 總 XP、今日進度環。

### 2.7 條文庫
- 依章／節瀏覽全部條文，可搜尋（條號或關鍵字）。
- 每條顯示熟練度：用該條相關題目的平均盒子編號算（未練／學習中／熟練）。
- 點進條文可看全文，並「練習這一條」（抽該條相關題目）。

### 2.8 分頁
底部導覽：**學習**（路徑）／**複習**（複習＋錯題本＋期限大挑戰）／**條文**（條文庫）／**我的**（每日目標、統計、匯出／匯入／重設進度）。

---

## 3. 內容格式

```
content/
  laws/patent/articles.json        ← 官方條文（scripts/parse_law.py 由全國法規資料庫產生）
  laws/patent/source.html          ← 原始網頁備份
  courses/patent/course.json       ← 單元與課的結構
  courses/patent/questions/u01.json … u10.json   ← 題庫（每個單元一個檔）
  fixtures/sample-questions.json   ← 每種題型一題的範例（測試用）
```

### 3.1 articles.json
```jsonc
{ "law": "專利法", "pcode": "J0070007", "amended": "2022-05-04", "source": "...",
  "articles": [ { "no": "22", "label": "第 22 條", "chapter": "第 二 章 發明專利", "section": "第 一 節 專利要件",
                  "paragraphs": ["…", "…"], "text": "段落以 \n 連接" } ] }
```

### 3.2 course.json
```jsonc
{ "id": "patent", "title": "專利法", "lawFile": "laws/patent/articles.json",
  "units": [ { "id": "u01", "title": "…", "description": "…",
               "lessons": [ { "id": "u01-l1", "title": "…", "articles": ["1","2","3"] } ] } ] }
```

### 3.3 題目（questions/uXX.json 是題目陣列）
所有題目共用欄位：
```jsonc
{
  "id": "u02-l1-q03",            // 唯一；格式 <lessonId>-qNN
  "lessonId": "u02-l1",
  "type": "true_false | single_choice | cloze | match | order",
  "difficulty": 1,               // 1 記憶、2 理解、3 應用（情境）
  "tags": ["deadline"],          // 可用：deadline 期間、definition 定義、procedure 程序、comparison 比較、case 情境
  "prompt": "題幹",              // cloze 可寫「請填入正確詞語」
  "evidence": [ { "article": "22", "quote": "必須是該條 text 中一字不差的連續片段" } ],
  "explanation": "為什麼，1～3 句"
}
```
各題型的額外欄位：
| type | 欄位 |
|---|---|
| `true_false` | `"answer": true/false` |
| `single_choice` | `"options": [4 個字串], "answerIndex": 0-3` |
| `cloze` | `"text": "含 {{0}}、{{1}} 的句子", "blanks": ["答案0","答案1"], "distractors": ["干擾詞", …]`（1～3 個空格，2～4 個干擾詞）。把 blanks 填回 text 之後，必須是 evidence 中某條 text 的連續片段。 |
| `match` | `"pairs": [ {"left": "…", "right": "…"} ×4 ]`，左右都要短（≤ 16 字寬，英數字算半字） |
| `order` | `"items": ["步驟1", "步驟2", …]`（3～5 項，依正確順序） |

### 3.4 驗證規則（`npm run validate` 會檢查）
1. 每題 id 唯一、lessonId 存在於 course.json、欄位齊全、型別正確。
2. 每個 `evidence.quote` 去掉空白後，是該 `article` text（去空白）的子字串。→ 防止編造條文。
3. cloze：blanks 填回 text 後（去空白）是某個 evidence 條文的子字串；`{{n}}` 數量＝blanks 長度；distractors 不和 blanks 重複。
4. single_choice：4 個選項不重複，answerIndex 在範圍內。
5. match：剛好 4 組，left、right 各自不重複。order：3～5 項不重複。
6. 每課至少 8 題，且至少 3 種題型。

---

## 4. 程式架構

- `src/engine/`：純函式，全部要有單元測試 —— 回合抽題（session builder）、判分、愛心／重做佇列、皇冠與解鎖、XP、連勝、Leitner 複習排程、熟練度。
- `src/store/`：進度狀態＋localStorage 持久化（key `lawgo:v1`，含 schemaVersion，可匯出／匯入）。
- `src/components/questions/`：5 種題型元件，共同介面 `{ question, onAnswer(correct: boolean) }`。
- `src/pages/`：Path、Lesson、Result、Review、Articles、ArticleDetail、Profile、DeadlineChallenge。
- 內容用 `import.meta.glob` 在建置時載入 `content/courses/*/course.json` 與題庫；多門課自動出現。
- 測試：Vitest + Testing Library。

---

## 5. 分工

| 誰 | 做什麼 |
|---|---|
| Claude | 設計（本文件）、條文抓取與解析、課程結構、範例題、驗收與審題 |
| Codex | App 全部程式、內容驗證器、測試 |
| Gemini | 依條文產生 10 個單元的題庫 JSON |

---

## 6. 第二版：多門課＋判例關卡（2026-11-17 新增）

### 6.1 多門課
- 目前兩門課：`patent`（台灣專利法）、`us-patent`（美國專利法 35 U.S.C.，2024 年版）。
- 首頁頂部有**課程切換**（例如「🇹🇼 專利法｜🇺🇸 美國專利法」），記住上次選的課。每門課的皇冠、XP 等進度各自計算；連勝和每日目標是全站共用。
- `course.json` 新增選填欄位：
  - `language`：條文語言（`"zh"` 預設，或 `"en"`）。
  - `casesFile`：判例資料檔路徑，例如 `cases/us-patent/cases.json`。
- 美國法的題目：題幹、選項、解說用**繁體中文**，關鍵術語附英文，例如「非顯而易知性（non-obviousness）」。`evidence.quote` 和克漏字 `text` 用**英文原文**，字詞塊也是英文。

### 6.2 判例資料
```
content/cases/us-patent/cases.json   ← 官方判決全文抽出的 Syllabus（scripts/build_us_cases.py 產生）
content/cases/us-patent/briefs.json  ← 中文案例摘要（給人讀的）
content/cases/patent/cases.json      ← 台灣判決的節錄原文
content/cases/patent/briefs.json
```
- `cases.json` 和 `articles.json` **同一個格式**（`articles` 陣列，每筆用 `no` 當判例 id，例如 `"alice"`），多了 `kind: "cases"`、`year`、`citation`、`court`、`sourceUrl`。這樣搜尋、高亮、熟練度都能沿用。
- `briefs.json`：判例 id 對應中文摘要。
  ```jsonc
  { "alice": { "nameZh": "Alice 案", "facts": "…", "issue": "…", "holding": "…", "significance": "…",
               "relatedArticles": ["101"], "keyRule": "一句話的判決規則" } }
  ```

### 6.3 判例關卡的玩法
- 單元可加 `"kind": "cases"`，在路徑上用不同的樣式（法槌圖示＋「判例關卡」標籤）。
- 課可加 `"cases": ["alice", "mayo"]`（這課涵蓋哪幾個判例）；判例課的 `articles` 可以是空陣列。
- **案例速覽**：進入判例課時，先看本課每個判例的卡片（案名、年份、事實 → 爭點 → 判決 → 意義），左右滑或按「下一個」，最後按「開始挑戰」。可以略過。
- 題型沿用原本 5 種，判例題常見的出法：
  - 「預測判決」：單選題，給事實，問法院怎麼判（tag `holding`）。
  - 判決規則的是非題。
  - 判決原文的克漏字。
  - 「判例 ↔ 規則」配對題。
  - 「法院審查步驟」排序題，例如 Alice 兩步驟、Graham 因素。
- `evidence` 每筆是**條文或判例二選一**：`{ "article": "101", "quote": "…" }` 或 `{ "case": "alice", "quote": "…" }`。`quote` 一樣必須是原文中一字不差的片段（去空白後比對）。
- 回饋面板：判例證據顯示成**判例卡**（案名＋年份＋高亮原文＋中文摘要的「判決」一句），可以展開看全文。

### 6.4 判例庫
- 「條文」分頁在有判例的課程多一個切換：**條文｜判例**。判例清單依年份排序，可搜尋，顯示熟練度。
- 判例詳細頁：中文摘要（事實／爭點／判決／意義）、相關條文連結、原文、「練習這個判例」。
- 條文詳細頁：列出引用這條的相關判例（來自 briefs 的 `relatedArticles`）。

### 6.5 驗證規則補充
7. `evidence` 每筆剛好有 `article` 或 `case` 其中一個；`case` 必須存在於該課的 casesFile。
8. 判例課（lesson 有 `cases`）的每題至少要有一筆 `case` 證據。
9. `briefs.json` 每個判例都要有摘要，`relatedArticles` 必須存在於該課的條文。
10. 每課至少 8 題、至少 3 種題型（判例課同樣適用）。
