import { useState } from "react";
import { Redo2, Trash2, Undo2 } from "lucide-react";

import { applyTreeOperation } from "@algoyantra/shared";

export default function TreeOperationPanel({
  treeType,
  tree,
  onTreeChange,
  onTraversalLogged,
  onOperation,
  notes = [],
  onResetNotes,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  title = "Operations",
  compact = false,
}) {
  const [value, setValue] = useState("");
  const [order, setOrder] = useState("inorder");

  function handleOperation(action) {
    if (action === "clear") {
      onTreeChange(null);
      const result = {
        tree: null,
        steps: [
          {
            id: "workspace-cleared",
            description: "Workspace cleared. Start building the tree again from an empty root.",
            tree: null,
            action: "clear",
            highlights: [],
            traversal: [],
            operation: { action: "clear" },
            meta: {
              kind: "workspace-clear",
            },
          },
        ],
        notes: ["Workspace cleared."],
      };
      onResetNotes?.(result.notes);
      onOperation?.({ action: "clear" }, result);
      return;
    }

    if (action !== "traverse" && value === "") {
      onResetNotes?.(["Enter a node value before running insert or delete."]);
      return;
    }

    const payload =
      action === "traverse"
        ? { action, order }
        : { action, value: Number.parseInt(value, 10) || 0 };

    const result = applyTreeOperation(treeType, tree, payload, {
      recordSteps: true,
    });

    onTreeChange(result.tree);

    if (action === "traverse" && result.traversal) {
      onTraversalLogged?.({
        order,
        values: result.traversal,
      });
    }

    onResetNotes?.(result.notes || []);
    onOperation?.(payload, result);

    if (action !== "traverse") {
      setValue("");
    }
  }

  return (
    <div className={`rounded-[2rem] border border-white/10 bg-slate-950/35 p-4 light:border-slate-200 light:bg-slate-50 ${compact ? "space-y-3" : "space-y-4"}`}>
      <div className={`flex ${compact ? "flex-wrap items-center" : "items-center justify-between"} gap-3`}>
        {!compact ? (
          <h3 className="font-display text-lg font-semibold text-white light:text-slate-900">
            {title}
          </h3>
        ) : null}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="number"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Node value"
            className="min-w-[140px] flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 light:border-slate-200 light:bg-white light:text-slate-900"
          />
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 light:border-slate-200 light:bg-white light:text-slate-900"
          >
            <option value="inorder">Inorder</option>
            <option value="preorder">Preorder</option>
            <option value="postorder">Postorder</option>
            <option value="levelorder">Level order</option>
          </select>
          <button
            type="button"
            onClick={() => handleOperation("insert")}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 font-semibold text-slate-950"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => handleOperation("delete")}
            className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 font-semibold text-rose-100 light:text-rose-700"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => handleOperation("traverse")}
            className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-100 light:text-emerald-700"
          >
            Traverse
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-full border border-white/10 p-2 text-slate-200 transition hover:bg-white/10 disabled:opacity-40 light:border-slate-200 light:text-slate-700"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded-full border border-white/10 p-2 text-slate-200 transition hover:bg-white/10 disabled:opacity-40 light:border-slate-200 light:text-slate-700"
          >
            <Redo2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleOperation("clear")}
            className="rounded-full border border-white/10 p-2 text-slate-200 transition hover:bg-white/10 light:border-slate-200 light:text-slate-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {!compact ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 light:text-slate-600">
            Algorithm notes
          </p>
          <div className="space-y-2">
            {(notes.length ? notes : ["Apply an operation to see step-by-step feedback."]).map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 light:border-slate-200 light:bg-white light:text-slate-700"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
