import { useState } from "react";
import toast from "react-hot-toast";

import { getTreeTypeMeta, simulateOperations } from "@algoyantra/shared";

import api from "../api/client.js";
import SectionCard from "./SectionCard.jsx";
import TreeVisualizer from "./TreeVisualizer.jsx";

const treeTypes = getTreeTypeMeta();

const defaultForm = {
  title: "",
  description: "",
  treeType: "bst",
  lesson: "",
  minValue: 1,
  maxValue: 100,
  xpReward: 120,
  difficulty: "Intermediate",
  dueDate: "",
  liveSessionEnabled: true,
  operations: [
    { action: "insert", value: 40, order: "inorder" },
    { action: "insert", value: 20, order: "inorder" },
    { action: "insert", value: 60, order: "inorder" },
  ],
};

export default function AssignmentEditor({ lessons = [], initialTree, onCreated }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateOperation(index, key, value) {
    setForm((current) => ({
      ...current,
      operations: current.operations.map((operation, operationIndex) =>
        operationIndex === index
          ? {
              ...operation,
              [key]: value,
            }
          : operation,
      ),
    }));
  }

  function addOperation() {
    setForm((current) => ({
      ...current,
      operations: [
        ...current.operations,
        { action: "insert", value: 0, order: "inorder" },
      ],
    }));
  }

  function removeOperation(index) {
    setForm((current) => ({
      ...current,
      operations: current.operations.filter((_, operationIndex) => operationIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        description: form.description,
        treeType: form.treeType,
        lesson: form.lesson || undefined,
        difficulty: form.difficulty,
        xpReward: Number(form.xpReward),
        dueDate: form.dueDate || undefined,
        liveSessionEnabled: form.liveSessionEnabled,
        initialTree: initialTree || null,
        constraints: {
          minValue: Number(form.minValue),
          maxValue: Number(form.maxValue),
          allowDuplicates: false,
        },
        operations: form.operations.map((operation) => ({
          ...operation,
          value: Number(operation.value),
        })),
      };

      const { data } = await api.post("/assignments", payload);
      toast.success("Assignment published.");
      onCreated?.(data.assignment);
      setForm(defaultForm);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create assignment.");
    } finally {
      setSaving(false);
    }
  }

  const preview = simulateOperations({
    treeType: form.treeType,
    initialTree: initialTree || null,
    operations: form.operations,
  });

  const matchingLessons = lessons.filter((lesson) => lesson.type === form.treeType);

  return (
    <SectionCard title="Assignment editor" eyebrow="Teacher tooling">
      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Title</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Tree type</span>
              <select
                value={form.treeType}
                onChange={(event) => updateField("treeType", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              >
                {treeTypes.map((treeType) => (
                  <option key={treeType.id} value={treeType.id}>
                    {treeType.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300 light:text-slate-700">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows="3"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Linked lesson</span>
              <select
                value={form.lesson}
                onChange={(event) => updateField("lesson", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              >
                <option value="">None</option>
                {matchingLessons.map((lesson) => (
                  <option key={lesson._id} value={lesson._id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Difficulty</span>
              <select
                value={form.difficulty}
                onChange={(event) => updateField("difficulty", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              >
                {["Beginner", "Intermediate", "Advanced"].map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Min</span>
              <input
                type="number"
                value={form.minValue}
                onChange={(event) => updateField("minValue", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Max</span>
              <input
                type="number"
                value={form.maxValue}
                onChange={(event) => updateField("maxValue", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">XP reward</span>
              <input
                type="number"
                value={form.xpReward}
                onChange={(event) => updateField("xpReward", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
              />
            </label>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-white light:text-slate-900">
                Operations
              </p>
              <button
                type="button"
                onClick={addOperation}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-100 light:border-slate-200 light:text-slate-800"
              >
                Add step
              </button>
            </div>
            <div className="space-y-3">
              {form.operations.map((operation, index) => (
                <div key={`${operation.action}-${index}`} className="grid gap-3 md:grid-cols-[140px,1fr,120px,44px]">
                  <select
                    value={operation.action}
                    onChange={(event) => updateOperation(index, "action", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  >
                    <option value="insert">Insert</option>
                    <option value="delete">Delete</option>
                    <option value="traverse">Traverse</option>
                  </select>
                  <input
                    type="number"
                    disabled={operation.action === "traverse"}
                    value={operation.value}
                    onChange={(event) => updateOperation(index, "value", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white disabled:opacity-40 light:border-slate-200 light:bg-white light:text-slate-900"
                  />
                  <select
                    value={operation.order || "inorder"}
                    onChange={(event) => updateOperation(index, "order", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  >
                    <option value="inorder">Inorder</option>
                    <option value="preorder">Preorder</option>
                    <option value="postorder">Postorder</option>
                    <option value="levelorder">Level order</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeOperation(index)}
                    className="rounded-2xl border border-rose-300/20 bg-rose-500/10 text-rose-100 light:text-rose-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 light:border-slate-200 light:bg-white light:text-slate-700">
            <input
              type="checkbox"
              checked={form.liveSessionEnabled}
              onChange={(event) => updateField("liveSessionEnabled", event.target.checked)}
            />
            Allow live session mode for this assignment
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
          >
            {saving ? "Publishing..." : "Publish assignment"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Preview
            </p>
            <div className="mt-4">
              <TreeVisualizer tree={preview.tree} height={360} />
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Algorithm trace
            </p>
            <div className="mt-4 space-y-2">
              {preview.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 light:border-slate-200 light:bg-slate-50 light:text-slate-700"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
