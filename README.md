# Hoganpad

Excel 方眼紙の操作感で、そのまま印刷できる紙面を組むためのエディタ。

- **Excel のように**: セルカーソル・矢印キー・打ったら即入力・Enter で下へ・Shift で範囲選択・Ctrl+M でセル結合。
- **DTP のように**: すべての要素は方眼に吸着する「フレーム」。移動・サイズ変更・重ね順・罫線・塗り・文字組みを持ち、
  A4 に mm 単位で配置されてそのまま印刷（PDF 保存）できる。行送りも方眼の整数倍に揃う。

## 操作

| 操作 | キー / マウス |
|---|---|
| 移動 | 矢印 / クリック（フレームは 1 マスとして飛び越える） |
| 範囲選択 | Shift+矢印 / ドラッグ / Shift+クリック / Ctrl+A |
| 入力 | そのまま打つ（上書き、IME 可）/ F2・ダブルクリック（編集） |
| 確定して移動 | Enter（下）/ Shift+Enter（上）/ Tab（右）/ Shift+Tab（左） |
| セル内改行 / 取り消し | Alt+Enter / Esc |
| 結合して罫線ボックスに | Ctrl+M |
| フレームの移動 | Alt+矢印 / 選択中のフレームをドラッグ |
| フレームのサイズ変更 | Alt+Shift+矢印 / 選択枠右下のハンドルをドラッグ |
| 削除 | Delete / Backspace |
| 太字 / 斜体 | Ctrl+B / Ctrl+I |
| 最前面 / 最背面 | Ctrl+] / Ctrl+[ |
| コピー / 切り取り / 貼り付け | Ctrl+C / Ctrl+X / Ctrl+V（Excel のタブ区切りテキストも貼れる） |
| 元に戻す / やり直す | Ctrl+Z / Ctrl+Y・Ctrl+Shift+Z |

文字のない範囲に罫線や塗りを付けると、その範囲がボックスになります。
編集内容はブラウザに自動保存され、ツールバーから JSON で保存・読み込みできます。

## 構成

```
src/model/     ドキュメントのデータ型（Rect, Frame, Doc）と用紙計算
src/editor/    状態遷移（純粋な reducer）・選択とカーソル移動・キーマップ・クリップボード
src/components 紙面（Page）とツールバー
tests/         reducer / キーマップ / 入出力のテスト
```

## 開発

```sh
npm install
npm run dev     # 開発サーバ
npm test        # テスト
npm run lint
npm run build
```
