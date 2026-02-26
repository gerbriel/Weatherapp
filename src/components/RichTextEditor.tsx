import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type here...',
  label,
  helperText,
  minHeight = '120px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: outdent — remove leading spaces if present
        document.execCommand('outdent');
      } else {
        // Tab: insert 4 non-breaking spaces as indentation
        document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      }
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
  ];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-t-lg border-b-0">
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => execCommand(btn.command)}
            title={btn.title}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <btn.icon className="h-4 w-4" />
          </button>
        ))}
        
        {/* Font Size Selector */}
        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          className="ml-2 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300"
          defaultValue="3"
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white overflow-auto"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />

      {helperText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          position: absolute;
        }
        [contenteditable]:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};
