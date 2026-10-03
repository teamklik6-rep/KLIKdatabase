// Creates all TMA color variables (Light + Dark modes) from the Colors frame
// Run once via Plugins > Development > "Create TMA Color Variables"

function hex(h) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return r ? { r: parseInt(r[1], 16) / 255, g: parseInt(r[2], 16) / 255, b: parseInt(r[3], 16) / 255, a: 1 } : null;
}

function rgba(r, g, b, a) {
  return { r: r / 255, g: g / 255, b: b / 255, a };
}

const colors = [
  // ── Native TMA API Colors ────────────────────────────────────────────────
  { name: "bg_color",                          light: hex("#FFFFFF"),   dark: hex("#212121") },
  { name: "text_color",                        light: hex("#000000"),   dark: hex("#FFFFFF") },
  { name: "hint_color",                        light: hex("#707579"),   dark: hex("#AAAAAA") },
  { name: "link_color",                        light: hex("#007AFF"),   dark: hex("#2990FF") },
  { name: "button_color",                      light: hex("#007AFF"),   dark: hex("#2990FF") },
  { name: "button_text_color",                 light: hex("#FFFFFF"),   dark: hex("#FFFFFF") },
  { name: "secondary_bg_color",                light: hex("#EFEFF4"),   dark: hex("#0F0F0F") },

  // ── Native Extended Colors ───────────────────────────────────────────────
  { name: "native/header_bg_color",            light: hex("#FFFFFF"),   dark: hex("#212121") },
  { name: "native/accent_text_color",          light: hex("#007AFF"),   dark: hex("#007AFF") },
  { name: "native/section_bg_color",           light: hex("#FFFFFF"),   dark: hex("#212121") },
  { name: "native/section_header_text_color",  light: hex("#707579"),   dark: hex("#AAAAAA") },
  { name: "native/subtitle_text_color",        light: hex("#707579"),   dark: hex("#AAAAAA") },
  { name: "native/destructive_text_color",     light: hex("#E53935"),   dark: hex("#E53935") },

  // ── Custom Additional Colors ─────────────────────────────────────────────
  { name: "custom/skeleton",                   light: rgba(0,0,0,0.03),            dark: rgba(255,255,255,0.03) },
  { name: "custom/divider",                    light: rgba(0,0,0,0.15),            dark: rgba(255,255,255,0.05) },
  { name: "custom/outline",                    light: rgba(0,0,0,0.05),            dark: rgba(255,255,255,0.10) },
  { name: "custom/surface_primary",            light: rgba(255,255,255,0.95),      dark: rgba(23,23,23,0.95) },
  { name: "custom/surface_dark",               light: rgba(56,56,56,0.85),         dark: rgba(56,56,56,0.85) },
  { name: "custom/tertiary_bg_color",          light: hex("#F4F4F7"),              dark: hex("#2A2A2A") },
  { name: "custom/quaternary_bg_color",        light: hex("#F6F6FA"),              dark: hex("#2F2F2F") },
  { name: "custom/segmented_control_active_bg",light: hex("#FFFFFF"),              dark: hex("#2F2F2F") },
  { name: "custom/card_bg_color",              light: hex("#FFFFFF"),              dark: hex("#323232") },
  { name: "custom/secondary_hint_color",       light: hex("#A2ACB0"),              dark: hex("#78797E") },
  { name: "custom/secondary_fill",             light: rgba(67,120,255,0.10),       dark: rgba(41,144,255,0.15) },
  { name: "custom/green",                      light: hex("#31D158"),              dark: hex("#32E55E") },
  { name: "custom/destructive_background",     light: rgba(241,46,46,0.05),        dark: rgba(241,46,46,0.15) },
  { name: "custom/primary_code_highlight",     light: hex("#4378FF"),              dark: hex("#2990FF") },
  { name: "custom/secondary_code_highlight",   light: hex("#B00FB4"),              dark: hex("#E937ED") },
  { name: "custom/tertiary_code_highlight",    light: hex("#3A9F20"),              dark: hex("#5AE536") },
  { name: "custom/plain_background",           light: rgba(0,0,0,0.04),            dark: rgba(255,255,255,0.08) },
  { name: "custom/plain_foreground",           light: rgba(0,0,0,0.80),            dark: rgba(255,255,255,0.95) },
  { name: "custom/toast_accent_color",         light: hex("#55A6FF"),              dark: hex("#55A6FF") },
  { name: "custom/tooltip_background_dark",    light: rgba(0,0,0,0.85),            dark: rgba(0,0,0,0.85) },
  { name: "custom/white",                      light: hex("#FFFFFF"),              dark: hex("#FFFFFF") },
  { name: "custom/black",                      light: hex("#000000"),              dark: hex("#000000") },
];

(function () {
  // Check if collection already exists
  const existing = figma.variables.getLocalVariableCollections()
    .find(c => c.name === "Colors");
  if (existing) {
    figma.notify("⚠️ Collection 'Colors' already exists. Delete it first and re-run.", { timeout: 4000 });
    figma.closePlugin();
    return;
  }

  const collection = figma.variables.createVariableCollection("Colors");
  const lightId = collection.modes[0].modeId;
  collection.renameMode(lightId, "Light");
  const darkId = collection.addMode("Dark");

  for (const c of colors) {
    const v = figma.variables.createVariable(c.name, collection, "COLOR");
    v.setValueForMode(lightId, c.light);
    v.setValueForMode(darkId, c.dark);
  }

  figma.notify(`✅ Created ${colors.length} color variables in collection "Colors" (Light / Dark)`, { timeout: 4000 });
  figma.closePlugin();
})();
