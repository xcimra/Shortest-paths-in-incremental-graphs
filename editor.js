// editor.js

const codeLines = [
  "x = 5",
  "y = x + 1",
  "print(y)"
];
const history = []
// internal state
let currentLine = 0;

// DOM refs (set during init)
let codeDiv = null;
let linesDiv = null;
let cursor = null;
let padding =0
/**
 * Initialize editor (call after DOM is ready)
 */
export function initEditor() {
  codeDiv = document.getElementById("code");
  linesDiv = document.getElementById("lines");
  cursor = document.getElementById("cursor");

  if (!codeDiv || !linesDiv || !cursor) {
    console.error("Editor DOM elements not found");
    return;
  }

  render();
}
export function addCodeLine(line) {
  codeLines.push((" ".repeat(padding))+line);
  render();
}
export function addhistory(event) {
    history.push(event);
}
export function addpadding() {
    padding +=4
}
export function shrinkpadding() {
    padding -=4
}
/**
 * Render code + line numbers
 */
export function render() {
  codeDiv.innerHTML = "";
  linesDiv.innerHTML = "";

  for (let i = 0; i < codeLines.length; i++) {
    // code line
    const lineEl = document.createElement("div");
    lineEl.className = "line";
    lineEl.textContent = codeLines[i];
    codeDiv.appendChild(lineEl);

    // line number
    const numEl = document.createElement("div");
    numEl.className = "line-number";
    numEl.textContent = i + 1;
    linesDiv.appendChild(numEl);
  }

  moveCursor();
}

/**
 * Move visual cursor to current line
 */
export function moveCursor() {
  const lineHeight = 20;
  const offsetTop = 10;

  cursor.style.top = (currentLine * lineHeight + offsetTop) + "px";
}

/**
 * Advance execution by one step
 */
export function nextStep() {
  if (currentLine < codeLines.length - 1) {
    currentLine++;
    moveCursor();
  }
}
export function beforeStep() {
  if (currentLine >0) {
    currentLine--;
    moveCursor();
  }
}

/**
 * Optional: reset editor state
 */
export function resetEditor() {
  currentLine = 0;
  render();
}