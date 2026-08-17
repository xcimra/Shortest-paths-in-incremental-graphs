import { codeview, updateCytoscapeEdgesCode,graph,checkinput } from "./main.js";
// editor.js
export function checkinput1(input) {
  if (graph == null) {
    alert("zadajte najprv počet vrcholov");
    return false;
  }

  const inp = Number(input);

  if (!Number.isInteger(inp) || inp <= 0) {
    alert("Zadajte kladné celé číslo väčšie ako 0");
    return false;
  }

  return true;
}
const codeLines = [

];
const counthistory = [];
export const history = []
// internal state

export let currentLine = 0;
export function resetcurrentline()
{
  currentLine = 0;
  moveCursor();
}
// DOM refs (set during init)
let codeDiv = null;
let linesDiv = null;
let cursor = null;
let padding =0
export let counter =0;
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
  counter++;
  codeLines.push((" ".repeat(padding))+line);
  render();
}
export function addhistory(graph,special) {
  history.push([counter,graph.clone(),special]);
  counthistory.push(counter);

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
  if (graph ===null)
  {
    alert("zadajte počet vrcholov grafu");
    return;
  }
  if (codeview === false )
  {
    alert("stlačte najprv Mód pozerania kódu");
    return;
  }
  if (currentLine < codeLines.length - 1) {
    currentLine++;
    const cur = counthistory.indexOf(currentLine);
    if (cur !== -1)
    {
      console.log("yes");
      console.log(history[cur][0]);
      console.log(history[cur][1]);
      updateCytoscapeEdgesCode(history[cur][1], history[cur][2]);
    }

    moveCursor();
  }
}
export function goToLine() {
  if (graph ===null)
  {
    alert("zadajte počet vrcholov grafu");
    return;
  }

  if (codeview === false )
  {
    alert("stlačte najprv Mód pozerania kódu");
    return;
  }
  const input = document.getElementById("gotoLineInput");

  const line = parseInt(input.value);
  if (!checkinput1(line))
  {
    return;
  }
  if (isNaN(line)) return;
  console.log(line,codeLines.length);
  if (line-1<codeLines.length)
  {

    currentLine = line-1;
  }
  moveCursor();
  if (currentLine < codeLines.length  && line -1<codeLines.length ) {

    const cur = counthistory.indexOf(currentLine);
    console.log(counthistory.indexOf(currentLine));
    if (cur !== -1)
    {
      console.log("yes");
      console.log(history[cur][0]);
      console.log(history[cur][1]);
      updateCytoscapeEdgesCode(history[cur][1], history[cur][2]);
    }


  }
}
export function beforeStep() {
  if (graph ===null)
  {
    alert("zadajte počet vrcholov grafu");
    return;
  }
  if (codeview === false )
  {
    alert("stlačte najprv Mód pozerania kódu");
    return;
  }
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