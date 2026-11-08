import { useRef, useState } from 'react';
import { parseScheduleJson, serializeSchedule } from '../lib/storage';

interface Props {
  selected: string[];
  onReplace: (ids: string[]) => void;
  onClear: () => void;
  onClose: () => void;
}

export function SettingsMenu({ selected, onReplace, onClear, onClose }: Props) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const json = () => serializeSchedule(selected);

  const download = () => {
    const blob = new Blob([json()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ukaren70-schedule.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json());
      setMsg('クリップボードにコピーしました');
    } catch {
      setText(json());
      setMsg('コピーできないため下の欄に表示しました。手動でコピーしてください');
    }
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
          <section>
            <h3>JSONを書き出し（別の端末へコピー）</h3>
            <p className="hint">選択中 {selected.length}件</p>
            <div className="row">
              <button type="button" className="btn" onClick={download}>
                ファイルを保存
              </button>
              <button type="button" className="btn" onClick={copy}>
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
          <p className="hint">
            選択内容はこのブラウザの localStorage（キー ukaren70.schedule.v1）に保存されます。サーバーには送信されません。
          </p>
        </div>
      </aside>
    </>
  );
}
