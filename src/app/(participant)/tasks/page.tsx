// import Navbar from "@/components/participant/Navbar";
// import ProgressCard from "@/components/participant/ProgressCard";
// import SocialCard from "@/components/participant/SocialCard";
// import TaskCard from "@/components/participant/TaskCard";

// export default function TasksPage() {
//   return (
//     <>
//       <Navbar />

//       <main className="px-6 py-12">
//         <div className="mx-auto max-w-7xl">

//           {/* HEADER */}

//           <div className="mb-10">
//             <span
//               className="
//                 mb-4 inline-flex
//                 rounded-full
//                 bg-[var(--blue-soft)]
//                 px-4 py-2
//                 text-sm font-medium
//                 text-[var(--blue)]
//               "
//             >
//               Participant Dashboard
//             </span>

//             <h1
//               className="
//                 mb-4
//                 text-4xl tracking-tight
//                 md:text-6xl
//               "
//               style={{
//                 fontFamily: "var(--font-display)",
//               }}
//             >
//               Complete tasks.
//               <span className="italic text-[var(--blue)]">
//                 {" "}Win dinner.
//               </span>
//             </h1>

//             <p
//               className="
//                 max-w-2xl
//                 text-lg leading-8
//                 text-[var(--ink-soft)]
//               "
//             >
//               Connect your accounts and complete
//               today&apos;s campaign tasks to qualify
//               for the raffle draw.
//             </p>
//           </div>

//           {/* GRID */}

//           <div className="grid gap-8 lg:grid-cols-3">

//             {/* LEFT */}
//             <div className="space-y-6 lg:col-span-2">

//   <TaskCard
//     title="Follow Instagram"
//     description="
//       Follow the official Pedrun Instagram
//       page to qualify for today’s raffle.
//     "
//     reward="+10 entries"
//     completed
//   />

//   <TaskCard
//     title="Share Campaign Post"
//     description="
//       Share today’s campaign flyer to your
//       Instagram story and tag Pedrun.
//     "
//     reward="+15 entries"
//   />

//   <TaskCard
//     title="Tag 3 Friends"
//     description="
//       Mention 3 friends in today’s campaign
//       comment section.
//     "
//     reward="+5 entries"
//   />


//               <SocialCard
//                 platform="Instagram"
//                 handle="@pedrun"
//                 description="
//                   Follow the official Pedrun Instagram
//                   account to qualify for the campaign.
//                 "
//               />

//               <SocialCard
//                 platform="TikTok"
//                 handle="@pedrun"
//                 description="
//                   Follow the official TikTok page and
//                   engage with today's campaign video.
//                 "
//               />

//               <SocialCard
//                 platform="Twitter / X"
//                 handle="@pedrun"
//                 description="
//                   Follow the official account and repost
//                   today’s campaign tweet.
//                 "
//               />

//             </div>

//             {/* RIGHT */}

//             <div className="space-y-6">

//               <ProgressCard
//                 completed={1}
//                 total={3}
//               />

//               <div
//                 className="
//                   rounded-[32px]
//                   border border-[var(--line)]
//                   bg-white
//                   p-6
//                 "
//               >
//                 <h3 className="mb-2 text-lg font-semibold">
//                   Today&apos;s Prize
//                 </h3>

//                 <p
//                   className="
//                     mb-6
//                     text-sm leading-6
//                     text-[var(--ink-soft)]
//                   "
//                 >
//                   One lucky participant wins
//                   a free dinner voucher delivered
//                   directly to their location.
//                 </p>

//                 <div
//                   className="
//                     rounded-2xl
//                     bg-[var(--grey-50)]
//                     p-5
//                   "
//                 >
//                   <p className="text-sm text-[var(--ink-soft)]">
//                     Voucher Value
//                   </p>

//                   <h2
//                     className="mt-2 text-4xl"
//                     style={{
//                       fontFamily: "var(--font-display)",
//                     }}
//                   >
//                     ₦25k
//                   </h2>
//                 </div>
//               </div>

//             </div>

//           </div>
//         </div>
//       </main>
//     </>
//   );
// }

"use client";

import AuthNavbar from "@/components/participant/AuthNavbar";
import Navbar from "@/components/participant/Navbar";
import Button from "@/components/ui/Button";
import { useState } from "react";

interface Task {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  status: "done" | "pending" | "idle";
}

const INITIAL_TASKS: Task[] = [
  {
    id: "follow",
    emoji: "📷",
    title: "Follow @pedrun on Instagram",
    desc: "Auto-verified · 2 min ago",
    status: "done",
  },
  {
    id: "share",
    emoji: "🔁",
    title: "Share today's post to your story",
    desc: "Auto-verified · 1 min ago",
    status: "done",
  },
  {
    id: "tag",
    emoji: "🏷️",
    title: "Tag 2 friends in comments",
    desc: "We'll check in ~10s after you post",
    status: "idle",
  },
];

function CheckIcon({ status }: { status: Task["status"] }) {
  if (status === "done") {
    return (
      <div
        className="
          flex h-6 w-6 shrink-0 items-center justify-center
          rounded-full bg-[var(--forest)] text-white
        "
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path
            d="M1 5l3.5 3.5L11 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div
        className="
          flex h-6 w-6 shrink-0 animate-spin items-center
          justify-center rounded-full
          border-2 border-[var(--blue-soft)] border-t-[var(--blue)]
        "
      />
    );
  }
  return (
    <div
      className="
        h-6 w-6 shrink-0 rounded-full
        border-2 border-[var(--grey-200)]
      "
    />
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [verifying, setVerifying] = useState(false);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = Math.round((doneCount / tasks.length) * 100);
  const allDone = doneCount === tasks.length;
  const pendingTask = tasks.find((t) => t.status === "idle");

  function handleVerify() {
    if (!pendingTask) return;
    setVerifying(true);
    setTasks((prev) =>
      prev.map((t) => (t.id === pendingTask.id ? { ...t, status: "pending" } : t))
    );
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === pendingTask.id
            ? { ...t, status: "done", desc: "Auto-verified · just now" }
            : t
        )
      );
      setVerifying(false);
    }, 3000);
  }

  return (
    <>
          <AuthNavbar />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="mx-auto max-w-lg">

          {/* Header */}
          <div className="mb-8">
            <h1
              className="mb-2 text-4xl leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Today&apos;s{" "}
              <em className="italic text-[var(--blue)]">tasks.</em>
            </h1>
          </div>

          {/* Progress bar + countdown */}
          <div className="mb-8 rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-[var(--ink-soft)]">
                {doneCount} of {tasks.length} completed
              </p>
              <span
                className="font-mono text-sm font-semibold text-[var(--blue)]"
              >
                ⏱ 03:42:18
              </span>
            </div>

            {/* Progress track */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--grey-100)]">
              <div
                className="h-full rounded-full bg-[var(--blue)] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            {allDone && (
              <p className="mt-3 text-sm font-medium text-[var(--forest)]">
                ✓ All tasks complete — claim your voucher below.
              </p>
            )}
          </div>

          {/* Task cards */}
          <div className="mb-8 flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="
                  flex items-center gap-4
                  rounded-2xl border border-[var(--line)]
                  bg-white px-5 py-4
                  transition-all
                "
                style={{
                  opacity: task.status === "done" ? 0.7 : 1,
                }}
              >
                {/* Emoji icon */}
                <div
                  className="
                    flex h-10 w-10 shrink-0 items-center justify-center
                    rounded-xl bg-[var(--grey-50)]
                    text-xl
                  "
                >
                  {task.emoji}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {task.title}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">{task.desc}</p>
                </div>

                {/* Check */}
                <CheckIcon status={task.status} />
              </div>
            ))}
          </div>

          {/* CTA */}
          {allDone ? (
            <Button fullWidth>
              Claim my voucher →
            </Button>
          ) : (
            <Button
              fullWidth
              onClick={handleVerify}
              disabled={verifying || !pendingTask}
            >
              {verifying ? "Verifying…" : "I've tagged friends — verify now"}
            </Button>
          )}

          <p className="mt-4 text-center text-xs text-[var(--mute)]">
            Tasks are one-time per cycle. Verification is fully automated.
          </p>

        </div>
      </main>
    </>
  );
}
