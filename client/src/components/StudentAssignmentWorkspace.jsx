import { useEffect, useState } from "react";
import { Send, X } from "lucide-react";

import {
  addChildNode,
  addRootNode,
  findNodeById,
  removeNodeById,
  setNodeValue,
} from "@algoyantra/shared";

import SectionCard from "./SectionCard.jsx";
import TreeVisualizer from "./TreeVisualizer.jsx";

export default function StudentAssignmentWorkspace({
  assignment,
  tree,
  onTreeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSubmit,
  onClose,
  submitting = false,
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    setSelectedNodeId(null);
  }, [assignment?._id]);

  const promptValues = assignment?.promptValues || [];

  function handleNodeClick(nodeId, nodeDatum) {
    setSelectedNodeId(nodeId);
  }

  function handleAddRoot() {
    const nextTree = addRootNode(tree);
    onTreeChange(nextTree);
    setSelectedNodeId(nextTree?.id || null);
  }

  function handleAddChild(side, nodeId = selectedNodeId) {
    if (!nodeId) {
      return;
    }

    const nextTree = addChildNode(tree, nodeId, side);
    const nextNode = findNodeById(nextTree, nodeId)?.[side] || null;
    onTreeChange(nextTree);
    setSelectedNodeId(nextNode?.id || nodeId);
  }

  function handleNodeValueChange(nodeId, nextValue) {
    if (!nodeId) {
      return;
    }

    onTreeChange(setNodeValue(tree, nodeId, nextValue));
    setSelectedNodeId(nodeId);
  }

  function handleRemoveNode(nodeId = selectedNodeId) {
    if (!nodeId) {
      return;
    }

    onTreeChange(removeNodeById(tree, nodeId));
    setSelectedNodeId(null);
  }

  if (!assignment) {
    return (
      <SectionCard title="Assignment workspace">
        <div className="rounded-[2rem] border border-dashed border-white/15 p-8 text-center text-slate-400 light:border-slate-300 light:text-slate-600">
          Select an assignment to start filling the tree.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Assignment workspace" eyebrow={assignment.treeType}>
      <div className="space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-white light:text-slate-900">
                {assignment.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-700">
                {assignment.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300 light:text-slate-700">
                <span className="rounded-full border border-white/10 px-3 py-1.5 light:border-slate-200">
                  Vector: {promptValues.length ? promptValues.join(", ") : "Teacher has not added a vector yet"}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 light:border-slate-200">
                  Marks: {assignment.xpReward}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
              aria-label="Close assignment"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-5 light:border-slate-200 light:bg-slate-50">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
            Blank workspace
          </p>
          <TreeVisualizer
            tree={tree}
            highlights={selectedNodeId ? [selectedNodeId] : []}
            onNodeClick={handleNodeClick}
            onAddRoot={handleAddRoot}
            onAddChild={handleAddChild}
            onDeleteNode={handleRemoveNode}
            onNodeValueChange={handleNodeValueChange}
            editableNodeId={selectedNodeId}
            height={520}
          />
        </div>

        {assignment.referenceImageUrl ? (
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 light:border-slate-200 light:bg-white">
            <img
              src={assignment.referenceImageUrl}
              alt={`${assignment.title} reference`}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}

        <footer className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-300 light:text-slate-700">
              {selectedNodeId
                ? "Edit directly inside the selected node. Use the workspace controls around it to grow or remove the tree."
                : "Create the root inside the blank workspace, then click any node to type inside it."}
            </p>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              <Send size={16} />
              {submitting ? "Submitting..." : "Submit assignment"}
            </button>
          </div>
        </footer>
      </div>
    </SectionCard>
  );
}
