# 形式手法によるエディタ状態遷移の検証

`src/editor/` の reducer（カーソル移動・box skip・box 全体展開・選択矩形）を、
3 つの形式手法ツールで検証したモデルと手順。ソースの挙動に変更が入ったら
ここのモデルも合わせて更新すること。

## 検証している性質

| ツール | ファイル | 検証内容 | 手法 |
|---|---|---|---|
| **Z3** | `boxskip.smt2` | box skip の算術的正しさ（全整数位置・全幅で成立） | SMT・無限ドメイン証明 |
| **Alloy** | `BoxAtomic.als` | 「box は選択の原子単位」（箱の部分選択は起きない） | 有限スコープ反例探索 |
| **TLA+** | `BoxNav.tla` | 到達可能性・デッドロック無・box に閉じ込められない | 時相論理・網羅的モデル検査 |

対応する実装:
- `moveArrow`（box skip / 着地展開）… `src/editor/reducer.ts`
- `getSelectionRect` / `expandSelectionToBox` / `findContainingBox` … `src/editor/selectors.ts`
- 既存のユニットテスト … `tests/cursor-movement.test.ts`

## 実行方法

検証時のツールバージョン: Z3 4.16.0 / Alloy 6.2.0 / TLA+ tla2tools (TLC 2.19)。

### Z3

各性質は「否定が `unsat`（＝反例なし＝全域で成立）」で証明する。

```sh
z3 boxskip.smt2
# 期待: P1..P5 すべて unsat
```

証明が空虚（前提が矛盾）でないことは、前提のみを `sat` 判定して確認できる。

### Alloy

`check` が `UNSAT` なら、そのスコープ内に反例が存在しない（＝不変条件が成立）。

```sh
alloy exec -c '*' BoxAtomic.als
# 期待: 3 つの check が UNSAT、run NonEmptyWorld が SAT
```

### TLA+

安全性（両方向 + デフォルトのデッドロック検査）と活性（右のみ + 弱公平性）を別 config で検査する。

```sh
# 安全性・デッドロック無
tlc -config safety.cfg BoxNav.tla
# 期待: No error has been found

# 活性 ReachRightWall（右端到達 = 箱に閉じ込められない）
# 右のみ仕様は右端到達で後続が無くなるため、デッドロック検査を切って時相性質のみ見る
tlc -deadlock -config live.cfg BoxNav.tla
# 期待: temporal properties ... No error has been found
```

> `tlc` は `tla2tools.jar` のラッパ（`java -cp tla2tools.jar tlc2.TLC`）を想定。
> `-deadlock` フラグは「デッドロック検査を行わない」の意。

## 検証結果（要約）

- **Z3**: P1〜P5 すべて `unsat`。box skip は任意位置・任意幅で必ず箱を脱出し、カーソルは
  厳密単調に前進する（隣接 2 箱でも成立）。選択矩形は cursor/anchor の順序に依らず `w≥1`。
- **Alloy**: スコープ 8 で反例なし。箱の一部だけを選択した状態は仕様上到達不能で、
  箱内のどこに着地しても選択範囲は箱全体で一意に決まる。
- **TLA+**: 全到達状態で `TypeOK` / `NoPartialSel` / `CursorInBoxAtLo` 成立。デッドロック無。
  右を押し続ければ必ず右端に到達し、どの箱にも閉じ込められない（活性）。
