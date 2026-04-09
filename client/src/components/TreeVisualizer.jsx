import { useEffect, useRef, useState } from "react";
import Tree from "react-d3-tree";

import { countNodes, treeHeight, treeToD3Data } from "@algoyantra/shared";

function getComparisonTheme(comparisonState) {
  if (!comparisonState) {
    return null;
  }

  if (comparisonState.kind === "tree-traverse") {
    return {
      badgeClass: "tree-traverse-badge",
      label: `${comparisonState.order} traversal`,
      value: comparisonState.traversal?.length || 0,
    };
  }

  if (comparisonState.kind?.includes("delete")) {
    return {
      badgeClass: "tree-delete-badge",
      label: "Delete node",
      value: comparisonState.targetValue,
    };
  }

  return {
    badgeClass: "",
    label: "Incoming node",
    value: comparisonState.incomingValue,
  };
}

function getComparisonStatus(comparisonState) {
  if (!comparisonState) {
    return "";
  }

  if (comparisonState.kind === "tree-traverse") {
    return comparisonState.currentValue != null
      ? `Visiting ${comparisonState.currentValue} in ${comparisonState.order} order`
      : `Preparing ${comparisonState.order} traversal`;
  }

  const treeLabel = comparisonState.kind?.startsWith("avl")
    ? "AVL"
    : comparisonState.kind?.startsWith("rb")
      ? "Red-Black"
      : comparisonState.kind?.startsWith("binary")
        ? "Binary Tree"
        : "BST";

  switch (comparisonState.decision) {
    case "root":
      return "Placed as root node";
    case "compare":
      return comparisonState.comparedValue != null
        ? `Comparing with ${comparisonState.comparedValue}`
        : `Checking ${treeLabel} structure`;
    case "left":
      return `Move left from ${comparisonState.comparedValue}`;
    case "right":
      return `Move right from ${comparisonState.comparedValue}`;
    case "placed-left":
      return `Placed as left child of ${comparisonState.comparedValue}`;
    case "placed-right":
      return `Placed as right child of ${comparisonState.comparedValue}`;
    case "placed":
      return `Placed ${comparisonState.incomingValue ?? comparisonState.targetValue}`;
    case "duplicate":
      return `Duplicate found at ${comparisonState.comparedValue}`;
    case "found":
      return `Found ${comparisonState.targetValue}`;
    case "deleted":
      return `Deleted ${comparisonState.targetValue}`;
    case "not-found":
      return `${comparisonState.targetValue} was not found`;
    case "delete-root":
      return `Deleted root ${comparisonState.targetValue}`;
    case "replaced-with-deepest":
      return `Replaced with the deepest node`;
    case "successor-found":
      return `Successor selected: ${comparisonState.comparedValue}`;
    case "promote-child":
      return "Promote the single child into this position";
    case "delete-leaf":
      return "Delete the leaf node directly";
    case "find-successor":
      return "Find inorder successor in the right subtree";
    case "successor-start":
      return `Successor search starts at ${comparisonState.comparedValue}`;
    case "successor-left":
      return `Move left to successor candidate ${comparisonState.comparedValue}`;
    case "rotate-left":
      return `${treeLabel} ${comparisonState.rotationLabel || "rebalance"}: rotate left`;
    case "rotate-right":
      return `${treeLabel} ${comparisonState.rotationLabel || "rebalance"}: rotate right`;
    case "color-flip":
      return "Flip colors to restore Red-Black rules";
    case "move-red-left":
      return "Move a red link left before deletion";
    case "move-red-right":
      return "Move a red link right before deletion";
    case "empty":
      return `${treeLabel} is empty`;
    default:
      return `Tracing ${treeLabel} ${comparisonState.kind?.includes("delete") ? "deletion" : "insertion"} steps`;
  }
}

export default function TreeVisualizer({
  tree,
  highlights = [],
  comparisonState = null,
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
  const comparedPathIds = comparisonState?.pathIds || [];
  const currentComparedNodeId = comparisonState?.currentNodeId || null;
  const insertedNodeId = comparisonState?.insertedNodeId || null;
  const comparisonTheme = getComparisonTheme(comparisonState);
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
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 light:border-slate-200 light:bg-white"
        style={{ height }}
      >
        {comparisonTheme ? (
          <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap items-center gap-3">
            <div className={`tree-compare-badge ${comparisonTheme.badgeClass}`}>
              <span className="tree-compare-label">{comparisonTheme.label}</span>
              <span className="tree-compare-value">{comparisonTheme.value}</span>
            </div>
            <div className="tree-compare-status">{getComparisonStatus(comparisonState)}</div>
          </div>
        ) : null}

        <Tree
          data={d3Data}
          pathFunc="elbow"
          translate={{ x: dimensions.width / 2, y: translateY }}
          zoom={zoom}
          transitionDuration={450}
          orientation="vertical"
          separation={compact ? { siblings: 1.05, nonSiblings: 1.2 } : { siblings: 1.3, nonSiblings: 1.6 }}
          zoomable
          pathClassFunc={(linkDatum) => {
            const targetNodeId = linkDatum.target.data.nodeId;

            if (comparedPathIds.includes(targetNodeId)) {
              if (comparisonState?.kind === "tree-traverse") {
                return "tree-link-traverse";
              }

              if (comparisonState?.kind?.includes("delete")) {
                return "tree-link-delete";
              }

              return "tree-link-compared";
            }

            return "tree-link-default";
          }}
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
            const isOnComparedPath = comparedPathIds.includes(nodeDatum.nodeId);
            const isCurrentCompared = currentComparedNodeId === nodeDatum.nodeId;
            const isInserted = insertedNodeId === nodeDatum.nodeId;
            const isTraversalNode = comparisonState?.kind === "tree-traverse" && isCurrentCompared;
            const isRotationNode = comparisonState?.decision?.startsWith("rotate-");
            const isColorFixNode = comparisonState?.decision === "color-flip";
            const fill = isHighlighted
              ? "#22d3ee"
              : isInserted
                ? "#06b6d4"
                : isTraversalNode
                  ? "#8b5cf6"
                : isRotationNode
                  ? "#ec4899"
                : isColorFixNode
                  ? "#14b8a6"
                : isCurrentCompared
                  ? "#f97316"
                  : isOnComparedPath
                    ? "#f59e0b"
              : isEmpty
                ? "#1e293b"
                : isRedNode
                  ? "#ef4444"
                  : "#111827";
            const stroke = isHighlighted
              ? "#67e8f9"
              : isInserted
                ? "#a5f3fc"
                : isTraversalNode
                  ? "#ddd6fe"
                : isRotationNode
                  ? "#f9a8d4"
                : isColorFixNode
                  ? "#99f6e4"
                : isCurrentCompared
                  ? "#fdba74"
                  : isOnComparedPath
                    ? "#fde68a"
                    : isEmpty
                      ? "#38bdf8"
                      : "#e2e8f0";

            return (
              <g
                onClick={() => onNodeClick?.(nodeDatum.nodeId, nodeDatum)}
                style={{ cursor: onNodeClick ? "pointer" : "default" }}
              >
                {isCurrentCompared || isInserted ? (
                  <circle
                    r={isInserted ? "38" : "34"}
                    fill="transparent"
                    stroke={isInserted ? "#22d3ee" : isTraversalNode ? "#8b5cf6" : isRotationNode ? "#ec4899" : isColorFixNode ? "#14b8a6" : "#f59e0b"}
                    strokeWidth="2"
                    opacity="0.85"
                    className="tree-node-pulse"
                  />
                ) : null}
                <circle
                  r="26"
                  fill={fill}
                  stroke={stroke}
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
                {isCurrentCompared ? (
                  <text
                    fill={isTraversalNode ? "#ddd6fe" : isRotationNode ? "#fbcfe8" : isColorFixNode ? "#ccfbf1" : "#fed7aa"}
                    stroke="none"
                    x="0"
                    y="-36"
                    textAnchor="middle"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}
                  >
                    {isTraversalNode ? "VISIT" : isRotationNode ? "ROTATE" : isColorFixNode ? "FIX" : "COMPARE"}
                  </text>
                ) : null}
                {isInserted ? (
                  <text
                    fill="#a5f3fc"
                    stroke="none"
                    x="0"
                    y="-36"
                    textAnchor="middle"
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}
                  >
                    PLACED
                  </text>
                ) : null}
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
