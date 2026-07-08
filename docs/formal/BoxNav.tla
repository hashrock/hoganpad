-------------------------------- MODULE BoxNav --------------------------------
(*****************************************************************************)
(* TLA+ : 矢印キー連打によるカーソル移動の時相検証                          *)
(*                                                                           *)
(* 対象: src/editor/reducer.ts の moveArrow（非 shift）                      *)
(*   - box 内なら反対端の外へ一発ジャンプ（box skip）                        *)
(*   - 着地セルが box 内なら selection を box 全体へ展開（cursor=box.lo）    *)
(*   - そうでなければ単一セル                                                *)
(*                                                                           *)
(* 1 次元コリドー [0..N] に 2 つの disjoint な box を置き、全到達状態を      *)
(* TLC で網羅検査する。検証する性質:                                         *)
(*   - TypeOK          : 状態が常に整合（境界内・sel_lo<=sel_hi）            *)
(*   - NoPartialSel    : 箱の一部だけを選択した状態は決して起きない          *)
(*   - CursorInBoxAtLo : 箱の中にいるときカーソルは必ず箱の左端             *)
(*   - デッドロック無  : どの状態からも必ず次の操作が可能（TLC 既定検査）    *)
(*   - ReachRightWall  : 右を押し続ければ必ず右端に到達（閉じ込め不可 / 活性）*)
(*****************************************************************************)
EXTENDS Integers

N == 12
Boxes == { [lo |-> 2, hi |-> 4],    \* 幅 3 の箱
           [lo |-> 7, hi |-> 8] }   \* 幅 2 の箱

VARIABLES cursor, sel_lo, sel_hi
vars == <<cursor, sel_lo, sel_hi>>

InSomeBox(c) == \E b \in Boxes : b.lo <= c /\ c <= b.hi
TheBox(c)    == CHOOSE b \in Boxes : b.lo <= c /\ c <= b.hi

\* box skip: 内側なら反対端の外、そうでなければ 1 セル移動
RightBase(c) == IF InSomeBox(c) THEN TheBox(c).hi + 1 ELSE c + 1
LeftBase(c)  == IF InSomeBox(c) THEN TheBox(c).lo - 1 ELSE c - 1

\* 着地処理: box に着地したら box 全体を選択（cursor=左端）、なければ単一セル
LandCursor(base) == IF InSomeBox(base) THEN TheBox(base).lo ELSE base
LandLo(base)     == IF InSomeBox(base) THEN TheBox(base).lo ELSE base
LandHi(base)     == IF InSomeBox(base) THEN TheBox(base).hi ELSE base

Init ==
  /\ cursor = 0
  /\ sel_lo = 0
  /\ sel_hi = 0

MoveRight ==
  /\ RightBase(cursor) <= N                 \* コリドー内に収まる場合のみ
  /\ cursor' = LandCursor(RightBase(cursor))
  /\ sel_lo' = LandLo(RightBase(cursor))
  /\ sel_hi' = LandHi(RightBase(cursor))

MoveLeft ==
  /\ LeftBase(cursor) >= 0
  /\ cursor' = LandCursor(LeftBase(cursor))
  /\ sel_lo' = LandLo(LeftBase(cursor))
  /\ sel_hi' = LandHi(LeftBase(cursor))

Next      == MoveRight \/ MoveLeft
NextRight == MoveRight

\* 両方向を許す仕様（安全性・デッドロック検査用）
Spec == Init /\ [][Next]_vars

\* 右のみ + 弱公平性（活性検査用: 右を押し続ければ必ず前進する）
SpecRight == Init /\ [][NextRight]_vars /\ WF_vars(MoveRight)

(*------------------------------- 性質 -------------------------------------*)
TypeOK ==
  /\ cursor \in 0..N
  /\ sel_lo \in 0..N
  /\ sel_hi \in 0..N
  /\ sel_lo <= sel_hi

\* 箱の一部だけを選択している状態は存在しない
NoPartialSel ==
  \/ (sel_lo = sel_hi)
  \/ (\E b \in Boxes : sel_lo = b.lo /\ sel_hi = b.hi)

\* 箱の中にいるとき、カーソルは必ずその箱の左端にあり、選択は箱全体
CursorInBoxAtLo ==
  InSomeBox(cursor) =>
    \E b \in Boxes : /\ cursor = b.lo
                     /\ sel_lo = b.lo
                     /\ sel_hi = b.hi

\* 活性: 右を押し続ければ必ず右端 N に到達（どの箱にも閉じ込められない）
ReachRightWall == <>(cursor = N)
=============================================================================
