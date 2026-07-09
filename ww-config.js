export default {
  editor: { label: { en: "PM Calendar" } },
  triggerEvents: [
    { name: "eventClick", label: { en: "On event click" }, event: { id: "", title: "", date: "", tag: "", event: {} } },
    { name: "scheduleClick", label: { en: "On 'Schedule' click (unscheduled item)" }, event: { id: "", title: "", tag: "", event: {} } },
    { name: "dateClick", label: { en: "On day/slot click" }, event: { date: "" } },
    { name: "schedule", label: { en: "On drag-to-schedule (unscheduled → calendar)" }, event: { id: "", date: "", allDay: false, title: "", tag: "", event: {} } },
    { name: "eventDrop", label: { en: "On event dragged (reschedule)" }, event: { id: "", date: "", allDay: false, title: "", tag: "", event: {} } },
    { name: "viewChange", label: { en: "On view change" }, event: { view: "month" } },
    { name: "navigate", label: { en: "On navigate (range change)" }, event: { view: "month", date: "", rangeStart: "", rangeEnd: "" } },
  ],
  properties: {
    title: { label: { en: "Title" }, type: "Text", defaultValue: "Calendar", bindable: true },

    // ---- events / trackers ----
    // Bind your trackers/events. Accepts an array or a WeWeb collection.
    // Items WITHOUT a valid date (or scheduled:false) are treated as
    // unscheduled and surface in the "Needs Scheduling" action list.
    events: {
      label: { en: "Events / trackers (bind)" }, type: "Array", bindable: true,
      defaultValue: [
        { id: "e1", title: "Project#2690 QC Visit", date: "2026-07-08T09:00:00Z", tag: "QC", pm_name: "Joey Robinson", scheduled: true },
        { id: "e2", title: "Project#3080 Install", date: "2026-07-08T13:30:00Z", tag: "Install", pm_name: "James Sanzone", scheduled: true },
        { id: "e3", title: "Project#3079 Walkthrough", date: "2026-07-06T10:00:00Z", tag: "Walkthrough", pm_name: "AJ Burns", scheduled: true },
        { id: "e4", title: "Project#2955 Repipe", date: "2026-07-15", tag: "Repipe", pm_name: "James Sanzone", scheduled: true },
        { id: "e5", title: "Project#3099 Follow-up", date: "2026-07-22", tag: "Follow-up", pm_name: "Grady Pearson Jr.", scheduled: true },
        { id: "u1", title: "Project#2135 - 2767 New South Drive", date: "", tag: "Sold Unscheduled", scheduled: false },
        { id: "u2", title: "Project#3083 - 363 Brook Lea Cove", date: "", tag: "Sold Unscheduled", scheduled: false },
        { id: "u3", title: "Project#2118 - 134 Stoneybrooks Place", date: "", tag: "Needs QC", scheduled: false },
      ],
    },
    idKey: { label: { en: "Field: id" }, type: "Text", defaultValue: "id", bindable: true, section: "settings" },
    titleKey: { label: { en: "Field: title" }, type: "Text", defaultValue: "title", bindable: true, section: "settings" },
    dateKey: { label: { en: "Field: date/start" }, type: "Text", defaultValue: "date", bindable: true, section: "settings" },
    endKey: { label: { en: "Field: end (optional)" }, type: "Text", defaultValue: "end", bindable: true, section: "settings" },
    tagKey: { label: { en: "Field: tag/label" }, type: "Text", defaultValue: "tag", bindable: true, section: "settings" },
    pmKey: { label: { en: "Field: PM / assignee" }, type: "Text", defaultValue: "pm_name", bindable: true, section: "settings" },
    colorKey: { label: { en: "Field: color (hex, optional)" }, type: "Text", defaultValue: "color", bindable: true, section: "settings" },
    scheduledKey: { label: { en: "Field: scheduled (bool, optional)" }, type: "Text", defaultValue: "scheduled", bindable: true, section: "settings" },

    // ---- views ----
    defaultView: {
      label: { en: "Default view" }, type: "TextSelect",
      options: { options: [
        { value: "month", label: { en: "Month" } },
        { value: "week", label: { en: "Week" } },
        { value: "day", label: { en: "Day" } },
      ] }, defaultValue: "month", bindable: true,
    },
    showViewSwitch: { label: { en: "Show view switcher" }, type: "OnOff", defaultValue: true, bindable: true },
    showPmName: { label: { en: "Show PM name on events" }, type: "OnOff", defaultValue: true, bindable: true },
    weekStartsMonday: { label: { en: "Week starts Monday" }, type: "OnOff", defaultValue: false, bindable: true },
    utc: { label: { en: "Interpret & display times as UTC" }, type: "OnOff", defaultValue: true, bindable: true },
    maxPerDay: { label: { en: "Max events per day cell (month)" }, type: "Number", options: { min: 1, max: 10, step: 1 }, defaultValue: 3, bindable: true },
    // ---- week/day time grid ----
    dayStartHour: { label: { en: "Day start hour (0-23)" }, type: "Number", options: { min: 0, max: 23, step: 1 }, defaultValue: 7, bindable: true },
    dayEndHour: { label: { en: "Day end hour (1-24)" }, type: "Number", options: { min: 1, max: 24, step: 1 }, defaultValue: 20, bindable: true },
    defaultDurationMin: { label: { en: "Default event length (min)" }, type: "Number", options: { min: 15, max: 480, step: 15 }, defaultValue: 60, bindable: true },
    enableDragDrop: { label: { en: "Enable drag to schedule / reschedule" }, type: "OnOff", defaultValue: true, bindable: true },

    // ---- side lists ----
    showEventList: { label: { en: "Show events list" }, type: "OnOff", defaultValue: true, bindable: true },
    eventListTitle: { label: { en: "Events list title" }, type: "Text", defaultValue: "Events", bindable: true },
    hidePastEvents: { label: { en: "Events list: only yesterday & after" }, type: "OnOff", defaultValue: true, bindable: true },
    showUnscheduled: { label: { en: "Show 'Needs Scheduling' list" }, type: "OnOff", defaultValue: true, bindable: true },
    unscheduledTitle: { label: { en: "Needs-scheduling title" }, type: "Text", defaultValue: "Needs Scheduling", bindable: true },
    scheduleLabel: { label: { en: "Schedule button label" }, type: "Text", defaultValue: "Schedule", bindable: true },
    emptyEventsText: { label: { en: "Empty events text" }, type: "Text", defaultValue: "No events in this range", bindable: true },
    emptyUnscheduledText: { label: { en: "Empty unscheduled text" }, type: "Text", defaultValue: "All caught up — nothing to schedule", bindable: true },

    // ---- theme (standard across pp- components) ----
    primaryColor: { label: { en: "Primary color" }, type: "Color", defaultValue: "#10b981", bindable: true },
    accentColor: { label: { en: "Accent color" }, type: "Color", defaultValue: "#6366f1", bindable: true },
    darkMode: {
      label: { en: "Theme mode" }, type: "TextSelect",
      options: { options: [
        { value: "auto", label: { en: "Auto (system)" } },
        { value: "light", label: { en: "Light" } },
        { value: "dark", label: { en: "Dark" } },
      ] }, defaultValue: "auto", bindable: true,
    },
    radius: { label: { en: "Corner radius (px)" }, type: "Number", options: { min: 0, max: 32, step: 1 }, defaultValue: 16, bindable: true },
  },
};
