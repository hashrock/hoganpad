/*
 * Alloy : 「box は選択の原子単位である」構造不変条件の検証
 *
 * 対象: src/editor/reducer.ts の moveTo / moveArrow の着地処理
 *       - findContainingBox(items, x, y) で着地セルを含む box を探す
 *       - box があれば expandSelectionToBox で box 全体を選択
 *       - なければ singleCell で 1 セル選択
 *
 * ここでは座標算術を捨象し、box を「セルの集合（矩形）」として抽象化。
 * UI 上の要求「箱の一部だけが選択される状態は決して起きない」を
 * 有限スコープで反例探索する。反例が出なければ仕様上その状態は到達不能。
 */

sig Cell {}

sig Box {
  cells: some Cell        // box は 1 つ以上のセルを覆う
}

// 事実: 異なる box はセルを共有しない（findContainingBox が一意に定まる前提）
fact DisjointBoxes {
  all disj b1, b2: Box | no (b1.cells & b2.cells)
}

/*
 * selectionOf[t, s]: 着地セル t に対して reducer が作る選択 s を関係づける。
 *   - t が或る box に属する  → s はその box の全セル（expandSelectionToBox）
 *   - t がどの box にも属さない → s は {t} のみ（singleCell）
 */
pred selectionOf[t: Cell, s: set Cell] {
  (some b: Box | t in b.cells and s = b.cells)
  or
  ((no b: Box | t in b.cells) and s = t)
}

/* -------- 検証 1: どの着地からも「箱の部分選択」は生じない -------- */
assert NoPartialBoxSelection {
  all t: Cell, s: set Cell |
    selectionOf[t, s] implies
      (all b: Box | some (s & b.cells) implies b.cells in s)
}
check NoPartialBoxSelection for 8

/* -------- 検証 2: 箱内のどのセルに着地しても同じ選択（原子性） -------- */
// pointerDown / 矢印がヒットするセルが箱内のどこであっても、
// 選択される範囲は箱全体で一意に決まる（クリック位置に依存しない）。
assert BoxIsAtomicUnderLanding {
  all b: Box, t1, t2: Cell |
    (t1 in b.cells and t2 in b.cells) implies
      (all s1, s2: set Cell |
        (selectionOf[t1, s1] and selectionOf[t2, s2]) implies s1 = s2)
}
check BoxIsAtomicUnderLanding for 8

/* -------- 検証 3: 選択は必ず「1 つの box 全体」か「箱でない単一セル」 -------- */
assert SelectionIsBoxOrSingleCell {
  all t: Cell, s: set Cell |
    selectionOf[t, s] implies
      ( (some b: Box | s = b.cells)          // ちょうど 1 つの box
        or (one s and no (s & Box.cells)) )  // 箱に属さない単一セル
}
check SelectionIsBoxOrSingleCell for 8

/* 反例探索が空虚でないことの確認: モデルは実際に存在する */
pred NonEmptyWorld { some Box and some Cell - Box.cells }
run NonEmptyWorld for 8
