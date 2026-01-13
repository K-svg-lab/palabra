/**
 * Rich Text Editor Component
 * 
 * Simple rich text editor for personal notes and mnemonics.
 * Supports basic formatting: bold, italic, bullet lists.
 * 
 * @module components/shared/rich-text-editor
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List } from 'lucide-react';

interface RichTextEditorProps {
  /** Initial value */
  value?: string;
  /** Callback when content changes */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character limit */
  maxLength?: number;
  /** Read-only mode */
  readOnly?: boolean;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Add personal notes or mnemonics...',
  maxLength = 500,
  readOnly = false,
}: RichTextEditorProps) {
  const [content, setContent] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Update content when value prop changes
  useEffect(() => {
    if (value !== content) {
      setContent(value);
      if (editorRef.current && !isFocused) {
        editorRef.current.textContent = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.textContent || '';
      
      // Check character limit
      if (maxLength && newContent.length > maxLength) {
        editorRef.current.textContent = newContent.substring(0, maxLength);
        return;
      }
      
      setContent(newContent);
      onChange?.(newContent);
    }
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  };

  if (readOnly) {
    return (
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {content || placeholder}
      </div>
    );
  }

  const characterCount = content.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Bullet List"
          aria-label="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>
        
        {/* Character count */}
        {maxLength && (
          <span 
            className={`ml-auto text-xs ${
              isNearLimit ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {characterCount}/{maxLength}
          </span>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className={`min-h-[100px] p-3 rounded-lg border ${
          isFocused
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-gray-300 dark:border-gray-700'
        } bg-white dark:bg-black text-sm focus:outline-none`}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        aria-label="Rich text editor"
        role="textbox"
        aria-multiline="true"
      >
        {content}
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        
        [contenteditable] {
          outline: none;
        }
        
        [contenteditable] b,
        [contenteditable] strong {
          font-weight: 600;
        }
        
        [contenteditable] i,
        [contenteditable] em {
          font-style: italic;
        }
        
        [contenteditable] ul {
          list-style-type: disc;
          margin-left: 1.5em;
          padding-left: 0.5em;
        }
        
        [contenteditable] li {
          margin: 0.25em 0;
        }
      `}</style>
    </div>
  );
}

