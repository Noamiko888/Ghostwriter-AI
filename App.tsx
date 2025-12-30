
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { InitialScreen } from './components/InitialScreen';
import { EditorView } from './components/EditorView';
import { generateInitialDraft, generateSuggestions, applySuggestions } from './services/geminiService';
import type { Revision, Suggestion, AttachedFile, Platform } from './types';
import { LoadingIcon } from './components/icons';

const App: React.FC = () => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Undo/Redo State
  const [historyPast, setHistoryPast] = useState<string[]>([]);
  const [historyFuture, setHistoryFuture] = useState<string[]>([]);
  const lastSaveTimeRef = useRef<number>(0);
  const prevRevisionsLengthRef = useRef(0);

  const currentRevision = revisions.length > 0 ? revisions[revisions.length - 1] : null;

  // Reset undo history when a new revision is created by AI
  useEffect(() => {
    if (revisions.length > prevRevisionsLengthRef.current) {
        setHistoryPast([]);
        setHistoryFuture([]);
        prevRevisionsLengthRef.current = revisions.length;
    }
  }, [revisions.length]);

  const handleGenerateDraft = async (prompt: string, files: AttachedFile[], platform: Platform) => {
    setIsGeneratingDraft(true);
    setLoadingMessage('Crafting your initial draft...');
    setError(null);
    try {
      const content = await generateInitialDraft(prompt, files, platform);
      setRevisions([{ id: Date.now().toString(), content, timestamp: new Date(), platform }]);
      setSuggestions([]);
      setSelectedSuggestions(new Set());
    } catch (e) {
      setError('Failed to generate draft. Please check your API key and try again.');
      console.error(e);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const fetchSuggestions = useCallback(async (revision: Revision) => {
    if (!revision || revision.content.length < 50) return;
    setIsFetchingSuggestions(true);
    try {
      const newSuggestions = await generateSuggestions(revision.content, revision.platform);
      setSuggestions(newSuggestions);
    } catch (e) {
      console.error('Failed to fetch suggestions:', e);
      // Not showing a user-facing error for this, as it's a background task.
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentRevision) {
        fetchSuggestions(currentRevision);
      }
    }, 3000); // Debounce suggestion fetching

    return () => clearTimeout(timer);
  }, [currentRevision, fetchSuggestions]);

  const handleApplySuggestions = async () => {
    if (selectedSuggestions.size === 0 || !currentRevision) return;
    
    setIsGeneratingDraft(true);
    setLoadingMessage('Weaving in your selected changes...');
    setError(null);

    const suggestionsToApply = suggestions.filter(s => selectedSuggestions.has(s.id));

    try {
      const newContent = await applySuggestions(currentRevision.content, suggestionsToApply, currentRevision.platform);
      setRevisions(prev => [...prev, { id: Date.now().toString(), content: newContent, timestamp: new Date(), platform: currentRevision.platform }]);
      setSelectedSuggestions(new Set());
      setSuggestions([]); // Clear old suggestions after applying
    } catch (e) {
      setError('Failed to apply suggestions. Please try again.');
      console.error(e);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleToggleSuggestion = (suggestionId: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };
  
  const handleContentChange = (newContent: string) => {
    if (!currentRevision) return;

    // Save history snapshot if enough time has passed since the last save
    const now = Date.now();
    if (now - lastSaveTimeRef.current > 1000) {
      setHistoryPast(prev => [...prev, currentRevision.content]);
      setHistoryFuture([]); // Clear redo stack on new input
      lastSaveTimeRef.current = now;
    }

    const updatedRevision = { ...currentRevision, content: newContent };
    setRevisions([...revisions.slice(0, -1), updatedRevision]);
  }

  const handleUndo = () => {
    if (historyPast.length === 0 || !currentRevision) return;

    const previousContent = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);

    setHistoryFuture(prev => [currentRevision.content, ...prev]);
    setHistoryPast(newPast);

    const updatedRevision = { ...currentRevision, content: previousContent };
    setRevisions([...revisions.slice(0, -1), updatedRevision]);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0 || !currentRevision) return;

    const nextContent = historyFuture[0];
    const newFuture = historyFuture.slice(1);

    setHistoryPast(prev => [...prev, currentRevision.content]);
    setHistoryFuture(newFuture);

    const updatedRevision = { ...currentRevision, content: nextContent };
    setRevisions([...revisions.slice(0, -1), updatedRevision]);
  };

  return (
    <div className="min-h-screen bg-brand-primary font-sans text-brand-text">
      {isGeneratingDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center">
          <LoadingIcon className="w-16 h-16 animate-spin text-brand-accent" />
          <p className="mt-4 text-lg text-brand-subtle">{loadingMessage}</p>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="absolute top-1 right-2 font-bold">x</button>
        </div>
      )}

      {revisions.length === 0 ? (
        <InitialScreen onGenerate={handleGenerateDraft} />
      ) : (
        <EditorView
          revisions={revisions}
          suggestions={suggestions}
          selectedSuggestions={selectedSuggestions}
          isFetchingSuggestions={isFetchingSuggestions}
          onToggleSuggestion={handleToggleSuggestion}
          onApplySuggestions={handleApplySuggestions}
          onContentChange={handleContentChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyPast.length > 0}
          canRedo={historyFuture.length > 0}
        />
      )}
    </div>
  );
};

export default App;
