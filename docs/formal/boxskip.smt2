; ============================================================
; Z3 / SMT-LIB2 : box skip の算術的正しさを整数全域で証明
;
; 対象: src/editor/reducer.ts の moveArrow と
;       src/editor/selectors.ts の getSelectionRect / expandSelectionToBox
;
; 各性質は「否定が unsat（＝反例なし＝全域で成立）」で証明する。
; box は (bx: 左端, bw: 幅>=1)。cursor が [bx, bx+bw-1] にあるとき "内側"。
; moveArrow(right) の box-skip: 内側なら nx = bx + bw、そうでなければ nx = cx+1。
; moveArrow(left)  の box-skip: 内側なら nx = bx - 1、そうでなければ nx = cx-1。
; ============================================================

; ------------------------------------------------------------
; P1: 右スキップは box を必ず脱出し、厳密に前進する
;   inside(cx,bx,bw) => nx=bx+bw satisfies  nx > cx  AND  nx > bx+bw-1 (右端の外)
; ------------------------------------------------------------
(push)
(declare-const bx Int)
(declare-const bw Int)
(declare-const cx Int)
(assert (>= bw 1))                       ; 箱の幅は 1 以上
(assert (and (<= bx cx) (<= cx (+ bx (- bw 1)))))  ; cursor は箱の内側
(define-fun nx () Int (+ bx bw))         ; 右スキップ後の x
; 否定: 「前進しない or まだ箱の中」= NOT(nx>cx AND nx>bx+bw-1)
(assert (not (and (> nx cx) (> nx (+ bx (- bw 1))))))
(echo "P1 右スキップ脱出+前進 (unsat が証明成功):")
(check-sat)
(pop)

; ------------------------------------------------------------
; P2: 左スキップは box を必ず脱出し、厳密に後退する
;   inside => nx=bx-1 satisfies  nx < cx  AND  nx < bx (左端の外)
; ------------------------------------------------------------
(push)
(declare-const bx Int)
(declare-const bw Int)
(declare-const cx Int)
(assert (>= bw 1))
(assert (and (<= bx cx) (<= cx (+ bx (- bw 1)))))
(define-fun nx () Int (- bx 1))
(assert (not (and (< nx cx) (< nx bx))))
(echo "P2 左スキップ脱出+後退 (unsat が証明成功):")
(check-sat)
(pop)

; ------------------------------------------------------------
; P3: 幅に依らない一発脱出（wideBox テストの一般化）
;   幅がどれだけ大きくても、右スキップは 1 回で右端の外に出る。
;   すなわち step 移動 (cx+1) では箱内に留まりうるが、skip では必ず脱出。
;   ここでは「skip 後の nx は箱の全セルより右」を全幅で証明。
; ------------------------------------------------------------
(push)
(declare-const bx Int)
(declare-const bw Int)
(declare-const cx Int)
(declare-const k  Int)                   ; 箱内の任意セル
(assert (>= bw 1))
(assert (and (<= bx cx) (<= cx (+ bx (- bw 1)))))
(assert (and (<= bx k)  (<= k  (+ bx (- bw 1)))))  ; k も箱内
(define-fun nx () Int (+ bx bw))
(assert (not (> nx k)))                   ; 否定: nx が箱内セル k 以下
(echo "P3 幅無依存の一発脱出 (unsat が証明成功):")
(check-sat)
(pop)

; ------------------------------------------------------------
; P4: 2 つの隣接 box 間でも右移動は厳密単調（無限ループ不能の核心）
;   box1 の内側から右移動 → 着地が box2 内なら expand で cursor=box2.bx。
;   disjoint(box1 の右 <= box2 の左) の下で new_cursor > cx を全域証明。
; ------------------------------------------------------------
(push)
(declare-const bx1 Int) (declare-const bw1 Int)
(declare-const bx2 Int) (declare-const bw2 Int)
(declare-const cx  Int)
(assert (>= bw1 1)) (assert (>= bw2 1))
(assert (and (<= bx1 cx) (<= cx (+ bx1 (- bw1 1)))))  ; cursor は box1 内
(assert (<= (+ bx1 bw1) bx2))                          ; box2 は box1 の右で disjoint
(define-fun base () Int (+ bx1 bw1))                    ; box1 からの右スキップ着地
; 着地セル base が box2 内 → expand で新カーソル = bx2、そうでなければ base
(define-fun in_box2 () Bool (and (<= bx2 base) (<= base (+ bx2 (- bw2 1)))))
(define-fun ncur () Int (ite in_box2 bx2 base))
(assert (not (> ncur cx)))                ; 否定: 前進しない
(echo "P4 2箱間の厳密単調前進 (unsat が証明成功):")
(check-sat)
(pop)

; ------------------------------------------------------------
; P5: getSelectionRect は cursor/anchor の順序に依らず同一（正規化）
;   かつ 幅 w>=1 が常に成り立つ。
; ------------------------------------------------------------
(push)
(declare-const cx Int) (declare-const ax Int)
(define-fun leftOf  ((p Int) (q Int)) Int (ite (<= p q) p q))
(define-fun rightOf ((p Int) (q Int)) Int (ite (<= p q) q p))
(define-fun width   ((p Int) (q Int)) Int (+ (abs (- p q)) 1))
; 順序入替不変
(assert (not (and
  (= (leftOf  cx ax) (leftOf  ax cx))
  (= (rightOf cx ax) (rightOf ax cx))
  (= (width   cx ax) (width   ax cx))
  (>= (width  cx ax) 1))))
(echo "P5 選択矩形の正規化+w>=1 (unsat が証明成功):")
(check-sat)
(pop)
