import { MinPriorityQueue } from "https://cdn.skypack.dev/@datastructures-js/priority-queue";

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

export class Graph {
  constructor(vertices) {
    this.V = vertices;

    this.p_list = Array.from({ length: vertices }, () =>
      Array.from(
        { length: vertices },
        () => new MinPriorityQueue((path) => path.weight),
      ),
    );

    this.p_star_list = Array.from({ length: vertices }, () =>
      Array.from(
        { length: vertices },
        () => new MinPriorityQueue((path) => path.weight),
      ),
    );

    for (let i = 0; i < vertices; i++) {
      let path = new Path(i, i);
      path.weight = 0;

      this.p_list[i][i].enqueue(path);
      this.p_star_list[i][i].enqueue(path);
    }
  }

  distance(x, y) {
    if (this.p_list[x][y].size() !== 0) return this.p_list[x][y].front().weight;

    return Infinity;
  }

  path(x, y) {
    if (this.p_list[x][y].size() !== 0) return this.p_list[x][y].front();

    return null;
  }

  /* cleanup(), fixup(), update() */

  cleanup(v) {
    const Q = [];

    if (!this.p_list[v][v] || this.p_list[v][v].isEmpty()) return;

    Q.push(this.p_list[v][v].front());

    while (Q.length !== 0) {
      const p = Q.shift(); // match deque FIFO behavior

      if (!p) continue;

      const neighbors = [...(p.L || []), ...(p.R || [])];

      for (const p_xy of neighbors) {
        if (!p_xy) continue;

        Q.push(p_xy);

        try {
          // remove from P_list
          this.p_list[p_xy.start][p_xy.end].remove(p_xy);

          if (p_xy.r) {
            p_xy.r.L = (p_xy.r.L || []).filter((x) => x !== p);
          }
          if (p_xy.l) {
            p_xy.l.R = (p_xy.l.R || []).filter((x) => x !== p);
          }

          if (
            !this.p_star_list[p_xy.start][p_xy.end].isEmpty() &&
            this.p_star_list[p_xy.start][p_xy.end].front().element === p_xy
          ) {
            if (p_xy.r)
              p_xy.r.L_star = (p_xy.r.L_star || []).filter((x) => x !== p);

            if (p_xy.l)
              p_xy.l.R_star = (p_xy.l.R_star || []).filter((x) => x !== p);
          }
        } catch (e) {}
      }
    }
  }

  fixup(v, w) {
    const [weight_from, weight_to] = w;

    // ---------- phase 1 ----------

    for (let u = 0; u < weight_from.length; u++) {
      if (u == v) {
        continue;
      }
      let w_vu = weight_from[u];

      if (w_vu < Infinity) {
        console.log("weight_from " + v, u);
        let path = new Path(v, u);
        path.weight = w_vu;
        path.l = this.p_list[v][v].front();
        path.r = this.p_list[u][u].front();
        this.p_list[v][u].enqueue(path);

        path.r?.L.push(path);
        path.l?.R.push(path);
      }
    }

    for (let u = 0; u < weight_to.length; u++) {
      if (u == v) {
        continue;
      }

      let w_uv = weight_to[u];

      if (w_uv < Infinity) {
        console.log("weight_to " + u, v);
        let path = new Path(u, v);
        path.weight = w_uv;

        path.l = this.p_list[u][u].front();
        path.r = this.p_list[v][v].front();

        this.p_list[u][v].enqueue(path);

        path.l?.R.push(path);
        path.r?.L.push(path);
      }
    }

    // ---------- phase 2 ----------

    const H = new MinPriorityQueue({
      compare: (a, b) => a.weight - b.weight,
    });

    for (const P_list of this.p_list) {
      for (const P of P_list) {
        if (!P || P.isEmpty()) continue;
        console.log(P.front(), P.front().weight);
        H.enqueue(P.front());
      }
    }

    // ---------- phase 3 ----------

    const n = this.p_list.length;

    const visited = Array.from({ length: n }, () => Array(n).fill(false));

    while (!H.isEmpty()) {
      const path_xy = H.dequeue();

      if (!path_xy) continue;

      if (visited[path_xy.start][path_xy.end]) continue;

      visited[path_xy.start][path_xy.end] = true;
      if (this.p_star_list[path_xy.start][path_xy.end].front() == null) {
        //console.log(this.p_star_list[path_xy.start][path_xy.end].front());

        console.log(path_xy);
        this.p_star_list[path_xy.start][path_xy.end].enqueue(path_xy);

        path_xy.l?.R_star?.push(path_xy);
        path_xy.r?.L_star?.push(path_xy);

        for (const path_new_xb of path_xy.l?.L_star || []) {
          let path_new_xy = new Path(path_new_xb.start, path_xy.end);

          path_new_xy.weight =
            this.p_list[path_new_xb.start][path_xy.start].front().weight +
            path_xy.weight;

          path_new_xy.l = path_new_xb;
          path_new_xy.r = path_xy;

          this.p_list[path_new_xy.start][path_new_xy.end].enqueue(path_new_xy);

          path_xy.L.push(path_new_xy);
          path_new_xb.R.push(path_new_xy);

          H.enqueue(path_new_xy);
        }

        for (const path_a_new_y of path_xy.r?.R_star || []) {
          let path_x_new_y = new Path(path_xy.start, path_a_new_y.end);

          path_x_new_y.weight =
            this.p_list[path_xy.end][path_a_new_y.end].front().weight +
            path_xy.weight;

          path_x_new_y.l = path_xy;
          path_x_new_y.r = path_a_new_y;

          this.p_list[path_a_new_y.start][path_a_new_y.end].enqueue(
            path_x_new_y,
          );

          path_a_new_y.L.push(path_x_new_y);
          path_xy.R.push(path_x_new_y);

          H.enqueue(path_x_new_y);
        }
      }
    }
  }

  update(v, w) {
    this.cleanup(v);
    this.fixup(v, w);
  }
}
