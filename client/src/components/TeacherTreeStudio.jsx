import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  History,
  Pause,
  Play,
  ShieldCheck,
  Trees,
} from "lucide-react";

import {
  countNodes,
  getTreeTypeMeta,
  normalizeTreeType,
  treeHeight,
  validateAVL,
  validateBST,
  validateBinaryTree,
  validateRBTree,
} from "@algoyantra/shared";

import useHistoryState from "../hooks/useHistoryState.js";
import SectionCard from "./SectionCard.jsx";
import TreeOperationPanel from "./TreeOperationPanel.jsx";
import TreeVisualizer from "./TreeVisualizer.jsx";

const treeTypes = getTreeTypeMeta();

function getValidator(treeType) {
  switch (normalizeTreeType(treeType)) {
    case "binary-tree":
      return validateBinaryTree;
    case "avl":
      return validateAVL;
    case "red-black":
      return validateRBTree;
    case "bst":
    default:
      return validateBST;
  }
}

function starterNotes(treeType) {
  return [
    `Selected ${treeTypes.find((treeTypeMeta) => treeTypeMeta.id === treeType)?.label || "tree"} workspace.`,
    "Use Insert, Delete, and Traverse to build a live teaching sequence.",
  ];
}

function formatOperationLabel(operation) {
  if (!operation) {
    return "Operation";
  }

  if (operation.action === "traverse") {
    return `${operation.order || "inorder"} traversal`;
  }

  if (operation.action === "clear") {
    return "Workspace cleared";
  }

  if (operation.value != null) {
    return `${operation.action} ${operation.value}`;
  }

  return operation.action || "Operation";
}

export default function TeacherTreeStudio() {
  const [selectedTreeType, setSelectedTreeType] = useState("bst");
  const treeHistory = useHistoryState(null);
  const [notes, setNotes] = useState(starterNotes("bst"));
  const [playbackSteps, setPlaybackSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [operationHistory, setOperationHistory] = useState([]);
  const [showTreePicker, setShowTreePicker] = useState(false);
  const currentStep = activeStepIndex >= 0 ? playbackSteps[activeStepIndex] : null;
  const displayTree = currentStep?.tree ?? treeHistory.present;
  const highlights = currentStep?.highlights || [];
  const comparisonState = currentStep?.meta || null;

  const validation = useMemo(() => getValidator(selectedTreeType)(treeHistory.present), [selectedTreeType, treeHistory.present]);

  useEffect(() => {
    if (!isPlaying || activeStepIndex < 0 || activeStepIndex >= playbackSteps.length - 1) {
      if (activeStepIndex >= playbackSteps.length - 1) {
        setIsPlaying(false);
      }
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveStepIndex((current) => Math.min(current + 1, playbackSteps.length - 1));
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [activeStepIndex, isPlaying, playbackSteps.length]);

  function clearPlayback() {
    setPlaybackSteps([]);
    setActiveStepIndex(-1);
    setIsPlaying(false);
  }

  function handleTreeTypeChange(nextTreeType) {
    setSelectedTreeType(nextTreeType);
    treeHistory.reset(null);
    setNotes(starterNotes(nextTreeType));
    setOperationHistory([]);
    setShowTreePicker(false);
    clearPlayback();
  }

  function handleTreeChange(nextTree) {
    treeHistory.setPresent(nextTree);
    clearPlayback();
  }

  function handleOperation(operation, result) {
    setPlaybackSteps(result.steps || []);
    setActiveStepIndex(result.steps?.length ? 0 : -1);
    setIsPlaying(Boolean(result.steps?.length > 1));
    setOperationHistory((current) => [
      ...current,
      {
        id: `${operation.action || "operation"}-${Date.now()}`,
        label: formatOperationLabel(operation),
        operation,
        steps: result.steps || [],
        summary: result.notes?.[0] || "Operation completed.",
      },
    ]);
  }

  function handleUndo() {
    treeHistory.undo();
    clearPlayback();
  }

  function handleRedo() {
    treeHistory.redo();
    clearPlayback();
  }

  function togglePlayback() {
    if (!playbackSteps.length) {
      return;
    }

    if (activeStepIndex >= playbackSteps.length - 1) {
      setActiveStepIndex(0);
    }

    setIsPlaying((current) => !current);
  }

  function moveStep(direction) {
    if (!playbackSteps.length) {
      return;
    }

    setIsPlaying(false);
    setActiveStepIndex((current) => {
      const baseIndex = current < 0 ? 0 : current;
      return Math.max(0, Math.min(playbackSteps.length - 1, baseIndex + direction));
    });
  }

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <div className="min-w-0 flex-1">
              <TreeOperationPanel
                treeType={selectedTreeType}
                tree={treeHistory.present}
                onTreeChange={handleTreeChange}
                onOperation={handleOperation}
                notes={notes}
                onResetNotes={setNotes}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={treeHistory.canUndo}
                canRedo={treeHistory.canRedo}
                title="Algo controls"
                compact
              />
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowTreePicker((current) => !current);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 light:border-slate-200 light:bg-white light:text-slate-700"
                aria-label="Select tree type"
              >
                <Trees size={17} />
              </button>
              {showTreePicker ? (
                <div className="absolute right-0 top-12 z-20 w-72 rounded-[1.5rem] border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur light:border-slate-200 light:bg-white">
                  <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 light:text-slate-600">
                    Select tree
                  </p>
                  <div className="space-y-2">
                    {treeTypes.map((treeType) => (
                      <button
                        key={treeType.id}
                        type="button"
                        onClick={() => handleTreeTypeChange(treeType.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          selectedTreeType === treeType.id
                            ? `border-transparent bg-gradient-to-r ${treeType.accent} text-slate-950`
                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
                        }`}
                      >
                        {treeType.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 light:border-slate-200 light:bg-slate-50">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveStep(-1)}
                  disabled={!playbackSteps.length || activeStepIndex <= 0}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition disabled:opacity-40 light:border-slate-200 light:bg-white light:text-slate-700"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={togglePlayback}
                  disabled={!playbackSteps.length}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition disabled:opacity-40 light:border-slate-200 light:bg-white light:text-slate-700"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(1)}
                  disabled={!playbackSteps.length || activeStepIndex >= playbackSteps.length - 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition disabled:opacity-40 light:border-slate-200 light:bg-white light:text-slate-700"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <TreeVisualizer
                tree={displayTree}
                highlights={highlights}
                comparisonState={comparisonState}
                height={620}
                showStats={false}
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 light:border-slate-200 light:bg-white light:text-slate-700">
                  {treeTypes.find((treeType) => treeType.id === selectedTreeType)?.label}
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 light:border-slate-200 light:bg-white light:text-slate-700">
                  Nodes {countNodes(displayTree)}
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 light:border-slate-200 light:bg-white light:text-slate-700">
                  Height {treeHeight(displayTree)}
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 light:border-slate-200 light:bg-white light:text-slate-700">
                  Replay {playbackSteps.length ? `${Math.max(activeStepIndex + 1, 1)}/${playbackSteps.length}` : "Ready"}
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-500/10 p-4">
                <div className="flex items-center gap-2 text-cyan-100 light:text-cyan-700">
                  <ArrowRight size={16} />
                  <p className="text-sm font-semibold">
                    {currentStep?.description || "Use the controls above to insert, delete, traverse, or clear the tree."}
                  </p>
                </div>
              </div>

              {!validation.isValid ? (
                <div className="mt-4 rounded-[1.5rem] border border-rose-300/15 bg-rose-500/10 p-4">
                  <div className="flex items-center gap-2 text-rose-100 light:text-rose-700">
                    <ShieldCheck size={16} />
                    <p className="text-sm font-semibold">
                      {validation.issues[0]}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
              <div className="mb-4 flex items-center gap-2 text-white light:text-slate-900">
                <History size={16} />
                <p className="text-sm font-semibold">Operation timeline</p>
              </div>

              <div className="h-[760px] space-y-3 overflow-y-auto pr-1">
                {operationHistory.length ? [...operationHistory].reverse().map((entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.35rem] border border-white/10 bg-slate-950/25 p-4 light:border-slate-200 light:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-white light:text-slate-900">
                        <GitBranch size={15} />
                        <p className="text-sm font-semibold">
                          Step {operationHistory.length - index}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 light:border-slate-200 light:bg-white light:text-slate-600">
                        {entry.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-100 light:text-slate-800">
                      {entry.summary}
                    </p>

                    <div className="mt-3 space-y-2">
                      {entry.steps.map((step, stepIndex) => (
                        <div
                          key={step.id}
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            currentStep?.id === step.id
                              ? "border-cyan-300/30 bg-cyan-500/10 text-cyan-50 light:text-cyan-700"
                              : "border-white/10 bg-white/5 text-slate-100 light:border-slate-200 light:bg-white light:text-slate-800"
                          }`}
                        >
                          <span className="mr-2 inline-flex min-w-7 items-center justify-center rounded-full border border-white/10 bg-slate-900/50 px-2 py-0.5 text-xs font-semibold text-slate-200 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
                            {stepIndex + 1}
                          </span>
                          {step.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="flex h-full min-h-[220px] items-center justify-center rounded-[1.35rem] border border-dashed border-white/15 bg-slate-950/20 px-4 text-center text-sm text-slate-400 light:border-slate-300 light:bg-slate-50 light:text-slate-600">
                    Build the tree and every operation will appear here in order, starting from Step 1.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
