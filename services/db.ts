
import { KanpoData } from '../types';

const DB_NAME = 'KanpoExtractorDB';
const DB_VERSION = 1;

const IMAGE_STORE = 'images';
const FORMDATA_STORE = 'formData';
const APPSTATE_STORE = 'appState';

export interface ImageRecord {
    id: number;
    file: File;
}

export interface FormDataRecord {
    id: number;
    data: KanpoData;
}

interface AppStateRecord {
    key: string;
    value: any;
}

export interface Manual {
    id: string;
    name: string;
    content: string; // HTML string OR URL
    type?: 'html' | 'url'; // Defaults to 'html' if undefined
    uploadedAt: number;
}

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(IMAGE_STORE)) {
                dbInstance.createObjectStore(IMAGE_STORE, { keyPath: 'id', autoIncrement: true });
            }
            if (!dbInstance.objectStoreNames.contains(FORMDATA_STORE)) {
                dbInstance.createObjectStore(FORMDATA_STORE, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(APPSTATE_STORE)) {
                dbInstance.createObjectStore(APPSTATE_STORE, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
            reject("Error opening database.");
        };
    });
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}


export async function bulkAddImagesAndData(files: File[], formDatas: KanpoData[], fingerprints: string[]): Promise<number[]> {
    const db = await openDB();
    const tx = db.transaction([IMAGE_STORE, FORMDATA_STORE, APPSTATE_STORE], 'readwrite');
    const imageStore = tx.objectStore(IMAGE_STORE);
    const formDataStore = tx.objectStore(FORMDATA_STORE);
    const appStateStore = tx.objectStore(APPSTATE_STORE);
    const ids: number[] = [];

    for (let i = 0; i < files.length; i++) {
        const imageId = await promisifyRequest(imageStore.add({ file: files[i] }));
        ids.push(imageId as number);
        // Ensure new records start as unverified
        const initialData = { ...formDatas[i], verificationStatus: 'unverified' };
        await promisifyRequest(formDataStore.add({ id: imageId, data: initialData }));
    }
    
    const [orderRecord, fingerprintsRecord] = await Promise.all([
        promisifyRequest(appStateStore.get('imageOrder')),
        promisifyRequest(appStateStore.get('fingerprints'))
    ]);

    const order: number[] = orderRecord?.value || [];
    const newOrder = order.concat(ids);
    await promisifyRequest(appStateStore.put({ key: 'imageOrder', value: newOrder }));

    const existingFingerprints: string[] = fingerprintsRecord?.value || [];
    const newFingerprints = [...existingFingerprints, ...fingerprints];
    await promisifyRequest(appStateStore.put({ key: 'fingerprints', value: newFingerprints }));
    
    return ids;
}

export async function updateFormData(id: number, data: KanpoData): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(FORMDATA_STORE, 'readwrite');
    await promisifyRequest(tx.objectStore(FORMDATA_STORE).put({ id, data }));
}

export async function getAllImages(): Promise<ImageRecord[]> {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readonly');
    return await promisifyRequest(tx.objectStore(IMAGE_STORE).getAll());
}

export async function getImage(id: number): Promise<ImageRecord | undefined> {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readonly');
    return await promisifyRequest(tx.objectStore(IMAGE_STORE).get(id));
}

export async function getAllFormData(): Promise<FormDataRecord[]> {
    const db = await openDB();
    const tx = db.transaction(FORMDATA_STORE, 'readonly');
    return await promisifyRequest(tx.objectStore(FORMDATA_STORE).getAll());
}

export async function getFormData(id: number): Promise<FormDataRecord | undefined> {
    const db = await openDB();
    const tx = db.transaction(FORMDATA_STORE, 'readonly');
    return await promisifyRequest(tx.objectStore(FORMDATA_STORE).get(id));
}

export async function getRecordsByIds(ids: number[]): Promise<{ images: ImageRecord[], formData: FormDataRecord[] }> {
    const db = await openDB();
    const tx = db.transaction([IMAGE_STORE, FORMDATA_STORE], 'readonly');
    const imageStore = tx.objectStore(IMAGE_STORE);
    const formDataStore = tx.objectStore(FORMDATA_STORE);

    const imagePromises = ids.map(id => promisifyRequest(imageStore.get(id)));
    const formDataPromises = ids.map(id => promisifyRequest(formDataStore.get(id)));

    const images = (await Promise.all(imagePromises)).filter(Boolean) as ImageRecord[];
    const formData = (await Promise.all(formDataPromises)).filter(Boolean) as FormDataRecord[];

    return { images, formData };
}

async function getAppState(key: string): Promise<any> {
    const db = await openDB();
    const tx = db.transaction(APPSTATE_STORE, 'readonly');
    const record = await promisifyRequest(tx.objectStore(APPSTATE_STORE).get(key));
    return record ? record.value : undefined;
}

async function setAppState(key: string, value: any): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(APPSTATE_STORE, 'readwrite');
    await promisifyRequest(tx.objectStore(APPSTATE_STORE).put({ key, value }));
}

export const saveImageOrder = (order: number[]) => setAppState('imageOrder', order);
export const saveSelectedImageIndex = (index: number) => setAppState('selectedImageIndex', index);

// Manuals are now stored as an array
export const saveManuals = (manuals: Manual[]) => setAppState('manuals', manuals);
export const loadManuals = async (): Promise<Manual[]> => {
    const data = await getAppState('manuals');
    return Array.isArray(data) ? data : [];
};


export async function clearDatabase(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction([IMAGE_STORE, FORMDATA_STORE, APPSTATE_STORE], 'readwrite');
    await promisifyRequest(tx.objectStore(IMAGE_STORE).clear());
    await promisifyRequest(tx.objectStore(FORMDATA_STORE).clear());
    await promisifyRequest(tx.objectStore(APPSTATE_STORE).clear());
}

export async function loadSession(): Promise<{
    imageOrder: number[],
    selectedImageIndex: number,
    imageCount: number,
    fingerprints: string[]
}> {
    const [imageOrder, selectedImageIndex, fingerprints] = await Promise.all([
        getAppState('imageOrder'),
        getAppState('selectedImageIndex'),
        getAppState('fingerprints')
    ]);

    const validatedImageOrder: number[] = Array.isArray(imageOrder) ? imageOrder.filter((id): id is number => typeof id === 'number') : [];

    return {
        imageOrder: validatedImageOrder,
        selectedImageIndex: selectedImageIndex ?? 0,
        imageCount: validatedImageOrder.length,
        fingerprints: fingerprints || [],
    };
}
