const CLUSTER_COLORS = [
  "#503AE0",
  "#51D4AD",
  "#5EB2FF",
  "#FFAA57",
  "#9689ED",
  "#E879F9",
];

export const WORLD = { width: 3400, height: 2100 };

export function buildKnowledgeGraph(skills) {
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const roots = skills.filter((skill) => !skill.prerequisites.length).map((s) => s.id);
  const clusterOf = new Map();
  const queue = [...roots];

  roots.forEach((id, index) => clusterOf.set(id, index % CLUSTER_COLORS.length));

  while (queue.length) {
    const id = queue.shift();
    const cluster = clusterOf.get(id);
    const skill = byId.get(id);
    if (!skill) continue;
    for (const nextId of skill.next) {
      if (!byId.has(nextId) || clusterOf.has(nextId)) continue;
      clusterOf.set(nextId, cluster);
      queue.push(nextId);
    }
  }

  for (const skill of skills) {
    if (clusterOf.has(skill.id)) continue;
    const parent = skill.prerequisites.find((pid) => clusterOf.has(pid));
    clusterOf.set(skill.id, parent ? clusterOf.get(parent) : 0);
  }

  const primaryParent = new Map();
  const children = new Map();
  for (const skill of skills) {
    children.set(skill.id, []);
  }

  const links = [];
  const linkKeys = new Set();
  for (const skill of skills) {
    skill.prerequisites.forEach((sourceId, index) => {
      if (!byId.has(sourceId)) return;
      const key = `${sourceId}->${skill.id}`;
      if (linkKeys.has(key)) return;
      linkKeys.add(key);
      const dashed = index > 0 || clusterOf.get(sourceId) !== clusterOf.get(skill.id);
      links.push({ source: sourceId, target: skill.id, dashed });
      if (!dashed) {
        primaryParent.set(skill.id, sourceId);
        children.get(sourceId)?.push(skill.id);
      }
    });
  }

  const nodes = skills.map((skill) => {
    const childCount = (children.get(skill.id) || []).length;
    const isRoot = !skill.prerequisites.length;
    return {
      id: skill.id,
      title: skill.title,
      isRoot,
      cluster: clusterOf.get(skill.id) ?? 0,
      childCount,
      prerequisites: skill.prerequisites,
      radius: isRoot ? 26 : childCount > 1 ? 18 : 13,
    };
  });

  return {
    nodes,
    links,
    roots,
    clusterOf,
    colors: CLUSTER_COLORS,
    primaryParent,
    children,
    byId,
  };
}

function layoutCluster(rootId, centerX, centerY, graph, positions) {
  const levels = [];
  const visited = new Set([rootId]);
  let frontier = [rootId];

  while (frontier.length) {
    levels.push([...frontier]);
    const next = [];
    for (const id of frontier) {
      for (const childId of graph.children.get(id) || []) {
        if (visited.has(childId)) continue;
        if (graph.clusterOf.get(childId) !== graph.clusterOf.get(rootId)) continue;
        visited.add(childId);
        next.push(childId);
      }
    }
    frontier = next;
  }

  positions.set(rootId, { x: centerX, y: centerY });

  for (let depth = 1; depth < levels.length; depth += 1) {
    const ring = levels[depth];
    const radius = 150 + depth * 125;
    ring.forEach((id, index) => {
      const angle = (index / ring.length) * Math.PI * 2 - Math.PI / 2 + depth * 0.22;
      positions.set(id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });
  }

  for (const node of graph.nodes) {
    if (graph.clusterOf.get(node.id) !== graph.clusterOf.get(rootId)) continue;
    if (positions.has(node.id)) continue;
    const parent = graph.primaryParent.get(node.id);
    const parentPos = parent ? positions.get(parent) : null;
    const anchor = parentPos ?? { x: centerX, y: centerY };
    const angle = Math.random() * Math.PI * 2;
    positions.set(node.id, {
      x: anchor.x + Math.cos(angle) * 150,
      y: anchor.y + Math.sin(angle) * 150,
    });
  }
}

export function layoutKnowledgeGraph(graph) {
  const positions = new Map();
  const centerX = WORLD.width / 2;
  const centerY = WORLD.height / 2;
  const orbitX = WORLD.width * 0.3;
  const orbitY = WORLD.height * 0.24;

  graph.roots.forEach((rootId, index) => {
    const angle = (index / Math.max(graph.roots.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const cx = centerX + Math.cos(angle) * orbitX;
    const cy = centerY + Math.sin(angle) * orbitY;
    layoutCluster(rootId, cx, cy, graph, positions);
  });

  for (const node of graph.nodes) {
    if (!positions.has(node.id)) {
      positions.set(node.id, {
        x: centerX + (Math.random() - 0.5) * 200,
        y: centerY + (Math.random() - 0.5) * 200,
      });
    }
  }

  const nodeMap = new Map(
    graph.nodes.map((node) => [
      node.id,
      { ...node, ...positions.get(node.id), vx: 0, vy: 0 },
    ]),
  );

  for (let step = 0; step < 120; step += 1) {
    const entries = Array.from(nodeMap.values());
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const a = entries[i];
        const b = entries[j];
        if (a.cluster !== b.cluster) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(Math.hypot(dx, dy), 20);
        const minDist = a.radius + b.radius + 90;
        if (dist < minDist) {
          const push = (minDist - dist) * 0.12;
          a.x += (dx / dist) * push;
          a.y += (dy / dist) * push;
          b.x -= (dx / dist) * push;
          b.y -= (dy / dist) * push;
        }
      }
    }
  }

  return Array.from(nodeMap.values());
}

export function getGraphBounds(nodes, padding = 220) {
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs) - padding;
  const maxX = Math.max(...xs) + padding;
  const minY = Math.min(...ys) - padding;
  const maxY = Math.max(...ys) + padding;
  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getClusterBounds(nodes, cluster) {
  const subset = nodes.filter((node) => node.cluster === cluster);
  return getGraphBounds(subset, 160);
}

export function fitBoundsToViewport(bounds, viewWidth, viewHeight) {
  const padding = 12;
  const scaleX = (viewWidth - padding * 2) / bounds.width;
  const scaleY = (viewHeight - padding * 2) / bounds.height;
  const zoom = Math.min(scaleX, scaleY);
  return {
    zoom,
    pan: {
      x: viewWidth / 2 - (bounds.minX + bounds.width / 2) * zoom,
      y: viewHeight / 2 - (bounds.minY + bounds.height / 2) * zoom,
    },
  };
}

export function computeOverviewView(nodes, viewWidth, viewHeight) {
  if (typeof document === "undefined") {
    return fitBoundsToViewport(getGraphBounds(nodes, 180), viewWidth, viewHeight);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const labels = buildLabelLayout(ctx, nodes, {});

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.radius - 16);
    maxX = Math.max(maxX, node.x + node.radius + 16);
    minY = Math.min(minY, node.y - node.radius - 16);
    maxY = Math.max(maxY, node.y + node.radius + 16);
  }

  for (const label of labels) {
    minX = Math.min(minX, label.rect.x - 6);
    maxX = Math.max(maxX, label.rect.x + label.rect.width + 6);
    minY = Math.min(minY, label.rect.y - 6);
    maxY = Math.max(maxY, label.rect.y + label.rect.height + 6);
  }

  return fitBoundsToViewport(
    {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    viewWidth,
    viewHeight,
  );
}

export function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function rectsOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function buildLabelLayout(ctx, nodes, options) {
  const { selectedId, hoverId } = options;

  const prioritized = [...nodes].sort((a, b) => {
    const score = (node) =>
      (node.id === selectedId ? 1000 : 0) +
      (node.id === hoverId ? 500 : 0) +
      (node.isRoot ? 100 : 0) +
      node.childCount * 10 +
      node.radius;
    return score(b) - score(a);
  });

  ctx.font = "600 12px Inter, sans-serif";
  const placed = [];
  const occupied = [];

  for (const node of prioritized) {
    const maxWidth = node.isRoot ? 200 : 176;
    const lines = wrapCanvasText(ctx, node.title, maxWidth);
    const lineHeight = 14;
    const boxHeight = lines.length * lineHeight + 10;
    const boxWidth =
      Math.max(...lines.map((line) => ctx.measureText(line).width), 0) + 14;

    const makeAnchors = (gap) => [
      { x: node.x + node.radius + gap, y: node.y - boxHeight / 2 },
      { x: node.x - node.radius - gap - boxWidth, y: node.y - boxHeight / 2 },
      { x: node.x - boxWidth / 2, y: node.y + node.radius + gap },
      { x: node.x - boxWidth / 2, y: node.y - node.radius - gap - boxHeight },
      { x: node.x + node.radius + gap, y: node.y + node.radius + gap },
      { x: node.x - node.radius - gap - boxWidth, y: node.y + node.radius + gap },
      { x: node.x + node.radius + gap, y: node.y - node.radius - gap - boxHeight },
      { x: node.x - node.radius - gap - boxWidth, y: node.y - node.radius - gap - boxHeight },
    ];

    let chosen = null;
    for (const gap of [12, 24, 38, 54, 72]) {
      for (const anchor of makeAnchors(gap)) {
        const rect = { x: anchor.x, y: anchor.y, width: boxWidth, height: boxHeight };
        if (!occupied.some((other) => rectsOverlap(rect, other))) {
          chosen = { node, lines, rect, lineHeight };
          occupied.push(rect);
          break;
        }
      }
      if (chosen) break;
    }

    if (!chosen) {
      const slot = placed.length;
      const rect = {
        x: node.x + node.radius + 16,
        y: node.y - boxHeight / 2 + (slot % 4) * 20,
        width: boxWidth,
        height: boxHeight,
      };
      chosen = { node, lines, rect, lineHeight };
      occupied.push(rect);
    }

    placed.push(chosen);
  }

  return placed;
}
