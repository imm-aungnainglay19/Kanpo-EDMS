
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { KanpoData, FormSchema, ApiConfig, User, UserRole, VerificationStatus } from './types';
import { PROVIDER_CONFIG } from './components/ApiKeyManager';
import * as db from './services/db';

import ImageUploader from './components/ImageUploader';
import KanpoForm from './components/KanpoForm';
import { UploadIcon, ClearIcon, ImportIcon, SettingsIcon, PackageIcon, SparklesIcon, ChevronRightIcon, GeminiGemIcon, UsersIcon, LogOutIcon, ChevronLeftIcon, SortAscIcon, EditIcon, InfoIcon, PlayIcon, StopIcon, BookIcon, ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, PasteIcon } from './components/icons';
import MainImageViewer from './components/MainImageViewer';
import ImageGallery from './components/ImageGallery';
import ExportButton from './components/ExportButton';
import SettingsModal from './components/SettingsModal';
import Spinner from './components/Spinner';
import ToastContainer, { ToastMessage } from './components/ToastNotification';
import { DEFAULT_FORM_SCHEMA } from './services/schema';
import { extractDataWithAI, generateSystemPrompt } from './services/aiService';
import { BASE_SYSTEM_INSTRUCTION } from './services/prompts';
import ConfirmationModal from './components/ConfirmationModal';
import JsonEditor from './components/JsonEditor';
import UserManagementModal from './components/UserManagementModal';
import LoginPage from './components/LoginPage';
import LogoutConfirmationModal from './components/LogoutConfirmationModal';
import AboutModal from './components/AboutModal';
import Pagination from './components/Pagination';
import RulesModal from './components/RulesModal';
import BulkPasteModal from './components/BulkPasteModal';


declare const XLSX: any;
declare const JSZip: any;

const MOCK_USERS: User[] = [
  { id: 1, name: 'Admin User', username: 'admin', password: 'admin', role: 'admin' },
  { id: 2, name: 'Data Entry User 1', username: 'user1', password: 'password1', role: 'user' },
  { id: 3, name: 'Data Entry User 2', username: 'user2', password: 'password2', role: 'user' },
];

const ITEMS_PER_PAGE = 100;

// --- Entity Type Mapping (Ordered by Specificity/Length) ---
const ENTITY_TYPE_MAP: Record<string, string> = {
    '事業協同組合連合会': '06', '共済水産業協同組合連合会': '2T', '水産加工業協同組合連合会': '2S',
    '全国土地改良事業団体連合会': '4C', '農業協同組合連合会': '2B', '農業共済組合連合会': '2D',
    '農業協同組合中央会': '2E', '漁業協同組合連合会': '2N', '漁業共済組合連合会': '2R',
    '酒造組合連合会': '33', '酒販組合連合会': '35', '商店街振興組合連合会': '3B',
    '生活衛生同業組合連合会': '3H', '森林組合連合会': '3N', 'たばこ耕作組合連合会': '3P',
    '海運組合連合': '3U', '水害予防組合連合': '3W', '土地改良区連合': '4B',
    '防災街区計画整備組合': '4E', '防災街区整備事業組合': '4E', '土地区画整理組合': '4F',
    '市街地再開発組合': '4G', '市街地再開発準備組合': '4H', '投資事業有限責任組合': '5A',
    '厚生年金基金連合会': '72', '労働金庫連合会': '8B', '協同組合連合会': '06',
    '消費生活協同組合': '16', '生活協同組合連合会': '1A', '中小企業団体中央会': '1E',
    '商工組合連合会': '1P', '商業組合連合会': '1Q', '工業組合連合会': '1R',
    '鉱業組合連合会': '1S', '生活衛生同業小組合': '3G', '団地管理組合法人': '41',
    '住宅街区整備組合': '4D', '防災街区整備組合': '4E', '有限責任事業組合': '50',
    '有限責任中間法人': '51', '無限責任中間法人': '52', '社会保険労務士法人': '68',
    '土地家屋調査士法人': '6A', '国家公務員共済組合': '6O', '国立研究開発法人': '83',
    '特定非営利活動法人': '19', '事業協同組合': '05', '農事組合法人': '17',
    '一般社団法人': '21', '一般財団法人': '22', '公益社団法人': '23',
    '公益財団法人': '24', '農業協同組合': '2A', '農業共済組合': '2C',
    '漁業協同組合': '2M', '漁業生産組合': '2O', '水産加工業協同組合': '2P',
    '漁業共済組合': '2Q', '輸出水産業組合': '2U', '技術研究組合': '31',
    '商店街振興組合': '3A', '生活衛生同業組合': '3F', 'たばこ耕作組合': '3O',
    '特定目的会社': '5C', '弁護士法人': '61', '弁護士会連合会': '63',
    '行政書士法人': '64', '司法書士法人': '66', '税理士法人': '6C',
    '特許業務法人': '6E', '更生保護法人': '6H', '火災共済協同組合': '6N',
    '厚生年金基金': '71', '地方独立行政法人': '7V', '公立大学法人': '7W',
    '独立行政法人': '81', '国立大学法人': '82', '株式会社': '01',
    '有限会社': '02', '合資会社': '03', '合名会社': '04',
    '協同組合': '05', '協業組合': '07', '企業組合': '08',
    '相互会社': '09', '社団法人': '10', '学校法人': '11',
    '準学校法人': '11', '財団法人': '12', '医療法人': '13',
    '社会福祉法人': '14', '宗教法人': '15', '生活協同組合': '16',
    '監査法人': '18', 'NPO法人': '19', '商工会': '1B',
    '商工会連合会': '1C', '商工会議所': '1D', '協同小組合': '1K',
    '商工組合': '1L', '商業組合': '1M', '工業組合': '1N',
    '鉱業組合': '1O', '合同会社': '20', '農住組合': '2F',
    '酒造組合': '32', '酒販組合': '34', '森林組合': '3L',
    '生産森林組合': '3M', '輸出組合': '3Q', '輸入組合': '3S',
    '海運組合': '3T', '水害予防組合': '3V', '管理組合法人': '41',
    '土地改良区': '4A', '投資法人': '5B', '弁護士会': '62',
    '行政書士会': '65', '司法書士会': '67', '社会保険労務士会': '69',
    '土地家屋調査士会': '6B', '税理士会': '6D', '共済組合': '6O',
    '国家機関': '7A', '都道府県': '7B', '役所': '7C', // Fuzzy check for 市
    '役場': '7E', // Fuzzy for 町/村
    '住宅供給公社': '7S', '道路公社': '7T', '土地開発公社': '7U',
    '労働金庫': '8A', '信用組合': '8F', '信用金庫': '8G'
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

const createFileFingerprint = (file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`;
};

const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const extractPageNumberFromFilename = (filename: string): string => {
  // Format expectation: xxxxx_PAGE_xxxxx.jpg (e.g., 20250929g00217_143_1.jpg -> 143)
  const parts = filename.split('_');
  // Check if the second part (index 1) exists and is numeric
  if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
      return parts[1];
  }
  // Fallback regex: look for a number surrounded by underscores
  const match = filename.match(/_(\d+)_/);
  if (match) return match[1];
  
  return '';
};

const calculateEntityType = (text: string): string | null => {
    if (!text) return null;
    // Sort keys by length descending to match longest string first
    const sortedKeys = Object.keys(ENTITY_TYPE_MAP).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
        if (text.includes(key)) {
            return ENTITY_TYPE_MAP[key];
        }
    }
    return null;
};

// --- SYSTEM CALCULATION FIRST ENGINE ---
// Enforces deterministic rules, clears null fields, and applies logic.
const applySystemRules = (data: KanpoData, filename?: string, schema: FormSchema = DEFAULT_FORM_SCHEMA): KanpoData => {
    const today = getTodayString();
    const log: string[] = [];
    
    // Phase 1: Deterministic System Fill
    
    // 1. Data ID: ALWAYS set to filename if available (User Requirement)
    if (filename) {
        data['データID'] = filename;
        // log.push('Set Data ID to Filename'); 
    }

    // 2. Dates: Set to today if empty
    if (!data['掲載日']) data['掲載日'] = today;
    if (!data['納品日']) data['納品日'] = today;
    
    // 3. Source Category: Always K
    data['ソース区分'] = 'K';
    
    // 4. Page Number: Extract from filename if missing
    if (filename && (!data['掲載ページ'] || data['掲載ページ'] === '')) {
        const pageNum = extractPageNumberFromFilename(filename);
        if (pageNum) {
            data['掲載ページ'] = pageNum;
        }
    }

    // Phase 2: Null Field Enforcement
    // Scan schema for fields labeled with ※NULL and force clear them
    let clearedCount = 0;
    schema.forEach(fieldset => {
        fieldset.fields.forEach(field => {
            const isNullField = field.label.includes('※NULL') || (field.englishLabel && field.englishLabel.includes('※NULL'));
            if (isNullField) {
                // Clear content to ensure it is null/empty
                data[field.name] = null;
                clearedCount++;
            }
        });
    });
    if (clearedCount > 0) log.push(`Cleared ${clearedCount} NULL fields`);

    // Phase 3: Logic-Based Derivation
    // 5. Entity Type (Field 20): Calculate from Full Text
    if (!data['法人格区分'] || data['法人格区分'] === '') {
        const articleText = data['記事（全角）'];
        if (articleText) {
            const entityType = calculateEntityType(articleText);
            if (entityType) {
                data['法人格区分'] = entityType;
                log.push(`Calculated Entity Type: ${entityType}`);
            }
        }
    }

    if (log.length > 0) {
        console.log("System Rules Applied:", log.join(', '));
    }

    return data;
};

const createInitialFormData = (schema: FormSchema, filename: string = ''): KanpoData => {
  const formData: KanpoData = { verificationStatus: 'unverified' };
  
  schema.forEach(fieldset => {
    fieldset.fields.forEach(field => {
        formData[field.name] = '';
    });
  });
  
  // Apply System Rules immediately on creation
  return applySystemRules(formData, filename, schema);
};

// --- Normalization Helper ---
// Maps keys from JSON (which might use Labels like "1. データID") to internal Schema Names (like "データID")
const normalizeDataKeys = (data: any, schema: FormSchema): KanpoData => {
    const normalized: KanpoData = {};
    const labelMap = new Map<string, string>();
    
    // Helper to strip tags like ※NULL or *AI for robust matching
    const cleanKey = (key: string) => key.replace(/※NULL/g, '').replace(/\*AI/g, '').trim();

    schema.forEach(section => {
        section.fields.forEach(field => {
            labelMap.set(field.label, field.name); // Map Label -> Name
            labelMap.set(field.name, field.name);   // Map Name -> Name (Identity)
            
            // Add cleaned versions to map to ensure matching if tags are missing/present in JSON vs Schema
            labelMap.set(cleanKey(field.label), field.name);

            if (field.englishLabel) {
                labelMap.set(field.englishLabel, field.name); // Map English Label -> Name
                labelMap.set(cleanKey(field.englishLabel), field.name);
            }
        });
    });

    Object.keys(data).forEach(key => {
        // Try direct match, then cleaned match
        let dbKey = labelMap.get(key);
        if (!dbKey) {
            dbKey = labelMap.get(cleanKey(key));
        }
        // Fallback to original key if not found in schema map
        normalized[dbKey || key] = data[key];
    });
    
    return normalized;
};
// ----------------------------

const getHeadersFromSchema = (schema: FormSchema): string[] => {
  return schema.flatMap(fieldset => fieldset.fields.map(field => field.name));
};

const getMimeType = (file: File): string => {
    if (file.type) {
        return file.type;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        default:
            return 'image/jpeg';
    }
};

export default function App() {
  // --- Scalable State Management ---
  // Lightweight state for managing all images
  const [imageDbIds, setImageDbIds] = useState<number[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageFingerprints, setImageFingerprints] = useState<Set<string>>(new Set());
  
  // State for the current page view (Image Gallery)
  const [paginatedImageUrls, setPaginatedImageUrls] = useState<string[]>([]);
  const [paginatedImageNames, setPaginatedImageNames] = useState<string[]>([]);
  // New state for statuses
  const [paginatedImageStatuses, setPaginatedImageStatuses] = useState<VerificationStatus[]>([]);
  
  // State for the currently active/selected image
  const [currentFormData, setCurrentFormData] = useState<KanpoData | null>(null);
  const [currentImage, setCurrentImage] = useState<{ url: string, name: string, file: File } | null>(null);
  const previousImageUrlRef = useRef<string | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loginHighlight, setLoginHighlight] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'form' | 'json'>('form');
  const [currentPage, setCurrentPage] = useState(1);
  const [isGalleryOpen, setIsGalleryOpen] = useState(true); // For collapsible gallery
  
  // Layout State (Resizable Split Pane)
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const isResizingRef = useRef(false);

  // Bulk Processing State
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [bulkLimit, setBulkLimit] = useState(0);
  const [totalUnverifiedCount, setTotalUnverifiedCount] = useState(0);
  const isBulkProcessingRef = useRef(false);
  
  // Bulk Paste State
  const [isBulkPasteModalOpen, setIsBulkPasteModalOpen] = useState(false);
  const [pendingBulkPasteData, setPendingBulkPasteData] = useState<KanpoData[]>([]);

  // Config & Schema State
  const [formSchema, setFormSchema] = useState<FormSchema>(DEFAULT_FORM_SCHEMA);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: 'gemini', apiKey: null, model: PROVIDER_CONFIG.gemini.models[0],
    ollamaUrl: 'http://localhost:11434', ollamaModel: '',
  });
  const [systemPrompt, setSystemPrompt] = useState(generateSystemPrompt(DEFAULT_FORM_SCHEMA, BASE_SYSTEM_INSTRUCTION));

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // New hook for keyboard shortcuts
  const useHotkeys = (key: string, callback: () => void) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for modifier keys if needed (e.g., Ctrl+Enter)
            if (key === 'Ctrl+Enter' && event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                callback();
            } else if (key === 'Ctrl+ArrowRight' && event.ctrlKey && event.key === 'ArrowRight') {
                event.preventDefault();
                callback();
            } else if (key === 'Ctrl+ArrowLeft' && event.ctrlKey && event.key === 'ArrowLeft') {
                event.preventDefault();
                callback();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [key, callback]);
  };

  const addToast = (message: string, type: 'success' | 'error') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const fetchAndSetPageData = useCallback(async (page: number, ids: number[]) => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const pageIds = ids.slice(startIndex, endIndex);

      if (pageIds.length === 0) {
        setPaginatedImageUrls([]);
        setPaginatedImageNames([]);
        setPaginatedImageStatuses([]);
        return;
      }

      const { images, formData } = await db.getRecordsByIds(pageIds);
      
      // Create maps to maintain order
      const imagesMap = new Map(images.map(img => [img.id, img.file]));
      const dataMap = new Map(formData.map(fd => [fd.id, fd.data]));
      
      const newUrls = pageIds.map(id => URL.createObjectURL(imagesMap.get(id)!));
      const newNames = pageIds.map(id => imagesMap.get(id)!.name);
      const newStatuses = pageIds.map(id => dataMap.get(id)?.verificationStatus || 'unverified');
      
      // Revoke old URLs to prevent memory leaks
      setPaginatedImageUrls(prevUrls => {
        prevUrls.forEach(url => URL.revokeObjectURL(url));
        return newUrls;
      });
      setPaginatedImageNames(newNames);
      setPaginatedImageStatuses(newStatuses);
  }, []);
  
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            // Load Layout Preference
            const savedWidth = localStorage.getItem('rightPanelWidth');
            if (savedWidth) setRightPanelWidth(parseInt(savedWidth, 10));

            const savedSchema = localStorage.getItem('formSchema');
            const loadedSchema = savedSchema ? JSON.parse(savedSchema) : DEFAULT_FORM_SCHEMA;
            setFormSchema(loadedSchema);

            const savedApiConfig = localStorage.getItem('apiConfig');
            if (savedApiConfig) setApiConfig(JSON.parse(savedApiConfig));
            
            const savedPrompt = localStorage.getItem('systemPrompt');
            
            // --- PROMPT MIGRATION LOGIC ---
            // Re-check to ensure we have the latest base prompt logic
            const needsField8Fix = savedPrompt && savedPrompt.includes("**記事（半角）") && savedPrompt.includes("INTERNAL FIELD. Leave blank/null.");
            const needsField20Fix = savedPrompt && !savedPrompt.includes("Classification Rules for Field 20");
            
            if (!savedPrompt || needsField8Fix || needsField20Fix) {
                const newPrompt = generateSystemPrompt(loadedSchema, BASE_SYSTEM_INSTRUCTION);
                setSystemPrompt(newPrompt);
                localStorage.setItem('systemPrompt', newPrompt);
                if (needsField8Fix || needsField20Fix) {
                    console.log("System prompt automatically updated to include latest extraction rules.");
                }
            } else {
                setSystemPrompt(savedPrompt);
            }
            // -------------------------------

            const savedUsers = localStorage.getItem('appUsers');
            const allUsers = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
            setUsers(allUsers);

            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                const fullUser = allUsers.find((u: User) => u.id === parsedUser.id);
                if (fullUser) setCurrentUser(fullUser);
            }

            const sessionData = await db.loadSession();
            setImageDbIds(sessionData.imageOrder);
            setImageCount(sessionData.imageCount);
            setImageFingerprints(new Set(sessionData.fingerprints));

            const finalIndex = sessionData.selectedImageIndex < sessionData.imageCount ? sessionData.selectedImageIndex : (sessionData.imageCount > 0 ? 0 : null);
            setSelectedImageIndex(finalIndex);
            if (finalIndex !== null) {
                const initialPage = Math.floor(finalIndex / ITEMS_PER_PAGE) + 1;
                setCurrentPage(initialPage);
                await fetchAndSetPageData(initialPage, sessionData.imageOrder);
            }
        } catch (error) {
            console.error("Failed to load state", error);
            addToast("Could not load session. Starting fresh.", "error");
            localStorage.removeItem('currentUser');
            await db.clearDatabase();
        } finally {
            setIsLoading(false);
        }
    };
    loadInitialData();
  }, [fetchAndSetPageData]);
  
  useEffect(() => {
    if (isLoading) return;
    fetchAndSetPageData(currentPage, imageDbIds);
  }, [currentPage, imageDbIds, fetchAndSetPageData, isLoading]);

  useEffect(() => {
    const fetchSelectedImageData = async () => {
        if (selectedImageIndex === null || imageDbIds.length === 0) {
            setCurrentFormData(null);
            setCurrentImage(null);
            return;
        }

        const dbId = imageDbIds[selectedImageIndex];
        const [formDataRecord, imageRecord] = await Promise.all([
            db.getFormData(dbId),
            db.getImage(dbId)
        ]);

        if (formDataRecord) setCurrentFormData(formDataRecord.data);
        if (imageRecord) {
            const imageUrl = URL.createObjectURL(imageRecord.file);
            setCurrentImage({ url: imageUrl, name: imageRecord.file.name, file: imageRecord.file });
            
            if (previousImageUrlRef.current) {
              URL.revokeObjectURL(previousImageUrlRef.current);
            }
            previousImageUrlRef.current = imageUrl;
        }
    };
    fetchSelectedImageData();
  }, [selectedImageIndex, imageDbIds]);


  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('appUsers', JSON.stringify(users));
  }, [users, isLoading]);

  // --- Resize Logic ---
  const startResizing = useCallback(() => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newWidth = window.innerWidth - e.clientX - 16;
    if (newWidth > 300 && newWidth < 1200) {
        setRightPanelWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove]);

  useEffect(() => {
      if (!isLoading) {
          localStorage.setItem('rightPanelWidth', rightPanelWidth.toString());
      }
  }, [rightPanelWidth, isLoading]);
  // --------------------

  const handleSchemaSave = (newSchema: FormSchema) => {
    setFormSchema(newSchema);
    const defaultOldPrompt = generateSystemPrompt(formSchema, BASE_SYSTEM_INSTRUCTION);
    if (systemPrompt === defaultOldPrompt) {
        const newPrompt = generateSystemPrompt(newSchema, BASE_SYSTEM_INSTRUCTION);
        setSystemPrompt(newPrompt);
        localStorage.setItem('systemPrompt', newPrompt);
    }
    localStorage.setItem('formSchema', JSON.stringify(newSchema));
    addToast("Form structure saved!", 'success');
  };
  
  const handleApiConfigChange = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    localStorage.setItem('apiConfig', JSON.stringify(newConfig));
  };
  
  const handleSystemPromptChange = (newPrompt: string) => {
    setSystemPrompt(newPrompt);
    localStorage.setItem('systemPrompt', newPrompt);
  };


  const handleImageChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const uniqueFiles = Array.from(files).filter(file => !imageFingerprints.has(createFileFingerprint(file)));
    if (uniqueFiles.length < files.length) {
        addToast(`Some duplicate images were ignored.`, 'error');
    }
    if (uniqueFiles.length === 0) return;
    
    // Initial creation handles metadata enrichment automatically via createInitialFormData -> applySystemRules
    const newInitialData = uniqueFiles.map((file) => createInitialFormData(formSchema, file.name));
    const newFingerprints = uniqueFiles.map(createFileFingerprint);
    
    const newIds = await db.bulkAddImagesAndData(uniqueFiles, newInitialData, newFingerprints);
    
    const firstNewImageIndex = imageCount;
    const newImageDbIds = [...imageDbIds, ...newIds];

    setImageDbIds(newImageDbIds);
    setImageCount(newImageDbIds.length);
    setImageFingerprints(prev => new Set([...prev, ...newFingerprints]));
    setSelectedImageIndex(firstNewImageIndex);
    
    await db.saveImageOrder(newImageDbIds);
    await db.saveSelectedImageIndex(firstNewImageIndex);

    const newPage = Math.floor(firstNewImageIndex / ITEMS_PER_PAGE) + 1;
    setCurrentPage(newPage);
  };

  const handleTriggerUpload = () => fileInputRef.current?.click();

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (selectedImageIndex === null || !currentFormData) return;
    const { name, value } = e.target;
    
    const newStatus = currentFormData.verificationStatus === 'ai-filled' ? 'unverified' : currentFormData.verificationStatus;

    const newData = { ...currentFormData, [name]: value, verificationStatus: newStatus };
    setCurrentFormData(newData);

    const dbId = imageDbIds[selectedImageIndex];
    db.updateFormData(dbId, newData);

    // Update local status for gallery immediately
    if (newStatus !== undefined) {
        setPaginatedImageStatuses(prev => {
            const next = [...prev];
            next[selectedImageIndex % ITEMS_PER_PAGE] = newStatus!;
            return next;
        });
    }
  };
  
  const handleToggleVerified = () => {
    if (selectedImageIndex === null || !currentFormData) return;

    const newStatus = currentFormData.verificationStatus === 'verified' ? 'unverified' : 'verified';
    const newData = { ...currentFormData, verificationStatus: newStatus };
    setCurrentFormData(newData);

    const dbId = imageDbIds[selectedImageIndex];
    db.updateFormData(dbId, newData);
    
    // Update local status for gallery immediately
    setPaginatedImageStatuses(prev => {
        const next = [...prev];
        next[selectedImageIndex % ITEMS_PER_PAGE] = newStatus;
        return next;
    });

    if (newStatus === 'verified') {
        addToast("Marked as Verified.", 'success');
    }
  };

  const handleJsonUpdate = (rawData: KanpoData) => {
    if (selectedImageIndex === null || !currentFormData) return;
    
    // Normalize keys
    const newData = normalizeDataKeys(rawData, formSchema);

    // Apply System Rules (Enforce ID, Date, Source K, Logic, Nulls)
    const enrichedData = applySystemRules(newData, currentImage?.name, formSchema);
    
    const mergedData = { ...currentFormData, ...enrichedData };
    setCurrentFormData(mergedData);

    const dbId = imageDbIds[selectedImageIndex];
    db.updateFormData(dbId, mergedData);

    addToast("Form data updated from JSON. (System Rules Applied)", 'success');
  };

  // Triggered by JSON Editor or Quick Paste
  const handleBulkJsonUpdate = (bulkData: Record<string, KanpoData> | KanpoData[]) => {
      // Normalize all incoming data first
      let dataArray: KanpoData[] = [];
      if (Array.isArray(bulkData)) {
          dataArray = bulkData.map(d => normalizeDataKeys(d, formSchema));
      } else {
          dataArray = Object.values(bulkData).map(d => normalizeDataKeys(d, formSchema));
      }
      
      setPendingBulkPasteData(dataArray);
      setIsBulkPasteModalOpen(true);
  };

  // Confirmed from BulkPasteModal
  const handleConfirmBulkPaste = async (startIndex: number, mapping: { dataIndex: number, imageIndex: number }[]) => {
      const allImages = await db.getAllImages();
      const idToImage = new Map(allImages.map(img => [img.id, img]));
      
      let updatedCount = 0;

      for (const map of mapping) {
          const dbId = imageDbIds[map.imageIndex];
          const record = pendingBulkPasteData[map.dataIndex];
          
          if (dbId !== undefined && record) {
              const existing = await db.getFormData(dbId);
              const image = idToImage.get(dbId);

              if (existing && image) {
                  // Apply System Rules (Enforce ID, Dates, Source K, Logic, Nulls)
                  const enrichedRecord = applySystemRules(record, image.file.name, formSchema);

                  const merged = { 
                      ...existing.data, 
                      ...enrichedRecord, 
                      verificationStatus: 'ai-filled' as const 
                  };

                  await db.updateFormData(dbId, merged);
                  updatedCount++;

                  if (selectedImageIndex !== null && imageDbIds[selectedImageIndex] === dbId) {
                      setCurrentFormData(merged);
                  }
              }
          }
      }

      // Refresh UI
      fetchAndSetPageData(currentPage, imageDbIds);
      setIsBulkPasteModalOpen(false);
      setPendingBulkPasteData([]);
      addToast(`Successfully updated ${updatedCount} images via Bulk Paste. (System Rules Applied)`, 'success');
  };

  const handleQuickPaste = async () => {
    if (!navigator.clipboard?.readText) {
        addToast("Clipboard API not supported in this browser.", 'error');
        return;
    }
    try {
        const text = await navigator.clipboard.readText();
        if (!text) {
            addToast("Clipboard is empty.", 'error');
            return;
        }
        
        // Smart Parse Logic (Clean Markdown, Fix Concatenated JSON)
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
        
        let parsedData: any = null;
        try {
            parsedData = JSON.parse(cleanText);
        } catch (e) {
            try {
                // Attempt to repair concatenated JSON objects (} { -> }, {)
                const repairedText = '[' + cleanText.replace(/}\s*,?\s*{/g, '},{') + ']';
                parsedData = JSON.parse(repairedText);
            } catch (e2) {
                addToast("Invalid JSON in clipboard.", 'error');
                return;
            }
        }

        // Unwrap logic (e.g. { result: [...] })
        if (!Array.isArray(parsedData) && typeof parsedData === 'object' && parsedData !== null) {
            const keys = Object.keys(parsedData);
            if (keys.length === 1 && Array.isArray(parsedData[keys[0]])) {
                parsedData = parsedData[keys[0]];
            }
        }

        // Call Bulk Update
        if (parsedData) {
            const dataToProcess = Array.isArray(parsedData) ? parsedData : [parsedData];
            handleBulkJsonUpdate(dataToProcess);
        }

    } catch (err) {
        console.error(err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
             addToast("Clipboard permission denied.", 'error');
        } else {
             addToast("Failed to read clipboard.", 'error');
        }
    }
  };

  const handleNavigation = useCallback((direction: 'prev' | 'next') => {
    if (selectedImageIndex === null || imageCount === 0) return;

    let newIndex = direction === 'prev' 
      ? (selectedImageIndex > 0 ? selectedImageIndex - 1 : imageCount - 1)
      : (selectedImageIndex < imageCount - 1 ? selectedImageIndex + 1 : 0);
    
    const newPage = Math.floor(newIndex / ITEMS_PER_PAGE) + 1;
    if (newPage !== currentPage) setCurrentPage(newPage);
    
    setSelectedImageIndex(newIndex);
    db.saveSelectedImageIndex(newIndex);
  }, [selectedImageIndex, imageCount, currentPage]);

  // Register Hotkeys
  useHotkeys('Ctrl+Enter', () => handleNavigation('next'));
  useHotkeys('Ctrl+ArrowRight', () => handleNavigation('next'));
  useHotkeys('Ctrl+ArrowLeft', () => handleNavigation('prev'));

  const handleImageSelect = (relativeIndex: number) => {
    const newIndex = ((currentPage - 1) * ITEMS_PER_PAGE) + relativeIndex;
    setSelectedImageIndex(newIndex);
    db.saveSelectedImageIndex(newIndex);
  };

  const handleClear = async () => {
    paginatedImageUrls.forEach(url => URL.revokeObjectURL(url));
    if (previousImageUrlRef.current) URL.revokeObjectURL(previousImageUrlRef.current);
    
    setPaginatedImageUrls([]);
    setPaginatedImageNames([]);
    setPaginatedImageStatuses([]);
    setCurrentFormData(null);
    setCurrentImage(null);
    setImageDbIds([]);
    setImageCount(0);
    setImageFingerprints(new Set());
    setSelectedImageIndex(null);
    setCurrentPage(1);
    
    await db.clearDatabase();

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (jsonInputRef.current) jsonInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  };
  
  const handleConfirmClear = async () => {
    await handleClear();
    setIsClearConfirmOpen(false);
  };
  
  const handleImageReorder = (relativeDragIndex: number, relativeDropIndex: number) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const absoluteDragIndex = startIndex + relativeDragIndex;
    const absoluteDropIndex = startIndex + relativeDropIndex;

    const newImageDbIds = [...imageDbIds];
    const [movedId] = newImageDbIds.splice(absoluteDragIndex, 1);
    newImageDbIds.splice(absoluteDropIndex, 0, movedId);

    setImageDbIds(newImageDbIds);
    
    // Update selected index if the selected image moved
    if (selectedImageIndex === absoluteDragIndex) {
        setSelectedImageIndex(absoluteDropIndex);
        db.saveSelectedImageIndex(absoluteDropIndex);
    } else if (selectedImageIndex !== null) {
       // Adjust selected index if needed
       if (absoluteDragIndex < selectedImageIndex && absoluteDropIndex >= selectedImageIndex) {
           setSelectedImageIndex(selectedImageIndex - 1);
           db.saveSelectedImageIndex(selectedImageIndex - 1);
       } else if (absoluteDragIndex > selectedImageIndex && absoluteDropIndex <= selectedImageIndex) {
           setSelectedImageIndex(selectedImageIndex + 1);
           db.saveSelectedImageIndex(selectedImageIndex + 1);
       }
    }
    
    // Update pagination immediately in memory
    fetchAndSetPageData(currentPage, newImageDbIds);
    db.saveImageOrder(newImageDbIds);
  };
  
  const handleSortByName = async () => {
    const { images } = await db.getRecordsByIds(imageDbIds);
    const sortedImages = images.sort((a, b) => a.file.name.localeCompare(b.file.name));
    const newOrder = sortedImages.map(img => img.id);
    
    setImageDbIds(newOrder);
    // Reset selection to first image after sort
    if (newOrder.length > 0) {
        setSelectedImageIndex(0);
        db.saveSelectedImageIndex(0);
        setCurrentPage(1);
    }
    
    db.saveImageOrder(newOrder);
  };

  const handleExtractAI = async () => {
    if (selectedImageIndex === null || !currentImage) return;
    
    setIsExtracting(true);
    try {
        const base64 = await fileToBase64(currentImage.file);
        const mimeType = getMimeType(currentImage.file);
        
        const extractedData = await extractDataWithAI(base64, mimeType, formSchema, apiConfig, systemPrompt);
        
        // Apply System Rules (Enforce ID, Dates, Source K, Logic, Nulls)
        const enrichedData = applySystemRules(extractedData, currentImage.name, formSchema);

        const mergedData = { ...currentFormData, ...enrichedData, verificationStatus: 'ai-filled' as const };
        setCurrentFormData(mergedData);
        
        const dbId = imageDbIds[selectedImageIndex];
        await db.updateFormData(dbId, mergedData);
        
        // Update local status
        setPaginatedImageStatuses(prev => {
            const next = [...prev];
            next[selectedImageIndex % ITEMS_PER_PAGE] = 'ai-filled';
            return next;
        });

        addToast("Data extracted & System Rules Applied!", 'success');
    } catch (error) {
        console.error(error);
        addToast(error instanceof Error ? error.message : "AI Extraction Failed", 'error');
    } finally {
        setIsExtracting(false);
    }
  };

  const handleLogin = (u: string, p: string) => {
    const user = users.find(user => user.username === u && user.password === p);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    // Close modals
    setIsSettingsOpen(false);
    setIsUserManagementOpen(false);
  };

  const handleExportAndLogout = async () => {
      await handleExportPackage();
      handleLogout();
      setIsLogoutConfirmOpen(false);
  };

  const handleExportCSV = async () => {
    const allData = await db.getAllFormData();
    const headers = getHeadersFromSchema(formSchema);
    
    const allImages = await db.getAllImages();
    const imageMap = new Map(allImages.map(img => [img.id, img.file.name]));

    const fullCsvContent = [
        ['Image Name', 'Verification Status', ...headers].join(','),
        ...allData.map(record => {
            const imageName = imageMap.get(record.id) || 'Unknown';
            const status = record.data.verificationStatus || 'unverified';
            const rowData = headers.map(header => {
                const val = record.data[header] || '';
                const stringVal = String(val).replace(/"/g, '""');
                return `"${stringVal}"`;
            });
            return [`"${imageName}"`, `"${status}"`, ...rowData].join(',');
        })
    ].join('\n');

    const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kanpo_data_${getTodayString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Exported CSV successfully.", 'success');
  };

  const handleExportXLSX = async () => {
    const allData = await db.getAllFormData();
    const allImages = await db.getAllImages();
    const imageMap = new Map(allImages.map(img => [img.id, img.file.name]));
    const headers = getHeadersFromSchema(formSchema);

    const aoaData = [
        ['Image Name', 'Verification Status', ...headers],
        ...allData.map(record => {
            const imageName = imageMap.get(record.id) || 'Unknown';
            const status = record.data.verificationStatus || 'unverified';
            const rowData = headers.map(header => record.data[header] || '');
            return [imageName, status, ...rowData];
        })
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KanpoData");
    XLSX.writeFile(wb, `kanpo_data_${getTodayString()}.xlsx`);
    addToast("Exported Excel successfully.", 'success');
  };
  
  const handleExportSession = async () => {
      const allData = await db.getAllFormData();
      const session = {
          timestamp: Date.now(),
          schema: formSchema,
          data: allData
      };
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanpo_session_${getTodayString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      addToast("Exported Session JSON.", 'success');
  };

  const handleExportPackage = async () => {
      const zip = new JSZip();
      const allImages = await db.getAllImages();
      const allData = await db.getAllFormData();
      const manuals = await db.loadManuals(); // Get manuals
      
      // 1. Add Images folder
      const imgFolder = zip.folder("images");
      allImages.forEach((record) => {
          imgFolder.file(record.file.name, record.file);
      });

      // 2. Add Data JSON
      const dataMap: Record<string, any> = {};
      const imageIdNameMap = new Map(allImages.map(img => [img.id, img.file.name]));
      
      allData.forEach(record => {
          const fileName = imageIdNameMap.get(record.id);
          if (fileName) {
              dataMap[fileName] = record.data;
          }
      });
      
      zip.file("data.json", JSON.stringify(dataMap, null, 2));

      // 3. Add Schema
      zip.file("schema.json", JSON.stringify(formSchema, null, 2));
      
      // 4. Add Users
      zip.file("users.json", JSON.stringify(users, null, 2));

      // 5. Add System Prompt
      zip.file("system_prompt.txt", systemPrompt);
      
      // 6. Add Reference Manuals
      if (manuals && manuals.length > 0) {
          zip.file("manuals.json", JSON.stringify(manuals, null, 2));
      }

      // Generate Zip
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kanpo_package_${getTodayString()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      addToast("Exported Full Package successfully.", 'success');
  };
  
  const handleImportPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsLoading(true);
      try {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(file);
          
          const schemaFile = loadedZip.file("schema.json");
          if (schemaFile) {
              const schemaText = await schemaFile.async("string");
              const importedSchema = JSON.parse(schemaText);
              setFormSchema(importedSchema);
              localStorage.setItem('formSchema', schemaText);
          }

          const usersFile = loadedZip.file("users.json");
          if (usersFile) {
              const usersText = await usersFile.async("string");
              const importedUsers = JSON.parse(usersText);
              setUsers(importedUsers);
          }
          
          const promptFile = loadedZip.file("system_prompt.txt");
          if (promptFile) {
              const promptText = await promptFile.async("string");
              setSystemPrompt(promptText);
              localStorage.setItem('systemPrompt', promptText);
          }
          
          const manualsFile = loadedZip.file("manuals.json");
          if (manualsFile) {
              const manualsText = await manualsFile.async("string");
              const importedManuals = JSON.parse(manualsText);
              await db.saveManuals(importedManuals);
          }

          const dataFile = loadedZip.file("data.json");
          let importedDataMap: Record<string, any> = {};
          if (dataFile) {
              const dataText = await dataFile.async("string");
              importedDataMap = JSON.parse(dataText);
          }

          const imgFolder = loadedZip.folder("images");
          const newFiles: File[] = [];
          const newData: KanpoData[] = [];
          const newFingerprints: string[] = [];
          
          if (imgFolder) {
              const filePromises: Promise<void>[] = [];
              imgFolder.forEach((relativePath: string, fileEntry: any) => {
                  filePromises.push((async () => {
                      const blob = await fileEntry.async("blob");
                      const file = new File([blob], relativePath, { type: "image/jpeg" });
                      newFiles.push(file);
                      newFingerprints.push(createFileFingerprint(file));

                      if (importedDataMap[relativePath]) {
                          // Ensure page number is present even in imported data if missing
                          if (!importedDataMap[relativePath]['掲載ページ']) {
                              importedDataMap[relativePath]['掲載ページ'] = extractPageNumberFromFilename(file.name);
                          }
                          newData.push(importedDataMap[relativePath]);
                      } else {
                          newData.push(createInitialFormData(formSchema, file.name));
                      }
                  })());
              });
              await Promise.all(filePromises);
          }

          if (newFiles.length > 0) {
             await handleClear(); 
             const newIds = await db.bulkAddImagesAndData(newFiles, newData, newFingerprints);
             setImageDbIds(newIds);
             setImageCount(newIds.length);
             setImageFingerprints(new Set(newFingerprints));
             setSelectedImageIndex(0);
             
             await db.saveImageOrder(newIds);
             await db.saveSelectedImageIndex(0);
             setCurrentPage(1);
             fetchAndSetPageData(1, newIds);
          }

          addToast("Package imported successfully!", 'success');

      } catch (error) {
          console.error("Import failed", error);
          addToast("Failed to import package. Invalid format.", 'error');
      } finally {
          setIsLoading(false);
          if (zipInputRef.current) zipInputRef.current.value = '';
      }
  };

  const handleTriggerImportPackage = () => zipInputRef.current?.click();

  const handleBulkClick = async () => {
    if (isBulkProcessing) {
        if (isBulkProcessingRef.current) {
            isBulkProcessingRef.current = false;
            setIsBulkProcessing(false);
        }
    } else {
        if (imageDbIds.length === 0) {
             addToast("No images to process.", "error");
             return;
        }
        
        const allData = await db.getAllFormData();
        const unverifiedCount = allData.filter(r => r.data.verificationStatus !== 'verified').length;
        
        if (unverifiedCount === 0) {
             addToast("All images are verified. Nothing to extract.", "success");
             return;
        }

        setTotalUnverifiedCount(unverifiedCount);
        setBulkLimit(unverifiedCount);
        setIsBulkConfirmOpen(true);
    }
  };

  const handleConfirmBulkExtract = async () => {
    setIsBulkConfirmOpen(false);
    
    if (isBulkProcessingRef.current) return;
    
    isBulkProcessingRef.current = true;
    setIsBulkProcessing(true);
    
    const allDataRecords = await db.getAllFormData();
    const idToStatus = new Map(allDataRecords.map(r => [r.id, r.data.verificationStatus]));
    
    const candidates = imageDbIds.filter(id => idToStatus.get(id) !== 'verified');
    const targetIds = candidates.slice(0, bulkLimit);

    setBulkProgress({ current: 0, total: targetIds.length });

    let processedCount = 0;
    
    for (const id of targetIds) {
        if (!isBulkProcessingRef.current) break;

        try {
            const imageRecord = await db.getImage(id);
            const formDataRecord = await db.getFormData(id);
            
            if (imageRecord && formDataRecord) {
                const base64 = await fileToBase64(imageRecord.file);
                const mimeType = getMimeType(imageRecord.file);
                const extractedData = await extractDataWithAI(base64, mimeType, formSchema, apiConfig, systemPrompt);
                
                // Apply System Rules
                const enrichedData = applySystemRules(extractedData, imageRecord.file.name, formSchema);

                const mergedData = { ...formDataRecord.data, ...enrichedData, verificationStatus: 'ai-filled' as const };
                await db.updateFormData(id, mergedData);
            }
        } catch (e) {
            console.error(`Failed to extract for image ${id}`, e);
        }
        processedCount++;
        setBulkProgress(prev => ({ ...prev, current: processedCount }));
        
        await new Promise(r => setTimeout(r, 1000));
    }

    setIsBulkProcessing(false);
    isBulkProcessingRef.current = false;
    
    // Refresh visual status
    fetchAndSetPageData(currentPage, imageDbIds);
    
    addToast(`Bulk extraction completed. Processed ${processedCount} images.`, 'success');
    
    if (selectedImageIndex !== null) {
        const dbId = imageDbIds[selectedImageIndex];
        const updated = await db.getFormData(dbId);
        if (updated) setCurrentFormData(updated.data);
    }
  };
  
  const handleGoToGemini = () => {
    window.open('https://gemini.google.com/gem/1vjrW_4vqptJpqssSy7MAVTyjjbgskYw9?usp=sharing', '_blank');
  };

  const handleUpdateUserRole = (userId: number, role: UserRole) => {
      const updatedUsers = users.map(u => u.id === userId ? { ...u, role } : u);
      setUsers(updatedUsers);
      
      if (currentUser && currentUser.id === userId) {
          const updatedCurrent = { ...currentUser, role };
          setCurrentUser(updatedCurrent);
          localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));
      }
  };
  
  const handleCreateUser = (newUser: Omit<User, 'id'>) => {
      if (users.some(u => u.username === newUser.username)) {
          addToast("Username already exists.", "error");
          return false;
      }
      const id = Math.max(...users.map(u => u.id), 0) + 1;
      const createdUser = { ...newUser, id };
      setUsers([...users, createdUser]);
      addToast("User created successfully.", "success");
      return true;
  };

  const handleDeleteUser = (userId: number) => {
      setUsers(users.filter(u => u.id !== userId));
      addToast("User deleted.", "success");
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentSchema={formSchema}
        onSave={handleSchemaSave}
        apiConfig={apiConfig}
        onApiConfigChange={handleApiConfigChange}
        systemPrompt={systemPrompt}
        onSystemPromptChange={handleSystemPromptChange}
      />

      {isBulkPasteModalOpen && (
          <BulkPasteModal
              isOpen={isBulkPasteModalOpen}
              onClose={() => {
                  setIsBulkPasteModalOpen(false);
                  setPendingBulkPasteData([]);
              }}
              onConfirm={handleConfirmBulkPaste}
              jsonData={pendingBulkPasteData}
              startIndex={selectedImageIndex ?? 0}
              totalImages={imageCount}
              getImageName={async (index) => {
                  if (index >= imageDbIds.length) return "Unknown";
                  const rec = await db.getImage(imageDbIds[index]);
                  return rec ? rec.file.name : "Unknown";
              }}
          />
      )}

      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear All Data"
      >
        Are you sure you want to clear all images and data? This action cannot be undone.
      </ConfirmationModal>
      
      <ConfirmationModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleConfirmBulkExtract}
        title="Start Bulk Extraction"
      >
        <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
                You are about to start automated data extraction.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                    Processing Limit (API Credit Safety)
                </label>
                <div className="flex items-center">
                    <input 
                        type="number" 
                        min="1" 
                        max={totalUnverifiedCount}
                        value={bulkLimit}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) setBulkLimit(val);
                        }}
                        className="block w-24 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-semibold dark:text-white"
                    />
                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                        of <span className="font-bold text-gray-900 dark:text-white">{totalUnverifiedCount}</span> unverified images
                    </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    The extraction will stop automatically after processing this number of images.
                </p>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-100 dark:border-yellow-900/30">
                <ul className="list-disc pl-4 space-y-1">
                    <li>Costs API credits per image.</li>
                    <li>Overwrites existing data for unverified images.</li>
                    <li>Process takes ~2-5 seconds per image.</li>
                </ul>
            </div>
        </div>
      </ConfirmationModal>

      <LogoutConfirmationModal 
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onExportAndLogout={handleExportAndLogout}
        onLogoutAnyway={handleLogout}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={users}
        currentUser={currentUser}
        onUpdateUserRole={handleUpdateUserRole}
        onCreateUser={handleCreateUser}
        onDeleteUser={handleDeleteUser}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        userRole={currentUser.role}
        systemPrompt={systemPrompt}
        onSystemPromptChange={handleSystemPromptChange}
        formSchema={formSchema}
      />

      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-20 flex-shrink-0 relative">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white hidden sm:block">Kanpo Manual Data Extractor</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                <span className="font-medium mr-2">{currentUser.name}</span>
                <span className={`text-xs uppercase px-1.5 py-0.5 rounded ${currentUser.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                    {currentUser.role}
                </span>
            </div>
            
            <button 
                onClick={() => setIsAboutModalOpen(true)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="About & Help"
            >
                <InfoIcon className="h-6 w-6" />
            </button>
            
            {currentUser.role === 'admin' && (
                <>
                    <button 
                        onClick={() => setIsUserManagementOpen(true)}
                        className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Manage Users"
                    >
                        <UsersIcon className="h-6 w-6" />
                    </button>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Settings"
                    >
                        <SettingsIcon className="h-6 w-6" />
                    </button>
                </>
            )}
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
            
            <button 
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="p-2 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Logout"
            >
                <LogOutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative p-4 gap-4">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            
            {/* Workspace Toolbar */}
            <div className="bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 z-10 shrink-0">
                <div className="flex items-center space-x-2 overflow-x-auto">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap px-2">
                        Images ({imageCount})
                    </span>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                    <button 
                        onClick={handleTriggerUpload}
                        className="flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none shadow-sm transition-colors whitespace-nowrap"
                    >
                        <UploadIcon className="h-3.5 w-3.5 mr-1.5" /> Add Images
                    </button>
                    <button 
                        onClick={handleTriggerImportPackage}
                        className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none shadow-sm transition-colors whitespace-nowrap"
                    >
                        <PackageIcon className="h-3.5 w-3.5 mr-1.5" /> Import Zip
                    </button>
                    <button 
                        onClick={handleQuickPaste}
                        className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none shadow-sm transition-colors whitespace-nowrap"
                        title="Paste JSON data from clipboard directly to selected images"
                    >
                        <PasteIcon className="h-3.5 w-3.5 mr-1.5" /> Paste JSON
                    </button>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => handleImageChange(e.target.files)} 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <input 
                        type="file" 
                        ref={zipInputRef} 
                        onChange={handleImportPackage} 
                        accept=".zip" 
                        className="hidden" 
                    />
                </div>

                <div className="flex items-center space-x-2 ml-auto">
                    {paginatedImageUrls.length > 1 && (
                         <button onClick={handleSortByName} className="flex items-center text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300 transition-colors whitespace-nowrap">
                            <SortAscIcon className="h-3.5 w-3.5 mr-1.5"/> Sort
                        </button>
                    )}

                    {imageCount > 0 && (
                        <>
                             <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                             
                             <button
                                onClick={handleBulkClick}
                                className={`flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded border transition-colors whitespace-nowrap shadow-sm ${
                                    isBulkProcessing 
                                    ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700'
                                    : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                                }`}
                            >
                                {isBulkProcessing ? (
                                    <>
                                        <StopIcon className="h-3.5 w-3.5 mr-1.5" /> Stop Bulk ({bulkProgress.current}/{bulkProgress.total})
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-3.5 w-3.5 mr-1.5" /> Run Bulk Extraction
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setIsClearConfirmOpen(true)}
                                className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-900"
                                title="Clear All"
                            >
                                <ClearIcon className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Image View */}
            <div className="flex-1 relative bg-gray-200 dark:bg-gray-900 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-hidden flex flex-col justify-center relative z-0">
                    <MainImageViewer 
                        imageUrl={currentImage?.url || null}
                        imageName={currentImage?.name}
                        selectedIndex={selectedImageIndex}
                        imageCount={imageCount}
                        onNavigate={handleNavigation}
                    />
                </div>
                
                {selectedImageIndex !== null && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                         <button
                            onClick={handleExtractAI}
                            disabled={isExtracting}
                            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {isExtracting ? <Spinner /> : <SparklesIcon className="h-4 w-4 mr-2" />}
                            {isExtracting ? 'Extracting...' : 'Auto-fill with AI'}
                        </button>
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                         <button
                            onClick={() => setIsRulesModalOpen(true)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <BookIcon className="h-4 w-4 mr-2" />
                            Reference Guide
                        </button>
                        
                        <div className="hidden md:block pl-2 text-xs text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600">
                             {apiConfig.provider === 'ollama' 
                                ? `Model: ${apiConfig.ollamaModel || 'Local'}` 
                                : `${apiConfig.model}`
                             }
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Gallery Strip */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col shrink-0 z-10 transition-all duration-300">
                 <button 
                    onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                    className="w-full flex items-center justify-center py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none border-b border-gray-100 dark:border-gray-700"
                    title={isGalleryOpen ? "Collapse Gallery" : "Expand Gallery"}
                 >
                    {isGalleryOpen ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    )}
                 </button>

                 <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isGalleryOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                     <div className="p-2 pb-0">
                        <ImageGallery 
                            imageUrls={paginatedImageUrls}
                            imageNames={paginatedImageNames}
                            imageStatuses={paginatedImageStatuses}
                            selectedIndex={selectedImageIndex !== null ? selectedImageIndex % ITEMS_PER_PAGE : null}
                            onImageSelect={handleImageSelect}
                            onReorder={handleImageReorder}
                            onSortByName={handleSortByName}
                            showSortButton={false} 
                        />
                     </div>
                 </div>

                 <div className="px-2 pb-1 pt-1">
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={Math.ceil(imageCount / ITEMS_PER_PAGE) || 1}
                        onPageChange={setCurrentPage}
                    />
                 </div>
            </div>

        </div>

        {/* Split Pane Resizer */}
        <div 
            className="w-3 cursor-col-resize flex flex-col items-center justify-center hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors rounded flex-shrink-0 group select-none"
            onMouseDown={startResizing}
            title="Drag to resize"
        >
             <div className="w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-indigo-400 transition-colors" />
        </div>

        {/* Right Column: Data Entry Form */}
        <div style={{ width: rightPanelWidth }} className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col z-20 overflow-hidden">
           <div className="flex border-b border-gray-200 dark:border-gray-700">
               <button 
                  className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors focus:outline-none ${activeRightTab === 'form' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  onClick={() => setActiveRightTab('form')}
               >
                   Data Entry Form
               </button>
               <button 
                  className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors focus:outline-none ${activeRightTab === 'json' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  onClick={() => setActiveRightTab('json')}
               >
                   Raw JSON
               </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
              {selectedImageIndex !== null && currentFormData ? (
                activeRightTab === 'form' ? (
                    <KanpoForm 
                        formData={currentFormData} 
                        onFormChange={handleFormChange} 
                        onToggleVerified={handleToggleVerified}
                        schema={formSchema}
                    />
                ) : (
                    <JsonEditor 
                        jsonData={currentFormData}
                        onJsonChange={handleJsonUpdate}
                        onBulkJsonChange={handleBulkJsonUpdate}
                        addToast={addToast}
                    />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 space-y-4">
                    <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                        <UploadIcon className="h-12 w-12 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">No Image Selected</p>
                    <p className="text-sm max-w-xs text-center">Upload images using the toolbar on the left to get started.</p>
                </div>
              )}
           </div>

            {/* Action Bar */}
           <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                <button
                    onClick={handleGoToGemini}
                    className="p-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
                    title="Open Custom Gemini Gem"
                >
                     <GeminiGemIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </button>
                <button
                    onClick={() => handleNavigation('prev')}
                    disabled={!imageCount}
                    className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center justify-center">
                        <ChevronLeftIcon className="h-4 w-4 mr-2"/>
                        Previous
                    </div>
                </button>
                
                <button
                    onClick={() => handleNavigation('next')}
                    disabled={!imageCount}
                    className="flex-[2] py-2.5 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <div className="flex items-center justify-center">
                        Save & Next Image
                        <ChevronRightIcon className="h-4 w-4 ml-2"/>
                    </div>
                </button>
           </div>
           
           <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
             <ExportButton 
                disabled={imageCount === 0}
                onExportCSV={handleExportCSV}
                onExportXLSX={handleExportXLSX}
                onExportSession={handleExportSession}
                onExportPackage={handleExportPackage}
             />
           </div>
        </div>
      </div>
    </div>
  );
}
