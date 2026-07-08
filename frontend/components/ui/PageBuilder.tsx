"use client";
import React, { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, Copy, Plus, Loader2, CheckCircle2, Settings, LayoutTemplate, X,
  AlignLeft, AlignCenter, AlignRight, Maximize2, Minimize2, Square
} from "lucide-react";
import { Block, BlockType, BLOCK_LIBRARY, defaultBlockData } from "@/lib/blocks";
import ImageUploader from "@/components/ui/ImageUploader";
import { api } from "@/lib/api";
import { SiteData, BlockRenderer } from "./SiteBlocks";
import { getTheme } from "@/lib/themes";

const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa" };
const INPUT: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

const SIZE_OPTIONS = [
  { value: "sm", label: "S", title: "Small (640px)", icon: Minimize2 },
  { value: "md", label: "M", title: "Medium (860px)", icon: Square },
  { value: "lg", label: "L", title: "Large (1200px)", icon: Maximize2 },
  { value: "full", label: "Full", title: "Full Width", icon: LayoutTemplate },
] as const;

const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft, title: "Align Left" },
  { value: "center", icon: AlignCenter, title: "Align Center" },
  { value: "right", icon: AlignRight, title: "Align Right" },
] as const;

function LayoutControls({ d, set }: { d: Record<string, unknown>; set: (key: string, val: unknown) => void }) {
  const size = (d.containerSize as string) || "";
  const align = (d.textAlign as string) || "";
  const btnBase: React.CSSProperties = { padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4 };
  const active: React.CSSProperties = { background: "rgba(245,158,11,0.15)", borderColor: "#f59e0b", color: "#f59e0b" };
  const inactive: React.CSSProperties = { background: "rgba(255,255,255,0.04)", color: "#a1a1aa" };
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 16, paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={LABEL}>Width</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SIZE_OPTIONS.map(({ value, label, title, icon: Icon }) => (
          <button key={value} type="button" title={title}
            onClick={() => set("containerSize", size === value ? "" : value)}
            style={{ ...btnBase, ...(size === value ? active : inactive) }}>
            <Icon style={{ width: 12, height: 12 }} /> {label}
          </button>
        ))}
      </div>
      <div style={LABEL}>Text Alignment</div>
      <div style={{ display: "flex", gap: 6 }}>
        {ALIGN_OPTIONS.map(({ value, icon: Icon, title }) => (
          <button key={value} type="button" title={title}
            onClick={() => set("textAlign", align === value ? "" : value)}
            style={{ ...btnBase, ...(align === value ? active : inactive), padding: "6px 14px" }}>
            <Icon style={{ width: 14, height: 14 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function generateBlockId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function blockTitle(b: Block): string {
  const meta = BLOCK_LIBRARY.find((x) => x.type === b.type);
  const d = b.data as Record<string, string>;
  const custom = (d.heading || d.title) as string | undefined;
  return custom ? `${meta?.label} — ${custom}` : meta?.label || b.type;
}

// Sidebar Settings Panel
function BlockSettings({ block, onChange }: { block: Block; onChange: (data: Record<string, unknown>) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = block.data as Record<string, any>;
  const set = (key: string, val: unknown) => onChange({ ...d, [key]: val });

  switch (block.type) {
    case "hero":
      return (
        <>
          <Field label="Title"><input style={INPUT} value={d.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Subtitle"><input style={INPUT} value={d.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} /></Field>
          <ImageUploader label="Background Image" value={d.imageUrl} onChange={(url) => set("imageUrl", url)} aspect="21/9" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Button Text"><input style={INPUT} value={d.buttonText || ""} onChange={(e) => set("buttonText", e.target.value)} /></Field>
            <Field label="Button Links To"><input style={INPUT} value={d.buttonTarget || ""} onChange={(e) => set("buttonTarget", e.target.value)} placeholder="#contact" /></Field>
          </div>
          <LayoutControls d={d} set={set} />
        </>
      );
    case "about":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <Field label="Text"><textarea style={{ ...INPUT, minHeight: 80 }} value={d.text || ""} onChange={(e) => set("text", e.target.value)} /></Field>
          <ImageUploader label="Photo" value={d.imageUrl} onChange={(url) => set("imageUrl", url)} />
          <LayoutControls d={d} set={set} />
        </>
      );
    case "text-image":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <Field label="Text"><textarea style={{ ...INPUT, minHeight: 80 }} value={d.text || ""} onChange={(e) => set("text", e.target.value)} /></Field>
          <ImageUploader label="Photo" value={d.imageUrl} onChange={(url) => set("imageUrl", url)} />
          <Field label="Image Position">
            <select style={INPUT} value={d.imagePosition || "right"} onChange={(e) => set("imagePosition", e.target.value)}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </Field>
          <LayoutControls d={d} set={set} />
        </>
      );
    case "services":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <Field label="Intro"><input style={INPUT} value={d.intro || ""} onChange={(e) => set("intro", e.target.value)} /></Field>
          <p style={{ fontSize: 11, color: "#71717a" }}>Pulls your active Packages automatically.</p>
          <LayoutControls d={d} set={set} />
        </>
      );
    case "gallery":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <Field label="Max Photos"><input type="number" style={INPUT} value={d.limit ?? 9} onChange={(e) => set("limit", parseInt(e.target.value) || 9)} /></Field>
          <p style={{ fontSize: 11, color: "#71717a" }}>Pulls photos from your public Galleries automatically.</p>
          <LayoutControls d={d} set={set} />
        </>
      );
    case "testimonials": {
      const items: { quote: string; author: string }[] = d.items || [];
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          {items.map((it, i) => (
            <div key={i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea style={{ ...INPUT, minHeight: 50 }} placeholder="Quote" value={it.quote} onChange={(e) => {
                const next = [...items]; next[i] = { ...it, quote: e.target.value }; set("items", next);
              }} />
              <div style={{ display: "flex", gap: 8 }}>
                <input style={INPUT} placeholder="Author" value={it.author} onChange={(e) => {
                  const next = [...items]; next[i] = { ...it, author: e.target.value }; set("items", next);
                }} />
                <button type="button" onClick={() => set("items", items.filter((_, idx) => idx !== i))}
                  style={{ padding: "0 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", cursor: "pointer" }}>
                  <Trash2 style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => set("items", [...items, { quote: "", author: "" }])}
            style={{ padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 8, color: "#a1a1aa", fontSize: 12, cursor: "pointer" }}>
            + Add testimonial
          </button>
          <LayoutControls d={d} set={set} />
        </>
      );
    }
    case "booking":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <Field label="Subtitle"><input style={INPUT} value={d.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} /></Field>
          <p style={{ fontSize: 11, color: "#71717a" }}>Visitors pick a package + time; it creates a real (pending) booking in your dashboard for you to confirm.</p>
          <LayoutControls d={d} set={set} />
        </>
      );
    case "contact":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <Field label="Message"><textarea style={{ ...INPUT, minHeight: 60 }} value={d.message || ""} onChange={(e) => set("message", e.target.value)} /></Field>
          <LayoutControls d={d} set={set} />
        </>
      );
    case "cta":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Button Text"><input style={INPUT} value={d.buttonText || ""} onChange={(e) => set("buttonText", e.target.value)} /></Field>
            <Field label="Button Links To"><input style={INPUT} value={d.buttonTarget || ""} onChange={(e) => set("buttonTarget", e.target.value)} placeholder="#contact" /></Field>
          </div>
          <LayoutControls d={d} set={set} />
        </>
      );
    case "custom-text":
      return (
        <>
          <Field label="Heading"><input style={INPUT} value={d.heading || ""} onChange={(e) => set("heading", e.target.value)} /></Field>
          <Field label="Text"><textarea style={{ ...INPUT, minHeight: 80 }} value={d.text || ""} onChange={(e) => set("text", e.target.value)} /></Field>
          <LayoutControls d={d} set={set} />
        </>
      );
    default:
      return null;
  }
}

// The interactive wrapper for blocks in the live canvas
function CanvasBlockWrapper({
  block, site, theme, isActive, onClick, onDelete, onDuplicate
}: {
  block: Block; site: SiteData; theme: ReturnType<typeof getTheme>; isActive: boolean;
  onClick: () => void; onDelete: () => void; onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform), transition,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
        cursor: "pointer",
        outline: isActive ? `3px solid #f59e0b` : "2px solid transparent",
        outlineOffset: "-2px",
        zIndex: isActive ? 10 : 1,
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div style={{ pointerEvents: "none" }}>
        <BlockRenderer block={block} site={site} theme={theme} />
      </div>

      {isActive && (
        <div style={{
          position: "absolute", top: 12, right: 12, display: "flex", gap: 6,
          background: "#18181b", padding: 6, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 20
        }}>
          <button type="button" {...attributes} {...listeners} title="Drag to reorder"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "none", color: "#a1a1aa", cursor: "grab", padding: 4, borderRadius: 6 }}>
            <GripVertical style={{ width: 16, height: 16 }} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicate"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "none", color: "#a1a1aa", cursor: "pointer", padding: 4, borderRadius: 6 }}>
            <Copy style={{ width: 14, height: 14 }} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", cursor: "pointer", padding: 4, borderRadius: 6 }}>
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
      
      {/* Overlay for inactive blocks to prevent interactions with buttons/links inside the preview */}
      {!isActive && <div style={{ position: "absolute", inset: 0, zIndex: 5 }} />}
    </div>
  );
}

export default function PageBuilder({ initialBlocks, site }: { initialBlocks: Block[], site: SiteData }) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"add" | "settings">("add");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const theme = typeof site.theme === "string" ? getTheme(site.theme) : site.theme;

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const addBlock = (type: BlockType) => {
    const id = generateBlockId();
    setBlocks((prev) => [...prev, { id, type, data: defaultBlockData(type) }]);
    setActiveBlockId(id);
    setSidebarTab("settings");
  };

  const updateBlock = (id: string, data: Record<string, unknown>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } : b)));

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (activeBlockId === id) {
      setActiveBlockId(null);
      setSidebarTab("add");
    }
  };

  const duplicateBlock = (id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const copy: Block = { ...prev[idx], id: generateBlockId() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      setActiveBlockId(copy.id);
      setSidebarTab("settings");
      return next;
    });
  };

  const save = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      await api.put("/website/blocks", { blocks });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const activeBlock = blocks.find((b) => b.id === activeBlockId);

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", minHeight: "80vh" }}>
      {/* LEFT: Live Preview Canvas */}
      <div 
        style={{ flex: 1, background: theme.bg, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", minHeight: "80vh", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        onClick={() => { setActiveBlockId(null); setSidebarTab("add"); }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.length === 0 ? (
              <div style={{ padding: 120, textAlign: "center", color: theme.textMuted }}>
                <LayoutTemplate style={{ width: 48, height: 48, opacity: 0.2, marginBottom: 16 }} />
                <p>Your page is empty. Add a block from the right panel.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
                {blocks.map((b) => (
                  <CanvasBlockWrapper
                    key={b.id}
                    block={b}
                    site={site}
                    theme={theme}
                    isActive={activeBlockId === b.id}
                    onClick={() => { setActiveBlockId(b.id); setSidebarTab("settings"); }}
                    onDelete={() => deleteBlock(b.id)}
                    onDuplicate={() => duplicateBlock(b.id)}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* RIGHT: Sidebar Panel */}
      <div style={{ width: 340, flexShrink: 0, position: "sticky", top: 24, background: "#18181b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)" }}>
        
        {/* Sidebar Header / Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button 
            onClick={() => { setSidebarTab("add"); setActiveBlockId(null); }}
            style={{ flex: 1, padding: "14px 0", background: "none", border: "none", borderBottom: sidebarTab === "add" ? "2px solid #f59e0b" : "2px solid transparent", color: sidebarTab === "add" ? "#fafafa" : "#a1a1aa", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Plus style={{ width: 16, height: 16 }} /> Add Blocks
          </button>
          <button 
            onClick={() => setSidebarTab("settings")}
            disabled={!activeBlock}
            style={{ flex: 1, padding: "14px 0", background: "none", border: "none", borderBottom: sidebarTab === "settings" ? "2px solid #f59e0b" : "2px solid transparent", color: sidebarTab === "settings" ? "#fafafa" : activeBlock ? "#a1a1aa" : "#52525b", fontSize: 13, fontWeight: 600, cursor: activeBlock ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Settings style={{ width: 16, height: 16 }} /> Settings
          </button>
        </div>

        {/* Sidebar Content Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {sidebarTab === "add" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {BLOCK_LIBRARY.map((b) => (
                <button key={b.type} type="button" onClick={() => addBlock(b.type)}
                  style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", textAlign: "left", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fafafa" }}>{b.label}</div>
                  <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.4 }}>{b.description}</div>
                </button>
              ))}
            </div>
          )}

          {sidebarTab === "settings" && activeBlock && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>{blockTitle(activeBlock)}</span>
                <button onClick={() => { setActiveBlockId(null); setSidebarTab("add"); }} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <BlockSettings block={activeBlock} onChange={(data) => updateBlock(activeBlock.id, data)} />
            </div>
          )}

          {sidebarTab === "settings" && !activeBlock && (
            <div style={{ textAlign: "center", color: "#a1a1aa", marginTop: 40, fontSize: 13 }}>
              Select a block in the preview canvas to edit its settings.
            </div>
          )}
        </div>

        {/* Sidebar Footer / Save Button */}
        <div style={{ padding: 20, borderTop: "1px solid rgba(255,255,255,0.08)", background: "#18181b" }}>
          {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>{error}</p>}
          <button onClick={save} disabled={saving}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, color: "#09090b", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {saving ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : saved ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : null}
            {saved ? "Saved Successfully!" : "Save Website"}
          </button>
        </div>
      </div>
    </div>
  );
}
