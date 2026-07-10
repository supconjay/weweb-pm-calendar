<template>
  <div class="pp-root" :class="themeClass" :style="rootStyle">
    <div class="pp-card">
      <!-- toolbar -->
      <div class="pp-cal__bar">
        <div class="pp-cal__barleft">
          <h2 class="pp-cal__title">{{ content.title }}</h2>
          <div class="pp-cal__nav">
            <button type="button" class="pp-iconbtn" @click="navigate(-1)" aria-label="Previous"><svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('chevron-left')"></path></svg></button>
            <button type="button" class="pp-todaybtn" @click="goToday">Today</button>
            <button type="button" class="pp-iconbtn" @click="navigate(1)" aria-label="Next"><svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('chevron-right')"></path></svg></button>
          </div>
          <span class="pp-cal__range">{{ rangeLabel }}</span>
        </div>
        <div v-if="content.showViewSwitch !== false" class="pp-viewswitch">
          <button v-for="v in ['month','week','day']" :key="v" type="button" class="pp-viewswitch__btn" :class="{ 'pp-viewswitch__btn--active': view === v }" @click="setView(v)">{{ cap(v) }}</button>
        </div>
      </div>

      <div class="pp-cal__layout">
        <!-- calendar surface -->
        <div class="pp-cal__main">
          <!-- MONTH -->
          <div v-if="view === 'month'" class="pp-month">
            <div class="pp-month__dow">
              <span v-for="d in weekdayLabels" :key="d" class="pp-month__dowcell">{{ d }}</span>
            </div>
            <div class="pp-month__grid">
              <div
                v-for="(cell, ci) in monthCells" :key="ci"
                class="pp-daycell"
                :class="{ 'pp-daycell--out': !cell.inMonth, 'pp-daycell--today': cell.isToday, 'pp-dropover': dragOverKey === 'm' + ci }"
                @click="clickDate(cell.date)"
                @dragover="onDragOver($event, 'm' + ci)" @dragleave="onDragLeave" @drop="onMonthDrop($event, cell.date)"
              >
                <div class="pp-daycell__num">{{ cell.day }}</div>
                <div class="pp-daycell__events">
                  <button
                    v-for="ev in cell.events.slice(0, maxPerDay)" :key="ev._k" type="button"
                    class="pp-chip" :style="chipStyle(ev)" :title="ev.pm ? ev.title + ' — ' + ev.pm : ev.title"
                    :draggable="dragEnabled" @dragstart="onEventDragStart($event, ev)" @dragend="onDragEnd"
                    @click.stop="clickEvent(ev)"
                  >
                    <span class="pp-chip__dot" :style="dotStyle(ev)"></span>
                    <span v-if="ev.timeText" class="pp-chip__time">{{ ev.timeText }}</span>
                    <span class="pp-chip__label">{{ ev.title }}</span>
                  </button>
                  <button v-if="cell.events.length > maxPerDay" type="button" class="pp-chip pp-chip--more" @click.stop="openDay(cell.date)">
                    +{{ cell.events.length - maxPerDay }} more
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- WEEK / DAY time grid -->
          <div v-else class="pp-tg" :class="{ 'pp-tg--day': view === 'day' }">
            <div class="pp-tg__scroll">
            <div class="pp-tg__top">
            <div class="pp-tg__head">
              <div class="pp-tg__corner"></div>
              <div v-for="col in gridDays" :key="col.key" class="pp-tg__dayhead" :class="{ 'pp-tg__dayhead--today': col.isToday }">
                <span class="pp-tg__dow">{{ col.dow }} {{ col.mlabel }}</span>
              </div>
            </div>
            <div class="pp-tg__allday">
              <div class="pp-tg__alllabel">all-day</div>
              <div
                v-for="col in gridDays" :key="col.key"
                class="pp-tg__alldaycell" :class="{ 'pp-dropover': dragOverKey === 'ad' + col.key }"
                @dragover="onDragOver($event, 'ad' + col.key)" @dragleave="onDragLeave" @drop="onAllDayDrop($event, col.date)"
              >
                <button
                  v-for="ev in col.allDay" :key="ev._k" type="button" class="pp-chip" :style="chipStyle(ev)"
                  :draggable="dragEnabled" @dragstart="onEventDragStart($event, ev)" @dragend="onDragEnd" @click.stop="clickEvent(ev)"
                >
                  <span class="pp-chip__dot" :style="dotStyle(ev)"></span>
                  <span class="pp-chip__label">{{ ev.title }}</span>
                </button>
              </div>
            </div>
            </div>
            <div class="pp-tg__body">
              <div class="pp-tg__gutter" :style="{ height: gridHeight + 'px' }">
                <span v-for="h in hourMarks" :key="h" class="pp-tg__hlabel" :style="{ top: hourTop(h) + 'px' }">{{ hourLabel(h) }}</span>
              </div>
              <div class="pp-tg__cols" :style="{ height: gridHeight + 'px' }">
                <div
                  v-for="col in gridDays" :key="col.key"
                  class="pp-tg__col" :class="{ 'pp-tg__col--today': col.isToday, 'pp-dropover': dragOverKey === 'c' + col.key }"
                  @dragover="onDragOver($event, 'c' + col.key)" @dragleave="onDragLeave" @drop="onColDrop($event, col.date)"
                  @click="clickCol($event, col.date)"
                >
                  <div
                    v-for="ev in col.timed" :key="ev._k" class="pp-tgevent" :style="eventBlockStyle(ev)" :title="ev.title"
                    :draggable="dragEnabled" @dragstart="onEventDragStart($event, ev)" @dragend="onDragEnd" @click.stop="clickEvent(ev)"
                  >
                    <span class="pp-tgevent__time">{{ ev.spanText }}</span>
                    <span class="pp-tgevent__title">{{ ev.title }}</span>
                    <span v-if="content.showPmName !== false && ev.pm" class="pp-tgevent__pm"><svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('user')"></path></svg>{{ ev.pm }}</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <!-- side lists -->
        <aside v-if="content.showEventList !== false || content.showUnscheduled !== false" class="pp-side">
          <div v-if="content.showEventList !== false" class="pp-panel">
            <div class="pp-panel__head">
              <span>{{ content.eventListTitle || 'Events' }}</span>
              <span class="pp-panel__count">{{ rangeEvents.length }}</span>
            </div>
            <ul class="pp-panel__list">
              <li v-for="ev in rangeEvents" :key="ev._k">
                <button type="button" class="pp-listitem" @click="clickEvent(ev)">
                  <span class="pp-listitem__bar" :style="dotStyle(ev)"></span>
                  <span class="pp-listitem__main">
                    <span class="pp-listitem__title">{{ ev.title }}</span>
                    <span class="pp-listitem__meta">{{ ev.dateText }}<template v-if="ev.timeText"> · {{ ev.timeText }}</template></span>
                    <span v-if="content.showPmName !== false && ev.pm" class="pp-listitem__pm"><svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('user')"></path></svg>{{ ev.pm }}</span>
                  </span>
                  <span v-if="ev.tag" class="pp-tag" :style="tagStyle(ev)">{{ ev.tag }}</span>
                </button>
              </li>
              <li v-if="!rangeEvents.length" class="pp-panel__empty">{{ content.emptyEventsText || 'No events in this range' }}</li>
            </ul>
          </div>

          <div v-if="content.showUnscheduled !== false" class="pp-panel pp-panel--action">
            <div class="pp-panel__head">
              <span><svg class="pp-svg pp-panel__icon" v-bind="svgAttrs"><path :d="ic('alert')"></path></svg>{{ content.unscheduledTitle || 'Needs Scheduling' }}</span>
              <span class="pp-panel__count pp-panel__count--warn">{{ unscheduled.length }}</span>
            </div>
            <ul class="pp-panel__list">
              <li
                v-for="ev in unscheduled" :key="ev._k" class="pp-actionli"
                :draggable="dragEnabled" @dragstart="onUnschedDragStart($event, ev)" @dragend="onDragEnd"
              >
                <div class="pp-actionitem">
                  <div class="pp-actionitem__title">{{ ev.title }}</div>
                  <div class="pp-actionitem__foot">
                    <span v-if="ev.tag" class="pp-tag" :style="tagStyle(ev)">{{ ev.tag }}</span>
                    <span class="pp-actionitem__spacer"></span>
                    <button type="button" class="pp-schedbtn" @click="clickSchedule(ev)">
                      <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('calendar-plus')"></path></svg>
                      {{ content.scheduleLabel || 'Schedule' }}
                    </button>
                  </div>
                  <div v-if="dragEnabled" class="pp-actionitem__hint">
                    <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('grip')"></path></svg>
                    Drag onto a day or time slot to schedule
                  </div>
                </div>
              </li>
              <li v-if="!unscheduled.length" class="pp-panel__empty">{{ content.emptyUnscheduledText || 'All caught up' }}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script>
const ICONS = {
  "chevron-left": "M15 18l-6-6 6-6",
  "chevron-right": "M9 18l6-6-6-6",
  alert: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  "calendar-plus": "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 14v4M10 16h4",
  grip: "M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];
const DOW_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HOUR_H = 56;         // px per hour in the time grid
const MIN_EVENT_H = 26;    // min block height
const SNAP_MIN = 30;       // drop snapping (minutes)

export default {
  props: { content: { type: Object, required: true }, uid: { type: String, required: false } },
  emits: ["trigger-event"],
  data() {
    return {
      view: this.content.defaultView || "month",
      cursor: this.startOfDay(new Date()),
      overrides: {},      // id -> ISO date (optimistic drag result)
      dragId: null,
      dragKind: null,     // 'event' | 'unscheduled'
      dragOverKey: null,
    };
  },
  watch: {
    "content.defaultView"(v) { if (v) this.view = v; },
    "content.events"() { this.overrides = {}; },   // fresh server data wins
  },
  computed: {
    dragEnabled() { return this.content.enableDragDrop !== false; },
    maxPerDay() { const n = Number(this.content.maxPerDay); return n > 0 ? Math.floor(n) : 3; },
    dayStartHour() { const n = Number(this.content.dayStartHour); return isFinite(n) ? Math.max(0, Math.min(23, n)) : 7; },
    dayEndHour() { const n = Number(this.content.dayEndHour); const v = isFinite(n) ? Math.max(1, Math.min(24, n)) : 20; return v <= this.dayStartHour ? this.dayStartHour + 1 : v; },
    defaultDurMin() { const n = Number(this.content.defaultDurationMin); return n > 0 ? n : 60; },
    gridHeight() { return (this.dayEndHour - this.dayStartHour) * HOUR_H; },
    hourMarks() { const out = []; for (let h = this.dayStartHour; h <= this.dayEndHour; h++) out.push(h); return out; },
    weekStart() { return this.content.weekStartsMonday ? 1 : 0; },
    uc() { return this.content.utc !== false; },   // interpret/display all dates in UTC
    weekdayLabels() { const out = []; for (let i = 0; i < 7; i++) out.push(DOW_SUN[(this.weekStart + i) % 7]); return out; },
    eventsById() { const m = {}; this.normEvents.forEach((e) => { if (e.id !== "" && e.id != null) m[e.id] = e; }); return m; },
    normEvents() {
      let raw = this.content.events;
      if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) raw = raw.data;
      if (!Array.isArray(raw)) return [];
      const tk = this.content.titleKey || "title";
      const dk = this.content.dateKey || "date";
      const ek = this.content.endKey || "end";
      const gk = this.content.tagKey || "tag";
      const ck = this.content.colorKey || "color";
      const sk = this.content.scheduledKey || "scheduled";
      const pmk = this.content.pmKey || "pm_name";
      const idk = this.content.idKey || "id";
      const dur = this.defaultDurMin;
      return raw.map((o, i) => {
        const obj = o && typeof o === "object" ? o : { [tk]: o };
        const idVal = obj[idk] != null ? obj[idk] : "";
        let date = this.parseDate(this.unwrap(obj[dk]));
        let overridden = false;
        if (idVal !== "" && this.overrides[idVal] != null) { date = this.parseDate(this.overrides[idVal]); overridden = true; }
        let end = this.parseDate(this.unwrap(obj[ek]));
        const schedRaw = obj[sk];
        const scheduled = overridden ? true : (schedRaw === false || schedRaw === "false" ? false : !!date);
        const hasTime = !!date && (this.gH(date) !== 0 || this.gMi(date) !== 0);
        if (date && !end) end = new Date(date.getTime() + dur * 60000);
        const startMin = date ? this.gH(date) * 60 + this.gMi(date) : null;
        const endMin = end ? this.gH(end) * 60 + this.gMi(end) : null;
        return {
          _k: (idVal !== "" ? idVal : "i" + i) + "_" + i,
          id: idVal,
          title: String(this.unwrap(obj[tk]) || "Untitled"),
          date, end, tag: String(this.unwrap(obj[gk]) || ""),
          pm: this.namesOf(obj[pmk]),
          color: this.unwrap(obj[ck]) || "",
          scheduled, hasTime, startMin, endMin,
          timeText: hasTime ? this.timeStr(date) : "",
          spanText: hasTime ? `${this.timeStr(date)} - ${this.timeStr(end)}` : "",
          dateText: date ? `${MON_SHORT[this.gMo(date)]} ${this.gD(date)}` : "",
          raw: obj,
        };
      });
    },
    scheduledEvents() { return this.normEvents.filter((e) => e.scheduled && e.date); },
    unscheduled() { return this.normEvents.filter((e) => !e.scheduled || !e.date); },
    rangeBounds() {
      if (this.view === "day") return { start: this.startOfDay(this.cursor), end: this.endOfDay(this.cursor) };
      if (this.view === "week") { const s = this.startOfWeek(this.cursor); return { start: s, end: this.endOfDay(this.addDays(s, 6)) }; }
      return { start: this.startOfMonth(this.cursor), end: this.endOfDay(this.endOfMonth(this.cursor)) };
    },
    rangeEvents() {
      const { start, end } = this.rangeBounds;
      let lo = start;
      // Events list floor: only today and after (hide past items).
      if (this.content.hidePastEvents !== false) {
        const t = this.startOfDay(new Date());
        if (t > lo) lo = t;
      }
      return this.scheduledEvents.filter((e) => e.date >= lo && e.date <= end).sort((a, b) => a.date - b.date);
    },
    monthCells() {
      const first = this.startOfMonth(this.cursor);
      const gridStart = this.startOfWeek(first);
      const cells = [];
      const today = this.startOfDay(new Date());
      const month = this.gMo(this.cursor);
      for (let i = 0; i < 42; i++) {
        const date = this.addDays(gridStart, i);
        cells.push({ date, day: this.gD(date), inMonth: this.gMo(date) === month, isToday: this.isSameDay(date, today), events: this.eventsOnDay(date) });
        if (i >= 34 && this.gMo(date) !== month && this.gMo(this.addDays(gridStart, i - 6)) !== month) break;
      }
      return cells;
    },
    weekDays() {
      const s = this.startOfWeek(this.cursor);
      const out = [];
      for (let i = 0; i < 7; i++) out.push(this.buildDay(this.addDays(s, i)));
      return out;
    },
    gridDays() { return this.view === "day" ? [this.buildDay(this.cursor)] : this.weekDays; },
    rangeLabel() {
      const d = this.cursor;
      if (this.view === "day") return `${DOW_SUN[this.gDay(d)]}, ${MON_SHORT[this.gMo(d)]} ${this.gD(d)}, ${this.gY(d)}`;
      if (this.view === "week") {
        const s = this.startOfWeek(d), e = this.addDays(s, 6);
        if (this.gMo(s) === this.gMo(e)) return `${MON_SHORT[this.gMo(s)]} ${this.gD(s)} – ${this.gD(e)}, ${this.gY(e)}`;
        return `${MON_SHORT[this.gMo(s)]} ${this.gD(s)} – ${MON_SHORT[this.gMo(e)]} ${this.gD(e)}, ${this.gY(e)}`;
      }
      return `${MONTHS[this.gMo(d)]} ${this.gY(d)}`;
    },
    hourBgStyle() { return {}; },
    svgAttrs() {
      return { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" };
    },
    themeClass() {
      const m = this.content.darkMode || "auto";
      return { "pp-auto": m === "auto", "pp-dark": m === "dark", "pp-light": m === "light" };
    },
    rootStyle() {
      return {
        "--pp-primary": this.content.primaryColor || "#10b981",
        "--pp-accent": this.content.accentColor || "#6366f1",
        "--pp-hourh": HOUR_H + "px",
        "--pp-radius": (this.content.radius != null ? this.content.radius : 16) + "px",
      };
    },
  },
  methods: {
    ic(name) { return ICONS[name] || ""; },
    cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); },
    unwrap(v) { if (Array.isArray(v)) { const l = v.filter((x) => x != null && x !== ""); return l.length ? l[0] : ""; } return v == null ? "" : v; },
    // PM/assignee may arrive as an array of names or a single value — join them.
    namesOf(v) {
      if (Array.isArray(v)) return v.filter((x) => x != null && x !== "").map((x) => String(x).trim()).join(", ");
      return v == null ? "" : String(v).trim();
    },
    parseDate(v) { if (!v) return null; if (v instanceof Date) return isNaN(v.getTime()) ? null : v; const d = new Date(v); return isNaN(d.getTime()) ? null : d; },
    // Date-part accessors that honor the UTC flag, plus a UTC/local constructor.
    gY(d) { return this.uc ? d.getUTCFullYear() : d.getFullYear(); },
    gMo(d) { return this.uc ? d.getUTCMonth() : d.getMonth(); },
    gD(d) { return this.uc ? d.getUTCDate() : d.getDate(); },
    gDay(d) { return this.uc ? d.getUTCDay() : d.getDay(); },
    gH(d) { return this.uc ? d.getUTCHours() : d.getHours(); },
    gMi(d) { return this.uc ? d.getUTCMinutes() : d.getMinutes(); },
    mk(y, mo, d, h, mi) { return this.uc ? new Date(Date.UTC(y, mo, d, h || 0, mi || 0, 0, 0)) : new Date(y, mo, d, h || 0, mi || 0, 0, 0); },
    setTime(dateObj, mins) { const d = new Date(dateObj); const h = Math.floor(mins / 60), m = mins % 60; if (this.uc) d.setUTCHours(h, m, 0, 0); else d.setHours(h, m, 0, 0); return d; },
    startOfDay(d) { return this.mk(this.gY(d), this.gMo(d), this.gD(d), 0, 0); },
    endOfDay(d) { const x = new Date(this.startOfDay(d)); if (this.uc) x.setUTCHours(23, 59, 59, 999); else x.setHours(23, 59, 59, 999); return x; },
    startOfMonth(d) { return this.mk(this.gY(d), this.gMo(d), 1, 0, 0); },
    endOfMonth(d) { return this.mk(this.gY(d), this.gMo(d) + 1, 0, 0, 0); },
    addDays(d, n) { const b = this.startOfDay(d); return this.mk(this.gY(b), this.gMo(b), this.gD(b) + n, 0, 0); },
    addMonths(d, n) { return this.mk(this.gY(d), this.gMo(d) + n, Math.min(this.gD(d), 28), 0, 0); },
    startOfWeek(d) { const x = this.startOfDay(d); const diff = (this.gDay(x) - this.weekStart + 7) % 7; return this.addDays(x, -diff); },
    isSameDay(a, b) { return a && b && this.gY(a) === this.gY(b) && this.gMo(a) === this.gMo(b) && this.gD(a) === this.gD(b); },
    timeStr(d) { let h = this.gH(d); const m = this.gMi(d); const ap = h >= 12 ? "PM" : "AM"; h = h % 12; if (h === 0) h = 12; return m === 0 ? `${h}:00 ${ap}` : `${h}:${String(m).padStart(2, "0")} ${ap}`; },
    hourLabel(h) { const ap = h >= 12 && h < 24 ? "pm" : "am"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ap; },
    hourTop(h) { return (h - this.dayStartHour) * HOUR_H; },
    eventsOnDay(day) { return this.scheduledEvents.filter((e) => this.isSameDay(e.date, day)).sort((a, b) => a.date - b.date); },
    buildDay(date) {
      const today = this.startOfDay(new Date());
      const evs = this.eventsOnDay(date);
      const allDay = evs.filter((e) => !e.hasTime);
      const timed = this.layoutDayEvents(evs.filter((e) => e.hasTime));
      return { key: this.gY(date) + "-" + (this.gMo(date) + 1) + "-" + this.gD(date), date, dow: DOW_SUN[this.gDay(date)], mlabel: (this.gMo(date) + 1) + "/" + this.gD(date), isToday: this.isSameDay(date, today), allDay, timed };
    },
    // Pack overlapping events into side-by-side lanes; returns each with layout.
    layoutDayEvents(evs) {
      const ds = this.dayStartHour * 60, de = this.dayEndHour * 60;
      const items = evs.map((ev) => {
        let s = ev.startMin != null ? ev.startMin : ds;
        let e = ev.endMin != null ? ev.endMin : s + this.defaultDurMin;
        if (e <= s) e = s + this.defaultDurMin;
        s = Math.max(s, ds); e = Math.min(e, de); if (e <= s) e = Math.min(s + 30, de);
        return { ev, s, e };
      }).sort((a, b) => a.s - b.s || a.e - b.e);
      const clusters = []; let cur = []; let curEnd = -1;
      items.forEach((it) => { if (cur.length && it.s >= curEnd) { clusters.push(cur); cur = []; curEnd = -1; } cur.push(it); curEnd = Math.max(curEnd, it.e); });
      if (cur.length) clusters.push(cur);
      const out = [];
      clusters.forEach((cluster) => {
        const lanes = [];
        cluster.forEach((it) => {
          let lane = lanes.findIndex((end) => end <= it.s);
          if (lane === -1) { lane = lanes.length; lanes.push(it.e); } else lanes[lane] = it.e;
          it.lane = lane;
        });
        const cols = lanes.length || 1;
        cluster.forEach((it) => {
          out.push(Object.assign({}, it.ev, {
            _top: (it.s - ds) / 60 * HOUR_H,
            _height: Math.max((it.e - it.s) / 60 * HOUR_H, MIN_EVENT_H),
            _leftPct: (it.lane / cols) * 100,
            _widthPct: (1 / cols) * 100,
          }));
        });
      });
      return out;
    },
    eventBlockStyle(ev) {
      const c = this.colorOf(ev);
      return { top: ev._top + "px", height: ev._height + "px", left: "calc(" + ev._leftPct + "% + 2px)", width: "calc(" + ev._widthPct + "% - 4px)", background: c, "--chip": c };
    },
    colorOf(ev) {
      if (ev.color && /^#|rgb|hsl/.test(String(ev.color))) return ev.color;
      const key = String(ev.tag || ev.title || "");
      let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
      return PALETTE[h % PALETTE.length];
    },
    dotStyle(ev) { return { background: this.colorOf(ev) }; },
    chipStyle(ev) { const c = this.colorOf(ev); return { "--chip": c }; },
    tagStyle(ev) { const c = this.colorOf(ev); return { color: c, background: "color-mix(in srgb, " + c + " 14%, transparent)" }; },
    // ---- nav ----
    setView(v) { if (this.view === v) return; this.view = v; this.$emit("trigger-event", { name: "viewChange", event: { view: v } }); this.emitNavigate(); },
    navigate(dir) {
      if (this.view === "day") this.cursor = this.addDays(this.cursor, dir);
      else if (this.view === "week") this.cursor = this.addDays(this.cursor, dir * 7);
      else this.cursor = this.addMonths(this.cursor, dir);
      this.emitNavigate();
    },
    goToday() { this.cursor = this.startOfDay(new Date()); this.emitNavigate(); },
    openDay(date) { this.cursor = this.startOfDay(date); this.setView("day"); },
    emitNavigate() { const { start, end } = this.rangeBounds; this.$emit("trigger-event", { name: "navigate", event: { view: this.view, date: this.toISO(this.cursor), rangeStart: this.toISO(start), rangeEnd: this.toISO(end) } }); },
    toISO(d) { try { return new Date(d).toISOString(); } catch (e) { return ""; } },
    // ---- click emits ----
    clickDate(date) { if (this.dragId) return; this.$emit("trigger-event", { name: "dateClick", event: { date: this.toISO(date) } }); },
    clickCol(e, date) {
      if (this.dragId) return;
      const mins = this.minutesFromPointer(e, e.currentTarget);
      const nd = this.setTime(date, mins);
      this.$emit("trigger-event", { name: "dateClick", event: { date: this.toISO(nd) } });
    },
    clickEvent(ev) { this.$emit("trigger-event", { name: "eventClick", event: { id: ev.id, title: ev.title, date: this.toISO(ev.date), tag: ev.tag, pm: ev.pm, event: ev.raw } }); },
    clickSchedule(ev) { this.$emit("trigger-event", { name: "scheduleClick", event: { id: ev.id, title: ev.title, tag: ev.tag, event: ev.raw } }); },
    // ---- drag & drop ----
    onEventDragStart(e, ev) {
      if (!this.dragEnabled) return;
      this.dragId = ev.id; this.dragKind = "event";
      try { e.dataTransfer.setData("text/plain", String(ev.id)); e.dataTransfer.effectAllowed = "move"; } catch (err) {}
    },
    onUnschedDragStart(e, ev) {
      if (!this.dragEnabled) return;
      this.dragId = ev.id; this.dragKind = "unscheduled";
      try { e.dataTransfer.setData("text/plain", String(ev.id)); e.dataTransfer.effectAllowed = "move"; } catch (err) {}
    },
    onDragOver(e, key) { if (this.dragId == null) return; e.preventDefault(); this.dragOverKey = key; if (e.dataTransfer) e.dataTransfer.dropEffect = "move"; },
    onDragLeave() { this.dragOverKey = null; },
    onDragEnd() { this.dragId = null; this.dragKind = null; this.dragOverKey = null; },
    minutesFromPointer(e, colEl) {
      const rect = colEl.getBoundingClientRect();
      let mins = ((e.clientY - rect.top) / HOUR_H) * 60 + this.dayStartHour * 60;
      mins = Math.round(mins / SNAP_MIN) * SNAP_MIN;
      const min = this.dayStartHour * 60, max = this.dayEndHour * 60 - SNAP_MIN;
      return Math.max(min, Math.min(max, mins));
    },
    onColDrop(e, date) {
      e.preventDefault();
      if (this.dragId == null) return;
      const mins = this.minutesFromPointer(e, e.currentTarget);
      const nd = this.setTime(date, mins);
      this.commitDrop(nd, false);
    },
    onAllDayDrop(e, date) { e.preventDefault(); if (this.dragId == null) return; this.commitDrop(this.startOfDay(date), true); },
    onMonthDrop(e, date) {
      e.preventDefault();
      if (this.dragId == null) return;
      const src = this.eventsById[this.dragId];
      let nd = this.startOfDay(date);
      let allDay = true;
      if (src && src.startMin != null && src.hasTime) { nd = this.setTime(nd, src.startMin); allDay = false; }
      this.commitDrop(nd, allDay);
    },
    commitDrop(dateObj, allDay) {
      const id = this.dragId, kind = this.dragKind;
      if (id == null || id === "") { this.onDragEnd(); return; }
      const src = this.eventsById[id] || {};
      this.overrides = Object.assign({}, this.overrides, { [id]: dateObj.toISOString() });
      const name = kind === "unscheduled" ? "schedule" : "eventDrop";
      this.$emit("trigger-event", { name, event: { id, date: dateObj.toISOString(), allDay: !!allDay, title: src.title || "", tag: src.tag || "", event: src.raw || null } });
      this.onDragEnd();
    },
  },
};
</script>

<style lang="scss" scoped>
.pp-root {
  --surface: #ffffff; --surface-2: #f7f9fc; --surface-3: #eef2f7; --border: #e4e9f0; --border-strong: #d4dbe6;
  --text: #1f2a37; --text-muted: #64748b; --text-subtle: #94a3b8;
  --shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06);
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
  --success: #10b981; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6;
  --primary: var(--pp-primary, #10b981); --accent: var(--pp-accent, #6366f1); --radius: var(--pp-radius, 16px);
  --hour-h: var(--pp-hourh, 56px);
  box-sizing: border-box; width: 100%; max-width: 100%; container-type: inline-size; color: var(--text);
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.45;
}
.pp-root *, .pp-root *::before, .pp-root *::after { box-sizing: border-box; }
@mixin dark {
  --surface: #161f30; --surface-2: #1b2638; --surface-3: #202c40; --border: #28344a; --border-strong: #34425c;
  --text: #e8eef7; --text-muted: #94a3b8; --text-subtle: #64748b;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 12px 28px rgba(0, 0, 0, 0.35);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.pp-root.pp-dark { @include dark; }
@media (prefers-color-scheme: dark) { .pp-root.pp-auto { @include dark; } }

.pp-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: clamp(16px, 2.2vw, 22px); }

/* toolbar */
.pp-cal__bar { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
.pp-cal__barleft { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; min-width: 0; }
.pp-cal__title { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }
.pp-cal__nav { display: inline-flex; align-items: center; gap: 6px; }
.pp-todaybtn { padding: 7px 14px; border-radius: 9px; border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s; }
.pp-todaybtn:hover { background: var(--surface-2); border-color: var(--primary); }
.pp-cal__range { font-size: 15px; font-weight: 700; color: var(--text); }
.pp-iconbtn { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); cursor: pointer; transition: background .15s, color .15s; }
.pp-iconbtn:hover:not(:disabled) { background: var(--surface-2); color: var(--text); }
.pp-iconbtn .pp-svg { width: 16px; height: 16px; }

.pp-viewswitch { display: inline-flex; gap: 3px; padding: 4px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 11px; }
.pp-viewswitch__btn { border: none; background: transparent; color: var(--text-muted); padding: 7px 15px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .15s, color .15s; }
.pp-viewswitch__btn:hover { color: var(--text); }
.pp-viewswitch__btn--active { background: var(--surface); color: var(--primary); box-shadow: var(--shadow-sm); }

/* layout */
.pp-cal__layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; }
@container (min-width: 900px) { .pp-cal__layout { grid-template-columns: minmax(0, 1fr) 300px; align-items: start; } }
.pp-cal__main { min-width: 0; }

/* month */
.pp-month__dow { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
.pp-month__dowcell { text-align: center; font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: .04em; padding: 4px 0; }
.pp-month__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.pp-daycell { min-height: 96px; padding: 6px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); cursor: pointer; transition: border-color .15s, background .15s; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
.pp-daycell:hover { border-color: var(--border-strong); }
.pp-daycell--out { background: var(--surface-2); }
.pp-daycell--out .pp-daycell__num { color: var(--text-subtle); }
.pp-daycell--today { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); }
.pp-daycell__num { font-size: 12.5px; font-weight: 700; color: var(--text); align-self: flex-end; }
.pp-daycell--today .pp-daycell__num { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: #fff; }
.pp-daycell__events { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.pp-dropover { outline: 2px dashed var(--primary); outline-offset: -2px; background: color-mix(in srgb, var(--primary) 8%, transparent); }

.pp-chip { display: flex; align-items: center; gap: 5px; width: 100%; padding: 3px 6px; border: none; border-radius: 6px; background: color-mix(in srgb, var(--chip, var(--accent)) 14%, transparent); color: var(--text); font: inherit; font-size: 11px; font-weight: 600; cursor: pointer; text-align: left; min-width: 0; }
.pp-chip:hover { filter: brightness(.97); }
.pp-chip__dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.pp-chip__time { flex: none; font-variant-numeric: tabular-nums; color: var(--text-muted); }
.pp-chip__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-chip--more { background: none; color: var(--text-muted); justify-content: flex-start; padding: 2px 6px; }
.pp-chip--more:hover { color: var(--primary); }

/* time grid (week / day) */
.pp-tg { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
/* Single scroll container so the header, all-day row and time grid share the
   exact same width + scrollbar (otherwise the header drifts to the right). */
.pp-tg__scroll { max-height: 640px; overflow-y: auto; }
.pp-tg__top { position: sticky; top: 0; z-index: 5; background: var(--surface); }
.pp-tg__head, .pp-tg__allday { display: grid; grid-template-columns: 56px repeat(var(--cols, 7), minmax(0, 1fr)); }
.pp-tg--day .pp-tg__head, .pp-tg--day .pp-tg__allday { grid-template-columns: 56px minmax(0, 1fr); }
.pp-tg__corner, .pp-tg__alllabel { border-right: 1px solid var(--border); }
.pp-tg__alllabel { display: flex; align-items: center; justify-content: flex-end; padding: 6px 8px; font-size: 10.5px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; }
.pp-tg__dayhead { text-align: center; padding: 9px 4px; font-weight: 700; border-left: 1px solid var(--border); background: var(--surface-2); }
.pp-tg__dow { font-size: 12.5px; color: var(--text-muted); }
.pp-tg__dayhead--today { background: color-mix(in srgb, var(--primary) 12%, transparent); }
.pp-tg__dayhead--today .pp-tg__dow { color: var(--primary); }
.pp-tg__allday { border-top: 1px solid var(--border); min-height: 36px; }
.pp-tg__alldaycell { border-left: 1px solid var(--border); padding: 4px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }

.pp-tg__body { display: flex; }
.pp-tg__gutter { position: relative; width: 56px; flex: none; border-right: 1px solid var(--border); border-top: 1px solid var(--border); }
.pp-tg__hlabel { position: absolute; right: 6px; transform: translateY(-6px); font-size: 10.5px; font-weight: 600; color: var(--text-subtle); }
.pp-tg__cols { flex: 1; display: grid; grid-template-columns: repeat(var(--cols, 7), minmax(0, 1fr)); border-top: 1px solid var(--border); }
.pp-tg--day .pp-tg__cols { grid-template-columns: minmax(0, 1fr); }
.pp-tg__col { position: relative; border-left: 1px solid var(--border); background-image: repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 1px, transparent 1px, transparent var(--hour-h)); }
.pp-tg__col--today { background-color: color-mix(in srgb, var(--primary) 5%, transparent); }

.pp-tgevent { position: absolute; overflow: hidden; border-radius: 7px; padding: 4px 7px; color: #fff; cursor: grab; box-shadow: 0 2px 6px rgba(16, 24, 40, .18); border: 1px solid rgba(255, 255, 255, .25); display: flex; flex-direction: column; gap: 1px; }
.pp-tgevent:active { cursor: grabbing; }
.pp-tgevent__time { font-size: 10px; font-weight: 600; opacity: .92; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pp-tgevent__title { font-size: 11.5px; font-weight: 700; line-height: 1.25; overflow: hidden; }
.pp-tgevent__pm { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 600; opacity: .9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.pp-tgevent__pm .pp-svg { width: 10px; height: 10px; flex: none; }

/* week grid set cols var */
.pp-tg { --cols: 7; }
.pp-tg--day { --cols: 1; }

/* day view head label spacing already handled by grid */
.pp-day__empty, .pp-panel__empty { color: var(--text-subtle); font-size: 13px; text-align: center; padding: 22px 8px; list-style: none; }

/* side panels */
.pp-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.pp-panel { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow: hidden; }
.pp-panel--action { border-color: color-mix(in srgb, var(--warning) 40%, var(--border)); }
.pp-panel__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 11px 14px; background: var(--surface-2); border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 700; color: var(--text); }
.pp-panel__head > span:first-child { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
.pp-panel__icon { width: 15px; height: 15px; color: var(--warning); flex: none; }
.pp-panel__count { display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 7px; border-radius: 999px; background: color-mix(in srgb, var(--primary) 14%, transparent); color: var(--primary); font-size: 11.5px; font-weight: 700; }
.pp-panel__count--warn { background: color-mix(in srgb, var(--warning) 16%, transparent); color: var(--warning); }
.pp-panel__list { list-style: none; margin: 0; padding: 6px; display: flex; flex-direction: column; gap: 2px; max-height: 340px; overflow-y: auto; }

.pp-listitem { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 9px 10px; border: none; background: none; border-radius: 9px; cursor: pointer; font: inherit; color: var(--text); }
.pp-listitem:hover { background: var(--surface-2); }
.pp-listitem__bar { flex: none; width: 4px; align-self: stretch; min-height: 30px; border-radius: 3px; background: var(--accent); }
.pp-listitem__main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pp-listitem__title { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-listitem__meta { font-size: 11.5px; color: var(--text-muted); }
.pp-listitem__pm { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: var(--text-subtle); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-listitem__pm .pp-svg { width: 12px; height: 12px; flex: none; }
.pp-tag { flex: none; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--surface-3); color: var(--text-muted); white-space: nowrap; }

/* needs-scheduling action item (stacked so the button never covers the title) */
.pp-actionli { list-style: none; }
.pp-actionitem { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 10px; border: 1px solid transparent; cursor: grab; }
.pp-actionli:hover .pp-actionitem { background: var(--surface-2); border-color: var(--border); }
.pp-actionitem:active { cursor: grabbing; }
.pp-actionitem__title { font-size: 13px; font-weight: 600; color: var(--text); overflow-wrap: anywhere; }
.pp-actionitem__foot { display: flex; align-items: center; gap: 8px; }
.pp-actionitem__spacer { flex: 1; }
.pp-actionitem__hint { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-subtle); }
.pp-actionitem__hint .pp-svg { width: 13px; height: 13px; }
.pp-schedbtn { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 9px; border: none; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 32%, transparent); transition: filter .15s; }
.pp-schedbtn:hover { filter: brightness(1.06); }
.pp-schedbtn .pp-svg { width: 14px; height: 14px; }
.pp-svg { display: block; }

@container (max-width: 560px) {
  .pp-daycell { min-height: 72px; }
  .pp-chip__time { display: none; }
}
</style>
