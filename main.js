import { Graph } from "./graph.js";
import { initEditor, nextStep,addCodeLine,beforeStep,history,counter,goToLine,resetcurrentline} from "./editor.js";
import { formatWeight, parsePath, parseWeightValue, applyWeightUpdates } from "./utils.js";
export let graph = null;

export let cy;
let ctr = 0;
let node1;
let numVertices = null;
let queueMode;
let edge_matrix = null;
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

function promptManualEdges() {
  console.log("promptManualEdges called")
    const matrix = Array.from(
        { length: numVertices },
        () => Array(numVertices).fill(Infinity)
    );

    // distance from a vertex to itself
    for (let i = 0; i < numVertices; i++) {
        matrix[i][i] = 0;
    }

    const before = currentMode;
    currentMode = "hrana";

    try {
        for (let from = 0; from < numVertices; from++) {
            const input = prompt(
                `Zadajte hrany vychádzajúce z vrcholu ${from + 1} (napr. 2:3,4:1)\nPrázdne pole = žiadne hrany`
            );

            if (input === null) break;
            if (input.trim() === "") continue;

            for (const edge of input.split(",")) {
                const [to, weight] = edge.split(":").map(s => s.trim());

                matrix[from][Number(to) - 1] = Number(weight);
            }
        }
    } finally {
        currentMode = before;
    }

    return matrix;
}
function promptNumVertices() {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0, 0, 0, 0.6)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    const dialog = document.createElement("div");
    dialog.style.background = "#fff";
    dialog.style.borderRadius = "12px";
    dialog.style.padding = "24px";
    dialog.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
    dialog.style.maxWidth = "320px";
    dialog.style.width = "100%";
    dialog.style.textAlign = "center";

    const title = document.createElement("h3");
    title.textContent = "Zadaj počet vrcholov grafu:";
    title.style.margin = "0 0 16px";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.placeholder = "napr. 4";
    input.style.display = "block";
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.marginBottom = "16px";
    input.style.padding = "8px";

    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.justifyContent = "center";
    buttonRow.style.gap = "12px";

    const okButton = document.createElement("button");
    okButton.textContent = "OK";
    okButton.onclick = () => {
      const value = Number.parseInt(input.value, 10);
      if (!Number.isInteger(value) || value <= 0) {
        alert("Zadajte kladné celé číslo väčšie ako 0");
        return;
      }

      overlay.remove();
      numVertices = value;
      resolve(value);
    };

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Zrušiť";
    cancelButton.onclick = () => {
      overlay.remove();
      resolve(null);
    };

    buttonRow.appendChild(okButton);
    buttonRow.appendChild(cancelButton);
    dialog.appendChild(title);
    dialog.appendChild(input);
    dialog.appendChild(buttonRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    input.focus();
  });
}

function showInitialModePopup() {
  console.log("showInitialModePopup called");
  return new Promise(resolve => {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0, 0, 0, 0.6)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const dialog = document.createElement("div");
  dialog.style.background = "#fff";
  dialog.style.borderRadius = "12px";
  dialog.style.padding = "24px";
  dialog.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
  dialog.style.maxWidth = "420px";
  dialog.style.textAlign = "center";

  const title = document.createElement("h3");
  title.textContent = "Chcete použiť príklad alebo zadať hrany manuálne?";
  title.style.margin = "0 0 16px";

  const buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.justifyContent = "center";
  buttonRow.style.gap = "12px";

  const manualButton = document.createElement("button");
  manualButton.textContent = "manualne";
  manualButton.onclick = async () => {
    overlay.remove();
    const vertexCount = await promptNumVertices();
    if (vertexCount === null) {
      resolve(false);
      return;
    }
    edge_matrix = promptManualEdges();
    console.log("Manual edges matrix:", edge_matrix);
    resolve(true);
  };

  const exampleButton = document.createElement("button");
  exampleButton.textContent = "príklad";
  exampleButton.onclick = () => {
    overlay.remove();
    numVertices = 3;

    const before = currentMode;
    currentMode = "hrana";
    try {
      const vertexCount = 3;
      edge_matrix = [[0, 3, Infinity],
                     [10, 0, 4],
                     [5, Infinity, 0]];
      //doupdate(1, "2:3,3:2", "");
      //doupdate(2, "4:2", "1:3");
      //doupdate(3, "4:1", "1:2");
    } finally {
      currentMode = before;
    }
    resolve(true);
  };

  buttonRow.appendChild(manualButton);
  buttonRow.appendChild(exampleButton);
  dialog.appendChild(title);
  dialog.appendChild(buttonRow);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
        }
    );
}

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
    pathstring = parsePath(path, pathstring);
    pathstring += "}";

    const button = document.createElement("button");
    button.textContent = pathstring;

    const left =
      path.l == null
        ? "žiadna"
        : parsePath(path.l, (path.l.start + 1).toString() + ",");

    const right =
      path.r == null
        ? "žiadna"
        : parsePath(path.r, (path.r.start + 1).toString() + ",");

    const L = path.L?.map(p =>
      parsePath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    const R = path.R?.map(p =>
      parsePath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    const L_star = path.L_star?.map(p =>
      parsePath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    const R_star = path.R_star?.map(p =>
      parsePath(p, "{ " + (p.start + 1).toString()) + "}"
    ).join(", ") || "žiadna";

    button.onclick = () => {
      alert(
        `cesta: ${pathstring}\n` +
        `váha: ${formatWeight(path.weight)}\n` +
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
      let Q = [];

      let is = false;
      while (!current.isEmpty()) {
        let path = current.dequeue();
        is = true;
        Q.push(path);

        let pathstring = `{ ${path.start + 1}`;
        pathstring = parsePath(path, pathstring);
        pathstring += "},";

        whole += pathstring;
        
      }

      if (Q.length != 0){
        addPaths(Q, (i+1).toString()+", "+(j+1).toString());
      }

      for (let k = 0; k < Q.length; k++) current.enqueue(Q[k]);
    }
  }
}
// Pomocná funkcia na formátovanie susedov (rovnaká ako predtým)
function formatNeighborPath(pathNode) {
  if (!pathNode) return "None";
  return `Path(${pathNode.start + 1} → ${pathNode.end + 1}) [w: ${pathNode.weight}]`;
}
const tooltip = document.getElementById('path-tooltip');

async function showName() {
  console.log("showName called");
  if (numVertices != null)
  {
    alert("ak chcete vytvoriť nový graf obnovte stránku");
    return;
  }

  const shouldContinue = await showInitialModePopup();
  if (!shouldContinue) {
    return;
  }

  const elements = [];
  console.log("Creating graph with", numVertices, "vertices and edge matrix:", edge_matrix);
  try{
      graph = new Graph(numVertices,edge_matrix,addCodeLine);
  } catch (error) {
    numVertices = null;
    if (!error.cause ) {
        throw error;
    }
      alert(" Existuje viacero najkratších ciest medzi vrcholmi " + error.cause[0] + " a " + error.cause[1] + ". Algoritmus vyžaduje jedinečnú najkratšiu cestu medzi každou dvojicou vrcholov.");
      throw error;
  }



  //resetShortestQueues();
  resetLocallyShortestQueues();
  for (let i = 1; i <= numVertices; i++) {
    elements.push({
      data: { id: i.toString(), label: i.toString() },
    });
  }

  let edgeId = 0;

  for (let i = 0; i < graph.V; i++) {
    for (let j = 0; j < graph.V; j++) {
      const queue = graph.p_list[i][j];

      if (!queue || queue.isEmpty() || i === j) continue;

      const temp = [];
      let count = 0;
      while (!queue.isEmpty()) {
        const path = queue.dequeue();
        temp.push(path);

        elements.push({
          data: {
            id: "e" + edgeId++,
            source: (path.start + 1).toString(),
            target: (path.end + 1).toString(),
            weight: formatWeight(path.weight),
            color: count === 0 ? "#999" : "#FF851B",
            pathObj: path,
          },
        });
      console.log(`Added ${count} edge from ${i + 1} to ${j + 1}`);
            count++;
              }



      for (const path of temp) {
        queue.enqueue(path);
      }
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


// 1. Hover nad hranou - Zobraziť a naplniť box dáta-mi
cy.on('mouseover', 'edge', (evt) => {
  const edge = evt.target;
  const pathData = edge.data('pathObj');
  
  if (pathData) {
    edge.style({ 'width': 6 }); // Vizuálny hover efekt

    // Vygenerujeme rovnaký obsah z vlastností objektu Path
    tooltip.innerHTML = `
      <strong style="color:#333;">Informácie o ceste</strong><br>
      <strong>Vrcholy</strong> ${parsePath(pathData, (pathData.start+1).toString())}<br>
      <strong>Weight:</strong> ${pathData.weight === Infinity ? '∞' : pathData.weight}<br>
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 6px 0;">
      <strong>Left (l):</strong> ${formatNeighborPath(pathData.l)}<br>
      <strong>Right (r):</strong> ${formatNeighborPath(pathData.r)}<br>
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 6px 0;">
      <strong>Sizes (L/R):</strong> ${pathData.L?.length || 0} / ${pathData.R?.length || 0}<br>
      <strong>Shortest (L*/R*):</strong> ${pathData.L_star?.length || 0} / ${pathData.R_star?.length || 0}
    `;
    
    tooltip.style.display = 'block'; // Zobrazíme box
  }
});

// 2. Pohyb myši nad hranou - Dynamické posúvanie boxu s kurzorom
cy.on('mousemove', 'edge', (evt) => {
  const origin = evt.originalEvent;
  
  // Posunieme box o 15px doprava a 15px nadol od kurzora, aby nezavadzal pod šípkou
  tooltip.style.left = (origin.pageX + 15) + 'px';
  tooltip.style.top = (origin.pageY + 15) + 'px';
});

// 3. Odchod myši z hrany - Skryť box
cy.on('mouseout', 'edge', (evt) => {
  evt.target.removeStyle(); // Vrátime pôvodnú hrúbku hrany
  tooltip.style.display = 'none'; // Skryjeme box
});
}

function getdistance(x, y) {

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

  pathstring = parsePath(result, pathstring);

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
  if (currentMode == "hrana"){
const resultIn = Array(numVertices).fill(Infinity);
const resultOut = Array(numVertices).fill(Infinity);

// load CURRENT graph values
for (let i = 0; i < numVertices; i++) {
  let temp = [];
  while (!graph.p_list[v_start][i].isEmpty()) {

    let potential_path = graph.p_list[v_start][i].dequeue();
    temp.push(potential_path);
    if ((potential_path.start == potential_path.end)|| potential_path.l.start === potential_path.l.end && potential_path.r.start === potential_path.r.end) {
      resultIn[i] = potential_path.weight;
      break;
    }
  }

  for (const path of temp) {
    graph.p_list[v_start][i].enqueue(path);
  }
  temp = [];
  while (!graph.p_list[i][v_start].isEmpty()) {

    let potential_path = graph.p_list[i][v_start].dequeue();
    temp.push(potential_path);
    if ((potential_path.start == potential_path.end)|| potential_path.l.start === potential_path.l.end && potential_path.r.start === potential_path.r.end) {
      resultOut[i] = potential_path.weight;
      break;
    }
  }

  for (const path of temp) {
    graph.p_list[i][v_start].enqueue(path);
  }
}
  try{
    applyWeightUpdates(win, resultIn);
    if (resultIn[v_start] == Infinity){
      resultIn[v_start] = 0;
    }

    applyWeightUpdates(wout, resultOut);
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
  try {
    // error
    return str.split(",").map(value => parseWeightValue(value));
  } catch (e) {
    alert("Zlý vstup");
    return null;
  }
};

const inArr = parseArray(win);
const outArr = parseArray(wout);

if (!inArr || !outArr) return;

w = [inArr, outArr];
  }
  graph.update(v_start, w);

  resetShortestQueues();
  updateCytoscapeEdges(graph);
}

function isPathInQueue(path, queue) {
  if (!path || !queue || queue.isEmpty()) return false;

  const temp = [];
  let found = false;

  while (!queue.isEmpty()) {
    const current = queue.dequeue();
    if (current === path) found = true;
    temp.push(current);
  }

  temp.forEach(item => queue.enqueue(item));
  return found;
}

function getPathEdgeColor(graph, path) {
  if (!graph || !path) return "#999";

  const inStarList = isPathInQueue(
    path,
    graph.p_star_list?.[path.start]?.[path.end]
  );

  return inStarList ? "#999" : "#FF851B";
}

function updateCytoscapeEdges(graph) {
  if (!cy) return;

  // Clear all existing edges from the Cytoscape canvas before redrawing
  cy.edges().remove();

  // Iterate through all pairs of source (i) and target (j) vertices
  for (let i = 0; i < graph.V; i++) {
    for (let j = 0; j < graph.V; j++) {
      const queue = graph.p_list[i][j];

      // Skip if the queue is missing, empty, or represents a self-loop
      if (!queue || queue.isEmpty() || i === j) continue;

      // Temporary array to hold paths pulled from the priority queue
      // so we can restore the queue's original state later
      const tempPaths = [];

      // Extract and process every single path within the current priority queue
      while (!queue.isEmpty()) {
        const path = queue.dequeue();
        tempPaths.push(path);

        // Convert 0-indexed vertex IDs to 1-indexed for visual representation
        const sourceNode = (path.start + 1).toString();
        const targetNode = (path.end + 1).toString();

        // Generate a unique ID for the edge element. Append the array length 
        // as a suffix index to safely handle duplicate/parallel paths between the same nodes
        const edgeId = `e_${i}_${j}_${tempPaths.length}`;
        const color = getPathEdgeColor(graph, path);

        // Add the edge object to the Cytoscape instance
        cy.add({
          data: {
            id: edgeId,
            source: sourceNode,
            target: targetNode,
            weight: formatWeight(path.weight),
            color,
            pathObj: path
          },
        });
      }

      // RESTORE PHASE: Re-enqueue all extracted paths back into the priority queue
      // to ensure the underlying graph data structure remains completely unaltered
      for (const path of tempPaths) {
        queue.enqueue(path);
      }
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

      const color = getPathEdgeColor(graph, path);;

      cy.add({
        data: {
          id: `e_${key}`,
          source: `${u}`,
          target: `${v}`,
          weight: formatWeight(path.weight),
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
          weight: formatWeight(weight),
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
