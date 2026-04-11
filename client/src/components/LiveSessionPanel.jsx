import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { getSocketUrl } from "../config/runtime.js";

import SectionCard from "./SectionCard.jsx";

export default function LiveSessionPanel({
  mode,
  user,
  tree,
  treeType,
  highlights,
  latestTraversal,
  onRemoteState,
}) {
  const socketRef = useRef(null);
  const [session, setSession] = useState(null);
  const [sessionCodeInput, setSessionCodeInput] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState("LL rotation, RR rotation, Color flip");

  useEffect(() => {
    const socket = io(getSocketUrl());
    socketRef.current = socket;

    socket.on("session:state", (nextSession) => {
      setSession(nextSession);
      onRemoteState?.(nextSession);
    });

    return () => {
      socket.disconnect();
    };
  }, [onRemoteState]);

  useEffect(() => {
    if (mode !== "teacher" || !session?.sessionCode || !socketRef.current) {
      return;
    }

    socketRef.current.emit("tree:update", {
      sessionCode: session.sessionCode,
      tree,
      highlights,
    });
  }, [mode, session?.sessionCode, tree, highlights]);

  useEffect(() => {
    if (mode !== "teacher" || !session?.sessionCode || !socketRef.current || !latestTraversal) {
      return;
    }

    socketRef.current.emit("traversal:broadcast", {
      sessionCode: session.sessionCode,
      traversal: latestTraversal,
    });
  }, [latestTraversal, mode, session?.sessionCode]);

  function createSession() {
    socketRef.current?.emit(
      "session:create",
      {
        title: "AlgoYantra Live Session",
        treeType,
        tree,
        user,
      },
      ({ session: nextSession }) => setSession(nextSession),
    );
  }

  function joinSession() {
    socketRef.current?.emit(
      "session:join",
      {
        sessionCode: sessionCodeInput.trim().toUpperCase(),
        user,
      },
      ({ session: nextSession }) => setSession(nextSession),
    );
  }

  function askQuiz() {
    socketRef.current?.emit("quiz:ask", {
      sessionCode: session.sessionCode,
      question: quizQuestion,
      options: quizOptions
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean),
    });
    setQuizQuestion("");
  }

  function submitPoll(answer) {
    socketRef.current?.emit("quiz:submit", {
      sessionCode: session.sessionCode,
      answer,
      user,
    });
  }

  return (
    <SectionCard title="Live session" eyebrow="Socket.IO classroom">
      <div className="space-y-4">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
          {mode === "teacher" ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-300 light:text-slate-700">
                Create a room to broadcast tree edits, highlights, traversal animations, and quick polls.
              </p>
              <button
                type="button"
                onClick={createSession}
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 font-semibold text-slate-950"
              >
                Start live session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-300 light:text-slate-700">
                Join your teacher’s session to watch updates in real time.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={sessionCodeInput}
                  onChange={(event) => setSessionCodeInput(event.target.value)}
                  placeholder="Session code"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                />
                <button
                  type="button"
                  onClick={joinSession}
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 font-semibold text-slate-950"
                >
                  Join session
                </button>
              </div>
            </div>
          )}
        </div>

        {session ? (
          <>
            <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200 light:text-emerald-700">
                Session code
              </p>
              <div className="mt-2 font-display text-3xl font-bold text-white light:text-slate-900">
                {session.sessionCode}
              </div>
              <p className="mt-2 text-sm text-slate-200/90 light:text-slate-700">
                {session.attendees?.length || 0} participants connected.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                Attendees
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(session.attendees || []).map((attendee) => (
                  <span
                    key={`${attendee.name}-${attendee.role}`}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-100 light:border-slate-200 light:text-slate-800"
                  >
                    {attendee.name} • {attendee.role}
                  </span>
                ))}
              </div>
            </div>

            {mode === "teacher" ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 light:border-slate-200 light:bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 light:text-slate-600">
                  Poll students
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    value={quizQuestion}
                    onChange={(event) => setQuizQuestion(event.target.value)}
                    placeholder="Ask a quick question"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  />
                  <input
                    value={quizOptions}
                    onChange={(event) => setQuizOptions(event.target.value)}
                    placeholder="Option A, Option B, Option C"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white light:border-slate-200 light:bg-white light:text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={askQuiz}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 light:border-slate-200 light:text-slate-800"
                  >
                    Broadcast poll
                  </button>
                </div>
              </div>
            ) : null}

            {session.poll ? (
              <div className="rounded-[2rem] border border-amber-300/20 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-100 light:text-amber-700">
                  {session.poll.question}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {session.poll.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => submitPoll(option)}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-100 light:border-slate-200 light:text-slate-800"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-300 light:text-slate-600">
                  Responses: {session.poll.answers?.length || 0}
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </SectionCard>
  );
}
