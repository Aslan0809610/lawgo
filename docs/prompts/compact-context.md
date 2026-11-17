# 壓縮上下文提示詞

用法：在 Claude Code 輸入 `/compact`，後面貼上「提示詞」整段。
也可以在開新 session 時貼上，請 Claude 先讀 `DESIGN.md`、`docs/usage.md` 和 `git log --oneline -15` 再接手。

---

## 提示詞

```text
把目前的對話壓縮成「接手摘要」，給之後的自己看。用繁體中文，條列，精簡但不可遺漏決策與數字。只保留下列內容，其餘一律刪掉：

1. 專案目標與現況（一段）
   - 專案：法條通 LawGo，類 Duolingo 的法條學習 PWA。路徑 /Users/aslan/Projects/專利法小遊戲，repo github.com/Aslan0809610/lawgo，網站 https://aslan0809610.github.io/lawgo/（push main 會自動跑 validate→test→build→部署）。
   - 每門課程的單元數、課數、題數、判例數，以及最後一次 commit hash。

2. 已定案的決策（只寫結論和一句理由，不要寫討論過程）
   - 載體、技術棧、內容格式（DESIGN.md §3、§6）、分工（Claude 設計和驗收；Codex 寫程式；Gemini 用 agy 出題和盲測）。
   - 使用者已回答的選擇（例如公開 repo、判例範圍、美國法採「中文題目＋英文條文」）。

3. 品質保證流程（之後還要照做）
   - 驗證器規則：evidence.quote 要和原文逐字比對；cloze 填回後必須是原文的連續片段；match 每格 ≤16 字寬。
   - 盲測：另開一個 Gemini（argon-high）不看答案重答是非和單選題，只人工審答案不一致或被標記問題的題目。
   - 各課程盲測的一致率，以及修正過哪些題目（題目 id 加一句原因）。

4. 資料來源與限制（避免重踩坑）
   - 台灣條文來自全國法規資料庫；美國條文來自 govinfo USCODE-2024 HTML；美國判例來自 LOC、govinfo USREPORTS、supremecourt.gov 的 PDF Syllabus（scripts/build_us_cases.py）。
   - 司法院裁判書系統：curl 會被擋（bot-defense），不要繞過；只能在瀏覽器裡用頁內 fetch 抓節錄。外部腳本注入曾被安全機制拒絕，不要再試。lawplayer.com 宣告保留 AI 文字探勘權利，不要使用。
   - agy：stdin 不會讀；長輸出可能自我修正而夾雜「Wait…」，要重跑；必須加 --output-format json，用量才記得到。
   - Codex 沙箱沒有網路、不能寫 .git：npm install 和 commit 由 Claude 做。

5. 未完成與下一步
   - 還沒做或沒驗證的項目，每項一行，寫明驗收方式。
   - 使用者提過、但還沒排進來的需求。

6. 重要檔案索引（路徑加一句用途，最多 15 行）

不要保留：工具呼叫的原始輸出、整段條文或判決原文、題目全文、除錯過程、已經解決的錯誤訊息、寒暄。摘要控制在 1,500 字以內。
```

---

## 什麼時候用

- `docs/usage.md` 的腳本或 `/context` 顯示對話超過約 40 萬 token。
- 一個大段落做完（例如部署完、盲測完）、準備換下一個主題之前。
- 要讓另一個 session 或另一台機器接手時：把壓縮後的摘要存成 `docs/handoff-YYYY-MM-DD.md`。
