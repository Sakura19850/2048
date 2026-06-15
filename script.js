/* ========================================================================
 * 2048 — 游戏逻辑
 * ======================================================================== */

// ---------- 游戏状态 ----------
const SIZE = 4;
let board = [];
let score = 0;
let gameOver = false;
let wonContinue = false;   // 达到 2048 后是否已选择继续

// ---------- DOM 引用 ----------
const scoreEl = document.getElementById('score');
const boardEl = document.getElementById('board');
const tileLayer = document.getElementById('tile-layer');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlay-message');
const btnNewGame = document.getElementById('btn-new-game');
const btnOverlay = document.getElementById('btn-overlay');

// ---------- 初始化 ----------
function init() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  gameOver = false;
  wonContinue = false;
  updateScore();
  addRandomTile();
  addRandomTile();
  render(null);
  hideOverlay();
}

// ---------- 添加随机方块 ----------
function addRandomTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// ---------- 实用函数 ----------
function cloneBoard(b) {
  return b.map(row => [...row]);
}

function boardsEqual(a, b) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (a[r][c] !== b[r][c]) return false;
  return true;
}

// ---------- 单行处理（左移方向） ----------
// 输入：[2, 0, 2, 4] → 输出：[4, 4, 0, 0]
function processLine(line) {
  // 1. 去掉所有的 0
  const arr = line.filter(v => v !== 0);
  // 2. 合并相邻相等项
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  // 3. 补 0 到 4 位
  while (arr.length < SIZE) arr.push(0);
  return arr;
}

// ---------- 棋盘变换（用于复用左移逻辑） ----------

// 顺时针旋转 90°
function rotateCW(b) {
  const result = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      result[c][SIZE - 1 - r] = b[r][c];
  return result;
}

// 逆时针旋转 90°
function rotateCCW(b) {
  const result = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      result[SIZE - 1 - c][r] = b[r][c];
  return result;
}

// 水平翻转（每行反转）
function flipH(b) {
  return b.map(row => [...row].reverse());
}

// ---------- 移动 ----------
function move(direction) {
  if (gameOver) return;
  if (wonContinue && hasWon()) {
    // 已经赢过一次且选择了继续，允许正常移动
  }

  const before = cloneBoard(board);
  let workBoard = cloneBoard(board);

  // 所有方向转换为左移
  if (direction === 'left') {
    // 不变
  } else if (direction === 'right') {
    workBoard = flipH(workBoard);
  } else if (direction === 'up') {
    workBoard = rotateCCW(workBoard);
  } else if (direction === 'down') {
    workBoard = rotateCW(workBoard);
  }

  // 逐行处理
  let moved = false;
  for (let r = 0; r < SIZE; r++) {
    const result = processLine(workBoard[r]);
    if (!arraysEqual(workBoard[r], result)) moved = true;
    workBoard[r] = result;
  }

  if (!moved) return; // 无法移动

  // 变回原方向
  if (direction === 'left') {
    // 不变
  } else if (direction === 'right') {
    workBoard = flipH(workBoard);
  } else if (direction === 'up') {
    workBoard = rotateCW(workBoard);
  } else if (direction === 'down') {
    workBoard = rotateCCW(workBoard);
  }

  board = workBoard;
  addRandomTile();
  updateScore();
  render(before);

  // 检查胜利 / 失败
  if (!wonContinue && hasWon()) {
    showOverlay('🎉 你赢了！', '继续挑战');
  } else if (!hasMovesLeft()) {
    gameOver = true;
    showOverlay('游戏结束', '再来一局');
  }
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++)
    if (a[i] !== b[i]) return false;
  return true;
}

// ---------- 判定 ----------
function hasWon() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] >= 2048) return true;
  return false;
}

function hasMovesLeft() {
  // 有空格
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === 0) return true;
  // 有相邻相同
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  return false;
}

// ---------- 渲染 ----------
function render(prevBoard) {
  tileLayer.innerHTML = '';

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      if (val === 0) continue;

      const tile = document.createElement('div');
      tile.className = 'tile ' + tileClass(val);
      tile.style.setProperty('--row', r);
      tile.style.setProperty('--col', c);
      tile.textContent = val;

      // 判断动画类型
      if (prevBoard) {
        if (prevBoard[r][c] === 0) {
          // 之前为空 → 新出现的方块
          tile.classList.add('tile-new');
        } else if (prevBoard[r][c] !== val) {
          // 之前有不同值 → 合并产生的方块
          tile.classList.add('tile-merged');
        }
      }

      tileLayer.appendChild(tile);
    }
  }

  // 更新棋盘色调 — 有 2048 时暖一个层次
  if (hasWon() && !wonContinue) {
    boardEl.style.background = '#d4a84b';
  } else {
    boardEl.style.background = '#bbada0';
  }
}

function tileClass(val) {
  if (val <= 2048) return 'tile-' + val;
  return 'tile-super';
}

function updateScore() {
  scoreEl.textContent = score;
}

// ---------- 覆盖层 ----------
function showOverlay(msg, btnText) {
  overlay.classList.remove('hidden');
  overlayMsg.textContent = msg;
  btnOverlay.textContent = btnText || '再来一局';
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

// ---------- 继续游戏 ----------
function continueGame() {
  wonContinue = true;
  hideOverlay();
}

// ---------- 键盘输入 ----------
function handleKeyDown(e) {
  const keyMap = {
    'ArrowLeft':  'left',
    'ArrowRight': 'right',
    'ArrowUp':    'up',
    'ArrowDown':  'down',
    'a': 'left',  'A': 'left',
    'd': 'right', 'D': 'right',
    'w': 'up',    'W': 'up',
    's': 'down',  'S': 'down',
  };

  const dir = keyMap[e.key];
  if (dir) {
    e.preventDefault();
    move(dir);
  }
}

// ---------- 触屏 / 鼠标输入 ----------
let touchStartX = 0;
let touchStartY = 0;
let touchStarted = false;

let mouseStartX = 0;
let mouseStartY = 0;
let mouseDragging = false;

// 根据起始坐标和 delta 解析方向并执行移动
function resolveDirection(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const threshold = 30;

  if (Math.max(absDx, absDy) < threshold) return; // 滑动距离不够

  if (absDx > absDy) {
    move(dx > 0 ? 'right' : 'left');
  } else {
    move(dy > 0 ? 'down' : 'up');
  }
}

function handleTouchStart(e) {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStarted = true;
}

function handleTouchMove(e) {
  // 阻止页面滚动
  if (touchStarted) e.preventDefault();
}

function handleTouchEnd(e) {
  if (!touchStarted) return;
  touchStarted = false;

  const touch = e.changedTouches[0];
  resolveDirection(touchStartX, touchStartY, touch.clientX, touch.clientY);
}

// ---------- 鼠标拖拽 ----------
function handleMouseDown(e) {
  e.preventDefault();
  mouseStartX = e.clientX;
  mouseStartY = e.clientY;
  mouseDragging = true;
  boardEl.style.cursor = 'grabbing';
}

function handleMouseUp(e) {
  if (!mouseDragging) return;
  mouseDragging = false;
  boardEl.style.cursor = 'grab';

  resolveDirection(mouseStartX, mouseStartY, e.clientX, e.clientY);
}

function handleMouseLeave() {
  if (mouseDragging) {
    mouseDragging = false;
    boardEl.style.cursor = 'grab';
  }
}

// ---------- 事件绑定 ----------
document.addEventListener('keydown', handleKeyDown);
boardEl.addEventListener('touchstart', handleTouchStart, { passive: false });
boardEl.addEventListener('touchmove', handleTouchMove, { passive: false });
boardEl.addEventListener('touchend', handleTouchEnd);
boardEl.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mouseup', handleMouseUp);
boardEl.addEventListener('mouseleave', handleMouseLeave);

// 棋盘鼠标光标样式
boardEl.style.cursor = 'grab';

// 新游戏按钮
btnNewGame.addEventListener('click', init);
btnOverlay.addEventListener('click', () => {
  if (!wonContinue && hasWon() && gameOver === false) {
    // 玩家赢了但还没继续 → 点击继续挑战
    continueGame();
  } else {
    // 游戏结束 → 重新开始
    init();
  }
});

// ---------- 启动 ----------
init();
