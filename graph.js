import { MinPriorityQueue } from "https://cdn.skypack.dev/@datastructures-js/priority-queue";
import { addpadding,shrinkpadding,addhistory, addCodeLine } from "./editor.js";
export class Path {
  constructor(start, end) {
    this.node_p = null;
    this.node_p_star = null;
    this.start = start;
    this.end = end;
    this.l = null;
    this.r = null;
    this.weight = Infinity;
    this.L = [];
    this.L_star = [];
    this.R = [];
    this.R_star = [];
  }
}
function pathKey(p) {
  return _parsepath(p, p.start);
}
function _parsepath(result, startstring) {
  let pathstring = startstring;

  while (result.r != null) {
    result = result.r;
    pathstring += `,${result.start + 1}`;
  }

  return pathstring;
}
function getEdgesFromPath(path) {
  let edges = [];

  // full path edge (shortcut like 1-3)
  edges.push(`${path.start}-${path.end}`);

  // walk through the chain using r
  let current = path;

  while (current.r != null) {
    const next = current.r;

    // edge between consecutive nodes
    if (!edges.includes(`${current.start}-${next.start}`))
    {
          console.log(`${current.start}-${next.start}`);
      edges.push(`${current.start}-${next.start}`);
    }


    current = next;
  }

  return edges;
}
export class Graph {

constructor(vertices, matrix = null, logger = () => {}) {
    this.V = vertices;
    this.log = logger;
    console.log("yes");
    this.p_list = Array.from({ length: vertices }, () =>
        Array.from(
            { length: vertices },
            () => new MinPriorityQueue(path => path.weight)
        )
    );

    this.p_star_list = Array.from({ length: vertices }, () =>
        Array.from(
            { length: vertices },
            () => new MinPriorityQueue(path => path.weight)
        )
    );
    if (matrix) {
        this.initializeFromMatrix(matrix);
        //this.initializeLocallyShortestPaths();
    }
}
createIncomingEdges(matrix) {
    const n = matrix.length;

    // incoming[v][u] = weight of edge u -> v (Infinity if none)
    const incoming = Array.from(
        { length: n },
        () => Array(n).fill(Infinity)
    );

    for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
            if (u !== v && matrix[u][v] < Infinity) {
                incoming[v][u] = matrix[u][v];
            }
        }
    }

    return incoming;
}
initializeFromMatrix(matrix) {
    const n = this.V;
    const dist = matrix.map(row => [...row]);
    const edges  = matrix.map(row => [...row]);
    const next = Array.from({ length: n }, () => Array(n).fill(-1));
    const count = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        dist[i][i] = 0;
        next[i][i] = i;
        count[i][i] = 1;

        for (let j = 0; j < n; j++) {
            if (i !== j && matrix[i][j] < Infinity) {
                next[i][j] = j;
                count[i][j] = 1;
            }
        }
    }

    // Floyd-Warshall
    for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
            if (dist[i][k] === Infinity) continue;
            if (i === k) continue;
            for (let j = 0; j < n; j++) {
                if (dist[k][j] === Infinity) continue;
                if (j === k || i === j) continue;
                const through = dist[i][k] + dist[k][j];

                if (through < dist[i][j]) {
                    dist[i][j] = through;
                    next[i][j] = next[i][k];
                    count[i][j] = count[i][k] * count[k][j];
                } else if (
                    through === dist[i][j] &&
                    through < Infinity &&
                    next[i][j] !== next[i][k]
                ) {
                    count[i][j] += count[i][k] * count[k][j];
                }
            }
        }
    }

    console.log("dist:", dist);
    alert("Initializing graph...");

    this.checkUniqueShortestPaths(edges);


    // Build Path objects
    // trivial
    const pathTable = Array.from({ length: n }, () => Array(n).fill(null));
    for (let i = 0; i < n; i++) {
      const path = new Path(i, i);
      path.weight = 0;
      pathTable[i][i] = path;

      this.p_list[i][i].enqueue(path);
      this.p_star_list[i][i].enqueue(path);
  }
  for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
          if (i !== j && edges[i][j] < Infinity) {
              let path = new Path(i, j);
              path.weight = edges[i][j];
              this.p_list[i][j].enqueue(path);
              path.l = this.p_list[i][i].front();
              path.r = this.p_list[j][j].front();
              path.l.R.push(path);
              path.r.L.push(path);
                            pathTable[i][j] = path;
              if (dist[i][j] !== edges[i][j]) continue;

              this.p_star_list[i][j].enqueue(path);
              path.l.R_star.push(path);
              path.r.L_star.push(path);

          }
      }
  }


  for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {

        if (i === j || dist[i][j] === Infinity){
          continue;
        }
        let path = new Path(i, j);
        path.weight = dist[i][j];
        
        // Already inserted above as a direct edge
        if (dist[i][j] === edges[i][j])
            continue;
        pathTable[i][j] = path;
        this.p_list[i][j].enqueue(path);
        this.p_star_list[i][j].enqueue(path);
      }
  }
    
  // Pass 2: set l and r
  for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {

          if (i === j || dist[i][j] === Infinity)
              continue;

          const path = pathTable[i][j];

          // a = second vertex on shortest path i -> j
          const a = next[i][j];

          // Find b = predecessor of j
          let b = i;
          while (next[b][j] !== j) {
              b = next[b][j];
          }

        path.l = pathTable[i][b];
        path.r = pathTable[a][j];
        if (path.l) {
            if (!path.l.R.includes(path)) path.l.R.push(path);
            if (!path.l.R_star.includes(path)) path.l.R_star.push(path);
        }

        if (path.r) {
            if (!path.r.L.includes(path)) path.r.L.push(path);
            if (!path.r.L_star.includes(path)) path.r.L_star.push(path);
        }

      }
  }
this.initializeLocallyShortestPaths(dist, this.createIncomingEdges(dist));
}
checkUniqueShortestPaths(matrix) {
    const n = matrix.length;

    for (let source = 0; source < n; source++) {

        const dist = Array(n).fill(Infinity);
        const ways = Array(n).fill(0);
        const visited = Array(n).fill(false);

        dist[source] = 0;
        ways[source] = 1;

        for (;;) {

            // Extract closest unvisited vertex
            let u = -1;
            let best = Infinity;

            for (let v = 0; v < n; v++) {
                if (!visited[v] && dist[v] < best) {
                    best = dist[v];
                    u = v;
                }
            }

            if (u === -1)
                break;

            visited[u] = true;

            for (let v = 0; v < n; v++) {

                if (u === v) continue;
                if (matrix[u][v] === Infinity) continue;

                const nd = dist[u] + matrix[u][v];

                if (nd < dist[v]) {
                    dist[v] = nd;
                    ways[v] = ways[u];
                }
                else if (nd === dist[v]) {
                    ways[v] += ways[u];
                }
            }
        }

        for (let v = 0; v < n; v++) {
            if (ways[v] > 1) {
                throw new Error(
                    `Multiple shortest paths from ${source + 1} to ${v + 1}`,{cause:[source + 1, v + 1]}
                );
            }
        }
    }
}
initializeLocallyShortestPaths(outgoingEdges, incomingEdges) {
    for (let i = 0; i < this.V; i++) {
        for (let j = 0; j < this.V; j++) {

            if (i === j) continue;

            const P = this.p_list[i][j];
            if (!P || P.isEmpty()) continue;

            const path = P.front();

            // Left extensions
            for (let k = 0; k < path.l.L_star.length; k++) {

                const xb = path.l.L_star[k];

                const newPath = new Path(xb.start, j);
                newPath.weight = xb.weight + path.weight;

                const sp = this.p_star_list[newPath.start][newPath.end];

                if (!sp.isEmpty() &&
                    newPath.weight === sp.front().weight) {
                    continue;
                }

                newPath.l = xb;
                newPath.r = path;

                const pq = this.p_list[xb.start][j];

                if (!this.hasDuplicate(pq, newPath.l, newPath.r)) {
                    pq.enqueue(newPath);
                    xb.R.push(newPath);
                    path.L.push(newPath);
                }
            }

            // Right extensions
            for (let k = 0; k < path.r.R_star.length; k++) {

                const ay = path.r.R_star[k];

                const newPath = new Path(i, ay.end);
                newPath.weight = ay.weight + path.weight;

                const sp = this.p_star_list[newPath.start][newPath.end];

                if (!sp.isEmpty() &&
                    newPath.weight === sp.front().weight) {
                    continue;
                }

                newPath.l = path;
                newPath.r = ay;

                const pq = this.p_list[i][ay.end];

                if (!this.hasDuplicate(pq, newPath.l, newPath.r)) {
                    pq.enqueue(newPath);
                    path.R.push(newPath);
                    ay.L.push(newPath);
                }
            }
        }
    }
}
hasDuplicate(queue, l, r) {
    const items = queue.toArray();
    console.log("paths");
    for (const item of items) {
        let p = item; // depending on your MinPriorityQueue
        console.log(`l`, p.l, l);
        console.log(`r`, p.r, r);
        if (((p.l == null && l == null) && (p.r == null && r == null)) || (p.l && l && p.l.start === l.start && p.l.end === l.end && p.r && r && p.r.start === r.start && p.r.end === r.end)) {
            return true;
        }
    }

    return false;
}
clone() {
  const newGraph = new Graph(this.V, this.log);

  // Map old Path -> new Path
  const map = new Map();

  // ---------- Phase 1: copy all paths ----------
  for (let i = 0; i < this.V; i++) {
    for (let j = 0; j < this.V; j++) {
      const oldQueue = this.p_list[i][j];
      const newQueue = newGraph.p_list[i][j];

      const temp = [];

      while (!oldQueue.isEmpty()) {
        const oldPath = oldQueue.dequeue();

        const newPath = new Path(oldPath.start, oldPath.end);
        newPath.weight = oldPath.weight;

        map.set(oldPath, newPath);
        temp.push(oldPath);
        newQueue.enqueue(newPath);
      }

      // restore original queue
      for (const p of temp) oldQueue.enqueue(p);
    }
  }

  // ---------- Phase 2: reconnect references ----------
  for (const [oldPath, newPath] of map.entries()) {
    newPath.l = map.get(oldPath.l) || null;
    newPath.r = map.get(oldPath.r) || null;

    newPath.L = (oldPath.L || []).map(p => map.get(p));
    newPath.R = (oldPath.R || []).map(p => map.get(p));

    newPath.L_star = (oldPath.L_star || []).map(p => map.get(p));
    newPath.R_star = (oldPath.R_star || []).map(p => map.get(p));
  }

  // ---------- Phase 3: copy p_star_list ----------
  for (let i = 0; i < this.V; i++) {
    for (let j = 0; j < this.V; j++) {
      const oldQueue = this.p_star_list[i][j];
      const newQueue = newGraph.p_star_list[i][j];

      const temp = [];

      while (!oldQueue.isEmpty()) {
        const oldPath = oldQueue.dequeue();

        temp.push(oldPath);

        const mapped = map.get(oldPath);
        if (mapped) newQueue.enqueue(mapped);
      }

      for (const p of temp) oldQueue.enqueue(p);
    }
  }

  return newGraph;
}
  distance(x, y) {
    this.log(`distance(${x+1},${y+1}):`);
    addpadding();
    this.log(`if P(${x+1},${y+1}) je prázdny`);

    if (this.p_list[x][y].size() == 0) {
        addpadding();
        addhistory(this,new Map([[`${x}-${y}`,"red"],[`P${x}-${y}`,"red"]]));
        this.log(`return nekonečno`);

        shrinkpadding();
        shrinkpadding();
    
      return Infinity;
    }
    addhistory(this,new Map([[`${x}-${y}`,"green"],[`P${x}-${y}`,"green"]]));
    console.log("yes");
    this.log(`return ${this.p_list[x][y].front().weight}`);
    shrinkpadding();

    return this.p_list[x][y].front().weight;
  }

  path(x, y) {
    this.log(`path(${x+1},${y+1}):`);
    addpadding();
    addhistory(this,new Map([[`P${x}-${y}`,"red"]]));
    this.log(`if P(${x+1},${y+1}) je prázdny `);
    if (this.p_list[x][y].size() == 0){
        addhistory(this,new Map([[`${x}-${y}`,"red"],[`P${x}-${y}`,"red"]]));
        addpadding();
        this.log(`return Nil`);
        shrinkpadding();
        shrinkpadding();
        return null;
    }
    let result = this.p_list[x][y].front();
    let pathstring = `Cesta (${result.start + 1}`;
    addhistory(this,new Map([[`${x}-${y}`,"green"],[`P${x+1}-${y+1}`,"green"]]));
    pathstring = _parsepath(result, pathstring);
    pathstring+= ")"
    this.log(`return ${pathstring}`)
    shrinkpadding();
    return this.p_list[x][y].front();
  }

  /* cleanup(), fixup(), update() */

  cleanup(v) {
    addCodeLine(`cleanup(${v+1}):`);
    addpadding();
    const Q = [];

    if (!this.p_list[v][v] || this.p_list[v][v].isEmpty())
      {
        shrinkpadding();
        return;
      } 
    if(!Q.includes(this.p_list[v][v].front()))
    {
        Q.push(this.p_list[v][v].front());
    }


    addCodeLine(`Q <- {${this.p_list[v][v].front().start+1}}`);
    addCodeLine(`while Q nie je prazdny:`);
    addpadding();
    while (Q.length !== 0) {
      const p = Q.shift(); // match deque  FIFO behavior
      addCodeLine(`vyber cestu {${_parsepath(p,p.start+1)}}`);
      if (!p) continue;
      console.log("cleanup", p.L);
      const neighbors = [...(p.L || []), ...(p.R || [])];
      let paths =neighbors.map((p) => `{${_parsepath(p,p.start+1)}},`)
      addCodeLine(`foreach pxy v {${paths}}`);
      addpadding();
      for (const p_xy of neighbors) {
        if (!p_xy) continue;
        addCodeLine(`pridaj {${_parsepath(p_xy,p_xy.start+1)}} do Q`);
        if(!Q.includes(p_xy))
        {
            Q.push(p_xy);
        }
        
        let line = "";
        let shortest = "";

        try {

          // remove from P_list
          let edges = getEdgesFromPath(p_xy);

          const map = new Map();

          // color all edges in the path
          edges.forEach(e => map.set(e, "red"));
          console.log('rem');
          // also keep your P marker
          map.set(`P${p_xy.start}-${p_xy.end}`, "red");

          //addhistory(this, map);
          this.p_list[p_xy.start][p_xy.end].remove((el) => el === p_xy);
          line += `odstráň {${_parsepath(p_xy,p_xy.start+1)}} z P(${p_xy.start+1},${p_xy.end+1})`
          
          if (p_xy.r) {

            line +=`,L(${_parsepath(p_xy.r,p_xy.r.start+1)})`;
            p_xy.r.L = (p_xy.r.L || []).filter((x) => x !== p_xy);
          }
          if (p_xy.l) {
            line +=`,R(${_parsepath(p_xy.l,p_xy.l.start+1)})`;
            p_xy.l.R = (p_xy.l.R || []).filter((x) => x !== p_xy);
          }

          if (
            
            !this.p_star_list[p_xy.start][p_xy.end].isEmpty() &&
            this.p_star_list[p_xy.start][p_xy.end].front() === p_xy
          ) {
            console.log("removing from p_star_list", p_xy);
            // remove from P_list
            let edges = getEdgesFromPath(p_xy);

            const map = new Map();

            // color all edges in the path
            edges.forEach(e => map.set(e, "red"));
            console.log('rem');
            // also keep your P marker
            map.set(`P${p_xy.start}-${p_xy.end}`, "red");

            //addhistory(this, map);
            shortest += `odstráň {${_parsepath(p_xy,p_xy.start+1)}} z P*(${p_xy.start+1},${p_xy.end+1})`;
            this.p_star_list[p_xy.start][p_xy.end].remove((el) => el === p_xy);
            if (p_xy.r)
            {


              shortest +=`,L*(${_parsepath(p_xy.r,p_xy.r.start+1)})`;
              p_xy.r.L_star = (p_xy.r.L_star || []).filter((x) => x !== p_xy);
            }
            if (p_xy.l)
            {
              shortest +=`,R*(${_parsepath(p_xy.l,p_xy.l.start+1)})`;
              p_xy.l.R_star = (p_xy.l.R_star || []).filter((x) => x !== p_xy);
            }
          }
        } catch (e) {
          console.log(e.message,e.cause);
          throw e;
        }
        finally{
          if (line !== "")
          {
          addCodeLine(line);
          }
          if (shortest !== "")
          {
          addCodeLine(shortest);
          }
        }
      }
      shrinkpadding();
    }
    shrinkpadding();
    shrinkpadding();
    console.log("cleanup done");
    console.log(this.p_list);
    console.log(this.p_star_list);
  }

  fixup(v, w) {
    console.log("fixup", v, w);
    const from =w[0].filter((a)=> a!== Infinity );
    const to =w[1].filter((a)=> a!== Infinity );
    addCodeLine(`fixup(${v+1},[${from }],[${to}]):`);
    const [weight_from, weight_to] = w;
    // ---------- phase 1 ----------
    addCodeLine(`foreach u != ${v+1}:`);
    addCodeLine(`//infinity skipped`);
    addpadding();

    for (let u = 0; u < weight_from.length; u++) {
      if (u == v) {
        continue;
      }
      let w_vu = weight_from[u];

      if (w_vu < Infinity) {

        addCodeLine(`if ${v+1}->${u+1}<inf`);
        addpadding();
        let path = new Path(v, u);
        path.weight = w_vu;
        path.l = this.p_list[v][v].front();
        path.r = this.p_list[u][u].front();


        path.r?.L.push(path);
        path.l?.R.push(path);
        addCodeLine(`w({${v+1},${u+1}}) <- {${w_vu}}`);
        //addhistory(this,new Map([[`${v}-${v}`,"green"],[`P${v}-${v}`,"green"]]));
        addCodeLine(`l({${v+1},${u+1}}) <- {${v+1}}`);
        //addhistory(this,new Map([[`${u}-${u}`,"green"],[`P${u}-${u}`,"green"]]));
        addCodeLine(`r({${v+1},${u+1}}) <- {${u+1}}`);
        this.p_list[v][u].enqueue(path);
        //addhistory(this,new Map([[`${v}-${u}`,"green"],[`P${v}-${u}`,"green"]]));
        addCodeLine(`pridaj {${v+1},${u+1}} do P(${v+1},${u+1}), L({${u+1}}), R({${v+1}})`);


        shrinkpadding();
      }

      let w_uv = weight_to[u];

      if (w_uv < Infinity) {

        addCodeLine(`if ${u+1}->${v+1}<inf`);
        addpadding();
        let path = new Path(u, v);
        path.weight = w_uv;

        path.l = this.p_list[u][u].front();
        path.r = this.p_list[v][v].front();



        path.l?.R.push(path);
        path.r?.L.push(path);
        addCodeLine(`w({${u+1},${v+1}}) <- {${w_uv}}`);
        //addhistory(this,new Map([[`${u}-${u}`,"green"],[`P${u}-${u}`,"green"]]));
        addCodeLine(`l({${u+1},${v+1}}) <- {${u+1}}`);
        //addhistory(this,new Map([[`${v}-${v}`,"green"],[`P${v}-${v}`,"green"]]));
        addCodeLine(`r({${u+1},${v+1}}) <- {${v+1}}`);
        this.p_list[u][v].enqueue(path);
        //addhistory(this,new Map([[`${u}-${v}`,"green"],[`P${u}-${v}`,"green"]]));
        addCodeLine(`pridaj ({${u+1},${v+1}}) do P(${u+1},${v+1}), L({${v+1}}), R({${u+1}})`);

        shrinkpadding();
      }

    }
    shrinkpadding();
    // ---------- phase 2 ----------
    addCodeLine(`H <- prázdny rad`);
    const H = new MinPriorityQueue({
      compare: (a, b) => a.weight - b.weight,
    });
    addCodeLine(`foreach (x, y):`);
    addpadding();
    for (let i = 0; i < this.p_list.length; i++) {
      for (let j = 0; j < this.p_list[i].length; j++) {
        const P = this.p_list[i][j];

        if (!P || P.isEmpty()) continue;
        if (i != j)
        {
          addCodeLine(`pridaj cestu {${_parsepath(P.front(),P.front().start+1)}} do H //nekonečno vynechané`);
        }

        H.enqueue(P.front());
      }
    }
    shrinkpadding();
    // ---------- phase 3 ----------

    const n = this.p_list.length;

    const visited = Array.from({ length: n }, () => Array(n).fill(false));
    addCodeLine(`while H != prázdny rad: //nekonečno vynechané`);
    addpadding();
    while (!H.isEmpty()) {
      const path_xy = H.dequeue();
      if (this.path.start != this.path.end)
      {
        addCodeLine(`vyber cestu {${_parsepath(path_xy,path_xy.start+1)}}`);
      }

      if (!path_xy) continue;

      if (visited[path_xy.start][path_xy.end]) continue;
      if (this.path.start != this.path.end)
      {
      addCodeLine(`{${_parsepath(path_xy,path_xy.start+1)}} je prvá pre (${path_xy.start+1},${path_xy.end+1})`);
      }
      addpadding();
      visited[path_xy.start][path_xy.end] = true;
      if (this.p_star_list[path_xy.start][path_xy.end].front() == null) {
        addCodeLine(`if {${_parsepath(path_xy,path_xy.start+1)}} nie je v P*(${path_xy.start+1},${path_xy.end+1})`);
        addpadding();
        console.log ("step3");
        //console.log(this.p_star_list[path_xy.start][path_xy.end].front());

        console.log(path_xy);
        console.log(this.p_star_list[path_xy.start][path_xy.end]);
        this.p_star_list[path_xy.start][path_xy.end].enqueue(path_xy);
        if (path_xy.l?.R_star?.indexOf(path_xy) == -1){
          path_xy.l?.R_star?.push(path_xy);
        }
        if (!path_xy.r?.L_star?.some(p => pathKey(p) === pathKey(path_xy))) {
          path_xy.r?.L_star?.push(path_xy);
        }

        // remove from P_list
        let edges = getEdgesFromPath(path_xy);

        let map = new Map();

        // color all edges in the path
        edges.forEach(e => map.set(e, "green"));
        console.log('rem');
        // also keep your P marker
        map.set(`P${path_xy.start}-${path_xy.end}`, "green");

        //addhistory(this, map);
        addCodeLine(`pridaj {${_parsepath(path_xy,path_xy.start+1)}} do P*(${path_xy.start+1},${path_xy.end+1}), L*({${_parsepath(path_xy.r,path_xy.r.start+1)}}), R*({${_parsepath(path_xy.l,path_xy.l.start+1)}})`);

        let paths =(path_xy.l?.L_star||[]).map((p) => `{${_parsepath(p,p.start+1)}},`);
        addCodeLine(`foreach pxb v L*({${paths}})`);
        addpadding();
      
        for (const path_new_xb of path_xy.l?.L_star || []) {

          let path_new_xy = new Path(path_new_xb.start, path_xy.end);
          addCodeLine(`cesta {${path_new_xy.start+1},${path_new_xy.end+1 }}`);
          path_new_xy.weight =
            this.p_list[path_new_xb.start][path_xy.start].front() === null ? 0:this.p_list[path_new_xb.start][path_xy.start].front().weight+
            path_xy.weight;

          path_new_xy.l = path_new_xb;
          path_new_xy.r = path_xy;
          if (this.hasDuplicate(this.p_list[path_new_xy.start][path_new_xy.end], path_new_xy.l, path_new_xy.r)) continue;
          console.log("enqueueing", path_new_xy);
          this.p_list[path_new_xy.start][path_new_xy.end].enqueue(path_new_xy);
          path_xy.L.push(path_new_xy);
          path_new_xb.R.push(path_new_xy);

          H.enqueue(path_new_xy);
          //addCodeLine(`w({${_parsepath(path_new_xy,path_new_xy.start+1)}}) <- w({${_parsepath(this.p_list[path_new_xb.start][path_xy.start].front(),this.p_list[path_new_xb.start][path_xy.start].front().start+1)}) + w({${_parsepath(path_xy,path_xy.start+1)})`);

          let edges = getEdgesFromPath(path_new_xy.l);

          let map = new Map();

          // color all edges in the path
          edges.forEach(e => map.set(e, "green"));
          console.log('rem');
          // also keep your P marker
          map.set(`P${path_new_xy.l.start}-${path_new_xy.l.end}`, "green");

          //addhistory(this, map);
          addCodeLine(`l({${_parsepath(path_new_xy,path_new_xy.start+1)}}) <- {${_parsepath(path_new_xb,path_new_xb.start+1)}}}`);
          edges = getEdgesFromPath(path_new_xy.r);

          map = new Map();

          // color all edges in the path
          edges.forEach(e => map.set(e, "green"));
          console.log('rem');
          // also keep your P marker
          map.set(`P${path_new_xy.r.start}-${path_new_xy.r.end}`, "green");
          //addhistory(this, map);
          addCodeLine(`r({${_parsepath(path_new_xy,path_new_xy.start+1)}}) <- {${_parsepath(path_xy,path_xy.start+1)}}}`);

          edges = getEdgesFromPath(path_new_xy);

          map = new Map();

          // color all edges in the path
          edges.forEach(e => map.set(e, "green"));
          console.log('rem');
          // also keep your P marker
          map.set(`P${path_new_xy.start}-${path_new_xy.end}`, "green");
          //addhistory(this, map);
          addCodeLine(`pridaj ({${_parsepath(path_new_xy,path_new_xy.start+1)}}) do P(${path_new_xy.start+1},${path_new_xy.end+1}), L({${_parsepath(path_xy,path_xy.start+1)}}), R({${_parsepath(path_new_xb,path_new_xb.start+1)}}),H`);
        }
        shrinkpadding();
        paths =(path_xy.r?.R_star || []).map((p) => `{${_parsepath(p,p.start+1)}},`);
        addCodeLine(`foreach pxb v R*({${paths}})`);
        addpadding();
        for (const path_a_new_y of path_xy.r?.R_star || []) {
          console.log ("has r");
          let path_x_new_y = new Path(path_xy.start, path_a_new_y.end);
          addCodeLine(`cesta {${path_x_new_y.start+1},${path_x_new_y.end+1 }}`);
          console.log(this.p_list[path_xy.end][path_a_new_y.end].front());
          const edgeFront = this.p_list[path_xy.end][path_a_new_y.end].front();
          if (!edgeFront) continue
          path_x_new_y.weight =
            this.p_list[path_xy.end][path_a_new_y.end].front().weight +//null exception
            path_xy.weight;

          path_x_new_y.l = path_xy;
          path_x_new_y.r = path_a_new_y;
          if (this.hasDuplicate(this.p_list[path_x_new_y.start][path_x_new_y.end], path_x_new_y.l, path_x_new_y.r)) continue;
          console.log("enqueueing", path_x_new_y);
          this.p_list[path_x_new_y.start][path_x_new_y.end].enqueue(
            path_x_new_y,
          );

          path_a_new_y.L.push(path_x_new_y);
          path_xy.R.push(path_x_new_y);

          H.enqueue(path_x_new_y);
          addCodeLine(`w({${_parsepath(path_x_new_y,path_x_new_y.start+1)}}) <- w({${_parsepath(this.p_list[path_xy.end][path_a_new_y.end].front(),this.p_list[path_xy.end][path_a_new_y.end].front().start+1)}) + w({${_parsepath(path_xy,path_xy.start+1)})`);
          edges = getEdgesFromPath(path_x_new_y.l);

          map = new Map();

          // color all edges in the path
          edges.forEach(e => map.set(e, "green"));
          console.log('rem');
          // also keep your P marker
          map.set(`P${path_x_new_y.l.start}-${path_x_new_y.l.end}`, "green");
          //addhistory(this, map);
          addCodeLine(`l({${_parsepath(path_x_new_y,path_x_new_y.start+1)}}) <- {${_parsepath(path_xy,path_xy.start+1)}}}`);
          edges = getEdgesFromPath(path_x_new_y.r);

          map = new Map();

          // color all edges in the path
          edges.forEach(e => map.set(e, "green"));
          console.log('rem');
          // also keep your P marker
          map.set(`P${path_x_new_y.r.start}-${path_x_new_y.r.end}`, "green");
          //addhistory(this, map);
          addCodeLine(`r({${_parsepath(path_x_new_y,path_x_new_y.start+1)}}) <- {${_parsepath(path_a_new_y,path_a_new_y.start+1)}}}`);
          edges = getEdgesFromPath(path_x_new_y);

          map = new Map();

          // color all edges in the path
          edges.forEach(e => map.set(e, "green"));
          console.log('rem');
          // also keep your P marker
          map.set(`P${path_x_new_y.start}-${path_x_new_y.end}`, "green");
          //addhistory(this, map);
         addCodeLine(`pridaj ({${_parsepath( path_x_new_y, path_x_new_y.start+1)}}) do P(${ path_x_new_y.start+1},${ path_x_new_y.end+1}), L({${_parsepath(path_a_new_y,path_a_new_y.start+1)}}), R({${_parsepath(path_xy,path_xy.start+1)}}),H`);

        }
        shrinkpadding();
        shrinkpadding();
      }

      shrinkpadding();
    }

    shrinkpadding();
  }

  update(v, w) {
    const from =w[0].filter((a)=> a!== Infinity );
    const to =w[1].filter((a)=> a!== Infinity );
    addCodeLine(`update(${v+1},[${from }],[${to}]): ////nekonečno vynechané`);
    addpadding();
    alert(w[0]);
    this.cleanup(v);
    this.fixup(v, w);
    shrinkpadding();
  }
}
