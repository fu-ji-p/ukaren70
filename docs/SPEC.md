# 宇科連70 タイムテーブルアプリ 仕様書

第70回宇宙科学技術連合講演会（2026年11月10日〜13日、宇都宮）の参加者が、
音楽フェスのタイムテーブルアプリのように「この時間はこの会場」を選び、当日はスマホで
計画を見ながら移動するための Web アプリ。

公開URL: https://fu-ji-p.github.io/ukaren70/
リポジトリ: https://github.com/fu-ji-p/ukaren70

## 1. ゴール

- 参加者がセッション単位で参加予定を選び、マイスケジュールとして閲覧できる。
- 選択はブラウザの localStorage に保存する。サーバー・ログイン不要。
- マイスケジュールを A4 縦で印刷できる。
- GitHub Pages で公開し、URL を知っていれば誰でも使える。

## 2. 技術スタック

- Vite + React + TypeScript。UI ライブラリなし、素の CSS（`src/styles/global.css`）。
- 状態管理は `useState` / `useReducer` と自作 hook（`src/hooks/`）のみ。
- データは `data/program.json` をビルド時に import する（fetch なし）。
- GitHub Actions（`.github/workflows/deploy.yml`）で `main` への push 時にテスト→ビルド→Pages デプロイ。
  `vite.config.ts` の `base` は環境変数 `VITE_BASE`（Actions がリポジトリ名から渡す）で決まる。
- テストは Vitest（`tests/`）。レイアウト計算・localStorage・マイスケジュール分析・検索を対象。

## 3. データ構造（data/program.json）

```jsonc
{
  "conference": { "name": "...", "dates": ["2026-11-10", "..."], "site": "...", "generatedFrom": [...], "generatedAt": "YYYY-MM-DD" },
  "venues": [ { "id": "A", "name": "A会場", "room": "中ホール", "building": "ライトキューブ宇都宮", "grid": true } ],
  "sessions": [
    {
      "id": "10A0900",          // 日(2桁) + 会場ID + 開始時刻(HHMM)。一意
      "date": "2026-11-10",
      "venue": "A",             // venues[].id
      "start": "09:00", "end": "10:00",
      "title": "【OS】...",
      "kind": "os",             // 後述
      "chair": "氏名 (所属)" | null,
      "talks": [ { "code": "2A01", "title": "...", "authors": "〇筆頭, 共著 (所属)" } ],
      "note": "任意の補足",       // 省略可
      "url": "https://..."     // 省略可（公式サイトの案内ページ）
    }
  ]
}
```

- `venues[].grid` が `false` の会場（企業展示 `EXH`、会場外 `OFF`）はグリッドの列にならず、
  各日の上部に「終日・会場外」のチップとして表示する。
- `kind` は `os` / `general` / `special` / `social` / `business` / `lunch` / `student` / `event` / `party` / `exhibition` の10種。
  配色はこの値で決まる（`global.css` の `--kind-*`）。
- 時刻は 5 分単位であること（グリッド内部解像度が 5 分）。15 分刻みでなくてもよい。

型定義は `src/types.ts`。

## 4. データ更新手順

1. 公式サイトから最新のプログラム PDF（演題一覧・日程表）を取得する。
2. `scripts/parse_sessions.py` を参考に PDF からセッション・講演を抽出し、第3章の構造で
   `data/program.json` を書き直す。スクリプトは pdfplumber の単語座標から
   「会場」「講演番号」「司会」「日付・時刻」の列を判定して組み立てる。
   ランチョン・ビジネス・懇親会など PDF にない行事は公式ページを見て手で追加する。
3. 次を確認する（`python3 -I` で簡単なチェックを書いてもよい）。
   - `id` が重複していない。
   - 同じ日・同じ会場でセッション時間が重なっていない。
   - `venue` が `venues[].id` に存在する。
   - `start` / `end` が 09:00〜20:30 の範囲、5 分単位。
4. `conference.generatedAt` を更新する。
5. `npm test && npm run build` を通し、`git commit` → `git push origin main`。
   数十秒後に GitHub Pages に反映される。

ユーザーの選択は `id` で保存されるため、`id` を変えると既存ユーザーの選択が消える。
時間変更だけなら `id` を据え置く。

## 5. 保存形式

- localStorage キー: `ukaren70.schedule.v1`
- 値: `{"selected": ["10A0900", ...], "updatedAt": "ISO 8601"}`
- 読み込み失敗・未保存時は空配列で起動する。プログラムに存在しない `id` は読み捨てる。
- 設定メニューの「JSON を書き出し/読み込み」は同じ形式のファイル（`ukaren70-schedule.json`）を扱う。

## 6. 画面

1. **タイムテーブル**: 日付タブ（4 日）→ 横軸が会場（A〜N ライトキューブ、O〜S TKP、1F/3F ホワイエ）、
   縦軸が 9:00〜20:30 の 15 分 = 1 行のグリッド。セッションは開始/終了に合わせた高さのカード。
   横スクロール、時刻列と建物/会場ヘッダは sticky。会場列は最小 90px、画面が広ければ均等に広がる。
   会期中（JST）は現在時刻の赤線を引き、その日のタブを初期表示にし、現在時刻付近へスクロールする。
   `?now=2026-11-10T10:30` を付けると現在時刻を偽装できる（動作確認用）。
2. **セッション詳細**: カードをタップするとボトムシート（スマホ）/右サイドパネル（900px 以上）に
   種別・日時・会場（部屋名と建物）・司会・備考・リンク・講演一覧（番号・題目・著者）と
   「マイスケジュールに追加/削除」ボタンを表示する。
3. **マイスケジュール**: 選んだセッションを日付ごとに時系列表示。同じ時間帯に 2 件以上あると
   「重複」バッジ（選択自体は許可）。建物をまたぐ移動（ライトキューブ⇄TKP 等）は直前に注記し、
   空き時間を示す。× で削除、タップで詳細。
4. **印刷ビュー**: 「印刷」ボタン（`window.print()`）または Cmd/Ctrl+P。A4 縦、日付ごとに改ページ、
   講演一覧も印刷する。画面には表示されない印刷専用レイアウトを常時描画しておく方式。
5. **検索/絞り込み**: キーワード（空白区切りで AND）でセッション名・講演題目・著者・司会・講演番号を検索。
   該当カードを強調し、他を薄くする。日付ごとの件数チップで日を移動できる。
6. **設定**: 全選択をクリア、JSON 書き出し（ファイル/クリップボード）、JSON 読み込み（ファイル/貼り付け）。

## 7. ディレクトリ

```
data/program.json       プログラムデータ
docs/SPEC.md            この文書
scripts/parse_sessions.py  PDF → JSON 変換の参考スクリプト
src/lib/                layout(グリッド計算) / time / storage / schedule / search
src/hooks/              useSchedule(localStorage) / useNow(JST 時計) / useElementWidth
src/components/         Timetable / SessionCard / SessionDetail / MySchedule / SearchBar / SettingsMenu / DayTabs
tests/                  Vitest
```
