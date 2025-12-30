
import React, { useState } from 'react';
import type { AttachedFile, Platform } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { SparklesIcon, FileIcon } from './icons';

interface InitialScreenProps {
  onGenerate: (prompt: string, files: AttachedFile[], platform: Platform) => void;
}

export const InitialScreen: React.FC<InitialScreenProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [platform, setPlatform] = useState<Platform>('Generic');

  const platforms: Platform[] = ['Generic', 'LinkedIn', 'Facebook', 'Reddit', 'Twitter'];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    const attachedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        content: await fileToBase64(file),
      }))
    );
    onGenerate(prompt, attachedFiles, platform);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-2xl mx-auto p-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-white">Ghostwriter AI</h1>
          <p className="mt-4 text-lg text-brand-subtle">Your collaborative thought partner in writing.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-brand-subtle mb-2">
              Select a platform
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    platform === p
                      ? 'bg-brand-accent text-white'
                      : 'bg-brand-secondary hover:bg-gray-700 text-brand-subtle'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-brand-subtle mb-2">
              What would you like to write about?
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-brand-secondary border border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
              placeholder="e.g., An article about the future of renewable energy..."
            />
          </div>

          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-brand-subtle mb-2">
              Attach files (optional)
            </label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-10">
              <div className="text-center">
                <FileIcon className="mx-auto h-12 w-12 text-gray-500" />
                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-brand-secondary font-semibold text-brand-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-accent focus-within:ring-offset-2 focus-within:ring-offset-brand-primary hover:text-indigo-400"
                  >
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">Any text or image files</p>
              </div>
            </div>
             {files.length > 0 && (
              <div className="mt-4 text-sm text-brand-subtle">
                <p>Attached: {files.map(f => f.name).join(', ')}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!prompt.trim()}
            className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-5 h-5" />
            Start Writing
          </button>
        </form>
      </div>
    </div>
  );
};
