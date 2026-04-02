import { useEffect, useRef, useState } from "react";
import Tree from "react-d3-tree";

import { countNodes, treeHeight, treeToD3Data } from "@algoyantra/shared";

export default function TreeVisualizer({
  tree,
  highlights = [],
  onNodeClick,
  height = 420,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 700, height });

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

  if (!tree || !d3Data) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-slate-950/30 text-center text-sm text-slate-400 light:border-slate-300 light:bg-slate-100 light:text-slate-600">
        Start inserting nodes to see the tree grow.
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
          translate={{ x: dimensions.width / 2, y: 70 }}
          orientation="vertical"
          separation={{ siblings: 1.3, nonSiblings: 1.6 }}
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
            const fill = isHighlighted ? "#22d3ee" : isRedNode ? "#ef4444" : "#111827";

            return (
              <g
                onClick={() => onNodeClick?.(nodeDatum.nodeId, nodeDatum)}
                style={{ cursor: onNodeClick ? "pointer" : "default" }}
              >
                <circle
                  r="26"
                  fill={fill}
                  stroke={isHighlighted ? "#67e8f9" : "#e2e8f0"}
                  strokeWidth="2"
                />
                <text
                  fill="#f8fafc"
                  stroke="none"
                  x="0"
                  y="5"
                  textAnchor="middle"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  {nodeDatum.name}
                </text>
              </g>
            );
          }}
        />
      </div>

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
    </div>
  );
}
