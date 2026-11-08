import { useRef, useState } from 'react';
import { shareUrl } from '../lib/share';
import { parseScheduleJson, serializeSchedule } from '../lib/storage';

interface Props {
  selected: string[];
  /** entries that exist in the current program */
  visibleCount: number;
  onReplace: (ids: string[]) => void;
  onClear: () => void;
  onClose: () => void;
}

export function SettingsMenu({ selected, visibleCount, onReplace, onClear, onClose }: Props) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const json = () => serializeSchedule(selected);

  const copyText = async (t: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(t);
      setMsg(okMsg);
    } catch {
      setText(t);
      setMsg('コピーできないため下の欄に表示しました。手動でコピーしてください');
    }
  };

  const shareLink = async () => {
    const url = shareUrl(selected);
    if (navigator.share) {
      try {
        await navigator.share({ title: '宇科連70 マイスケジュール', url });
        return;
      } catch {
        /* cancelled: fall back to copy */
      }
    }
    await copyText(url, 'リンクをコピーしました。スマホのブラウザで開くと読み込めます');
  };

  const download = () => {
    const blob = new Blob([json()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ukaren70-schedule.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importText = (t: string) => {
    const parsed = parseScheduleJson(t);
    if (!parsed) {
      setMsg('読み込めませんでした。{"selected":[...]} 形式のJSONを貼り付けてください');
      return;
    }
    onReplace(parsed.selected);
    setMsg(`${parsed.selected.length}件を読み込みました`);
    setText('');
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    importText(await f.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  const clear = () => {
    if (selected.length === 0 || window.confirm(`選択中の${selected.length}件をすべて解除します。よろしいですか？`)) {
      onClear();
      setMsg('全選択をクリアしました');
    }
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <h2 id="settings-title" className="settings-title">
            設定
          </h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>
        <div className="sheet-body settings">
          <p className="notice">
            選択内容はこのブラウザ内（localStorage）にだけ保存され、サーバーには送られません。
            別の端末やブラウザには自動では引き継がれないため、<strong>当日使う端末で追加する</strong>のが確実です。
            パソコンで作った場合は下の「リンクをコピー」でスマホへ送ってください。
          </p>
          <section>
            <h3>別の端末へ送る</h3>
            <p className="hint">選択中 {visibleCount}件</p>
            <div className="row">
              <button type="button" className="btn" onClick={shareLink} disabled={selected.length === 0}>
                🔗 リンクをコピー / 共有
              </button>
            </div>
            <p className="hint">リンクをスマホで開くと、含まれる選択を読み込むか確認されます。</p>
          </section>
          <section>
            <h3>JSONを書き出し</h3>
            <div className="row">
              <button type="button" className="btn" onClick={download}>
                ファイルを保存
              </button>
              <button type="button" className="btn" onClick={() => copyText(json(), 'クリップボードにコピーしました')}>
                クリップボードにコピー
              </button>
            </div>
          </section>
          <section>
            <h3>JSONを読み込み</h3>
            <p className="hint">読み込むと現在の選択は置き換えられます。</p>
            <div className="row">
              <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
                ファイルを選択
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <textarea
              className="json-area"
              rows={4}
              placeholder='{"selected":["10A0900", ...]}'
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="button" className="btn" disabled={!text.trim()} onClick={() => importText(text)}>
              貼り付けた内容を読み込む
            </button>
          </section>
          <section>
            <h3>全選択をクリア</h3>
            <button type="button" className="btn btn-danger" onClick={clear}>
              すべて解除
            </button>
          </section>
          {msg && <p className="settings-msg">{msg}</p>}
          <section className="about">
            <h3>このアプリについて（v{__APP_VERSION__}）</h3>
            <p className="hint">
              このアプリは個人が作成した非公式ツールで、宇科連（宇宙科学技術連合講演会）および主催者とは関係ありません。
              プログラムは公開情報をもとに作成しており、変更が反映されていない場合があります。講演ごとの時刻はセッション時間を
              講演数で等分した目安です。最新情報は
              <a href="https://smartconf.jp/content/sstc70" target="_blank" rel="noreferrer">
                公式サイト
              </a>
              をご確認ください。
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
