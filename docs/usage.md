# Token 用量紀錄

重新計算（並把新的 Gemini 輸出收進帳本）：

```bash
python3 scripts/usage.py --gemini-dir <放 agy JSON 輸出的資料夾> --markdown
```

- **Claude**：讀 `~/.claude/projects/<本專案>/` 的對話紀錄，逐則回覆加總 `usage`（含子代理）。
- **Codex**：讀 `~/.codex/sessions/` 裡工作目錄是本專案的 session，取最後一筆累計用量。
- **Gemini（agy）**：`--output-format json` 的輸出有 `usage`，但檔案放在暫存區，重開機可能被清掉。所以腳本會把用量（不含內容）收進 [`usage/gemini-ledger.jsonl`](usage/gemini-ledger.jsonl)，以 `conversation_id` 去重。之後呼叫 agy 一律加 `--output-format json`，跑完執行上面的指令收帳。
- 「推理」是輸出的一部分，不另外加進合計。

## 2026-11-17（第一天：v1 台灣專利法 → v2 美國專利法＋判例關卡）

| 模型 | 次數 | 新輸入 | 快取讀取 | 輸出 | 其中推理 | 合計 |
| --- | --- | --- | --- | --- | --- | --- |
| Claude | 289 replies | 0.50M | 69.55M | 0.21M | — | 70.25M |
| Codex | 2 sessions | 0.18M | 6.11M | 0.12M | 19k | 6.40M |
| Gemini | 31 calls | 2.46M | 5.37M | 0.79M | 0.36M | 8.62M |
| **合計** |  | 3.14M | 81.02M | 1.12M |  | 85.28M |

**怎麼看**

- 合計的 95% 是快取讀取：每一輪回覆都重讀一次累積的對話。快取讀取的價格約是一般輸入的一成，所以實際成本主要看「新輸入」和「輸出」。
- 分工：Claude 負責設計、找資料、驗收和審題；Codex 寫 App（實際產出約 120k）；Gemini 出約 830 題、37 則判例摘要，並盲測 541 題（實際產出最多）。
- 沒算到的：agy 連線測試一次；以及被重跑覆蓋的 Gemini 輸出（例如 u09 第一版）。合計約數萬 token。
- 當天 Claude 方案用量：5 小時窗口用了 71%、每週額度用了 49%（Max 方案）。

**下次省 token 的做法**

- Claude 對話超過約 40 萬 token 就壓縮（提示詞在 [`prompts/compact-context.md`](prompts/compact-context.md)），或開新 session 接手，避免每輪都重讀整段歷史。
- 判決全文、長條文不要整段讀進 Claude 的對話：在瀏覽器裡用關鍵字先篩，只回傳需要的段落。
- 大量出題、盲測交給 Gemini；Claude 只看驗證器報錯和兩邊答案不一致的題目。
