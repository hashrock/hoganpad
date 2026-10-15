import { useEffect, useReducer, useRef } from 'react';
import { Page } from './components/Page';
import { Toolbar } from './components/Toolbar';
import { Action, activeFrame, createState, currentRect, editorReducer } from './editor';
import { Doc, parseDoc, SAMPLE_DOC, TEXT_STYLE } from './model/doc';

const STORAGE_KEY = 'hoganpad:doc';

function loadDoc(): Doc {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return parseDoc(JSON.parse(saved));
  } catch {
    // 壊れた保存データやストレージ無効時はサンプルから始める
  }
  return SAMPLE_DOC;
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => createState(loadDoc()));
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { doc } = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
      // 保存できなくても編集は続けられる
    }
  }, [doc]);

  function run(action: Action) {
    dispatch(action);
    inputRef.current?.focus({ preventScroll: true });
  }

  async function open(file: File) {
    try {
      run({ type: 'load', doc: parseDoc(JSON.parse(await file.text())) });
    } catch (e) {
      alert(`読み込めませんでした: ${e instanceof Error ? e.message : e}`);
    }
  }

  return (
    <>
      {/* 印刷時の用紙サイズを紙面の向きに合わせる */}
      <style>{`@page { size: A4 ${doc.page.orientation}; margin: 0; }`}</style>
      <Toolbar
        style={activeFrame(state)?.style ?? TEXT_STYLE}
        page={doc.page}
        selection={currentRect(state)}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        run={run}
        onOpen={() => fileRef.current?.click()}
        onSave={() => download('hoganpad.json', JSON.stringify(doc, null, 2))}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void open(file);
        }}
      />
      <main className="desk">
        <Page state={state} dispatch={dispatch} inputRef={inputRef} />
      </main>
      <footer className="help screen-only">
        矢印: 移動 ／ Shift+矢印・ドラッグ: 範囲選択 ／ 文字キー: 上書き入力 ／ F2・ダブルクリック: 編集 ／
        Alt+Enter: 改行 ／ Ctrl+M: 結合 ／ Alt+矢印・ドラッグ: 移動 ／ Alt+Shift+矢印・右下ハンドル: サイズ変更 ／
        Delete: 削除 ／ Ctrl+C・X・V: コピー・切り取り・貼り付け
      </footer>
    </>
  );
}
