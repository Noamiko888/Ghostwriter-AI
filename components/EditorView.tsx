
import React, { useState, useRef } from 'react';
import type { Revision, Suggestion } from '../types';
import { CheckIcon, LightbulbIcon, SparklesIcon, LoadingIcon, UndoIcon, RedoIcon } from './icons';

interface EditorViewProps {
  revisions: Revision[];
  suggestions: Suggestion[];
  selectedSuggestions: Set<string>;
  isFetchingSuggestions: boolean;
  onToggleSuggestion: (id: string) => void;
  onApplySuggestions: () => void;
  onContentChange: (newContent: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SuggestionCard: React.FC<{
  suggestion: Suggestion;
  isSelected: boolean;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ suggestion, isSelected, onToggle, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected ? 'bg-indigo-900/50 border-brand-accent' : 'bg-brand-secondary border-gray-600 hover:border-gray-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <p className="text-xs text-red-400 line-through mb-1">{suggestion.originalText}</p>
          <p className="text-sm text-green-300">{suggestion.suggestedChange}</p>
          <p className="text-xs text-brand-subtle mt-2">{suggestion.reason}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-sm flex-shrink-0 mt-1 flex items-center justify-center border-2 ${
            isSelected ? 'bg-brand-accent border-brand-accent' : 'border-gray-500'
          }`}
        >
          {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
        </div>
      </div>
    </div>
  );
};

export const EditorView: React.FC<EditorViewProps> = ({
  revisions,
  suggestions,
  selectedSuggestions,
  isFetchingSuggestions,
  onToggleSuggestion,
  onApplySuggestions,
  onContentChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && highlighterRef.current) {
        highlighterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        onRedo();
      } else {
        onUndo();
      }
    }
  };

  const getHighlightedContent = (content: string, textToHighlight: string | null) => {
    if (!textToHighlight) {
      return content;
    }
    // Escape special characters for regex
    const escapedText = textToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedText})`, 'gi');
    return content.replace(regex, `<mark class="bg-yellow-500/30 rounded">$1</mark>`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 p-4 sm:p-8 md:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {revisions.map((revision, index) => {
            const isLast = index === revisions.length - 1;
            return (
                <div key={revision.id} className={`font-serif text-lg leading-relaxed prose prose-invert max-w-none ${!isLast ? 'opacity-40 pb-12 border-b border-dashed border-gray-700 mb-12' : ''}`}>
                    {!isLast ? (
                        <div dangerouslySetInnerHTML={{ __html: revision.content.replace(/\n/g, '<br/>') }} />
                    ) : (
                        <div className="relative group">
                            <div className="absolute -top-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                <button 
                                    onClick={onUndo} 
                                    disabled={!canUndo}
                                    className="p-2 bg-brand-secondary border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-brand-text transition-colors"
                                    title="Undo (Ctrl+Z)"
                                >
                                    <UndoIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={onRedo} 
                                    disabled={!canRedo}
                                    className="p-2 bg-brand-secondary border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-brand-text transition-colors"
                                    title="Redo (Ctrl+Shift+Z)"
                                >
                                    <RedoIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="relative">
                                <div
                                    ref={highlighterRef}
                                    className="absolute inset-0 font-serif text-lg leading-relaxed whitespace-pre-wrap pointer-events-none overflow-hidden"
                                    aria-hidden="true"
                                    dangerouslySetInnerHTML={{ __html: getHighlightedContent(revision.content, highlightedText) }}
                                />
                                <textarea 
                                    ref={textareaRef}
                                    className="relative w-full h-auto bg-transparent focus:outline-none resize-none min-h-[50vh] font-serif text-lg leading-relaxed caret-white"
                                    value={revision.content}
                                    onChange={(e) => onContentChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onScroll={handleScroll}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
          })}
        </div>
      </main>
      <aside className="w-96 bg-brand-secondary border-l border-gray-700 flex flex-col h-full">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LightbulbIcon className="w-6 h-6 text-yellow-300" />
            Suggestions
          </h2>
          <p className="text-sm text-brand-subtle mt-1">AI-powered ideas to improve your writing.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isFetchingSuggestions && suggestions.length === 0 ? (
             <div className="text-center py-10">
              <LoadingIcon className="w-8 h-8 mx-auto animate-spin text-brand-subtle"/>
              <p className="text-brand-subtle mt-2">Thinking of suggestions...</p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                isSelected={selectedSuggestions.has(s.id)}
                onToggle={() => onToggleSuggestion(s.id)}
                onMouseEnter={() => setHighlightedText(s.originalText)}
                onMouseLeave={() => setHighlightedText(null)}
              />
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-brand-subtle">No suggestions right now.</p>
              <p className="text-sm text-gray-500">Keep writing, and we'll offer ideas as they come up.</p>
            </div>
          )}
        </div>
        {suggestions.length > 0 && (
          <div className="p-6 border-t border-gray-700">
            <button
              onClick={onApplySuggestions}
              disabled={selectedSuggestions.size === 0}
              className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <SparklesIcon className="w-5 h-5" />
              Generate New Revision ({selectedSuggestions.size})
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
