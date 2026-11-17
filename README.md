# 法條通 LawGo

以深靛藍與金色打造的法律學習 PWA。
手機優先，桌面以 480px 寬度呈現。
第一門課使用隨附版本的中華民國專利法，
提供五種互動題型、皇冠路徑、間隔複習與條文書房。
所有使用者介面均為臺灣繁體中文，無須帳號或後端。

## 開發與檢查

使用 Node.js 22.12 以上版本及 npm：

```sh
npm install
npm run dev
```

依終端顯示的 localhost 網址開啟，預設為 `http://localhost:5173`。

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 啟動 Vite 開發伺服器 |
| `npm test` | 執行 Vitest、Testing Library 與驗證器測試 |
| `npm run test:watch` | 持續執行測試 |
| `npm run typecheck` | 嚴格檢查應用程式與 TypeScript 測試檔 |
| `npm run format` | 以 Prettier、100 字元行寬格式化程式碼 |
| `npm run validate` | 驗證所有課程與每課配額 |
| `npm run build` | TypeScript 檢查並產生 `dist/` 與離線快取 |
| `npm run preview` | 預覽 production build |

單獨驗證指定題庫：

```sh
npm run validate -- --file content/fixtures/sample-questions.json
npm run validate -- --file content/courses/patent/questions/u01.json
```

單檔模式檢查所有題目欄位、引用、判分資料與重複 id，
略過「整課至少 8 題、3 種題型」配額，方便驗證五題範例。
完整模式跨檔檢查 id，並逐課列出題數、題型與錯誤。
任何錯誤均以 exit code 1 結束。

題庫正在加入時，完整驗證會回報尚未有題目的課程；
這是內容未完成的訊號，不會阻止 App 啟動。
不要為了通過驗證而放寬配額或修改官方條文。

## 玩法與進度

- 每課最多 10 題；皇冠 0、1、2–3 級分別使用難度 1–2、1–3、2–3。
- 沒做過的題目優先，其次是曾答錯的題目；同順位使用可重現的隨機抽題。
- 每回合 5 顆愛心。答錯扣心，錯題排到回合尾端，直到答對。
- 完成 +10 XP，全對再 +5 XP；一般課程增加 1 級皇冠，上限 3。
- 單元全課至少 1 皇冠才開放 15 題混合挑戰；複習與條文練習不增加皇冠。
- 盒子依**每回合第一次作答**更新。答對升一盒，答錯回盒子 1；同回合重做不再升盒。
- 盒子 0–5 的間隔為 0、1、2、4、7、15 個本地日曆日。
- 到期複習只取已解鎖課程，最多 10 題；錯題本列出盒子 1 的題目。
- 條文熟練度以所有引用該條的題目平均盒子計算，未做題目算 0。
  平均為 0 顯示「未練」，達 4 顯示「熟練」，其餘顯示「學習中」。
- 期限挑戰只使用 `deadline` 題目，倒數 60 秒，記錄最高答對數。
  題庫用完會循環，本模式不計 XP 與皇冠，讀解說時倒數持續。
- 每日目標預設 20 XP，可選 10、20、30、50；以裝置本地日期判斷。
  已達標的日期會保留；今日未達標前仍顯示延續自昨日的連勝。

資料存在 `localStorage` 的 `lawgo:v1`，含 `schemaVersion: 1`。
「我的」可匯出 JSON、驗證後確認匯入，或再次確認後重設全部課程進度。
儲存不可用時會顯示提示，請匯出備份。

## 內容與程式架構

```text
content/
  laws/<law>/articles.json       官方條文快照
  courses/<course>/course.json   課程、單元、課與法條對應
  courses/<course>/questions/    單元題庫陣列，檔名 _ 開頭不載入
  fixtures/sample-questions.json 五種題型範例
src/
  types/                        內容與進度型別
  content/                      課程載入與 0–10 題庫檔案情境測試
  engine/                       抽題、判分、皇冠／XP、SRS、熟練度等純函式
  store/                        版本驗證、時鐘注入與 localStorage 持久化
  hooks/                        一般回合與限時挑戰的狀態控制
  components/questions/         每種題型各自一個元件
  components/path/              學習路徑元件
  components/profile/           目標、備份、重設元件
  pages/                        學習、練習、結算、複習、條文、個人設定
scripts/validate-content.mjs     零額外依賴的 Node ESM 驗證器
```

內容透過 `import.meta.glob` 在建置時載入，
各題庫與條文拆成獨立資源，PWA 會一起預先快取。
新增 JSON 後請讓 Vite 重新載入，production 則須重新建置。

開發模式下，某課程完全沒有題庫檔案時會使用隨附範例，
並顯示「示範題庫」。範例保留原 id、lessonId 與引用。
只要有任何正式題庫檔案，就只使用現有題庫；缺題的課顯示準備中。
production 不會使用範例補題，零題庫時仍能瀏覽完整條文。
新法律的示範題可能沒有對應條文，正式上線前應備妥該課題庫。

## 新增一門法律課程

1. 建立 `content/laws/<law>/articles.json`，
   按 [DESIGN.md](DESIGN.md) 的格式填入官方來源、修正日期及條文。
   條號一律使用字串，例如 `"60-1"`，保留原文與章節資訊。
2. 建立 `content/courses/<course>/course.json`，使用全域唯一的課程 id，
   `lawFile` 指向相對於 `content/` 的條文 JSON 路徑。
   填入 units、lessons 與各課的 articles。
3. 在該課程的 `questions/` 加入 JSON 陣列，題型與欄位依設計文件。
   題目 id 為 `<lessonId>-qNN`；每課至少 8 題、3 種題型。
   `evidence.quote` 必須是所引條文的連續片段；比對時忽略空白。
   克漏字填回後也必須能在所引條文中找到。
4. 執行 `npm run validate`、`npm test`、`npm run typecheck` 與 `npm run build`。
5. 重新開啟 App，課程選單會自動出現，不需修改 React 路由或程式碼。

題庫課程目錄可與 course.id 不同，進度以 course.id 隔離。
未完成草稿請用 `_` 開頭檔名，以免進入載入及驗證流程。

## 建置、安裝與離線驗證

```sh
npm run build
npm run preview
```

PWA 的 service worker 只在 production build 註冊。
第一次連線開啟後等待快取完成，再切換離線並重新載入，
檢查課程、條文與練習皆可使用。
桌面／Android 可由支援的瀏覽器選單安裝；
iPhone 使用 Safari「分享 → 加入主畫面」。
需要 HTTPS 或 localhost，不能直接雙擊 `dist/index.html`。
字型使用系統備援，不依賴外部字型服務。

## 部署至 GitHub Pages

Vite 已設定 `base: './'`，路由使用 HashRouter，
例如 `https://<account>.github.io/<repo>/#/patent/path`。
因此子目錄部署與重新整理深層頁面不需要伺服器 rewrite。

在 GitHub 儲存庫的 Settings → Pages 選擇 GitHub Actions，
使用靜態網站工作流程執行：

```sh
npm ci
npm test
npm run validate
npm run build
```

再以 `actions/upload-pages-artifact` 上傳 **`dist/` 目錄**，
由 `actions/deploy-pages` 部署。
工作流程需設定 `pages: write`、`id-token: write` 權限
及 `github-pages` environment，依 GitHub Pages 的部署設定執行。
題庫尚未完成時應先補齊內容，讓完整驗證通過後再部署。
也可將 `dist/` 交給其他支援 HTTPS 的靜態網站主機。

本專案無自動推送、發佈或對外傳送學習紀錄的機制。
