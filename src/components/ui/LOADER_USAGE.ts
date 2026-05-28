/**
 * LOADER USAGE GUIDE
 * ==================
 * Drop this into any file that needs loading states.
 *
 * import { Spinner, PageLoader, TableLoader, CardLoader } from "@/components/ui/Loader";
 */


/* ─────────────────────────────────────────────────────────────────────
 * 1. PAGE LOADER
 *    Replaces the full screen while an initial fetch is pending.
 *    Currently every page does:
 *
 *      if (loading) return (
 *        <div className="flex min-h-[50vh] items-center justify-center">
 *          <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
 *        </div>
 *      );
 *
 *    Replace with:
 * ──────────────────────────────────────────────────────────────────── */

// Full screen (participant pages, vendor pages)
// if (loading) return <PageLoader />;

// Sub-section (inside a portal page where the sidebar stays visible)
// if (loading) return <PageLoader fullPage={false} />;

// With message
// if (loading) return <PageLoader message="Loading cycle data…" fullPage={false} />;


/* ─────────────────────────────────────────────────────────────────────
 * 2. TABLE LOADER
 *    Drop inside Panel noPadding while data is fetching.
 *    Currently pages do an early return; this lets the Panel/header
 *    render immediately so the layout doesn't jump.
 *
 *    Before:
 *      <Panel title="All vendors" noPadding>
 *        {loading ? (
 *          <div className="px-5 py-10 text-center text-sm text-[var(--ink-soft)]">
 *            Loading vendors…
 *          </div>
 *        ) : (
 *          <Table>...</Table>
 *        )}
 *      </Panel>
 *
 *    After:
 * ──────────────────────────────────────────────────────────────────── */

// <Panel title="All vendors" noPadding>
//   {loading ? (
//     <TableLoader rows={6} cols={5} />
//   ) : (
//     <Table>...</Table>
//   )}
// </Panel>

// Adjust rows/cols to match your actual table columns:
// vendors list      → rows={6} cols={6}
// participants list → rows={8} cols={6}
// draw logs         → rows={5} cols={7}
// redemptions       → rows={5} cols={3}
// tasks             → rows={4} cols={5}


/* ─────────────────────────────────────────────────────────────────────
 * 3. CARD LOADER
 *    Skeleton for KPI strips while stats are loading.
 *
 *    Before:
 *      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
 *        {[...].map(s => (
 *          <div key={s.label} ...>
 *            <p>…</p>
 *            <p>{loading ? "—" : s.value}</p>
 *          </div>
 *        ))}
 *      </div>
 *
 *    After:
 * ──────────────────────────────────────────────────────────────────── */

// {loading
//   ? <CardLoader count={4} />
//   : <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">...</div>
// }


/* ─────────────────────────────────────────────────────────────────────
 * 4. SPINNER IN BUTTONS
 *    Button now accepts a `loading` prop. No Spinner import needed.
 *
 *    Before:
 *      <Button disabled={saving}>
 *        {saving ? "Saving…" : "Save changes"}
 *      </Button>
 *
 *    After:
 * ──────────────────────────────────────────────────────────────────── */

// <Button loading={saving}>Save changes</Button>

// The label stays the same — the spinner appears to the left automatically.
// This is cleaner than toggling text and avoids layout shift.

// For actions with distinct done states:
// <Button loading={saving}>
//   {saved ? "✓ Saved" : "Save changes"}
// </Button>


/* ─────────────────────────────────────────────────────────────────────
 * 5. SPINNER STANDALONE
 *    Use anywhere you need a raw spinner without a button.
 *
 *    Task verification spinning indicator:
 * ──────────────────────────────────────────────────────────────────── */

// <Spinner size={20} color="var(--blue)" />

// Default (inherits text colour, useful inside coloured containers):
// <Spinner />

// White (on dark backgrounds):
// <Spinner size={18} color="white" />
