import { useEffect, useRef, useState } from "react";
import Tree from "react-d3-tree";

import { countNodes, treeHeight, treeToD3Data } from "@algoyantra/shared";

export default function TreeVisualizer({
  tree,
  highlights = [],
  onNodeClick,
  onAddRoot,
  onAddChild,
  onDeleteNode,
  onNodeValueChange,
  editableNodeId,
  height = 420,
  compact = false,
  showStats = true,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 700, height });
  const [draftValue, setDraftValue] = useState("");

  useEffect(() => {
    function syncDimensions() {
      if (!containerRef.current) {
        return;
      }

      setDimensions({
        width: containerRef.current.offsetWidth,
        height,
      });
    }

    syncDimensions();
    window.addEventListener("resize", syncDimensions);

    return () => window.removeEventListener("resize", syncDimensions);
  }, [height]);

  const d3Data = treeToD3Data(tree);
  const nodeCount = countNodes(tree);
  const currentTreeHeight = treeHeight(tree);
  const translateY = nodeCount <= 1
    ? dimensions.height / 2
    : compact
      ? Math.max(88, dimensions.height * 0.22)
      : 70;
  const zoom = compact
    ? Math.max(
        0.42,
        Math.min(0.92, 0.96 - Math.max(0, currentTreeHeight - 2) * 0.1 - Math.max(0, nodeCount - 7) * 0.015),
      )
    : 1;

  useEffect(() => {
    if (!editableNodeId || !tree) {
      setDraftValue("");
      return;
    }

    function findNode(node, nodeId) {
      if (!node) {
        return null;
      }

      if (node.id === nodeId) {
        return node;
      }

      return findNode(node.left, nodeId) || findNode(node.right, nodeId);
    }

    const activeNode = findNode(tree, editableNodeId);
    setDraftValue(activeNode?.value == null ? "" : String(activeNode.value));
  }, [editableNodeId, tree]);

  function commitDraftValue(nodeId) {
    onNodeValueChange?.(nodeId, draftValue);
  }

  if (!tree || !d3Data) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-white/15 bg-slate-950/30 px-6 text-center text-sm text-slate-400 light:border-slate-300 light:bg-slate-100 light:text-slate-600">
        <p>Start with a blank workspace and create the root node.</p>
        {onAddRoot ? (
          <button
            type="button"
            onClick={onAddRoot}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
          >
            Add root node
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 light:border-slate-200 light:bg-white"
        style={{ height }}
      >
        <Tree
          data={d3Data}
          pathFunc="elbow"
          translate={{ x: dimensions.width / 2, y: translateY }}
          zoom={zoom}
          orientation="vertical"
          separation={compact ? { siblings: 1.05, nonSiblings: 1.2 } : { siblings: 1.3, nonSiblings: 1.6 }}
          zoomable
          styles={{
            links: {
              stroke: "#64748b",
              strokeWidth: 2,
            },
          }}
          renderCustomNodeElement={({ nodeDatum }) => {
            const isHighlighted = highlights.includes(nodeDatum.nodeId);
            const isRedNode = nodeDatum.attributes?.color === "red";
            const isEmpty = nodeDatum.attributes?.isEmpty;
            const hasLeftChild = nodeDatum.attributes?.hasLeftChild;
            const hasRightChild = nodeDatum.attributes?.hasRightChild;
            const isEditing = editableNodeId === nodeDatum.nodeId;
            const fill = isHighlighted
              ? "#22d3ee"
              : isEmpty
                ? "#1e293b"
                : isRedNode
                  ? "#ef4444"
                  : "#111827";

            return (
              <g
                onClick={() => onNodeClick?.(nodeDatum.nodeId, nodeDatum)}
                style={{ cursor: onNodeClick ? "pointer" : "default" }}
              >
                <circle
                  r="26"
                  fill={fill}
                  stroke={isHighlighted ? "#67e8f9" : isEmpty ? "#38bdf8" : "#e2e8f0"}
                  strokeWidth="2"
                  strokeDasharray={isEmpty ? "5 3" : "0"}
                />
                {isEditing ? (
                  <foreignObject
                    x="-24"
                    y="-16"
                    width="48"
                    height="32"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      value={draftValue}
                      onChange={(event) => setDraftValue(event.target.value)}
                      onBlur={() => commitDraftValue(nodeDatum.nodeId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      className="h-full w-full rounded-full border border-cyan-300/60 bg-slate-950/90 px-2 text-center text-xs font-semibold text-white outline-none"
                      inputMode="numeric"
                      autoFocus
                    />
                  </foreignObject>
                ) : (
                  <text
                    fill="#f8fafc"
                    stroke="none"
                    x="0"
                    y="5"
                    textAnchor="middle"
                    style={{ fontSize: isEmpty ? 20 : 14, fontWeight: 700 }}
                  >
                    {nodeDatum.name}
                  </text>
                )}
                {onDeleteNode ? (
                  <g
                    transform="translate(0,-44)"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteNode(nodeDatum.nodeId);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle r="12" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.5" />
                    <text
                      fill="#111827"
                      stroke="none"
                      x="0"
                      y="4"
                      textAnchor="middle"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      -
                    </text>
                  </g>
                ) : null}
                {onAddChild && !hasLeftChild ? (
                  <g
                    transform="translate(-44,44)"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddChild("left", nodeDatum.nodeId);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    <text
                      fill="#e0f2fe"
                      stroke="none"
                      x="0"
                      y="4"
                      textAnchor="middle"
                      style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      L+
                    </text>
                  </g>
                ) : null}
                {onAddChild && !hasRightChild ? (
                  <g
                    transform="translate(44,44)"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddChild("right", nodeDatum.nodeId);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    <text
                      fill="#e0f2fe"
                      stroke="none"
                      x="0"
                      y="4"
                      textAnchor="middle"
                      style={{ fontSize: 12, fontWeight: 700 }}
                    >
                      R+
                    </text>
                  </g>
                ) : null}
              </g>
            );
          }}
        />
      </div>

      {showStats ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 light:border-slate-200 light:bg-white light:text-slate-700">
            <span className="font-semibold text-white light:text-slate-900">Nodes:</span>{" "}
            {countNodes(tree)}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 light:border-slate-200 light:bg-white light:text-slate-700">
            <span className="font-semibold text-white light:text-slate-900">Height:</span>{" "}
            {treeHeight(tree)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
