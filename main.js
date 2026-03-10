import { Graph } from "./graph.js";

let graph;
let cy;
let ctr = 0;
let node1;

function showName() {

let numVertices = parseInt(document.getElementById("nameInput").value);

const elements = [];

graph = new Graph(numVertices);

for (let i = 1; i <= numVertices; i++) {

elements.push({
data: { id: i.toString(), label: i.toString() }
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
target: (path.end + 1).toString()
}
});

}
}

cy = cytoscape({
container: document.getElementById("cy"),
elements: elements,

style: [
{
selector: "node",
style: {
"background-color": "#0074D9",
"label": "data(label)",
"color": "#fff",
"text-valign": "center",
"text-halign": "center"
}
},

{
selector: "edge",
style: {
    "curve-style": "bezier",
    "target-arrow-shape": "triangle",
    "label": "data(weight)",
    "font-size": "14px",
    "text-background-color": "white",
    "text-background-opacity": 1,
    "text-background-padding": "2px"
}
},
{
  selector: '.clicked',
  style: {
    'border-color': 'green',
    'border-width': 3
  }
}
],

layout: { name: "circle" }

});

cy.on("tap", "node", function(evt) {

const node = evt.target;

if (ctr < 1) {

node1 = parseInt(node.id());
ctr++;
node.addClass("clicked");

} else {

cy.nodes().removeClass("clicked");

let whole = `P{${node1},${parseInt(node.id())}} obsahuje cesty:`;
let current = graph.p_list[node1-1][parseInt(node.id())-1];

const Q = [];

while (!current.isEmpty()) {

let path = current.dequeue();

Q.push(path);

let pathstring = `{ ${path.start+1}`;
pathstring = _parsepath(path, pathstring);
pathstring += "},";

whole += pathstring;

}

for (let i=0;i<Q.length;i++)
current.enqueue(Q[i]);

alert(whole);

ctr = 0;

}

});

}

function _parsepath(result,startstring){

let pathstring = startstring;

while (result.r != null) {

result = result.r;
pathstring += `,${result.start+1}`;

}

return pathstring;

}

function getdistance(x,y){

x = parseInt(x)-1;
y = parseInt(y)-1;

let result = graph.distance(x,y);

alert(`Vzdialenosť medzi vrcholmi ${x+1} a ${y+1} je ${result == Infinity ? "nekonečno" : result}.`);

}

function getpath(x,y){

x = parseInt(x)-1;
y = parseInt(y)-1;

let result = graph.path(x,y);

if (result == null) {

alert("Cesta neexistuje.");
return;

}

let pathstring = `Cesta obsahuje vrcholy: ${result.start+1}`;

pathstring = _parsepath(result,pathstring);

alert(pathstring+".");

}

function doupdate(v,win,wout){

v = parseInt(v)-1;

let w = [
win.split(",").map(x => x.trim()=="inf"?Infinity:Number(x)),
wout.split(",").map(x => x.trim()=="inf"?Infinity:Number(x))
];

graph.update(v,w);

updateCytoscapeEdges();

}

function updateCytoscapeEdges() {

if (!cy) return;

cy.edges().remove();

for (let i=0;i<graph.V;i++){
for (let j=0;j<graph.V;j++){

const queue = graph.p_list[i][j];

if (!queue || queue.isEmpty() || i===j) continue;

const path = queue.front();

cy.add({
data:{
id:`e_${i}_${j}`,
source:(path.start+1).toString(),
target:(path.end+1).toString(),
weight:path.weight
}
});

}
}

}

window.showName = showName;
window.getdistance = getdistance;
window.getpath = getpath;
window.doupdate = doupdate;