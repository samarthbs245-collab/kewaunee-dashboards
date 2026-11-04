// Fills the approved dashboard template with an approved snapshot (port of the demo's render.py).
import TEMPLATE from "./template.mjs";
import { MON, MONTH_LONG, DAY, esc, fixed, pyRound, parseISO, parseFmt, pyJson } from "./util.mjs";

const js = (t) => { const d = new Date(t); return `${d.getUTCFullYear()},${d.getUTCMonth()},${d.getUTCDate()}`; };

export function tokens(snap, logo) {
  const o = snap.overall, D = snap.D;
  const dd = parseISO(snap.dates.data_date), start = parseISO(snap.dates.start), fin = parseISO(snap.dates.finish);
  const wk1 = parseISO(snap.dates.first_week_end);
  const v = o.variance;
  let varsigned, pill;
  if (v < 0) { varsigned = `−${fixed(Math.abs(v), 1)}`; pill = `${fixed(Math.abs(v), 1)} pts behind plan`; }
  else if (v > 0) { varsigned = `+${fixed(v, 1)}`; pill = `${fixed(v, 1)} pts ahead of plan`; }
  else { varsigned = "0.0"; pill = "On plan"; }
  const ms = D.ms;
  const done = ms.filter((m) => m[2]).length;
  const nxt = ms.findIndex((m) => !m[2]);
  const todayIdx = ms.filter((m) => parseFmt(m[0]) <= dd).length;
  let nx;
  if (nxt >= 0) {
    const nd = parseFmt(ms[nxt][0]); const d = new Date(nd);
    nx = { NXMON: MON[d.getUTCMonth()].toUpperCase(), NXDAY: String(d.getUTCDate()).padStart(2, "0"),
      NXDAYS: String(Math.round((nd - dd) / DAY)), NXNAME: esc(ms[nxt][1]) };
  } else nx = { NXMON: "—", NXDAY: "✓", NXDAYS: "0", NXNAME: "All milestones achieved" };
  const el = Math.round((dd - start) / DAY), tot = Math.round((fin - start) / DAY);
  const ddD = new Date(dd), finD = new Date(fin);
  const ticks = [...new Set([1, ...range(4, snap.week, 4), snap.week])].sort((a, b) => a - b);
  const dataJson = pyJson(D).replace(/<\//g, "<\\/");
  return {
    CLIENT: esc(snap.client.name), LOGO: logo,
    PHASE: esc(snap.project.phase), PSHORT: esc(snap.project.name_short), PLONG: esc(snap.project.name_long),
    WEEK: String(snap.week), WEEKIDX: String(snap.week - 1), TWEEKS: String(snap.total_weeks),
    REMWEEKS: String(snap.total_weeks - snap.week),
    DD_LONG: `${ddD.getUTCDate()} ${MONTH_LONG[ddD.getUTCMonth()]} ${ddD.getUTCFullYear()}`,
    DD_SHORT: `${String(ddD.getUTCDate()).padStart(2, "0")} ${MON[ddD.getUTCMonth()]} ${ddD.getUTCFullYear()}`,
    DD_TAG: `${String(ddD.getUTCDate()).padStart(2, "0")} ${MON[ddD.getUTCMonth()].toUpperCase()}`,
    ACT: fixed(o.actual, 1), PLAN: fixed(o.planned, 1), VARSIGNED: varsigned, VARPILL: pill,
    SPI: fixed(o.spi, 2), SPIW: String(pyRound(Math.min(o.spi, 1) * 100, 0)),
    DAYS: String(snap.days_left), FIN: `${String(finD.getUTCDate()).padStart(2, "0")} ${MON[finD.getUTCMonth()]} ${finD.getUTCFullYear()}`,
    ELDAYS: String(el), TOTDAYS: String(tot), ELPCT: String(pyRound((el / tot) * 100, 0)),
    MSDONE: String(done), MSTOTAL: String(ms.length), MSPCT: fixed((done / ms.length) * 100, 1),
    NEXTIDX: String(nxt), TODAYIDX: String(todayIdx),
    JS_START: js(start), JS_FIN: js(fin), JS_DD: js(dd), JS_WK1: js(wk1),
    TDTICKS: "[" + ticks.join(", ") + "]",
    DATA: dataJson, ...nx,
  };
}
function range(a, b, s) { const r = []; for (let i = a; i < b; i += s) r.push(i); return r; }

export function renderDashboard(snap, logo) {
  if (typeof logo !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logo)) throw new Error("Invalid logo");
  const t = tokens(snap, logo);
  const out = TEMPLATE.replace(/__K_([A-Z0-9_]+?)__/g, (_, k) => {
    if (!(k in t)) throw new Error("Unfilled dashboard token " + k);
    return t[k];
  });
  if (out.includes("__K_")) throw new Error("Unfilled dashboard token");
  return out;
}
