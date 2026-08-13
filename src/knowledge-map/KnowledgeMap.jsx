import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  buildKnowledgeGraph,
  buildLabelLayout,
  computeOverviewView,
  layoutKnowledgeGraph,
} from "./graph.js";

const MIN_ZOOM = 0.18;
const MAX_ZOOM = 2.4;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function panForZoomAroundPoint(zoom, pan, nextZoom, focalX, focalY) {
  const scale = nextZoom / zoom;
  return {
    x: focalX - (focalX - pan.x) * scale,
    y: focalY - (focalY - pan.y) * scale,
  };
}

function getZoomFocalPoint(nodes, selectedId, zoom, pan, viewWidth, viewHeight) {
  if (selectedId) {
    const node = nodes.find((item) => item.id === selectedId);
    if (node) {
      return {
        x: node.x * zoom + pan.x,
        y: node.y * zoom + pan.y,
      };
    }
  }

  return {
    x: viewWidth / 2,
    y: viewHeight / 2,
  };
}

function drawDottedBackground(ctx, width, height, zoom, pan) {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  const step = 22 * Math.max(0.7, Math.min(1.2, zoom));
  const offsetX = pan.x % step;
  const offsetY = pan.y % step;

  ctx.fillStyle = "rgba(120, 132, 144, 0.2)";
  for (let x = offsetX; x < width; x += step) {
    for (let y = offsetY; y < height; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function findNodeAt(nodes, x, y, zoom) {
  const hitRadius = 10 / zoom;
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    const dist = Math.hypot(node.x - x, node.y - y);
    if (dist <= node.radius + hitRadius) return node;
  }
  return null;
}

export default function KnowledgeMap({ skills, selectedId, onSelect }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const skillMap = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills]);
  const graph = useMemo(() => buildKnowledgeGraph(skills), [skills]);
  const nodes = useMemo(() => layoutKnowledgeGraph(graph), [graph]);
  const taskCount = useMemo(() => {
    const seen = new Set();
    for (const skill of skills) {
      for (const task of skill.tasks || []) {
        seen.add(task.id);
      }
    }
    return seen.size;
  }, [skills]);
  const [size, setSize] = useState({ width: 960, height: 620 });
  const [zoom, setZoom] = useState(0.4);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoverId, setHoverId] = useState(null);
  const dragRef = useRef(null);

  const selectedSkill = selectedId ? skillMap.get(selectedId) : null;
  const prerequisiteSkills = useMemo(() => {
    if (!selectedSkill) return [];
    return selectedSkill.prerequisites
      .map((id) => skillMap.get(id))
      .filter(Boolean);
  }, [selectedSkill, skillMap]);

  const prerequisiteIds = useMemo(
    () => new Set(prerequisiteSkills.map((skill) => skill.id)),
    [prerequisiteSkills],
  );

  const applyView = (nextZoom, nextPan) => {
    setZoom(nextZoom);
    setPan(nextPan);
  };

  const zoomAroundFocus = (nextZoom) => {
    const clampedZoom = clampZoom(nextZoom);
    const focal = getZoomFocalPoint(
      nodes,
      selectedId,
      zoom,
      pan,
      size.width,
      size.height,
    );
    applyView(
      clampedZoom,
      panForZoomAroundPoint(zoom, pan, clampedZoom, focal.x, focal.y),
    );
  };

  const fitAll = () => {
    const view = computeOverviewView(nodes, size.width, size.height);
    applyView(view.zoom, view.pan);
  };

  useEffect(() => {
    if (!nodes.length) return;
    fitAll();
  }, [nodes, size.width, size.height]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(320, Math.floor(width)),
        height: Math.max(420, Math.floor(height)),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return undefined;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawDottedBackground(ctx, size.width, size.height, zoom, pan);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    for (const link of graph.links) {
      const source = nodes.find((node) => node.id === link.source);
      const target = nodes.find((node) => node.id === link.target);
      if (!source || !target) continue;

      const isPrereqLink =
        selectedId &&
        target.id === selectedId &&
        prerequisiteIds.has(source.id);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isPrereqLink
        ? "rgba(255, 170, 87, 0.95)"
        : link.dashed
          ? "rgba(255, 170, 87, 0.55)"
          : "rgba(180, 190, 204, 0.75)";
      ctx.lineWidth = (isPrereqLink ? 2.4 : link.dashed ? 1.2 : 1.5) / zoom;
      if (link.dashed && !isPrereqLink) ctx.setLineDash([6, 6]);
      else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const node of nodes) {
      const color = graph.colors[node.cluster % graph.colors.length];
      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoverId;
      const isPrerequisite = prerequisiteIds.has(node.id);

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isPrerequisite) {
        ctx.lineWidth = 3 / zoom;
        ctx.strokeStyle = "#FFAA57";
        ctx.stroke();
      }

      if (isSelected || isHovered) {
        ctx.lineWidth = 3 / zoom;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
        ctx.lineWidth = 2 / zoom;
        ctx.strokeStyle = "rgba(30, 42, 54, 0.35)";
        ctx.stroke();
      }
    }

    const labels = buildLabelLayout(ctx, nodes, {
      selectedId,
      hoverId,
    });

    for (const label of labels) {
      const { rect, lines, lineHeight, node } = label;
      const isSelected = node.id === selectedId;
      const isPrerequisite = prerequisiteIds.has(node.id);

      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.strokeStyle = isSelected
        ? "rgba(80, 58, 224, 0.45)"
        : isPrerequisite
          ? "rgba(255, 170, 87, 0.75)"
          : "rgba(216, 224, 234, 0.95)";
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1e2a36";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      lines.forEach((line, index) => {
        ctx.fillText(line, rect.x + 7, rect.y + 5 + index * lineHeight);
      });
    }

    ctx.restore();
  }, [graph, nodes, size, zoom, pan, selectedId, hoverId, prerequisiteIds]);

  const toGraphPoint = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const onWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    zoomAroundFocus(zoom * delta);
  };

  const onPointerDown = (event) => {
    const point = toGraphPoint(event.clientX, event.clientY);
    const hit = findNodeAt(nodes, point.x, point.y, zoom);
    dragRef.current = {
      mode: hit ? "node" : "pan",
      startX: event.clientX,
      startY: event.clientY,
      panStart: { ...pan },
    };
    canvasRef.current?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    const point = toGraphPoint(event.clientX, event.clientY);
    const hit = findNodeAt(nodes, point.x, point.y, zoom);
    setHoverId(hit?.id ?? null);

    const drag = dragRef.current;
    if (!drag || drag.mode !== "pan") return;

    setPan({
      x: drag.panStart.x + (event.clientX - drag.startX),
      y: drag.panStart.y + (event.clientY - drag.startY),
    });
  };

  const onPointerUp = (event) => {
    const drag = dragRef.current;
    dragRef.current = null;
    canvasRef.current?.releasePointerCapture(event.pointerId);
    if (!drag) return;

    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (moved > 6) return;

    const point = toGraphPoint(event.clientX, event.clientY);
    const hit = findNodeAt(nodes, point.x, point.y, zoom);
    if (hit) onSelect(hit.id);
  };

  const zoomStep = (factor) => {
    zoomAroundFocus(zoom * factor);
  };

  return (
    <section className="knowledge-map" aria-label="Карта знаний">
      <div className="knowledge-map__toolbar">
        <div className="knowledge-map__stats" aria-label="Статистика графа">
          <span>
            <b>{nodes.length}</b> узлов
          </span>
          <span>
            <b>{graph.links.length}</b> связей
          </span>
          <span>
            <b>{taskCount}</b> заданий
          </span>
        </div>
        <div className="knowledge-map__zoom">
          <button type="button" onClick={fitAll} aria-label="Показать всю карту">
            <RotateCcw size={16} />
          </button>
          <button type="button" onClick={() => zoomStep(0.88)} aria-label="Отдалить">
            <ZoomOut size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => zoomStep(1.12)} aria-label="Приблизить">
            <ZoomIn size={16} />
          </button>
        </div>
      </div>
      <div className="knowledge-map__canvas-wrap" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="knowledge-map__canvas"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHoverId(null)}
        />
        {selectedSkill && (
          <aside className="knowledge-map__detail">
            <h3>{selectedSkill.title}</h3>
            <p className="knowledge-map__detail-label">Необходимо изучить до:</p>
            {prerequisiteSkills.length ? (
              <ul>
                {prerequisiteSkills.map((skill) => (
                  <li key={skill.id}>
                    <button type="button" onClick={() => onSelect(skill.id)}>
                      {skill.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="knowledge-map__detail-empty">Стартовая тема — пререквизитов нет.</p>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
