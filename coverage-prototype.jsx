import React, { useState, useMemo } from "react";

/* ------------------------------------------------------------------
   COVERAGE — vendor compliance tracking for subcontractor-heavy SMBs
   Mock draft. Single screen: see what's lapsing, chase it in one click.
------------------------------------------------------------------- */

const TODAY = new Date("2026-08-14");

const VENDORS = [
  { id: 1,  name: "Brennan Electric",        trade: "Electrical",   contact: "dispatch@brennanelec.com",   days: -22, doc: "COI — General Liability", policy: "GL-4471-882",  net: 3, job: "Kettle Ridge" },
  { id: 2,  name: "Torres Framing",          trade: "Framing",      contact: "mike@torresframing.net",     days: -9,  doc: "COI — Workers Comp",      policy: "WC-2210-114",  net: 1, job: "Kettle Ridge" },
  { id: 3,  name: "Delmar Plumbing Co.",     trade: "Plumbing",     contact: "office@delmarplumb.com",     days: -4,  doc: "State License",           policy: "PL-88-30291",  net: 0, job: "Harbor Lofts" },
  { id: 4,  name: "Nine Mile Excavation",    trade: "Sitework",     contact: "j.reyes@ninemile.co",        days: 2,   doc: "COI — General Liability", policy: "GL-9902-013",  net: 2, job: "Harbor Lofts" },
  { id: 5,  name: "Cardinal Roofing",        trade: "Roofing",      contact: "admin@cardinalroof.com",     days: 6,   doc: "COI — Auto",              policy: "AU-3311-777",  net: 0, job: "Kettle Ridge" },
  { id: 6,  name: "Pace Mechanical",         trade: "HVAC",         contact: "billing@pacemech.com",       days: 11,  doc: "COI — Workers Comp",      policy: "WC-6650-201",  net: 4, job: "Vernon St." },
  { id: 7,  name: "Kestrel Drywall",         trade: "Drywall",      contact: "sam@kestreldrywall.com",     days: 19,  doc: "W-9",                     policy: "—",            net: 1, job: "Vernon St." },
  { id: 8,  name: "Aldridge Concrete",       trade: "Concrete",     contact: "office@aldridgeco.com",      days: 27,  doc: "COI — General Liability", policy: "GL-1188-455",  net: 2, job: "Harbor Lofts" },
  { id: 9,  name: "Fairview Glass",          trade: "Glazing",      contact: "orders@fairviewglass.com",   days: 34,  doc: "COI — General Liability", policy: "GL-7734-090",  net: 0, job: "Vernon St." },
  { id: 10, name: "Ostrander Painting",      trade: "Painting",     contact: "l.ostrander@gmail.com",      days: 48,  doc: "COI — Workers Comp",      policy: "WC-4400-318",  net: 1, job: "Kettle Ridge" },
  { id: 11, name: "Hollis Landscape",        trade: "Landscape",    contact: "crew@hollisland.com",        days: 61,  doc: "COI — Auto",              policy: "AU-5521-604",  net: 0, job: "Harbor Lofts" },
  { id: 12, name: "Quimby Steel",            trade: "Structural",   contact: "contracts@quimbysteel.com",  days: 73,  doc: "COI — Umbrella",          policy: "UM-2098-441",  net: 5, job: "Vernon St." },
  { id: 13, name: "Sutter Fire Systems",     trade: "Fire/Life",    contact: "service@sutterfire.com",     days: 84,  doc: "State License",           policy: "FS-11-77420",  net: 2, job: "Harbor Lofts" },
];

const bucket = (d) => (d < 0 ? "lapsed" : d <= 14 ? "critical" : d <= 45 ? "soon" : "ok");

const LABEL = {
  lapsed:   "Lapsed",
  critical: "Lapsing",
  soon:     "Watch",
  ok:       "Current",
  sent:     "Requested",
};

const fmtDate = (days) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const relative = (d) =>
  d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "today" : `in ${d}d`;

/* runway maps -30…+90 days onto 0…100% */
const runwayX = (d) => ((Math.max(-30, Math.min(90, d)) + 30) / 120) * 100;

export default function Coverage() {
  const [filter, setFilter] = useState("action");
  const [openId, setOpenId] = useState(null);
  const [sent, setSent] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const rows = useMemo(() => {
    const withState = VENDORS.map((v) => ({
      ...v,
      state: sent.has(v.id) ? "sent" : bucket(v.days),
      raw: bucket(v.days),
    }));
    const sorted = withState.sort((a, b) => a.days - b.days);
    if (filter === "action") return sorted.filter((v) => v.raw === "lapsed" || v.raw === "critical");
    if (filter === "lapsed") return sorted.filter((v) => v.raw === "lapsed");
    return sorted;
  }, [filter, sent]);

  const lapsedCount = VENDORS.filter((v) => bucket(v.days) === "lapsed").length;
  const criticalCount = VENDORS.filter((v) => bucket(v.days) === "critical").length;
  const open = VENDORS.find((v) => v.id === openId) || null;

  const flash = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const request = (id) => {
    setSent((prev) => new Set(prev).add(id));
    const v = VENDORS.find((x) => x.id === id);
    flash(`Request sent to ${v.name}`);
    setOpenId(null);
  };

  const requestAll = () => {
    const targets = VENDORS.filter((v) => bucket(v.days) === "lapsed" && !sent.has(v.id));
    if (!targets.length) return flash("No outstanding lapsed certificates");
    setSent((prev) => {
      const next = new Set(prev);
      targets.forEach((t) => next.add(t.id));
      return next;
    });
    flash(`Request sent to ${targets.length} vendors`);
  };

  return (
    <div className="cv-root">
      <style>{css}</style>

      <header className="cv-head">
        <div className="cv-brand">
          <span className="cv-mark" aria-hidden="true" />
          <span className="cv-brandname">Coverage</span>
        </div>
        <div className="cv-headmeta">
          <span>Hammond &amp; Sons Construction</span>
          <span className="cv-dot" aria-hidden="true">/</span>
          <span>{VENDORS.length} active vendors</span>
        </div>
      </header>

      {/* ---------- hero: the count, then the runway ---------- */}
      <section className="cv-hero">
        <div className="cv-count">
          <span className="cv-bignum">{lapsedCount}</span>
          <p className="cv-countcopy">
            certificates have <strong>already lapsed</strong>. {criticalCount} more expire
            inside two weeks.
          </p>
        </div>

        <div className="cv-runwaywrap">
          <div className="cv-runwaytop">
            <h2 className="cv-eyebrow">Coverage runway</h2>
            <span className="cv-eyebrow cv-quiet">next 90 days</span>
          </div>

          <div className="cv-runway" role="img" aria-label="Timeline of vendor document expirations over the next 90 days">
            <div className="cv-past" style={{ width: `${runwayX(0)}%` }} />
            <div className="cv-now" style={{ left: `${runwayX(0)}%` }}>
              <span className="cv-nowlabel">TODAY</span>
            </div>
            {VENDORS.map((v, i) => {
              const b = sent.has(v.id) ? "sent" : bucket(v.days);
              return (
                <button
                  key={v.id}
                  className={`cv-tick cv-${b}`}
                  style={{ left: `${runwayX(v.days)}%`, animationDelay: `${i * 45}ms` }}
                  onClick={() => setOpenId(v.id)}
                  aria-label={`${v.name}, ${v.doc}, ${relative(v.days)}`}
                />
              );
            })}
          </div>

          <div className="cv-scale">
            <span style={{ left: "0%" }}>30d past</span>
            <span style={{ left: "50%" }}>+30</span>
            <span style={{ left: "75%" }}>+60</span>
            <span style={{ left: "100%" }}>+90</span>
          </div>
        </div>
      </section>

      {/* ---------- toolbar ---------- */}
      <div className="cv-bar">
        <div className="cv-filters" role="tablist" aria-label="Filter vendors">
          {[
            ["action", "Needs action"],
            ["lapsed", "Lapsed only"],
            ["all", "All vendors"],
          ].map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={filter === k}
              className={`cv-chip ${filter === k ? "cv-chipon" : ""}`}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="cv-primary" onClick={requestAll}>
          Request all lapsed
        </button>
      </div>

      {/* ---------- ledger ---------- */}
      <div className="cv-ledger">
        <div className="cv-lhead">
          <span>Vendor</span>
          <span>Document</span>
          <span className="cv-hidesm">Expires</span>
          <span>Status</span>
          <span />
        </div>

        {rows.length === 0 && (
          <div className="cv-empty">
            <p>Nothing needs chasing right now.</p>
            <span>Next expiration is {fmtDate(rows[0]?.days ?? 19)}.</span>
          </div>
        )}

        {rows.map((v) => (
          <div
            key={v.id}
            className="cv-row"
            role="button"
            tabIndex={0}
            onClick={() => setOpenId(v.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenId(v.id)}
          >
            <div className="cv-vendor">
              <span className="cv-vname">{v.name}</span>
              <span className="cv-trade">{v.trade} · {v.job}</span>
            </div>
            <div className="cv-doc">
              <span>{v.doc}</span>
              <span className="cv-mono cv-quiet">{v.policy}</span>
            </div>
            <div className="cv-mono cv-hidesm">{fmtDate(v.days)}</div>
            <div>
              <span className={`cv-pill cv-${v.state}`}>{LABEL[v.state]}</span>
              <span className="cv-rel">{v.state === "sent" ? "sent today" : relative(v.days)}</span>
            </div>
            <div className="cv-act">
              {v.state === "sent" ? (
                <span className="cv-quiet cv-mono">awaiting upload</span>
              ) : (
                <button
                  className="cv-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    request(v.id);
                  }}
                >
                  Send request
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---------- detail drawer ---------- */}
      {open && (
        <>
          <div className="cv-scrim" onClick={() => setOpenId(null)} />
          <aside className="cv-drawer" aria-label={`${open.name} details`}>
            <div className="cv-drawerhead">
              <div>
                <span className="cv-eyebrow">{open.trade}</span>
                <h3>{open.name}</h3>
                <span className="cv-mono cv-quiet">{open.contact}</span>
              </div>
              <button className="cv-close" onClick={() => setOpenId(null)} aria-label="Close">
                ×
              </button>
            </div>

            <dl className="cv-facts">
              <div>
                <dt>Document</dt>
                <dd>{open.doc}</dd>
              </div>
              <div>
                <dt>Policy</dt>
                <dd className="cv-mono">{open.policy}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd className="cv-mono">{fmtDate(open.days)} · {relative(open.days)}</dd>
              </div>
              <div>
                <dt>Assigned job</dt>
                <dd>{open.job}</dd>
              </div>
            </dl>

            {open.net > 0 && (
              <p className="cv-network">
                <strong>{open.net}</strong> other Coverage account{open.net > 1 ? "s" : ""} also
                track this vendor. When they upload once, everyone gets the current copy.
              </p>
            )}

            <div className="cv-draft">
              <span className="cv-eyebrow">Request we'll send</span>
              <div className="cv-mail">
                <p className="cv-mono cv-subject">
                  Subject: {open.doc} expired — {open.job}
                </p>
                <p>Hi —</p>
                <p>
                  Your {open.doc.toLowerCase()} on file with Hammond &amp; Sons expired{" "}
                  {fmtDate(open.days)}. We need a current copy before crews are back on{" "}
                  {open.job}.
                </p>
                <p>Upload here — no account needed, takes about a minute.</p>
                <p className="cv-quiet">[ Upload link ]</p>
              </div>
            </div>

            <button className="cv-primary cv-wide" onClick={() => request(open.id)}>
              Send request
            </button>
            <p className="cv-fineprint">
              Follows up automatically on day 3 and day 7 if nothing arrives.
            </p>
          </aside>
        </>
      )}

      {toast && <div className="cv-toast" role="status">{toast}</div>}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.cv-root{
  --concrete:#E9EAE3;
  --paper:#F6F6F1;
  --ink:#14202A;
  --slate:#2F4A57;
  --ash:#7E857F;
  --hivis:#D9E634;
  --rust:#B4451F;
  --blue:#2E6E7E;
  --line:#CFD2C8;
  background:var(--concrete);
  color:var(--ink);
  font-family:'IBM Plex Sans',system-ui,sans-serif;
  min-height:100%;
  padding:0 0 96px;
  -webkit-font-smoothing:antialiased;
}
.cv-root *{box-sizing:border-box;}
.cv-root button{font:inherit;cursor:pointer;}
.cv-root button:focus-visible,.cv-row:focus-visible{outline:2px solid var(--ink);outline-offset:2px;}
.cv-mono{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:-0.01em;}
.cv-quiet{color:var(--ash);}
.cv-eyebrow{
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:600;
  color:var(--slate);margin:0;
}

/* header */
.cv-head{
  display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:14px 28px;border-bottom:1px solid var(--line);flex-wrap:wrap;
}
.cv-brand{display:flex;align-items:center;gap:9px;}
.cv-mark{width:11px;height:11px;background:var(--hivis);border:1.5px solid var(--ink);display:block;}
.cv-brandname{
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  font-weight:700;text-transform:uppercase;letter-spacing:.2em;font-size:16px;
}
.cv-headmeta{display:flex;gap:10px;align-items:center;font-size:13px;color:var(--slate);}
.cv-dot{color:var(--line);}

/* hero */
.cv-hero{padding:40px 28px 28px;display:grid;gap:36px;}
.cv-count{display:flex;align-items:flex-start;gap:20px;max-width:640px;}
.cv-bignum{
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  font-size:108px;line-height:.78;font-weight:700;letter-spacing:-.02em;
  background:var(--hivis);padding:6px 14px 10px;display:inline-block;
}
.cv-countcopy{margin:6px 0 0;font-size:19px;line-height:1.45;max-width:34ch;}
.cv-countcopy strong{font-weight:600;}

/* runway — the signature */
.cv-runwaywrap{max-width:1100px;}
.cv-runwaytop{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
.cv-runway{
  position:relative;height:74px;background:var(--slate);
  border:1px solid var(--ink);
}
.cv-past{position:absolute;inset:0 auto 0 0;background:rgba(0,0,0,.22);}
.cv-now{position:absolute;top:0;bottom:0;width:1px;background:var(--paper);}
.cv-nowlabel{
  position:absolute;top:6px;left:6px;white-space:nowrap;color:var(--paper);
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  font-size:11px;letter-spacing:.16em;font-weight:600;
}
.cv-tick{
  position:absolute;bottom:14px;width:10px;height:34px;padding:0;
  transform:translateX(-50%);border:1px solid var(--ink);
  animation:cv-rise .5s cubic-bezier(.2,.8,.3,1) backwards;
}
@keyframes cv-rise{from{height:0;opacity:0;}to{height:34px;opacity:1;}}
.cv-tick:hover{height:44px;}
.cv-tick.cv-lapsed{background:var(--hivis);height:48px;}
.cv-tick.cv-critical{background:var(--rust);}
.cv-tick.cv-soon{background:#9FB2A6;}
.cv-tick.cv-ok{background:#6E8791;}
.cv-tick.cv-sent{background:var(--paper);}
.cv-scale{position:relative;height:20px;margin-top:6px;}
.cv-scale span{
  position:absolute;transform:translateX(-50%);
  font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ash);
}
.cv-scale span:first-child{transform:none;}
.cv-scale span:last-child{transform:translateX(-100%);}

/* toolbar */
.cv-bar{
  display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:6px 28px 16px;flex-wrap:wrap;
}
.cv-filters{display:flex;gap:6px;flex-wrap:wrap;}
.cv-chip{
  background:none;border:1px solid var(--line);padding:7px 13px;
  font-size:13px;color:var(--slate);border-radius:2px;
}
.cv-chip:hover{border-color:var(--slate);}
.cv-chipon{background:var(--ink);border-color:var(--ink);color:var(--paper);}
.cv-primary{
  background:var(--ink);color:var(--paper);border:1px solid var(--ink);
  padding:9px 18px;border-radius:2px;font-size:14px;font-weight:500;
}
.cv-primary:hover{background:var(--slate);border-color:var(--slate);}
.cv-wide{width:100%;padding:13px;}

/* ledger */
.cv-ledger{margin:0 28px;border:1px solid var(--line);background:var(--paper);}
.cv-lhead,.cv-row{
  display:grid;
  grid-template-columns:1.5fr 1.5fr .8fr 1fr .9fr;
  gap:16px;align-items:center;padding:13px 18px;
}
.cv-lhead{
  background:var(--ink);color:var(--paper);
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  text-transform:uppercase;letter-spacing:.13em;font-size:12px;font-weight:600;
}
.cv-row{border-top:1px solid var(--line);cursor:pointer;}
.cv-row:hover{background:#EFEFE8;}
.cv-vendor,.cv-doc{display:flex;flex-direction:column;gap:3px;min-width:0;}
.cv-vname{font-weight:600;font-size:15px;}
.cv-trade,.cv-rel{font-size:12px;color:var(--ash);}
.cv-doc span:first-child{font-size:14px;}
.cv-rel{display:block;margin-top:4px;}
.cv-pill{
  display:inline-block;padding:3px 9px;border-radius:2px;
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  text-transform:uppercase;letter-spacing:.1em;font-size:12px;font-weight:600;
  border:1px solid var(--ink);
}
.cv-pill.cv-lapsed{background:var(--hivis);}
.cv-pill.cv-critical{background:var(--rust);color:var(--paper);border-color:var(--rust);}
.cv-pill.cv-soon{background:transparent;color:var(--slate);border-color:var(--line);}
.cv-pill.cv-ok{background:transparent;color:var(--ash);border-color:var(--line);}
.cv-pill.cv-sent{background:var(--blue);color:var(--paper);border-color:var(--blue);}
.cv-act{text-align:right;}
.cv-ghost{
  background:none;border:1px solid var(--ink);padding:6px 12px;
  font-size:13px;border-radius:2px;color:var(--ink);
}
.cv-ghost:hover{background:var(--ink);color:var(--paper);}
.cv-empty{padding:40px 18px;text-align:center;}
.cv-empty p{margin:0 0 6px;font-size:16px;}
.cv-empty span{font-size:13px;color:var(--ash);}

/* drawer */
.cv-scrim{position:fixed;inset:0;background:rgba(20,32,42,.4);z-index:20;}
.cv-drawer{
  position:fixed;top:0;right:0;bottom:0;width:min(440px,100%);z-index:21;
  background:var(--paper);border-left:1px solid var(--ink);
  padding:24px;overflow-y:auto;
  animation:cv-slide .22s ease-out;
}
@keyframes cv-slide{from{transform:translateX(24px);opacity:0;}to{transform:none;opacity:1;}}
.cv-drawerhead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
.cv-drawerhead h3{
  font-family:'Barlow Condensed','Arial Narrow',sans-serif;
  font-size:30px;margin:4px 0 4px;font-weight:700;letter-spacing:-.01em;
}
.cv-close{background:none;border:none;font-size:26px;line-height:1;color:var(--ash);padding:0 4px;}
.cv-facts{margin:22px 0;padding:0;display:grid;gap:1px;background:var(--line);border:1px solid var(--line);}
.cv-facts>div{display:flex;justify-content:space-between;gap:12px;background:var(--paper);padding:10px 12px;}
.cv-facts dt{font-size:13px;color:var(--ash);margin:0;}
.cv-facts dd{margin:0;font-size:14px;text-align:right;}
.cv-network{
  background:var(--hivis);border:1px solid var(--ink);padding:12px 14px;
  font-size:13.5px;line-height:1.5;margin:0 0 22px;
}
.cv-draft{margin-bottom:20px;}
.cv-mail{
  border:1px solid var(--line);background:var(--concrete);padding:14px;margin-top:8px;
  font-size:13.5px;line-height:1.55;
}
.cv-mail p{margin:0 0 9px;}
.cv-mail p:last-child{margin-bottom:0;}
.cv-subject{font-weight:500;border-bottom:1px solid var(--line);padding-bottom:9px;}
.cv-fineprint{font-size:12px;color:var(--ash);text-align:center;margin:10px 0 0;}

/* toast */
.cv-toast{
  position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:40;
  background:var(--ink);color:var(--paper);padding:12px 20px;border-radius:2px;
  font-size:14px;box-shadow:0 6px 24px rgba(20,32,42,.28);
  animation:cv-pop .2s ease-out;
}
@keyframes cv-pop{from{transform:translate(-50%,8px);opacity:0;}to{transform:translate(-50%,0);opacity:1;}}

/* responsive */
@media (max-width:760px){
  .cv-hero{padding:28px 16px 20px;gap:28px;}
  .cv-bignum{font-size:76px;}
  .cv-countcopy{font-size:16px;}
  .cv-head,.cv-bar{padding-left:16px;padding-right:16px;}
  .cv-ledger{margin:0 16px;}
  .cv-lhead{display:none;}
  .cv-row{grid-template-columns:1fr auto;gap:8px 12px;}
  .cv-hidesm{display:none;}
  .cv-act{grid-column:1 / -1;text-align:left;}
  .cv-tick{width:7px;}
}
@media (prefers-reduced-motion:reduce){
  .cv-root *{animation:none !important;transition:none !important;}
}
`;
