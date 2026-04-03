import { useEffect, useMemo, useState } from "react";
import { Redo2, Save, Send, Trash2, Undo2 } from "lucide-react";

import {
  createBlankTreeFromTemplate,
  setNodeValue,
  simulateOperations,
} from "@algoyantra/shared";

import SectionCard from "./SectionCard.jsx";
import TreeVisualizer from "./TreeVisualizer.jsx";

function getExpectedTree(assignment) {
  if (!assignment) {
    return null;
  }

  if (assignment.solutionTree) {
    return assignment.solutionTree;
  }

  return simulateOperations({
    treeType: assignment.treeType,
    initialTree: assignment.initialTree || null,
    operations: assignment.operations || [],
    recordSteps: false,
  }).tree;
}

export default function StudentAssignmentWorkspace({
  assignment,
  tree,
  onTreeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSubmit,
  submitting = false,
}) {
  const expectedTree = useMemo(() => getExpectedTree(assignment), [assignment]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [draftValue, setDraftValue] = useState("");

  useEffect(() => {
    setSelectedNodeId(null);
    setDraftValue("");
  }, [assignment?._id]);

  const promptValues = assignment?.promptValues || [];

  function handleNodeClick(nodeId, nodeDatum) {
    setSelectedNodeId(nodeId);
    setDraftValue(nodeDatum.attributes?.isEmpty ? "" : nodeDatum.name);
  }

  function handleSaveValue() {
    if (!selectedNodeId) {
      return;
    }

    onTreeChange(setNodeValue(tree, selectedNodeId, draftValue));
  }

  function handleClearValue() {
    if (!selectedNodeId) {
      return;
    }

    onTreeChange(setNodeValue(tree, selectedNodeId, null));
    setDraftValue("");
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
              XP: {assignment.xpReward}
            </span>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-5 light:border-slate-200 light:bg-slate-50">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Fill the empty tree
            </p>
            <TreeVisualizer
              tree={tree || createBlankTreeFromTemplate(expectedTree)}
              onNodeClick={handleNodeClick}
              height={430}
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Instructions
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-700">
                Click any node in the tree, type the value you want there, and save it. If a value is
                already written, click the same node to rewrite it.
              </p>
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
          </div>
        </div>

        <footer className="rounded-[2rem] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
          <div className="grid gap-4 lg:grid-cols-[1fr,180px,auto,auto,auto]">
            <input
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              placeholder={selectedNodeId ? "Enter node value" : "Click a node to start editing"}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 light:border-slate-200 light:bg-white light:text-slate-900"
            />
            <button
              type="button"
              onClick={handleSaveValue}
              disabled={!selectedNodeId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              <Save size={16} />
              Save node
            </button>
            <button
              type="button"
              onClick={handleClearValue}
              disabled={!selectedNodeId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 font-semibold text-rose-100 disabled:opacity-50 light:text-rose-700"
            >
              <Trash2 size={16} />
              Clear
            </button>
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-slate-200 disabled:opacity-40 light:border-slate-200 light:text-slate-700"
            >
              <Undo2 size={16} />
              Undo
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-slate-200 disabled:opacity-40 light:border-slate-200 light:text-slate-700"
            >
              <Redo2 size={16} />
              Redo
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-300 light:text-slate-700">
              {selectedNodeId
                ? "Selected node ready for editing."
                : "Click a node in the tree to insert or rewrite a value."}
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
