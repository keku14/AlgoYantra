import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { createTreeFromValues, getTreeTypeMeta } from "@algoyantra/shared";

import api from "../api/client.js";
import SectionCard from "./SectionCard.jsx";
import TreeVisualizer from "./TreeVisualizer.jsx";

const treeTypes = getTreeTypeMeta();

const defaultForm = {
  title: "",
  description: "",
  treeType: "bst",
  xpReward: 120,
  dueDate: "",
  promptValues: "",
};

function parsePromptValues(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

export default function AssignmentEditor({ onCreated }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  const promptValues = useMemo(() => parsePromptValues(form.promptValues), [form.promptValues]);
  const solutionTree = useMemo(
    () => createTreeFromValues(form.treeType, promptValues),
    [form.treeType, promptValues],
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!promptValues.length) {
      toast.error("Enter at least one integer in the vector.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        description: form.description,
        treeType: form.treeType,
        xpReward: Number(form.xpReward),
        dueDate: form.dueDate || undefined,
        promptValues,
        solutionTree,
        initialTree: null,
        operations: [],
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

          <label className="block space-y-2">
            <span className="text-sm text-slate-300 light:text-slate-700">Vector of integers</span>
            <textarea
              value={form.promptValues}
              onChange={(event) => updateField("promptValues", event.target.value)}
              rows="3"
              placeholder="e.g. 50, 10, 40"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300 light:text-slate-700">Marks</span>
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
              Solution preview
            </p>
            <div className="mt-4">
              <TreeVisualizer tree={solutionTree} height={360} />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
