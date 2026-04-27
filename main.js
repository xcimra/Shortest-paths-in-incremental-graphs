import { Graph } from "./graph.js";
import { initEditor, nextStep,addCodeLine,beforeStep,history,counter,goToLine,resetcurrentline} from "./editor.js";
export let graph = null;

export let cy;
let ctr = 0;
let node1;
let numVertices = null;
let queueMode;
export let codeview = false;
export function checkinput(input) {
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
export function codeView(){
  if (graph == null) {
    alert("zadajte najprv počet vrcholov");
    return false;
  }
  const btn = document.getElementById("codemode");
  codeview =!codeview;
  cy.edges().remove();
  if (codeview)
  {
    btn.textContent = "preč s módu pozerania kodu";
    return;
  }
  updateCytoscapeEdges(graph);
  resetcurrentline();
  btn.textContent = "mód pozerania kodu";

  


  //updateCytoscapeEdges(graph);
};

window.addEventListener("DOMContentLoaded", () => {
  initEditor();

  // 🔥 expose to HTML
  window.nextStep = nextStep;
  window.codeView =codeView;
  window.beforeStep = beforeStep;
  window.goToLine = goToLine;
});

function addPaths(paths, id) {
  const panel = document.getElementById("panel");

  const card = document.createElement("div");
  card.className = "card";
  card.id = "card-" + id;

  card.innerHTML = `<h3>Prioritný rad ${id}</h3>`;

  paths.forEach(path => {
    let pathstring = "{ " + (path.start + 1);
    pathstring = _parsepath(path, pathstring);
    pathstring += "}";

    const button = document.createElement("button");
    button.textContent = pathstring;

    const left =
      path.l == null
        ? "žiadna"
        : _parsepath(path.l, (path.l.start + 1).toString() + ",");

    const right =
      path.r == null
        ? "žiadna"
        : _parsepath(path.r, (path.r.start + 1).toString() + ",");

    const L = path.L?.map(p =>
      _parsepath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    const R = path.R?.map(p =>
      _parsepath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    const L_star = path.L_star?.map(p =>
      _parsepath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    const R_star = path.R_star?.map(p =>
      _parsepath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    button.onclick = () => {
      alert(
        `cesta: ${pathstring}\n` +
        `váha: ${path.weight}\n` +
        `l: ${left}\n` +
        `r: ${right}\n` +
        `L: ${L}\n` +
        `R: ${R}\n` +
        `L*: ${L_star}\n` +
        `R*: ${R_star}`
      );
    };

    card.appendChild(button);
  });

  panel.appendChild(card);
}
function createRadioButtons() {
  const panel = document.getElementById("panel");

  const controls = document.createElement("div");
  controls.id = "controls";

  // Radio 1
  const labelL = document.createElement("label");
  const radioL = document.createElement("input");
  radioL.type = "radio";
  radioL.name = "mode1";
  radioL.value = "NonL";

  radioL.addEventListener("change", function () {
    queueMode = this.value;
    resetShortestQueues();
  });

  labelL.appendChild(radioL);
  labelL.appendChild(document.createTextNode(" Najkratšie cesty"));

  // Radio 2
  const labelR = document.createElement("label");
  const radioR = document.createElement("input");
  radioR.type = "radio";
  radioR.name = "mode1";
  radioR.value = "L";

  radioR.addEventListener("change", function () {
    queueMode = this.value;
    resetLocallyShortestQueues();
  });

  labelR.appendChild(radioR);
  labelR.appendChild(document.createTextNode(" Lokálne najkratšie cesty"));

  controls.appendChild(labelL);
  controls.appendChild(labelR);

  panel.appendChild(controls);
}
function resetShortestQueues(){
  document.getElementById("panel").innerHTML = "";
  createRadioButtons();
  for (let i = 0; i < graph.V; i++){
    for (let j = 0; j < graph.V; j++){
      let path =graph.p_list[i][j].front();
      if (path != null){
        addPaths([path], (i+1).toString()+", "+(j+1).toString());
      }

    }
  }

}
function resetLocallyShortestQueues(){
  document.getElementById("panel").innerHTML = "";
  createRadioButtons();
  for (let i = 0; i < graph.V; i++){
    for (let j = 0; j < graph.V; j++){
      let current = graph.p_list[i][j];
      let whole = "cesty: "
      const Q = [];

      while (!current.isEmpty()) {
        let path = current.dequeue();

        Q.push(path);

        let pathstring = `{ ${path.start + 1}`;
        pathstring = _parsepath(path, pathstring);
        pathstring += "},";

        whole += pathstring;
        
      }
      if (Q.length != 0 || i == j){
        addPaths(Q, (i+1).toString()+", "+(j+1).toString());
      }

      console.log(i,j,Q);
      for (let i = 0; i < Q.length; i++) current.enqueue(Q[i]);
    }
  }
}
function showName() {
  if (numVertices != null)
  {
    alert("ak chcete vytvoriť nový graf obnovte stránku");
    return;
  }
  numVertices = parseInt(document.getElementById("nameInput").value);
  if (isNaN(numVertices))
  {
    alert("zadajte spravne cislo");
    return;
  }

  console.log(numVertices);
  const elements = [];

  graph = new Graph(numVertices,addCodeLine);

  resetShortestQueues();

  for (let i = 1; i <= numVertices; i++) {
    elements.push({
      data: { id: i.toString(), label: i.toString() },
    });
  }

  let edgeId = 0;

  for (let i = 0; i < graph.V; i++) {
    for (let j = 0; j < graph.V; j++) {
      const queue = graph.p_list[i][j];

      if (!queue || queue.isEmpty() || i == j) continue;

      const path = queue.front();

      elements.push({
        data: {
          id: "e" + edgeId++,
          source: (path.start + 1).toString(),
          target: (path.end + 1).toString(),
        },
      });
    }
  }
  const nodeSize = Math.max(20, 120 / Math.sqrt(numVertices));
  const fontSize = Math.max(10, nodeSize / 2);
  cy = cytoscape({
    container: document.getElementById("cy"),
    elements: elements,

    style: [
      {
        selector: "node",
        style: {
          "background-color": "#0074D9",
          label: "data(label)",
          color: "#fff",
          "text-valign": "center",
          "text-halign": "center",
          width: nodeSize,
          height: nodeSize,
          "font-size": fontSize,
        },
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          label: "data(weight)",
          "font-size": Math.max(8, fontSize * 0.8),
          "text-background-color": "white",
          "text-background-opacity": 1,
          "text-background-padding": "2px",
          "line-color": "data(color)",         
          "target-arrow-color": "data(color)",  
        },
      },
      {
        selector: ".clicked",
        style: {
          "border-color": "green",
          "border-width": 3,
        },
      },
    ],

    layout: { name: "circle" },
  });
let selectedNode = null;

cy.on("tap", "node", function (evt) {
  const node = evt.target;

  if (!selectedNode) {
    selectedNode = parseInt(node.id());
    node.addClass("clicked");
    return;
  }

  const node2 = parseInt(node.id());

  cy.nodes().removeClass("clicked");

  let weight = prompt(`Zadajte dĺžku hrany: ${selectedNode}, ${node2}`);
  if (weight === null) {
    selectedNode = null;
    return;
  }

  let win = `${node2}:${weight}`;
  let wout = "";

  const before = currentMode;
  currentMode = "hrana";

  try {
    doupdate(selectedNode, win, wout);
  } finally {
    currentMode = before;
    selectedNode = null;
  }
});
}

function _parsepath(result, startstring) {
  let pathstring = startstring;

  while (result.r != null) {
    result = result.r;
    pathstring += `,${result.start + 1}`;
  }

  return pathstring;
}

function getdistance(x, y) {
  console.log("a");
  if (!checkinput(x) || !checkinput(y))
  {
    return;
  }

  x = parseInt(x) - 1;
  y = parseInt(y) - 1;
  if ((x >=graph.V ) ||(  y >=graph.V ))
  {
    alert("vyplnte správne začiatočný a koncový vrchol");
    return;
  }

  
  let result = graph.distance(x, y);

  alert(
    `Vzdialenosť medzi vrcholmi ${x + 1} a ${y + 1} je ${result == Infinity ? "nekonečno" : result}.`,
  );
}

function getpath(x, y) {

  if (!checkinput(x) || !checkinput(y))
  {
    return;
  }
  x = parseInt(x) - 1;
  y = parseInt(y) - 1;
  if ((x >=graph.V ) ||(  y >=graph.V ))
  {
    alert("vyplnte správne začiatočný a koncový vrchol");
    return;
  }


  let result = graph.path(x, y);

  if (result == null) {
    alert("Cesta neexistuje.");
    return;
  }

  let pathstring = `Cesta obsahuje vrcholy: ${result.start + 1}`;

  pathstring = _parsepath(result, pathstring);

  alert(pathstring + ".");
}

function doupdate(v, win, wout) {
  if (codeview)
  {
    alert("pozeranie kodu zapnute");
    return;
  }
  if (!checkinput(v))
  {
    return;
  }
  if (v-1 >=graph.V){
    alert("zle zadany vrchol");
    return;
  }
  const selected = document.querySelector('input[name="inputType"]:checked');


  const v_start = parseInt(v) - 1;
  if (isNaN(v_start))
  {
    alert("zadajte spravne meno vrcholu");
    return;
  }
  let w;
  console.log(currentMode);
  if (currentMode == "hrana"){
const resultIn = Array(numVertices).fill(Infinity);
const resultOut = Array(numVertices).fill(Infinity);

// load CURRENT graph values
for (let i = 0; i < numVertices; i++) {
  if (!graph.p_list[v_start][i].isEmpty()) {

    resultIn[i] = graph.p_list[v_start][i].front().weight;
  }

  if (!graph.p_list[i][v_start].isEmpty()) {
    resultOut[i] = graph.p_list[i][v_start].front().weight;
  }
}
  try{
    win.split(",").forEach(pair => {
      const [v, h] = pair.trim().split(":");
      console.log(Number(h));
      resultIn[Number(v)-1] = Number(h);
    });
    if (resultIn[v_start] == Infinity){
      resultIn[v_start] = 0;
    }


    wout.split(",").forEach(pair => {
      const [v, h] = pair.trim().split(":");
      
      resultOut[Number(v)-1] = Number(h);
    });
  }
  catch (e)
  {
    alert("zly vstup");
  }
  w = [resultIn,resultOut];
  if (resultOut[v_start] == Infinity){
    resultOut[v_start] = 0;
  }
  }
  else{
const parseArray = (str) => {
  const arr = str.split(",").map(x =>
    x.trim().toLowerCase() === "inf" ? Infinity : Number(x)
  );

  if (arr.some(v => Number.isNaN(v))) {
    alert("Zlý vstup");
    return null;
  }

  return arr;
};

const inArr = parseArray(win);
const outArr = parseArray(wout);

if (!inArr || !outArr) return;

w = [inArr, outArr];
  }
  console.log(w);
  console.log(v_start);
  graph.update(v_start, w);

  resetShortestQueues();
  updateCytoscapeEdges(graph);
}

function updateCytoscapeEdges(graph) {
  if (!cy) return;

  cy.edges().remove();

  for (let i = 0; i < graph.V; i++) {
    for (let j = 0; j < graph.V; j++) {
      const queue = graph.p_list[i][j];

      if (!queue || queue.isEmpty() || i === j) continue;

      const path = queue.front();

      cy.add({
        data: {
          id: `e_${i}_${j}`,
          source: (path.start + 1).toString(),
          target: (path.end + 1).toString(),
          weight: path.weight,
        },
      });
    }
  }
}
export function updateCytoscapeEdgesCode(graph, colorMap) {
  if (!cy || !graph) return;

  cy.edges().remove();

  const edgeExists = new Set();

  const getColor = (key) =>
    colorMap instanceof Map ? colorMap.get(key) : null;

  // =========================
  // 1. GRAPH EDGES (always drawn)
  // =========================
  for (let i = 0; i < graph.V; i++) {
    for (let j = 0; j < graph.V; j++) {
      const queue = graph.p_list[i][j];
      if (!queue || queue.isEmpty() || i === j) continue;

      const path = queue.front();

      const u = path.start + 1;
      const v = path.end + 1;
      const key = `${u-1}-${v-1}`;

      const color = getColor(key) || "#999";

      cy.add({
        data: {
          id: `e_${key}`,
          source: `${u}`,
          target: `${v}`,
          weight: path.weight,
          color
        }
      });

      edgeExists.add(key);
    }
  }

  // =========================
  // 2. EXTRA EDGES (ONLY NEW ONES)
  // =========================
  if (colorMap instanceof Map) {
    for (const [key, color] of colorMap.entries()) {
      if (!key.includes("-") || key.startsWith("P")) continue;

      const [x, y] = key.split("-").map(Number);

      const u = x + 1;
      const v = y + 1;

      const finalKey = `${u-1}-${v-1}`;

      if (edgeExists.has(finalKey)) continue;

      // try to get weight from graph
      let weight = "";

      if (
        graph.p_list[x]?.[y] &&
        !graph.p_list[x][y].isEmpty()
      ) {
        weight = graph.p_list[x][y].front().weight;
      }

      cy.add({
        data: {
          id: `e_extra_${finalKey}`,
          source: `${u}`,
          target: `${v}`,
          weight,
          color: color || "#999"
        }
      });

      edgeExists.add(finalKey);
    }
  }
}



window.showName = showName;
window.getdistance = getdistance;
window.getpath = getpath;
window.doupdate = doupdate;
window.addEventListener("resize", () => {
  if (cy) {
    cy.resize();
    cy.fit();
  }
});
let currentMode = null;

window.addEventListener("DOMContentLoaded", () => {

  const vectorDiv = document.getElementById("vectorInputs");
  const edgeDiv = document.getElementById("edgeInputs");
  document.querySelectorAll('input[name="inputType"]').forEach(radio => {
    radio.addEventListener("change", function () {
      if (graph == null)
      {
        alert("zadajte najprv počet vrcholov");
        return;
      }
      currentMode = this.value;
      if (currentMode === "hrana") 
      {
        vectorDiv.style.display = "none";
        edgeDiv.style.display = "block";
      }
      else{
        edgeDiv.style.display = "none";
        vectorDiv.style.display = "block";
      }
      //alert(currentMode);
    });
  });
});
window.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll('input[name="mode1"]').forEach(radio => {
    radio.addEventListener("change", function () {
      if (graph == null)
      {
        alert("zadajte najprv počet vrcholov");
        return;
      }
      queueMode = this.value;
      console.log(queueMode);
      console.log('queueMode');
      if (queueMode === "L") {
        resetLocallyShortestQueues();
      } else {
        resetShortestQueues();

      }
    });
  });
});