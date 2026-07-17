// PATH: src/app/dashboard/resumes/editor/[id]/page.tsx
'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { type Editor, Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Bold, Italic, Underline as UIUnderline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Undo2, Redo2,
  Save, Download, ChevronLeft, Highlighter, Unlink,
  IndentIcon, Type, Loader2, CheckCheck, AlertCircle,
  ZoomIn, ZoomOut, Sparkles, History,
  ChevronDown, RotateCcw, X, Zap, Minus,
  Wand2, SpellCheck, RefreshCw, CheckCircle, ChevronRight,
  MessageSquare, Lightbulb, Eye,
} from 'lucide-react';
import {
  getResume, updateResume, convertToEditable, optimizeForJD,
  getKeywordSuggestions, restoreVersion, getInlineSuggestions, improveSelectedText,
  type ResumeListItem, type ResumeVersion,
} from '@/app/lib/resumeApi';

// ══════════════════════════════════════════════════════════════════════════
// TipTap Extensions
// ══════════════════════════════════════════════════════════════════════════
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions: () => ({ types: ['textStyle'] }),
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      fontSize: { default: null, parseHTML: el => el.style.fontSize || null, renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {} },
    }}];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).run(),
    } as any;
  },
});

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions: () => ({ types: ['paragraph', 'heading'] }),
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      lineHeight: { default: null, parseHTML: el => el.style.lineHeight || null, renderHTML: attrs => attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {} },
    }}];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: any) =>
        this.options.types.every((t: string) => commands.updateAttributes(t, { lineHeight })),
    } as any;
  },
});

const Indent = Extension.create({
  name: 'indent',
  addOptions: () => ({ types: ['paragraph', 'heading'], step: 20, max: 200 }),
  addGlobalAttributes() {
    return [{ types: this.options.types, attributes: {
      indent: { default: 0, parseHTML: el => parseInt(el.style.marginLeft || '0') || 0, renderHTML: attrs => attrs.indent ? { style: `margin-left: ${attrs.indent}px` } : {} },
    }}];
  },
  addCommands() {
    return {
      indent: () => ({ editor, commands }: any) => {
        const cur = editor.getAttributes('paragraph').indent || 0;
        return this.options.types.every((t: string) => commands.updateAttributes(t, { indent: Math.min(cur + this.options.step, this.options.max) }));
      },
      outdent: () => ({ editor, commands }: any) => {
        const cur = editor.getAttributes('paragraph').indent || 0;
        return this.options.types.every((t: string) => commands.updateAttributes(t, { indent: Math.max(cur - this.options.step, 0) }));
      },
    } as any;
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => (this.editor.commands as any).indent(),
      'Shift-Tab': () => (this.editor.commands as any).outdent(),
    };
  },
});

const FloatRight = Mark.create({
  name: 'floatRight',
  parseHTML() {
    return [{ style: 'float' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { style: 'float: right;' }), 0];
  },
});

const getSuggestionColors = (type: string | null) => {
  switch (type) {
    case 'grammar': return { mark: 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/40 text-blue-900', text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500' };
    case 'strengthen': return { mark: 'bg-red-500/20 border-red-500 hover:bg-red-500/40 text-red-900', text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500' };
    case 'quantify': return { mark: 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/40 text-emerald-900', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500' };
    case 'keyword': return { mark: 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/40 text-purple-900', text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500' };
    default: return { mark: 'bg-amber-500/20 border-amber-500 hover:bg-amber-500/40 text-amber-900', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500' };
  }
};

const AISuggestionMark = Mark.create({
  name: 'aiSuggestion',
  addAttributes() {
    return {
      suggestionId: { default: null },
      suggestionType: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-suggestion-id]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const colors = getSuggestionColors(HTMLAttributes.suggestionType);
    return ['span', mergeAttributes(HTMLAttributes, { 
      'data-suggestion-id': HTMLAttributes.suggestionId,
      'data-suggestion-type': HTMLAttributes.suggestionType,
      class: `border-b-2 cursor-pointer transition-colors ${colors.mark}`
    }), 0];
  },
});

// ══════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════
interface InlineSuggestion {
  id: string;
  section: string;
  type: 'strengthen' | 'quantify' | 'keyword' | 'grammar' | 'impact';
  originalSnippet: string;
  suggestion: string;
  replacement: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActiveSuggestion {
  id: string;
  x: number;
  y: number;
}

interface SelectionToolbar {
  x: number;
  y: number;
  text: string;
  from: number;
  to: number;
}

// ══════════════════════════════════════════════════════════════════════════
// Toolbar Helpers
// ══════════════════════════════════════════════════════════════════════════
function Divider() { return <div className="w-px h-5 bg-[#2a2a2a] mx-0.5 flex-shrink-0" />; }

function Btn({ onClick, active = false, title, disabled = false, children }: {
  onClick: () => void; active?: boolean; title?: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors flex-shrink-0
        ${active ? 'bg-white/15 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
        ${disabled ? 'opacity-25 cursor-not-allowed' : ''}`}
    >{children}</button>
  );
}

const FONTS = [
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];
const SIZES = ['8','9','10','11','12','13','14','16','18','20','22','24','28','32','36','48'];
const LINE_HEIGHTS = [{ label: '1.0', value: '1' }, { label: '1.15', value: '1.15' }, { label: '1.5', value: '1.5' }, { label: '2.0', value: '2' }, { label: '2.5', value: '2.5' }];
const COLORS = ['#000000','#1a1a1a','#333333','#555555','#888888','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#2563eb','#dc2626'];

function ColorPicker({ label, onSelect, currentColor, icon: Icon }: { label: string; onSelect: (c: string) => void; currentColor: string; icon: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" title={label} onClick={() => setOpen(o => !o)}
        className="h-7 px-1.5 flex flex-col items-center justify-center rounded hover:bg-white/10 transition-colors">
        <Icon size={13} className="text-gray-400" />
        <div className="w-3.5 h-0.5 rounded-sm mt-0.5" style={{ backgroundColor: currentColor }} />
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-50 bg-[#1a1a1a] border border-[#333] rounded-xl p-3 shadow-2xl w-40">
          <p className="text-gray-500 text-xs mb-2">{label}</p>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => { onSelect(c); setOpen(false); }}
                className="w-6 h-6 rounded border border-[#333] hover:scale-110 transition-transform"
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <input type="color" defaultValue={currentColor} onChange={e => onSelect(e.target.value)}
            className="w-full h-6 rounded cursor-pointer border-0 bg-transparent" />
        </div>
      )}
    </div>
  );
}

function ToolSelect({ value, onChange, options, width = 'w-32' }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; width?: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`${width} h-7 bg-[#111] border border-[#2a2a2a] text-white text-xs rounded px-1.5 focus:outline-none focus:border-white cursor-pointer`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [hlColor, setHlColor] = useState('#fef08a');
  const currentFont = editor.getAttributes('textStyle').fontFamily ?? FONTS[0].value;
  const currentSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') ?? '12';
  const currentLH = editor.getAttributes('paragraph').lineHeight ?? '1.5';
  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href ?? '';
    const url = window.prompt('URL', prev);
    if (url === null) return;
    if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-[#141414] border-b border-[#222] z-20">
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}><Undo2 size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}><Redo2 size={14} /></Btn>
      <Divider />
      <ToolSelect width="w-28" value={currentFont} onChange={v => editor.chain().focus().setFontFamily(v).run()} options={FONTS.map(f => ({ label: f.label, value: f.value }))} />
      <ToolSelect width="w-14" value={currentSize} onChange={v => (editor.commands as any).setFontSize(`${v}px`)} options={SIZES.map(s => ({ label: s, value: s }))} />
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UIUnderline size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><Strikethrough size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleMark('floatRight').run()} active={editor.isActive('floatRight')} title="Float Right"><ChevronRight size={14} /></Btn>
      <Divider />
      <ColorPicker label="Text Color" icon={Type} currentColor={textColor} onSelect={c => { setTextColor(c); editor.chain().focus().setColor(c).run(); }} />
      <ColorPicker label="Highlight" icon={Highlighter} currentColor={hlColor} onSelect={c => { setHlColor(c); editor.chain().focus().toggleHighlight({ color: c }).run(); }} />
      <Divider />
      <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Left"><AlignLeft size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Right"><AlignRight size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={14} /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={14} /></Btn>
      <Divider />
      <Btn onClick={() => (editor.commands as any).outdent()} title="Decrease Indent"><IndentIcon size={14} className="rotate-180" /></Btn>
      <Btn onClick={() => (editor.commands as any).indent()} title="Increase Indent"><IndentIcon size={14} /></Btn>
      <Divider />
      <ToolSelect width="w-20" value={currentLH} onChange={v => (editor.commands as any).setLineHeight(v)} options={LINE_HEIGHTS} />
      <Divider />
      {([1, 2, 3] as const).map(level => (
        <Btn key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} active={editor.isActive('heading', { level })} title={`H${level}`}>
          <span className="font-bold text-xs">H{level}</span>
        </Btn>
      ))}
      <Divider />
      <Btn onClick={setLink} active={editor.isActive('link')} title="Link"><Link2 size={14} /></Btn>
      {editor.isActive('link') && <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link"><Unlink size={14} /></Btn>}
      <Divider />
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Line"><Minus size={14} /></Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Rulers
// ══════════════════════════════════════════════════════════════════════════
function HorizontalRuler({ width, marginLeft, marginRight, onMarginChange }: {
  width: number; marginLeft: number; marginRight: number; onMarginChange: (l: number, r: number) => void;
}) {
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!dragging || !rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (dragging === 'left') onMarginChange(Math.max(20, Math.min(x, width / 2 - 40)), marginRight);
    if (dragging === 'right') onMarginChange(marginLeft, Math.max(20, Math.min(width - x, width / 2 - 40)));
  }, [dragging, marginLeft, marginRight, width, onMarginChange]);
  useEffect(() => {
    if (!dragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => setDragging(null));
    return () => { document.removeEventListener('mousemove', handleMouseMove); };
  }, [dragging, handleMouseMove]);
  const ticks = Array.from({ length: Math.floor(width / 10) }, (_, i) => i * 10);
  return (
    <div ref={rulerRef} className="relative select-none" style={{ width, height: 24, backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
      {ticks.map(x => (<div key={x} style={{ position: 'absolute', left: x, top: x % 50 === 0 ? 10 : x % 20 === 0 ? 14 : 17, width: 1, height: x % 50 === 0 ? 14 : x % 20 === 0 ? 10 : 7, backgroundColor: '#444' }} />))}
      {ticks.filter(x => x % 100 === 0 && x > 0).map(x => (<span key={x} style={{ position: 'absolute', left: x + 2, top: 2, fontSize: 8, color: '#666', fontFamily: 'monospace' }}>{Math.round(x * 0.265)}</span>))}
      <div style={{ position: 'absolute', left: 0, top: 0, width: marginLeft, height: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, width: marginRight, height: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      <div onMouseDown={() => setDragging('left')} style={{ position: 'absolute', left: marginLeft - 4, top: 0, width: 8, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ width: 2, height: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
      <div onMouseDown={() => setDragging('right')} style={{ position: 'absolute', right: marginRight - 4, top: 0, width: 8, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ width: 2, height: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
    </div>
  );
}

function VerticalRuler({ height, marginTop, marginBottom, onMarginChange }: {
  height: number; marginTop: number; marginBottom: number; onMarginChange: (t: number, b: number) => void;
}) {
  const [dragging, setDragging] = useState<'top' | 'bottom' | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!dragging || !rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (dragging === 'top') onMarginChange(Math.max(20, Math.min(y, height / 2 - 40)), marginBottom);
    if (dragging === 'bottom') onMarginChange(marginTop, Math.max(20, Math.min(height - y, height / 2 - 40)));
  }, [dragging, marginTop, marginBottom, height, onMarginChange]);
  useEffect(() => {
    if (!dragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', () => setDragging(null));
    return () => { document.removeEventListener('mousemove', handleMouseMove); };
  }, [dragging, handleMouseMove]);
  const ticks = Array.from({ length: Math.floor(height / 10) }, (_, i) => i * 10);
  return (
    <div ref={rulerRef} className="relative select-none" style={{ width: 24, height, backgroundColor: '#1a1a1a', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>
      {ticks.map(y => (<div key={y} style={{ position: 'absolute', top: y, left: y % 50 === 0 ? 10 : y % 20 === 0 ? 14 : 17, height: 1, width: y % 50 === 0 ? 14 : y % 20 === 0 ? 10 : 7, backgroundColor: '#444' }} />))}
      {ticks.filter(y => y % 100 === 0 && y > 0).map(y => (<span key={y} style={{ position: 'absolute', top: y + 2, left: 2, fontSize: 8, color: '#666', fontFamily: 'monospace', transform: 'rotate(-90deg)', transformOrigin: 'left top', width: 20 }}>{Math.round(y * 0.265)}</span>))}
      <div style={{ position: 'absolute', left: 0, top: 0, height: marginTop, width: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: marginBottom, width: '100%', backgroundColor: 'rgba(59,130,246,0.08)' }} />
      <div onMouseDown={() => setDragging('top')} style={{ position: 'absolute', top: marginTop - 4, left: 0, height: 8, width: '100%', cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ height: 2, width: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
      <div onMouseDown={() => setDragging('bottom')} style={{ position: 'absolute', bottom: marginBottom - 4, left: 0, height: 8, width: '100%', cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <div style={{ height: 2, width: 16, backgroundColor: '#3b82f6', borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Inline Suggestion Popup
// ══════════════════════════════════════════════════════════════════════════
function SuggestionPopup({ suggestion, onAccept, onDismiss }: {
  suggestion: InlineSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const typeColors: Record<string, string> = {
    strengthen: 'text-blue-300 bg-blue-500/10 border-blue-500/25',
    quantify: 'text-green-300 bg-green-500/10 border-green-500/25',
    keyword: 'text-purple-300 bg-purple-500/10 border-purple-500/25',
    grammar: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/25',
    impact: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
  };
  const priorityDot: Record<string, string> = {
    high: 'bg-red-400',
    medium: 'bg-yellow-400',
    low: 'bg-green-400',
  };

  return (
    <div className="bg-[#1a1a1a] border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/10 w-72 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-blue-400" />
          <span className="text-white text-xs font-semibold">AI Suggestion</span>
          <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[suggestion.priority]}`} title={`${suggestion.priority} priority`} />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${typeColors[suggestion.type]}`}>
          {suggestion.type}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        <div>
          <p className="text-gray-500 text-xs mb-1">Current</p>
          <p className="text-gray-400 text-xs bg-[#111] rounded-lg px-3 py-2 line-clamp-2 line-through opacity-70">
            {suggestion.originalSnippet}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Suggested</p>
          <p className="text-white text-xs bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2 leading-relaxed">
            {suggestion.replacement}
          </p>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed">{suggestion.suggestion}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3">
        <button onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded-lg transition-colors font-medium">
          <CheckCircle size={12} /> Apply
        </button>
        <button onClick={onDismiss}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#111] hover:bg-[#222] text-gray-400 hover:text-white text-xs py-2 rounded-lg transition-colors border border-[#2a2a2a]">
          <X size={12} /> Dismiss
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Text Selection Floating Toolbar
// ══════════════════════════════════════════════════════════════════════════
function SelectionToolbarUI({ toolbar, onAction, onClose }: {
  toolbar: SelectionToolbar;
  onAction: (action: 'grammar' | 'rewrite' | 'custom', customPrompt?: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'main' | 'custom' | 'loading' | 'result'>('main');
  const [customInput, setCustomInput] = useState('');
  const [result, setResult] = useState<{ result: string; changes: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAction = async (action: 'grammar' | 'rewrite' | 'custom', prompt?: string) => {
    setMode('loading');
    await onAction(action, prompt);
  };

  useEffect(() => {
    if (mode === 'custom') setTimeout(() => inputRef.current?.focus(), 50);
  }, [mode]);

  const ACTIONS = [
    { id: 'grammar' as const, action: 'grammar' as const, icon: SpellCheck, label: 'Fix Grammar', color: 'hover:text-yellow-400', prompt: 'Fix grammar, spelling, and phrasing errors while maintaining the original tone and context.' },
    { id: 'rewrite' as const, action: 'rewrite' as const, icon: RefreshCw, label: 'Rewrite', color: 'hover:text-blue-400', prompt: 'Rewrite the selected text to sound more professional, active, and impactful.' },
    { id: 'custom' as const, action: 'custom' as const, icon: MessageSquare, label: 'Ask AI', color: 'hover:text-purple-400', prompt: '' },
  ];

  return (
    <div
      style={{ position: 'fixed', left: toolbar.x, top: toolbar.y - 8, zIndex: 1000, transform: 'translate(-50%, -100%)' }}
      className="selection-toolbar"
      onMouseDown={e => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
    >
      {mode === 'main' && (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl shadow-black/50 flex items-center gap-1 px-2 py-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
          {ACTIONS.map(({ id, action, icon: Icon, label, color, prompt }) => (
            <button key={id} title={label}
              onClick={() => id === 'custom' ? setMode('custom') : handleAction(action, prompt)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-300 ${color} transition-colors text-xs font-medium hover:bg-white/8`}>
              <Icon size={13} />{label}
            </button>
          ))}
          <div className="w-px h-4 bg-[#333] mx-0.5" />
          <button onClick={onClose} className="p-1.5 text-gray-600 hover:text-white rounded-lg hover:bg-white/8 transition-colors">
            <X size={12} />
          </button>
          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#1e1e1e] border-r border-b border-[#333] rotate-45" />
        </div>
      )}

      {mode === 'custom' && (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl shadow-black/50 w-72 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#2a2a2a]">
            <Wand2 size={13} className="text-purple-400" />
            <span className="text-white text-xs font-medium">Custom Instruction</span>
          </div>
          <div className="p-3">
            <p className="text-gray-500 text-xs mb-2 truncate">"{toolbar.text.slice(0, 50)}{toolbar.text.length > 50 ? '…' : ''}"</p>
            <input ref={inputRef} value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) handleAction('custom', customInput); if (e.key === 'Escape') setMode('main'); }}
              placeholder="e.g. Make this more quantified…"
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 mb-2" />
            <div className="flex gap-2">
              <button onClick={() => customInput.trim() && handleAction('custom', customInput)}
                disabled={!customInput.trim()}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-xs py-2 rounded-lg transition-colors font-medium disabled:opacity-40 flex items-center justify-center gap-1">
                <Wand2 size={11} /> Apply
              </button>
              <button onClick={() => setMode('main')}
                className="px-3 bg-[#111] border border-[#2a2a2a] text-gray-400 hover:text-white text-xs py-2 rounded-lg transition-colors">
                Back
              </button>
            </div>
          </div>
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#1e1e1e] border-r border-b border-[#333] rotate-45" />
        </div>
      )}

      {mode === 'loading' && (
        <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl px-4 py-3 flex items-center gap-2.5 animate-in fade-in duration-150">
          <Loader2 size={14} className="text-blue-400 animate-spin" />
          <span className="text-gray-300 text-xs">Improving with AI…</span>
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#1e1e1e] border-r border-b border-[#333] rotate-45" />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// AI Result Popup (shows after text improvement)
// ══════════════════════════════════════════════════════════════════════════
function AIResultPopup({ result, onAccept, onDismiss, position }: {
  result: { original: string; improved: string; changes: string };
  onAccept: () => void;
  onDismiss: () => void;
  position: { x: number; y: number };
}) {
  return (
    <div
      style={{ position: 'fixed', left: position.x, top: position.y - 8, zIndex: 1000, transform: 'translate(-50%, -100%)' }}
      onMouseDown={e => e.preventDefault()}
    >
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/60 w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-blue-400" />
            <span className="text-white text-xs font-semibold">AI Result</span>
          </div>
          <button onClick={onDismiss} className="text-gray-600 hover:text-white transition-colors"><X size={13} /></button>
        </div>

        <div className="p-3 space-y-2">
          <div className="text-xs text-gray-500 bg-[#111] rounded-lg px-3 py-2 line-through opacity-60 line-clamp-2">{result.original}</div>
          <div className="text-xs text-white bg-blue-500/8 border border-blue-500/20 rounded-lg px-3 py-2 leading-relaxed">{result.improved}</div>
          <p className="text-gray-600 text-xs">{result.changes}</p>
        </div>

        <div className="flex gap-2 px-3 pb-3">
          <button onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded-lg font-medium transition-colors">
            <CheckCircle size={12} /> Replace
          </button>
          <button onClick={onDismiss}
            className="px-4 bg-[#111] border border-[#2a2a2a] text-gray-400 hover:text-white text-xs py-2 rounded-lg transition-colors">
            Keep
          </button>
        </div>

        <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-r border-b border-[#2a2a2a] rotate-45" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Left Panels
// ══════════════════════════════════════════════════════════════════════════
type LeftPanel = 'ai' | 'suggestions' | 'versions' | null;

function AIPanel({ resumeId, keywordGaps, onKeywordInsert, onJDOptimize }: {
  resumeId: string; keywordGaps: string[];
  onKeywordInsert: (kw: string) => void; onJDOptimize: () => void;
}) {
  const [showJD, setShowJD] = useState(false);
  const [jd, setJd] = useState('');
  const [loadingJD, setLoadingJD] = useState(false);
  const [fetchingKW, setFetchingKW] = useState(false);
  const [liveKeywords, setLiveKeywords] = useState<string[]>(keywordGaps);
  useEffect(() => { setLiveKeywords(keywordGaps); }, [keywordGaps]);

  const handleFetchKeywords = async () => {
    setFetchingKW(true);
    try {
      const res = await getKeywordSuggestions(resumeId);
      setLiveKeywords(res.data.data.missingKeywords ?? []);
    } catch {} finally { setFetchingKW(false); }
  };

  const handleJDOptimize = async () => {
    if (!jd.trim()) return;
    setLoadingJD(true);
    try { await onJDOptimize(); } finally { setLoadingJD(false); }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-gray-400 text-xs font-medium">ATS Keywords</p>
          <button onClick={handleFetchKeywords} disabled={fetchingKW}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1">
            {fetchingKW ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />} Refresh
          </button>
        </div>
        {liveKeywords.length === 0 ? (
          <p className="text-gray-600 text-xs">No gaps found.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {liveKeywords.map((kw, i) => (
              <button key={i} onClick={() => onKeywordInsert(kw)}
                className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-full hover:bg-blue-500/25 transition-colors">
                + {kw}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#222] pt-4">
        <button onClick={() => setShowJD(v => !v)}
          className="flex items-center justify-between w-full text-gray-400 text-xs font-medium hover:text-white transition-colors mb-2">
          <span className="flex items-center gap-1.5"><Zap size={12} />Optimise for JD</span>
          <ChevronDown size={12} className={showJD ? 'rotate-180' : ''} />
        </button>
        {showJD && (
          <div className="space-y-2">
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={5}
              placeholder="Paste job description…"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-white/40 resize-none" />
            <button onClick={handleJDOptimize} disabled={!jd.trim() || loadingJD}
              className="w-full bg-white text-black text-xs py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              {loadingJD ? <><Loader2 size={12} className="animate-spin" />Optimising…</> : <><Sparkles size={12} />Optimise Resume</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionsPanel({ resumeId, suggestions, loading, onFetch, onAccept, onDismiss }: {
  resumeId: string;
  suggestions: InlineSuggestion[];
  loading: boolean;
  onFetch: () => void;
  onAccept: (sId: string) => void;
  onDismiss: (id: string) => void;
}) {
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...suggestions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const typeColors: Record<string, string> = {
    strengthen: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    quantify: 'text-green-300 bg-green-500/10 border-green-500/20',
    keyword: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    grammar: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20',
    impact: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-xs font-medium">
          {suggestions.length > 0 ? `${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}` : 'AI Suggestions'}
        </p>
        <button onClick={onFetch} disabled={loading}
          className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1">
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          {loading ? 'Analysing…' : 'Analyse'}
        </button>
      </div>

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-6">
          <Lightbulb size={24} className="text-gray-700 mx-auto mb-2" />
          <p className="text-gray-600 text-xs">Click "Analyse" to get AI suggestions for improving your resume.</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 size={20} className="text-blue-400 animate-spin" />
          <p className="text-gray-500 text-xs">Scanning resume…</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(s => (
          <div key={s.id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${typeColors[s.type]}`}>{s.type}</span>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.priority === 'high' ? 'bg-red-400' : s.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
              </div>
              <button onClick={() => onDismiss(s.id)} className="text-gray-700 hover:text-gray-400 transition-colors"><X size={12} /></button>
            </div>

            <div className="p-3 space-y-2">
              <p className="text-gray-400 text-xs line-through opacity-60 line-clamp-1">{s.originalSnippet}</p>
              <p className="text-white text-xs leading-relaxed">{s.replacement}</p>
              <p className="text-gray-500 text-xs">{s.suggestion}</p>
            </div>

            <div className="flex gap-2 px-3 pb-3">
              <button onClick={() => onAccept(s.id)}
                className="flex-1 bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs py-1.5 rounded-lg hover:bg-blue-500/25 transition-colors font-medium flex items-center justify-center gap-1">
                <CheckCircle size={11} />Apply
              </button>
              <button onClick={() => onDismiss(s.id)}
                className="px-3 bg-[#0a0a0a] border border-[#222] text-gray-500 hover:text-white text-xs py-1.5 rounded-lg transition-colors">
                Skip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionsPanel({ versions, onRestore }: { versions: ResumeVersion[]; onRestore: (v: ResumeVersion) => void }) {
  return (
    <div className="p-4 space-y-2">
      <p className="text-gray-600 text-xs mb-3">{versions.length} version{versions.length !== 1 ? 's' : ''} saved</p>
      {versions.length === 0 ? (
        <div className="text-center py-6">
          <History size={24} className="text-gray-700 mx-auto mb-2" />
          <p className="text-gray-600 text-xs">No versions yet. Edit and save to create versions.</p>
        </div>
      ) : [...versions].reverse().map(v => (
        <div key={v.id} className="bg-[#111] border border-[#222] rounded-xl p-3">
          <p className="text-white text-xs font-medium mb-0.5">{v.label}</p>
          <p className="text-gray-600 text-xs">{new Date(v.savedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <button onClick={() => onRestore(v)}
            className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <RotateCcw size={11} />Restore
          </button>
        </div>
      ))}
    </div>
  );
}

function SuggestionPopupUI({ activeId, x, y, suggestions, onAccept, onReject }: {
  activeId: string;
  x: number; y: number;
  suggestions: InlineSuggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const suggestion = suggestions.find(s => s.id === activeId);
  if (!suggestion) return null;

  const colors = getSuggestionColors(suggestion.type);

  return (
    <div style={{ position: 'fixed', left: x, top: y + 8, zIndex: 1000, transform: 'translateX(-50%)' }}
         className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 w-80 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className={colors.text} />
          <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{suggestion.type}</span>
        </div>
        <button onClick={() => onReject(suggestion.id)} className="text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full p-1"><X size={12}/></button>
      </div>
      <p className="text-gray-200 text-sm mb-4 leading-relaxed">{suggestion.suggestion}</p>
      
      <div className={`bg-black/40 p-3 rounded-xl border ${colors.border} mb-4 relative overflow-hidden`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bg}`} />
        <p className="text-gray-400 line-through text-xs mb-2 pl-2">{suggestion.originalSnippet}</p>
        <p className="text-white text-sm font-medium pl-2">{suggestion.replacement}</p>
      </div>
      
      <div className="flex gap-2">
        <button onClick={() => onAccept(suggestion.id)} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/5 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm">
          <CheckCheck size={14} className="text-emerald-400" /> Accept Fix
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main Editor Page
// ══════════════════════════════════════════════════════════════════════════
export default function ResumeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [resumeName, setResumeName] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [converting, setConverting] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [margins, setMargins] = useState({ top: 48, right: 48, bottom: 48, left: 48 });
  const [activePanel, setActivePanel] = useState<LeftPanel>(null);
  const [keywordGaps, setKeywordGaps] = useState<string[]>([]);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);

  // Inline suggestions state
  const [inlineSuggestions, setInlineSuggestions] = useState<InlineSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<ActiveSuggestion | null>(null);

  // Selection toolbar state
  const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbar | null>(null);
  const [aiResult, setAiResult] = useState<{
    original: string; improved: string; changes: string;
    from: number; to: number; position: { x: number; y: number };
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const PAGE_W = 794;
  const PAGE_H = 1123;

  const [contentHeight, setContentHeight] = useState(PAGE_H);

  useEffect(() => {
    const style = document.createElement('style');
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { document.head.removeChild(style); };
  }, []);

  // ─── Wheel zoom ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleWheel = (e: globalThis.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.max(50, Math.min(200, z - Math.sign(e.deltaY) * 10)));
      }
    };
    const el = canvasRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, []);

  // ─── TipTap ──────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: { depth: 100 } } as any),
      TextStyle, Color, FontFamily, FontSize, Underline, LineHeight, Indent,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      HorizontalRule, FloatRight, AISuggestionMark,
    ],
    content: '',
    editorProps: { attributes: { class: 'outline-none' } },
  });

  // ─── Suggestion click & hover handling ───────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    
    const handleEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('[data-suggestion-id]');
      if (mark) {
        const id = mark.getAttribute('data-suggestion-id');
        const rect = mark.getBoundingClientRect();
        if (id) setActiveSuggestion({ id, x: rect.left + rect.width / 2, y: rect.bottom });
      }
    };
    
    // We only clear the suggestion if they click outside. If they move their mouse away, it stays until they click it away or accept/reject.
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-suggestion-id]')) {
        setActiveSuggestion(null);
      } else {
        handleEvent(e);
      }
    };

    el.addEventListener('click', onClick);
    el.addEventListener('mouseover', handleEvent);
    
    return () => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('mouseover', handleEvent);
    };
  }, [editor]);

  // Track content height to render correct number of A4 pages
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContentHeight(Math.max(PAGE_H, entry.contentRect.height));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [editor]);

  // ─── Selection detection ─────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;

    const handleSelectionChange = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setSelectionToolbar(null);
        return;
      }
      const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();
      if (selectedText.length < 5) {
        setSelectionToolbar(null);
        return;
      }

      // Get caret position
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;
      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: selectedText,
        from,
        to,
      });
      setAiResult(null);
    };

    editor.on('selectionUpdate', handleSelectionChange);
    return () => { editor.off('selectionUpdate', handleSelectionChange); };
  }, [editor]);

  // Close selection toolbar on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.selection-toolbar') && !target.closest('.ai-result-popup')) {
        setSelectionToolbar(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Handle text improvement ─────────────────────────────────────────
  const handleTextAction = useCallback(async (action: 'grammar' | 'rewrite' | 'custom', customPrompt?: string) => {
    if (!selectionToolbar || !editor) return;
    const { text, from, to, x, y } = selectionToolbar;

    try {
      const context = editor.state.doc.textBetween(Math.max(0, from - 100), Math.min(editor.state.doc.content.size, to + 100), ' ');
      const res = await improveSelectedText(text, action, customPrompt, context);
      const data = res.data.data;

      setSelectionToolbar(null);
      setAiResult({
        original: text,
        improved: data.result,
        changes: data.changes,
        from,
        to,
        position: { x, y },
      });
    } catch {
      setSelectionToolbar(null);
    }
  }, [selectionToolbar, editor]);

  // ─── Accept AI result ────────────────────────────────────────────────
  const handleAcceptResult = useCallback(() => {
    if (!aiResult || !editor) return;
    const { from, to, improved } = aiResult;
    editor.chain().focus().setTextSelection({ from, to }).insertContent(improved).run();
    setAiResult(null);
  }, [aiResult, editor]);

  // ─── Auto Pagination ──────────────────────────────────────────────────
  const updatePagination = useCallback(() => {
    if (!canvasRef.current || !styleRef.current) return;
    const pm = canvasRef.current.querySelector('.ProseMirror') as HTMLElement;
    const overlay = canvasRef.current.querySelector('.editor-overlay') as HTMLElement;
    if (!pm || !overlay) return;

    const children = Array.from(pm.children) as HTMLElement[];
    const PAGE_FULL_H = PAGE_H + 32; // 32 is the GAP
    
    // Clear injected styles to read the purely natural layout
    styleRef.current.innerHTML = '';
    
    // Force a synchronous reflow to ensure natural positions are calculated
    void pm.offsetHeight;
    
    const overlayRect = overlay.getBoundingClientRect();
    const scale = zoom / 100;
    
    let cumulativePush = 0;
    let cssRules = '';
    
    const mTop = Number(margins.top) || 60;
    const mBottom = Number(margins.bottom) || 60;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childRect = child.getBoundingClientRect();
      
      // Calculate true visual top relative to the overlay without any scaling
      const naturalTop = (childRect.top - overlayRect.top) / scale;
      const childHeight = childRect.height / scale;

      const simulatedTop = naturalTop + cumulativePush;
      const simulatedBottom = simulatedTop + childHeight;

      const pageIndex = Math.floor(simulatedTop / PAGE_FULL_H);
      const bottomMarginY = pageIndex * PAGE_FULL_H + PAGE_H - mBottom;

      if (simulatedBottom > bottomMarginY) {
        const nextPageTopMarginY = (pageIndex + 1) * PAGE_FULL_H + mTop;
        const pushAmount = Math.max(0, nextPageTopMarginY - simulatedTop);
        
        if (pushAmount > 0) {
          cumulativePush += pushAmount;
          
          const naturalMarginTop = parseFloat(window.getComputedStyle(child).marginTop) || 0;
          const prevChild = i > 0 ? children[i - 1] : null;
          const prevMarginBottom = prevChild ? parseFloat(window.getComputedStyle(prevChild).marginBottom) || 0 : 0;
          
          // Compensate for CSS margin collapsing to ensure exact physical push
          const currentCollapsedMargin = Math.max(naturalMarginTop, prevMarginBottom);
          const targetMarginTop = currentCollapsedMargin + pushAmount;
          
          cssRules += `.ProseMirror > *:nth-child(${i + 1}) { margin-top: ${targetMarginTop}px !important; }\n`;
        }
      }
    }
    
    styleRef.current.innerHTML = cssRules;
  }, [margins, zoom]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => updatePagination();
    editor.on('update', handler);
    return () => { editor.off('update', handler); }
  }, [editor, updatePagination]);

  useEffect(() => {
    const timer = setTimeout(updatePagination, 50);
    return () => clearTimeout(timer);
  }, [updatePagination, contentHeight]);

  // ─── Load resume ─────────────────────────────────────────────────────
  const loadResume = useCallback(async () => {
    if (!editor) return;
    setLoading(true);
    try {
      let res = await getResume(id);
      let data = res.data.data;

      if (!data.content?.htmlContent) {
        setConverting(true);
        try { res = await convertToEditable(id); data = res.data.data; }
        catch {}
        setConverting(false);
      }

      setResumeName(data.name);
      setKeywordGaps(data.aiSuggestions?.keywordGaps ?? []);
      setVersions(data.content?.versions ?? []);
      const savedMargins = data.content?.margins ?? { top: 48, right: 48, bottom: 48, left: 48 };
      if (savedMargins.left === 72 && savedMargins.right === 72) {
        savedMargins.left = 48;
        savedMargins.right = 48;
        if (savedMargins.top === 60) savedMargins.top = 48;
        if (savedMargins.bottom === 60) savedMargins.bottom = 48;
      }
      setMargins(savedMargins);

      let html = data.content?.htmlContent;
      if (html) {
        // Robust DOM parsing to find and auto-float dates without breaking HTML tags
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Strip old AI suggestion marks saved in HTML
          const aiMarks = doc.querySelectorAll('span[data-suggestion-id]');
          aiMarks.forEach(mark => {
            const parent = mark.parentNode;
            while (mark.firstChild) parent?.insertBefore(mark.firstChild, mark);
            parent?.removeChild(mark);
          });

          const dateRegex = /(?:\s|—|-|–)*\(?((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4})\s*(?:-|—|–|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4}|Present|In Progress))\)?\s*$/i;
          
          const walk = document.createTreeWalker(doc.body, 4 /* NodeFilter.SHOW_TEXT */, null);
          let node;
          const replacements = [];
          while ((node = walk.nextNode())) {
            if (dateRegex.test(node.textContent || '')) replacements.push(node);
          }
          
          replacements.forEach(n => {
            const text = n.textContent || '';
            const match = text.match(dateRegex);
            if (match && n.parentNode) {
               const span = doc.createElement('span');
               span.style.float = 'right';
               span.textContent = match[1];
               n.textContent = text.replace(dateRegex, '');
               n.parentNode.insertBefore(span, n.nextSibling);
            }
          });
          html = doc.body.innerHTML;
          
          // Auto-fix contact info style to match new design (dots instead of pipes, no hr)
          html = html.replace(/ \| /g, ' &nbsp;&middot;&nbsp; ');
          html = html.replace(/<\/p><hr>/g, '</p>');
        } catch(e) { console.error('Auto-format failed', e); }
        
        editor.commands.setContent(html);
      }
      else if (data.content?.autoCorrectedText) {
        editor.commands.setContent(`<p>${data.content.autoCorrectedText.replace(/\n/g, '</p><p>')}</p>`);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id, editor]);

  useEffect(() => { if (editor) loadResume(); }, [editor]);

  // ─── Auto-save ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      clearTimeout(autoSaveTimer.current);
      setSaveState('idle');
      autoSaveTimer.current = setTimeout(handleSave, 4000);
    };
    editor.on('update', onUpdate);
    return () => { editor.off('update', onUpdate); clearTimeout(autoSaveTimer.current); };
  }, [editor]);

  // ─── Save ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (label?: string) => {
    if (!editor) return;
    setSaveState('saving');
    try {
      await updateResume(id, { htmlContent: editor.getHTML(), name: resumeName || undefined, margins, versionLabel: label });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch { setSaveState('error'); }
  }, [editor, id, resumeName, margins]);

  // ─── Inline suggestions ──────────────────────────────────────────────
  const fetchInlineSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const res = await getInlineSuggestions(id);
      const suggestions: InlineSuggestion[] = res.data.data.suggestions ?? [];
      
      if (editor && suggestions.length > 0) {
        const { tr } = editor.state;
        suggestions.forEach(s => {
          const escaped = s.originalSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'i'); // Removed 'g' to match only the first occurrence
          let matched = false;

          editor.state.doc.descendants((node, pos) => {
            if (matched) return false; // Stop searching if already found
            
            if (node.isTextblock) {
              let text = '';
              const posMap: number[] = [];
              node.forEach((child, offset) => {
                if (child.isText && child.text) {
                  for (let i = 0; i < child.text.length; i++) {
                    text += child.text[i];
                    posMap.push(pos + 1 + offset + i);
                  }
                } else {
                  text += ' '; // Represent inline nodes (e.g. <br>) as space
                  posMap.push(pos + 1 + offset);
                }
              });

              const match = regex.exec(text);
              if (match) {
                const startIdx = match.index;
                const endIdx = match.index + match[0].length - 1;
                if (startIdx < posMap.length && endIdx < posMap.length) {
                  const from = posMap[startIdx];
                  const to = posMap[endIdx] + 1;
                  tr.addMark(from, to, editor.schema.marks.aiSuggestion.create({ suggestionId: s.id, suggestionType: s.type }));
                  matched = true;
                }
              }
            }
          });
        });
        editor.view.dispatch(tr);
      }
      setInlineSuggestions(suggestions);
      setActivePanel(null);
    } catch {} finally { setLoadingSuggestions(false); }
  }, [id, editor]);

  const clearInlineSuggestions = useCallback(() => {
    if (!editor) return;
    const { tr } = editor.state;
    editor.state.doc.descendants((node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'aiSuggestion') {
          tr.removeMark(pos, pos + node.nodeSize, mark);
        }
      });
    });
    editor.view.dispatch(tr);
    setInlineSuggestions([]);
    setActiveSuggestion(null);
  }, [editor]);

  const handleAcceptSuggestion = useCallback((sId: string) => {
    if (!editor) return;
    const suggestion = inlineSuggestions.find(s => s.id === sId);
    if (!suggestion) return;

    let from = -1;
    let to = -1;
    
    // Find contiguous range of this specific suggestion mark
    editor.state.doc.descendants((node, pos) => {
       const mark = node.marks.find(m => m.type.name === 'aiSuggestion' && m.attrs.suggestionId === sId);
       if (mark) {
          if (from === -1) from = pos;
          to = pos + node.nodeSize;
       }
    });
    
    if (from !== -1 && to !== -1) {
       editor.view.dispatch(editor.state.tr.replaceWith(from, to, editor.schema.text(suggestion.replacement)));
    }
    
    setInlineSuggestions(prev => prev.filter(s => s.id !== sId));
    setActiveSuggestion(null);
  }, [editor, inlineSuggestions]);

  const handleDismissSuggestion = useCallback((sId: string) => {
    if (!editor) return;
    const { tr } = editor.state;
    editor.state.doc.descendants((node, pos) => {
       const mark = node.marks.find(m => m.type.name === 'aiSuggestion' && m.attrs.suggestionId === sId);
       if (mark) {
          tr.removeMark(pos, pos + node.nodeSize, editor.schema.marks.aiSuggestion);
       }
    });
    editor.view.dispatch(tr);
    setInlineSuggestions(prev => prev.filter(s => s.id !== sId));
    setActiveSuggestion(null);
  }, [editor]);

  // ─── Margin handlers ─────────────────────────────────────────────────
  const handleHorizontalMarginChange = useCallback((l: number, r: number) => {
    setMargins(m => ({ ...m, left: Math.round(l), right: Math.round(r) }));
  }, []);
  const handleVerticalMarginChange = useCallback((t: number, b: number) => {
    setMargins(m => ({ ...m, top: Math.round(t), bottom: Math.round(b) }));
  }, []);

  // ─── Keyword insert ──────────────────────────────────────────────────
  const handleKeywordInsert = useCallback((kw: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(` ${kw}`).run();
  }, [editor]);

  // ─── JD Optimize ─────────────────────────────────────────────────────
  const handleJDOptimize = useCallback(async () => { await loadResume(); }, [loadResume]);

  // ─── Version restore ─────────────────────────────────────────────────
  const handleVersionRestore = useCallback(async (version: ResumeVersion) => {
    if (!editor || !confirm(`Restore "${version.label}"?`)) return;
    try {
      const res = await restoreVersion(id, version.id);
      editor.commands.setContent(res.data.data.htmlContent);
      const refreshed = await getResume(id);
      setVersions(refreshed.data.data.content?.versions ?? []);
    } catch {}
  }, [editor, id]);

  // ─── Export ──────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!editor) return;
    const win = window.open('', '_blank')!;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${resumeName}</title><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Times New Roman",Times,serif;font-size:13.5px;line-height:1.35;color:#000;padding:${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;max-width:${PAGE_W}px;margin:0 auto}
h1{font-size:24px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#000;margin-bottom:2px;text-align:center}
h2{font-size:14.5px;font-weight:700;color:#000;margin-top:10px;margin-bottom:2px;padding-bottom:2px;border-bottom:1px solid #000}
p{margin-bottom:2px}ul,ol{margin-left:20px;margin-bottom:2px}li{margin-bottom:1px;padding-left:2px}
a{color:#000;text-decoration:none}hr{border:none;border-top:1px solid #000;margin:6px 0}strong{font-weight:700}em{font-style:italic}
@media print{body{padding:20px}@page{margin:15mm}}
</style></head><body>${editor.getHTML()}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }, [editor, resumeName, margins]);

  const SaveIcon = saveState === 'saving' ? Loader2 : saveState === 'saved' ? CheckCheck : saveState === 'error' ? AlertCircle : Save;
  const saveLabel = { idle: 'Save', saving: 'Saving…', saved: 'Saved', error: 'Error' }[saveState];
  const saveClass = saveState === 'saved' ? 'bg-green-500/15 border-green-500/30 text-green-400' :
    saveState === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-400' :
    'bg-[#1c1c1e] border-[#2c2c2e] text-gray-300 hover:text-white hover:border-white/40';

  const PANEL_TABS = [
    { key: 'ai' as LeftPanel, icon: Sparkles, label: 'AI Tools' },
    { key: 'suggestions' as LeftPanel, icon: Lightbulb, label: 'Suggestions', badge: inlineSuggestions.length || null },
    { key: 'versions' as LeftPanel, icon: History, label: 'History' },
  ];

  const EDITOR_CSS = `
    .ProseMirror { font-family: "Times New Roman", Times, serif; font-size: 13.5px; line-height: 1.35; color: #000; }
    .ProseMirror:focus { outline: none; }
    .ProseMirror ::selection { background: rgba(59,130,246,0.25); }
    .ProseMirror a { color: inherit; text-decoration: none; }
    .ProseMirror strong { font-weight: 700; }
    .ProseMirror em { font-style: italic; }
    .ProseMirror u { text-decoration: underline; }
    .ProseMirror s { text-decoration: line-through; }
    .ProseMirror mark { border-radius: 2px; padding: 0 2px; }
    
    .ProseMirror h1 { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #000; margin-bottom: 2px; text-align: center; }
    .ProseMirror h2 { font-size: 14.5px; font-weight: 700; color: #000; margin-top: 10px; margin-bottom: 2px; padding-bottom: 2px; border-bottom: 1px solid #000; }
    .ProseMirror h3 { font-size: 13.5px; font-weight: 700; color: #000; margin-top: 6px; margin-bottom: 2px; }
    .ProseMirror p { margin-bottom: 2px; color: #000; }
    .ProseMirror ul { list-style-type: disc; margin-left: 20px; margin-bottom: 2px; }
    .ProseMirror ol { list-style-type: decimal; margin-left: 20px; margin-bottom: 2px; }
    .ProseMirror li { margin-bottom: 1px; color: #000; padding-left: 2px; }
    .ProseMirror hr { border: none; border-top: 1px solid #000; margin: 6px 0; }

    @keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: slideDown 0.15s ease; }
  `;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-[#111] border-b border-[#1e1e1e] z-40 flex-shrink-0">
        <button onClick={() => router.push('/dashboard/resumes')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm flex-shrink-0">
          <ChevronLeft size={16} />Back
        </button>
        <div className="w-px h-4 bg-[#2a2a2a]" />
        <input value={resumeName} onChange={e => setResumeName(e.target.value)}
          className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 min-w-0"
          placeholder="Untitled Resume" />

        {/* Analyse button */}
        <div className="flex items-center gap-1">
          <button onClick={fetchInlineSuggestions} disabled={loadingSuggestions || loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-500/15 border border-blue-500/25 text-blue-300 rounded-lg hover:bg-blue-500/25 transition-colors disabled:opacity-40 flex-shrink-0">
            {loadingSuggestions ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loadingSuggestions ? 'Analysing…' : 'Analyse'}
            {inlineSuggestions.length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                {inlineSuggestions.length}
              </span>
            )}
          </button>
          
          {inlineSuggestions.length > 0 && (
            <button onClick={clearInlineSuggestions} title="Clear AI Suggestions"
              className="p-1.5 text-gray-400 hover:text-red-400 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-1 py-1">
          <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="text-gray-400 hover:text-white p-1 transition-colors"><ZoomOut size={13} /></button>
          <select value={zoom} onChange={e => setZoom(Number(e.target.value))}
            className="bg-transparent text-white text-xs w-14 text-center focus:outline-none cursor-pointer">
            {[50, 75, 100, 125, 150].map(z => <option key={z} value={z}>{z}%</option>)}
          </select>
          <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="text-gray-400 hover:text-white p-1 transition-colors"><ZoomIn size={13} /></button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => handleSave('Manual save')} disabled={saveState === 'saving'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${saveClass}`}>
            <SaveIcon size={12} className={saveState === 'saving' ? 'animate-spin' : ''} />{saveLabel}
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold flex-shrink-0">
            <Download size={12} />Export
          </button>
        </div>
      </header>

      {/* Toolbar */}
      {editor && !loading && <Toolbar editor={editor} />}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left tabs */}
        <div className="flex flex-col border-r border-[#1e1e1e] bg-[#0d0d0d] flex-shrink-0">
          {PANEL_TABS.map(({ key, icon: Icon, label, badge }) => (
            <button key={String(key)} title={label ?? ''} onClick={() => setActivePanel(p => p === key ? null : key)}
              className={`relative p-3 flex flex-col items-center gap-1 transition-colors text-xs ${activePanel === key ? 'text-white bg-white/8' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}>
              <Icon size={15} />
              <span className="text-[9px]">{label}</span>
              {badge && badge > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold text-[8px]">{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Left expandable panel */}
        {activePanel && (
          <div className="w-60 border-r border-[#1e1e1e] bg-[#0d0d0d] flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {{ ai: 'AI Tools', suggestions: 'Suggestions', versions: 'History' }[activePanel]}
              </span>
              <button onClick={() => setActivePanel(null)} className="text-gray-600 hover:text-white transition-colors"><X size={13} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'ai' && (
                <AIPanel resumeId={id} keywordGaps={keywordGaps} onKeywordInsert={handleKeywordInsert} onJDOptimize={handleJDOptimize} />
              )}
              {activePanel === 'suggestions' && (
                <SuggestionsPanel
                  resumeId={id}
                  suggestions={inlineSuggestions}
                  loading={loadingSuggestions}
                  onFetch={fetchInlineSuggestions}
                  onAccept={handleAcceptSuggestion}
                  onDismiss={handleDismissSuggestion}
                />
              )}
              {activePanel === 'versions' && <VersionsPanel versions={versions} onRestore={handleVersionRestore} />}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef} className="flex-1 overflow-auto bg-[#161616]">
          {loading || converting ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div style={{ width: 300, background: '#fff', borderRadius: 4, padding: 24, opacity: 0.06 }}>
                  <div style={{ height: 20, background: '#ccc', borderRadius: 4, marginBottom: 8, width: '60%', marginLeft: '20%' }} />
                  <div style={{ height: 10, background: '#ccc', borderRadius: 4, marginBottom: 4, width: '80%', marginLeft: '10%' }} />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ height: 8, background: '#ccc', borderRadius: 4, marginBottom: 6, width: `${70 + (i % 3) * 10}%` }} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={28} className="text-white/60 animate-spin" />
                </div>
              </div>
              <p className="text-gray-500 text-sm">{converting ? 'Converting to editable format…' : 'Loading resume…'}</p>
            </div>
          ) : (
            <div className="flex py-8" style={{ minHeight: '100%', justifyContent: 'center' }}>
              <VerticalRuler
                height={Math.round((Math.max(1, Math.ceil(contentHeight / PAGE_H)) * PAGE_H + Math.max(0, Math.ceil(contentHeight / PAGE_H) - 1) * 32) * zoom / 100)}
                marginTop={Math.round(margins.top * zoom / 100)}
                marginBottom={Math.round(margins.bottom * zoom / 100)}
                onMarginChange={handleVerticalMarginChange}
              />

              <div className="flex flex-col items-center">
                <HorizontalRuler
                  width={Math.round(PAGE_W * zoom / 100)}
                  marginLeft={Math.round(margins.left * zoom / 100)}
                  marginRight={Math.round(margins.right * zoom / 100)}
                  onMarginChange={handleHorizontalMarginChange}
                />

                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', marginBottom: `${(zoom / 100 - 1) * (Math.max(1, Math.ceil(contentHeight / PAGE_H)) * PAGE_H + Math.max(0, Math.ceil(contentHeight / PAGE_H) - 1) * 32)}px` }}>
                  <div 
                    onClick={() => { if (editor && !editor.isFocused) editor.commands.focus('end'); }}
                    style={{
                      width: PAGE_W, 
                      minHeight: Math.max(1, Math.ceil(contentHeight / PAGE_H)) * PAGE_H + Math.max(0, Math.ceil(contentHeight / PAGE_H) - 1) * 32,
                      position: 'relative',
                      cursor: 'text'
                    }}
                  >
                    {/* Render Page Backgrounds and Margin Guides */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                      {Array.from({ length: Math.max(1, Math.ceil(contentHeight / PAGE_H)) }).map((_, i) => (
                        <div key={i} style={{
                          position: 'absolute',
                          top: i * (PAGE_H + 32),
                          left: 0,
                          width: PAGE_W,
                          height: PAGE_H,
                          backgroundColor: '#ffffff',
                          boxShadow: '0 8px 60px rgba(0,0,0,0.15)',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{ position: 'absolute', top: margins.top, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.25) 10%, rgba(59,130,246,0.25) 90%, transparent)' }} />
                          <div style={{ position: 'absolute', bottom: margins.bottom, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.25) 10%, rgba(59,130,246,0.25) 90%, transparent)' }} />
                          {/* Page Number Indicator */}
                          <div style={{ position: 'absolute', bottom: 12, right: margins.right, fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
                            Page {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Editor Content Overlay */}
                    <div className="editor-overlay" style={{ 
                      position: 'relative', 
                      zIndex: 10,
                      paddingTop: margins.top, paddingRight: margins.right,
                      paddingBottom: margins.bottom, paddingLeft: margins.left,
                      minHeight: Math.max(1, Math.ceil(contentHeight / PAGE_H)) * PAGE_H
                    }}>
                      {editor && <EditorContent editor={editor} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selection Toolbar */}
      {selectionToolbar && !aiResult && (
        <SelectionToolbarUI
          toolbar={selectionToolbar}
          onAction={handleTextAction}
          onClose={() => setSelectionToolbar(null)}
        />
      )}
      {activeSuggestion && (
        <SuggestionPopupUI
          activeId={activeSuggestion.id}
          x={activeSuggestion.x}
          y={activeSuggestion.y}
          suggestions={inlineSuggestions}
          onAccept={handleAcceptSuggestion}
          onReject={handleDismissSuggestion}
        />
      )}

      {/* AI Result Popup */}
      {aiResult && (
        <div className="ai-result-popup">
          <AIResultPopup
            result={aiResult}
            position={aiResult.position}
            onAccept={handleAcceptResult}
            onDismiss={() => setAiResult(null)}
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />
    </div>
  );
}