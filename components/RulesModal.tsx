
import React, { useState, useEffect, useRef } from 'react';
import { BookIcon, UploadIcon, TrashIcon, PlusIcon, ScrollTextIcon, ZoomInIcon, ZoomOutIcon, LinkIcon, ExternalLinkIcon, EditIcon, CheckIcon, CloseIcon, SparklesIcon, CopyIcon } from './icons';
import { UserRole, FormSchema } from '../types';
import * as db from '../services/db';

// Internal icons for Full Screen toggle
const ExpandIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </svg>
);

const CompressIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
    </svg>
);

// Pie Chart Icon for Analytics
const PieChartIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
);

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  systemPrompt: string;
  onSystemPromptChange: (newPrompt: string) => void;
  formSchema: FormSchema;
}

const AI_SOP_ID = 'ai_sop_live';
const ANALYTICS_ID = 'form_analytics';

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, userRole, systemPrompt, onSystemPromptChange, formSchema }) => {
  const [manuals, setManuals] = useState<db.Manual[]>([]);
  const [activeManualId, setActiveManualId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  
  // Add Link Modal State
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Edit SOP State
  const [isEditingSop, setIsEditingSop] = useState(false);
  const [editedSopContent, setEditedSopContent] = useState(systemPrompt);
  const [sopCopySuccess, setSopCopySuccess] = useState(false);
  
  // Analytics State
  const [analyticsExpanded, setAnalyticsExpanded] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
        try {
            const loadedManuals = await db.loadManuals();
            setManuals(loadedManuals);
            // If no manual selected, select AI SOP by default
            if (!activeManualId) {
                setActiveManualId(AI_SOP_ID);
            }
        } catch (e) {
            console.error("Failed to load reference manuals", e);
        }
    };
    if (isOpen) loadData();
  }, [isOpen]);

  // Sync system prompt to edit state when not editing
  useEffect(() => {
    if (!isEditingSop) {
        setEditedSopContent(systemPrompt);
    }
  }, [systemPrompt, isEditingSop]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newManuals: db.Manual[] = [];
    const timestamp = Date.now();
    const filePromises = (Array.from(files) as File[]).map((file, index) => {
        return new Promise<void>((resolve) => {
             const reader = new FileReader();
             reader.onload = (evt) => {
                 const text = evt.target?.result as string;
                 if (text) {
                     // Create unique ID combining timestamp, index and random string to prevent collision
                     const uniqueId = `${timestamp}-${index}-${Math.random().toString(36).substring(2, 9)}`;
                     newManuals.push({
                         id: uniqueId,
                         name: file.name,
                         content: text,
                         type: 'html',
                         uploadedAt: timestamp
                     });
                 }
                 resolve();
             };
             reader.onerror = () => {
                 console.error(`Failed to read file: ${file.name}`);
                 resolve();
             };
             reader.readAsText(file);
        });
    });

    await Promise.all(filePromises);

    if (newManuals.length > 0) {
        // Sort new manuals by name to be consistent with typical file selection behavior
        newManuals.sort((a, b) => a.name.localeCompare(b.name));
        
        const updatedManuals = [...manuals, ...newManuals];
        await db.saveManuals(updatedManuals);
        setManuals(updatedManuals);
        
        // Switch to the first newly added manual
        setActiveManualId(newManuals[0].id);
    }

    if (e.target) e.target.value = ''; // Reset input
  };

  const openAddLinkModal = () => {
      setNewLinkName('');
      setNewLinkUrl('');
      setIsAddLinkOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName || !newLinkUrl) return;

    // Basic URL validation
    let formattedUrl = newLinkUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
    }

    const newManual: db.Manual = {
        id: `${Date.now()}-link`,
        name: newLinkName,
        content: formattedUrl,
        type: 'url',
        uploadedAt: Date.now()
    };
    
    const updatedManuals = [...manuals, newManual];
    updatedManuals.sort((a, b) => a.name.localeCompare(b.name));

    await db.saveManuals(updatedManuals);
    setManuals(updatedManuals);
    setActiveManualId(newManual.id);
    setIsAddLinkOpen(false);
  };

  const handleDeleteManual = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Are you sure you want to delete this resource?")) {
          const updatedManuals = manuals.filter(m => m.id !== id);
          await db.saveManuals(updatedManuals);
          setManuals(updatedManuals);
          
          if (activeManualId === id) {
              setActiveManualId(updatedManuals.length > 0 ? updatedManuals[0].id : AI_SOP_ID);
          }
      }
  }
  
  const handleSaveSop = () => {
      onSystemPromptChange(editedSopContent);
      setIsEditingSop(false);
  };

  const handleCancelSop = () => {
      setEditedSopContent(systemPrompt);
      setIsEditingSop(false);
  };

  const handleCopySop = () => {
      navigator.clipboard.writeText(systemPrompt).then(() => {
          setSopCopySuccess(true);
          setTimeout(() => setSopCopySuccess(false), 2000);
      });
  };

  // Analytics Calculation
  const calculateAnalytics = () => {
      const allFields = formSchema.flatMap(fs => fs.fields);
      const totalFields = allFields.length;
      
      const aiFields = allFields.filter(f => f.label.includes('*AI') || (f.englishLabel && f.englishLabel.includes('*AI')));
      const nullFields = allFields.filter(f => f.label.includes('※NULL') || (f.englishLabel && f.englishLabel.includes('※NULL')));
      
      const systemNullCount = nullFields.length;
      const aiAutoCount = aiFields.filter(f => !f.label.includes('※NULL') && !(f.englishLabel && f.englishLabel.includes('※NULL'))).length;
      
      // Calculate standard fields (NOT *AI and NOT ※NULL)
      const standardFields = allFields.filter(f => {
          const isNull = f.label.includes('※NULL') || (f.englishLabel && f.englishLabel.includes('※NULL'));
          const isAi = f.label.includes('*AI') || (f.englishLabel && f.englishLabel.includes('*AI'));
          return !isNull && !isAi;
      });
      
      const standardCount = standardFields.length;

      return {
          totalFields,
          aiFields,
          nullFields,
          standardFields,
          counts: {
              ai: aiAutoCount,
              null: systemNullCount,
              standard: standardCount
          },
          percentages: {
              ai: totalFields ? Math.round((aiAutoCount / totalFields) * 100) : 0,
              null: totalFields ? Math.round((systemNullCount / totalFields) * 100) : 0,
              standard: totalFields ? Math.round((standardCount / totalFields) * 100) : 0
          }
      };
  };

  const activeManual = manuals.find(m => m.id === activeManualId);
  const isAiSopActive = activeManualId === AI_SOP_ID;
  const isAnalyticsActive = activeManualId === ANALYTICS_ID;
  
  const analytics = isAnalyticsActive ? calculateAnalytics() : null;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-all duration-300 ${isFullScreen ? 'p-0' : ''}`} onClick={onClose}>
      <div 
        className={`bg-white dark:bg-gray-800 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isFullScreen 
            ? 'w-full h-full rounded-none' 
            : 'rounded-lg w-full max-w-6xl h-[90vh]'
        }`} 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <BookIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reference Guide</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                   Customer Rules & Manuals
                </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-md transition-colors"
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullScreen ? <CompressIcon className="h-5 w-5" /> : <ExpandIcon className="h-5 w-5" />}
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
        </header>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden relative">
            
            {/* Add Link Modal Overlay */}
            {isAddLinkOpen && (
                <div className="absolute inset-0 z-20 bg-black bg-opacity-40 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add External Link</h3>
                        <form onSubmit={handleSaveLink} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title / Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newLinkName}
                                    onChange={e => setNewLinkName(e.target.value)}
                                    placeholder="e.g. Google Sheet SOP"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                                <input 
                                    type="url" 
                                    required
                                    value={newLinkUrl}
                                    onChange={e => setNewLinkUrl(e.target.value)}
                                    placeholder="https://docs.google.com/..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddLinkOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                                >
                                    Add Link
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Left Sidebar: Manual List */}
            <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resources</h3>
                        {userRole === 'admin' && (
                            <button 
                                onClick={() => setIsEditingList(!isEditingList)}
                                className={`text-xs font-medium px-2 py-1 rounded transition-colors ${isEditingList ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                {isEditingList ? 'Done' : 'Manage'}
                            </button>
                        )}
                    </div>
                    {userRole === 'admin' && (
                        <div className="grid grid-cols-2 gap-2">
                            <input type="file" accept=".html, .htm" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                title="Upload HTML Manuals"
                                className="flex items-center justify-center px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                <UploadIcon className="h-3 w-3 mr-1.5" /> Upload HTML
                            </button>
                             <button 
                                onClick={openAddLinkModal} 
                                title="Add External Link"
                                className="flex items-center justify-center px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors shadow-sm"
                            >
                                <LinkIcon className="h-3 w-3 mr-1.5" /> Add Link
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {/* Fixed AI SOP Item */}
                    <button
                        onClick={() => setActiveManualId(AI_SOP_ID)}
                        className={`flex-1 flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isAiSopActive
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                        }`}
                    >
                        <SparklesIcon className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
                        <span className="truncate" title="AI Extraction Rules (Live SOP)">AI Extraction Rules (Live SOP)</span>
                    </button>

                    {/* Fixed Analytics Item */}
                    <button
                        onClick={() => setActiveManualId(ANALYTICS_ID)}
                        className={`flex-1 flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isAnalyticsActive
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                        }`}
                    >
                        <PieChartIcon className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                        <span className="truncate" title="Form Field Analytics">Form Field Analytics</span>
                    </button>

                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>

                    {manuals.length === 0 && !isAiSopActive && !isAnalyticsActive && (
                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                            No uploaded resources.
                        </div>
                    )}

                    {manuals.map(manual => (
                        <div key={manual.id} className="flex items-center group relative">
                            <button
                                onClick={() => setActiveManualId(manual.id)}
                                className={`flex-1 flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeManualId === manual.id
                                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                            >
                                {manual.type === 'url' ? (
                                     <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0 opacity-70" />
                                ) : (
                                     <ScrollTextIcon className="h-4 w-4 mr-2 flex-shrink-0 opacity-70" />
                                )}
                                <span className="truncate" title={manual.name}>{manual.name}</span>
                            </button>
                            
                            {/* Delete Button: Always visible in Edit mode, hover only in View mode */}
                            {userRole === 'admin' && (
                                <button 
                                    onClick={(e) => handleDeleteManual(manual.id, e)}
                                    className={`absolute right-1 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all ${
                                        isEditingList 
                                        ? 'opacity-100 bg-red-50 dark:bg-red-900/10 text-red-500' 
                                        : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    title="Delete Resource"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Right Content: Viewer */}
            <main className="flex-1 bg-white dark:bg-gray-900 relative flex flex-col">
                {isAiSopActive ? (
                     <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
                         <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    <SparklesIcon className="h-5 w-5 mr-2 text-purple-500" />
                                    AI Data Extraction SOP (Standard Operating Procedure)
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    This document reflects the <strong className="text-indigo-600 dark:text-indigo-400">LIVE</strong> instructions currently being used by the "Auto-fill with AI" button. 
                                    {isEditingSop 
                                        ? " You are currently EDITING the rules. Changes will be applied immediately upon saving."
                                        : " Copy this text to update your external Gemini Gem."
                                    }
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {isEditingSop ? (
                                    <>
                                        <button 
                                            onClick={handleCancelSop}
                                            className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSaveSop}
                                            className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                                        >
                                            <CheckIcon className="h-4 w-4 mr-1.5" /> Save Rules
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={handleCopySop}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 rounded-md shadow-sm"
                                            title="Copy SOP to Clipboard"
                                        >
                                            {sopCopySuccess ? (
                                                <>
                                                    <CheckIcon className="h-4 w-4 text-green-500 mr-2"/>
                                                    <span className="text-green-600 dark:text-green-400">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CopyIcon className="h-4 w-4 mr-2 text-indigo-500"/>
                                                    <span>Copy Instructions for Gemini Gem</span>
                                                </>
                                            )}
                                        </button>
                                        {userRole === 'admin' && (
                                            <button 
                                                onClick={() => setIsEditingSop(true)}
                                                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
                                            >
                                                <EditIcon className="h-4 w-4 mr-1.5" /> Edit SOP
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                         </div>
                         
                         <div className="flex-1 overflow-auto p-6">
                            {isEditingSop ? (
                                <textarea 
                                    value={editedSopContent}
                                    onChange={(e) => setEditedSopContent(e.target.value)}
                                    className="w-full h-full p-4 font-mono text-sm text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-300 leading-relaxed">
                                        {systemPrompt}
                                    </pre>
                                </div>
                            )}
                         </div>
                     </div>
                ) : isAnalyticsActive ? (
                    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                        {analytics && (
                            <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                        <PieChartIcon className="h-6 w-6 mr-3 text-blue-500" />
                                        Form Field Analytics
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                                        Breakdown of how fields are categorized based on their Labels (`*AI` for Auto-Fill, `※NULL` for System Ignored).
                                    </p>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">AI Auto-Fill</h4>
                                        <div className="mt-2 flex items-baseline">
                                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.counts.ai}</span>
                                            <span className="ml-2 text-sm font-medium text-gray-500">Fields</span>
                                        </div>
                                        <div className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                                            {analytics.percentages.ai}% of Total
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-gray-400 dark:border-gray-500">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">System / NULL (Ignored)</h4>
                                        <div className="mt-2 flex items-baseline">
                                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.counts.null}</span>
                                            <span className="ml-2 text-sm font-medium text-gray-500">Fields</span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            {analytics.percentages.null}% of Total
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Standard / Human Check</h4>
                                        <div className="mt-2 flex items-baseline">
                                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.counts.standard}</span>
                                            <span className="ml-2 text-sm font-medium text-gray-500">Fields</span>
                                        </div>
                                        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            {analytics.percentages.standard}% of Total
                                        </div>
                                    </div>
                                </div>

                                {/* Visual Bar */}
                                <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${analytics.percentages.ai}%` }} className="bg-purple-500 h-full" title={`AI Auto: ${analytics.percentages.ai}%`} />
                                    <div style={{ width: `${analytics.percentages.standard}%` }} className="bg-blue-500 h-full" title={`Standard: ${analytics.percentages.standard}%`} />
                                    <div style={{ width: `${analytics.percentages.null}%` }} className="bg-gray-400 h-full" title={`System NULL: ${analytics.percentages.null}%`} />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                                    <div className="flex items-center"><span className="w-3 h-3 bg-purple-500 rounded-sm mr-1"></span> AI Auto</div>
                                    <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></span> Standard</div>
                                    <div className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-sm mr-1"></span> System / NULL</div>
                                </div>

                                {/* Details List */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div 
                                        className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex justify-between items-center"
                                        onClick={() => setAnalyticsExpanded(analyticsExpanded === 'null' ? null : 'null')}
                                    >
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">System / NULL Fields (Ignored)</h4>
                                        <span className="text-sm text-gray-500">{analyticsExpanded === 'null' ? 'Collapse' : 'View List'}</span>
                                    </div>
                                    {analyticsExpanded === 'null' && (
                                        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {analytics.nullFields.map(f => (
                                                    <li key={f.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2 flex-shrink-0"></span>
                                                        <span className="truncate">{f.label.replace('※NULL', '').trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div 
                                        className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex justify-between items-center"
                                        onClick={() => setAnalyticsExpanded(analyticsExpanded === 'ai' ? null : 'ai')}
                                    >
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">AI Auto Fields (*AI Tagged)</h4>
                                        <span className="text-sm text-gray-500">{analyticsExpanded === 'ai' ? 'Collapse' : 'View List'}</span>
                                    </div>
                                    {analyticsExpanded === 'ai' && (
                                        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {analytics.aiFields.map(f => (
                                                    <li key={f.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 flex-shrink-0"></span>
                                                        <span className="truncate">{f.label.replace('*AI', '').trim()}</span>
                                                    </li>
                                                ))}
                                                {analytics.aiFields.length === 0 && <li className="text-sm text-gray-400 italic">No fields tagged with *AI</li>}
                                            </ul>
                                        </div>
                                    )}

                                    <div 
                                        className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex justify-between items-center"
                                        onClick={() => setAnalyticsExpanded(analyticsExpanded === 'standard' ? null : 'standard')}
                                    >
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Standard / Human Check Fields</h4>
                                        <span className="text-sm text-gray-500">{analyticsExpanded === 'standard' ? 'Collapse' : 'View List'}</span>
                                    </div>
                                    {analyticsExpanded === 'standard' && (
                                        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 max-h-64 overflow-y-auto">
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {analytics.standardFields.map(f => (
                                                    <li key={f.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                                        <span className="truncate">{f.label.replace(/※NULL|\*AI/g, '').trim()}</span>
                                                    </li>
                                                ))}
                                                {analytics.standardFields.length === 0 && <li className="text-sm text-gray-400 italic">No standard fields</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>
                ) : activeManual ? (
                    <>
                        {/* Top Bar for Links (or useful info) */}
                        {activeManual.type === 'url' && (
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 overflow-hidden">
                                    <ExternalLinkIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate font-mono text-xs opacity-75" title={activeManual.content}>{activeManual.content}</span>
                                </div>
                                <a 
                                    href={activeManual.content} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm"
                                >
                                    Open in New Tab <ExternalLinkIcon className="ml-1.5 h-3.5 w-3.5" />
                                </a>
                            </div>
                        )}

                        {activeManual.type === 'url' ? (
                             <iframe 
                                src={activeManual.content}
                                className="w-full h-full border-none block bg-white"
                                title={activeManual.name}
                            />
                        ) : (
                             <iframe 
                                srcDoc={activeManual.content}
                                className="w-full h-full border-none block bg-white"
                                title={activeManual.name}
                                sandbox="allow-scripts allow-same-origin allow-forms" 
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                        <BookIcon className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-xl font-medium">Select a resource to view.</p>
                        {userRole === 'admin' && manuals.length === 0 && (
                            <p className="text-base mt-2 text-center max-w-md">
                                Get started by adding your SOPs.<br/>
                                You can upload HTML files or add links to Google Sheets/Docs via the "Manage" menu in the sidebar.
                            </p>
                        )}
                    </div>
                )}
            </main>

        </div>

        {/* Footer */}
        <footer className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
            <button onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">Close</button>
        </footer>
      </div>
    </div>
  );
};

export default RulesModal;
