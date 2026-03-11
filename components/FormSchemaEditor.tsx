
import React, { useState, useRef } from 'react';
import { FormSchema, FieldSetSchema, FormFieldSchema, SelectOption } from '../types';
import { PlusIcon, TrashIcon, DownloadIcon, ImportIcon, GripVerticalIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface FormSchemaEditorProps {
    schema: FormSchema;
    setSchema: (schema: FormSchema) => void;
}

type DraggedItem = {
    type: 'field' | 'fieldset';
    fsIndex: number;
    fIndex?: number;
} | null;

type DropIndicator = {
    fsIndex: number;
    fIndex?: number;
    position: 'top' | 'bottom';
} | null;

const DropIndicatorLine: React.FC = () => (
    <div className="h-1 my-1 bg-indigo-500 rounded-full" />
);

const EmptySectionDropzone: React.FC = () => (
    <div className="h-16 bg-indigo-100 dark:bg-indigo-900/30 border-2 border-dashed border-indigo-400 rounded-lg my-2 flex items-center justify-center text-sm text-indigo-500">
        <p>Drop field here</p>
    </div>
);


const FormSchemaEditor: React.FC<FormSchemaEditorProps> = ({ schema, setSchema }) => {
    
    const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
    const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
    const [highlightedFsIndex, setHighlightedFsIndex] = useState<number | null>(null);
    const draggedNode = useRef<HTMLElement | null>(null);
    const [pendingDelete, setPendingDelete] = useState<{ type: 'fieldset' | 'field', fsIndex: number, fIndex?: number } | null>(null);

    const handleUpdateField = (fieldsetIndex: number, fieldIndex: number, updatedField: FormFieldSchema) => {
        const newSchema = JSON.parse(JSON.stringify(schema));
        const oldField = newSchema[fieldsetIndex].fields[fieldIndex];

        // If type changes to 'select' and there are no options, initialize them
        if (updatedField.type === 'select' && !Array.isArray(updatedField.options)) {
            updatedField.options = [];
        }
        // If type changes away from 'select', remove options property for cleanliness
        if (oldField.type === 'select' && updatedField.type !== 'select') {
            delete updatedField.options;
        }

        newSchema[fieldsetIndex].fields[fieldIndex] = updatedField;
        setSchema(newSchema);
    };

    const handleAddField = (fieldsetIndex: number) => {
        const newSchema = [...schema];
        newSchema[fieldsetIndex].fields.push({
            id: `id_${Date.now()}`,
            name: `new_field_${Date.now()}`,
            label: 'New Field',
            englishLabel: '',
            type: 'text',
            width: 'half',
        });
        setSchema(newSchema);
    };

    const handleConfirmDelete = () => {
        if (!pendingDelete) return;

        const { type, fsIndex, fIndex } = pendingDelete;
        const newSchema = JSON.parse(JSON.stringify(schema));

        if (type === 'fieldset') {
            newSchema.splice(fsIndex, 1);
        } else if (type === 'field' && typeof fIndex === 'number') {
            newSchema[fsIndex].fields.splice(fIndex, 1);
        }

        setSchema(newSchema);
        setPendingDelete(null);
    };
    
    const handleUpdateLegend = (fieldsetIndex: number, legend: string) => {
        const newSchema = [...schema];
        newSchema[fieldsetIndex].legend = legend;
        setSchema(newSchema);
    };

    const handleAddFieldset = () => {
        setSchema([...schema, {
            id: `id_${Date.now()}`,
            legend: 'New Section',
            fields: []
        }]);
    };

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === schema.length - 1)) {
            return;
        }
        const newSchema = [...schema];
        const [movedSection] = newSchema.splice(index, 1);
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newSchema.splice(newIndex, 0, movedSection);
        setSchema(newSchema);
    };

    const handleMoveField = (fsIndex: number, fIndex: number, direction: 'up' | 'down') => {
        const fields = schema[fsIndex].fields;
        if ((direction === 'up' && fIndex === 0) || (direction === 'down' && fIndex === fields.length - 1)) {
            return;
        }
        const newSchema = JSON.parse(JSON.stringify(schema));
        const [movedField] = newSchema[fsIndex].fields.splice(fIndex, 1);
        const newIndex = direction === 'up' ? fIndex - 1 : fIndex + 1;
        newSchema[fsIndex].fields.splice(newIndex, 0, movedField);
        setSchema(newSchema);
    };

    const handleAddOption = (fsIndex: number, fIndex: number) => {
        const newSchema = JSON.parse(JSON.stringify(schema));
        const field = newSchema[fsIndex].fields[fIndex];
        if (!Array.isArray(field.options)) {
            field.options = [];
        }
        field.options.push({ value: `value_${Date.now()}`, label: 'New Option' });
        setSchema(newSchema);
    };

    const handleDeleteOption = (fsIndex: number, fIndex: number, oIndex: number) => {
        const newSchema = JSON.parse(JSON.stringify(schema));
        newSchema[fsIndex].fields[fIndex].options.splice(oIndex, 1);
        setSchema(newSchema);
    };

    const handleUpdateOption = (fsIndex: number, fIndex: number, oIndex: number, key: keyof SelectOption, newValue: string) => {
        const newSchema = JSON.parse(JSON.stringify(schema));
        newSchema[fsIndex].fields[fIndex].options[oIndex][key] = newValue;
        setSchema(newSchema);
    };


    const handleDragStart = (e: React.DragEvent, type: 'field' | 'fieldset', fsIndex: number, fIndex?: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        
        const node = e.currentTarget.closest('.field-editor-item, .fieldset-editor-item');
        if (node) {
            draggedNode.current = node as HTMLElement;
            setTimeout(() => {
                if (draggedNode.current) {
                    draggedNode.current.classList.add('dragging-item');
                }
            }, 0);
        }

        setDraggedItem({ type, fsIndex, fIndex });
    };

    const handleDragOver = (e: React.DragEvent, fsIndex: number, fIndex?: number) => {
        e.preventDefault();
        if (!draggedItem) return;

        setHighlightedFsIndex(fsIndex);
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const isOverTopHalf = e.clientY < rect.top + rect.height / 2;

        if (draggedItem.type === 'field') {
            setDropIndicator({ fsIndex, fIndex, position: isOverTopHalf ? 'top' : 'bottom' });
        } else if (draggedItem.type === 'fieldset' && fIndex === undefined) {
             setDropIndicator({ fsIndex, position: isOverTopHalf ? 'top' : 'bottom' });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedItem || !dropIndicator) return;
        
        const newSchema = JSON.parse(JSON.stringify(schema));

        if (draggedItem.type === 'fieldset') {
            const { fsIndex: sourceFsIndex } = draggedItem;
            let { fsIndex: targetFsIndex, position } = dropIndicator;
            
            const [movedItem] = newSchema.splice(sourceFsIndex, 1);

            let dropIndex = targetFsIndex;
            if (position === 'bottom') dropIndex++;
            if (sourceFsIndex < dropIndex) dropIndex--;

            newSchema.splice(dropIndex, 0, movedItem);

        } else if (draggedItem.type === 'field') {
            const { fsIndex: sourceFsIndex, fIndex: sourceFIndex } = draggedItem;
            const { fsIndex: targetFsIndex, fIndex: targetFIndex, position } = dropIndicator;
            
            const [movedItem] = newSchema[sourceFsIndex].fields.splice(sourceFIndex!, 1);
            
            if (targetFIndex === undefined) {
                 newSchema[targetFsIndex].fields.push(movedItem);
            } else {
                let dropIndex = targetFIndex!;
                if (position === 'bottom') dropIndex++;
                if (sourceFsIndex === targetFsIndex && sourceFIndex! < dropIndex) dropIndex--;
                newSchema[targetFsIndex].fields.splice(dropIndex, 0, movedItem);
            }
        }
        setSchema(newSchema);
    };

    const handleDragEnd = () => {
        if (draggedNode.current) {
            draggedNode.current.classList.remove('dragging-item');
        }
        setDraggedItem(null);
        setDropIndicator(null);
        setHighlightedFsIndex(null);
        draggedNode.current = null;
    };
    
    return (
        <div className="space-y-6" onDrop={handleDrop} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setHighlightedFsIndex(null)}>
            {pendingDelete && (
                <ConfirmationModal
                    isOpen={!!pendingDelete}
                    onClose={() => setPendingDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                >
                    {pendingDelete.type === 'fieldset'
                        ? 'Are you sure you want to delete this entire section and all its fields? This action cannot be undone.'
                        : 'Are you sure you want to delete this field? This action cannot be undone.'}
                </ConfirmationModal>
            )}

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Form Structure Editor</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 -mt-2">
                Use the arrows for precise reordering, or drag and drop for larger moves.
            </p>
            
            <div className="space-y-6">
                 {schema.map((fieldset, fsIndex) => {
                    const showTopSectionIndicator = dropIndicator?.fsIndex === fsIndex && dropIndicator.position === 'top' && dropIndicator.fIndex === undefined;
                    const showBottomSectionIndicator = dropIndicator?.fsIndex === fsIndex && dropIndicator.position === 'bottom' && dropIndicator.fIndex === undefined;
                    const isSectionHighlighted = highlightedFsIndex === fsIndex && draggedItem?.type === 'field';

                    return (
                        <React.Fragment key={fieldset.id}>
                            {showTopSectionIndicator && <DropIndicatorLine />}
                            <fieldset
                                className={`fieldset-editor-item border p-4 rounded-md space-y-4 transition-all duration-200 ${
                                    isSectionHighlighted
                                    ? 'border-indigo-400 bg-indigo-50 dark:bg-gray-700/50 ring-2 ring-indigo-400'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}
                                onDragOver={(e) => handleDragOver(e, fsIndex)}
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'fieldset', fsIndex)}
                                        className="flex items-center gap-2 cursor-grab active:cursor-grabbing flex-grow"
                                    >
                                        <GripVerticalIcon className="h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={fieldset.legend}
                                            onChange={(e) => handleUpdateLegend(fsIndex, e.target.value)}
                                            className="text-lg font-semibold bg-transparent border-b border-transparent focus:border-gray-300 dark:focus:border-gray-500 focus:outline-none text-gray-800 dark:text-gray-200 w-full"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <div className="flex flex-col bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm">
                                            <button onClick={() => handleMoveSection(fsIndex, 'up')} disabled={fsIndex === 0} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md disabled:opacity-30 disabled:cursor-not-allowed border-b border-gray-300 dark:border-gray-600" title="Move section up">
                                                <ChevronUpIcon className="h-5 w-5"/>
                                            </button>
                                            <button onClick={() => handleMoveSection(fsIndex, 'down')} disabled={fsIndex === schema.length - 1} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-md disabled:opacity-30 disabled:cursor-not-allowed" title="Move section down">
                                                <ChevronDownIcon className="h-5 w-5"/>
                                            </button>
                                        </div>
                                        <button onClick={() => setPendingDelete({ type: 'fieldset', fsIndex })} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md" title="Delete section"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    {fieldset.fields.map((field, fIndex) => {
                                        const showTopFieldIndicator = dropIndicator?.fsIndex === fsIndex && dropIndicator?.fIndex === fIndex && dropIndicator?.position === 'top';
                                        return (
                                            <React.Fragment key={field.id}>
                                                {showTopFieldIndicator && <DropIndicatorLine />}
                                                <div
                                                    className="field-editor-item p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md transition-all"
                                                    onDragOver={(e) => handleDragOver(e, fsIndex, fIndex)}
                                                >
                                                    <div className="flex items-start gap-x-2">
                                                        <div 
                                                            className="flex-shrink-0 pt-6 cursor-grab active:cursor-grabbing"
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, 'field', fsIndex, fIndex)}
                                                        >
                                                            <GripVerticalIcon className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        
                                                        <div className="flex-grow grid grid-cols-12 gap-x-4 gap-y-2 items-center">
                                                            <div className="col-span-12 sm:col-span-3 space-y-1">
                                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Label (JP)</label>
                                                                <input type="text" value={field.label} onChange={e => handleUpdateField(fsIndex, fIndex, {...field, label: e.target.value})} className="w-full form-input"/>
                                                            </div>
                                                            <div className="col-span-12 sm:col-span-3 space-y-1">
                                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Label (EN) - Optional</label>
                                                                <input type="text" value={field.englishLabel || ''} onChange={e => handleUpdateField(fsIndex, fIndex, {...field, englishLabel: e.target.value})} className="w-full form-input" placeholder="e.g. Publication Date"/>
                                                            </div>
                                                            <div className="col-span-12 sm:col-span-2 space-y-1">
                                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Key (DB)</label>
                                                                <input type="text" value={field.name} onChange={e => handleUpdateField(fsIndex, fIndex, {...field, name: e.target.value.replace(/\s/g, '_')})} className="w-full form-input font-mono text-sm"/>
                                                            </div>
                                                            <div className="col-span-6 sm:col-span-2 space-y-1">
                                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
                                                                <select value={field.type} onChange={e => handleUpdateField(fsIndex, fIndex, {...field, type: e.target.value as FormFieldSchema['type']})} className="w-full form-input">
                                                                    <option value="text">Text</option>
                                                                    <option value="textarea">Text Area</option>
                                                                    <option value="select">Select</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-span-6 sm:col-span-2 flex items-center justify-end space-x-2 self-end pb-1">
                                                                <div className="flex flex-col bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm">
                                                                    <button onClick={() => handleMoveField(fsIndex, fIndex, 'up')} disabled={fIndex === 0} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md disabled:opacity-30 disabled:cursor-not-allowed border-b border-gray-300 dark:border-gray-600" title="Move field up">
                                                                        <ChevronUpIcon className="h-4 w-4"/>
                                                                    </button>
                                                                    <button onClick={() => handleMoveField(fsIndex, fIndex, 'down')} disabled={fIndex === fieldset.fields.length - 1} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-md disabled:opacity-30 disabled:cursor-not-allowed" title="Move field down">
                                                                        <ChevronDownIcon className="h-4 w-4"/>
                                                                    </button>
                                                                </div>
                                                                <button onClick={() => setPendingDelete({ type: 'field', fsIndex, fIndex })} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md" title="Delete field"><TrashIcon className="h-5 w-5"/></button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {field.type === 'select' && (
                                                        <div className="mt-4 pl-6 space-y-3">
                                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Options for '{field.label}'</h4>
                                                            <div className="space-y-2">
                                                                {field.options && field.options.map((option, oIndex) => (
                                                                    <div key={oIndex} className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800/60 rounded-md">
                                                                        <div className="flex-1">
                                                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Label (what user sees)</label>
                                                                            <input
                                                                                type="text"
                                                                                value={option.label}
                                                                                onChange={(e) => handleUpdateOption(fsIndex, fIndex, oIndex, 'label', e.target.value)}
                                                                                className="w-full form-input"
                                                                                placeholder="e.g., In Front"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Value (what is saved)</label>
                                                                            <input
                                                                                type="text"
                                                                                value={option.value}
                                                                                onChange={(e) => handleUpdateOption(fsIndex, fIndex, oIndex, 'value', e.target.value)}
                                                                                className="w-full form-input font-mono text-sm"
                                                                                placeholder="e.g., 1"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDeleteOption(fsIndex, fIndex, oIndex)}
                                                                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md self-end mb-1"
                                                                            title="Delete option"
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddOption(fsIndex, fIndex)}
                                                                className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
                                                            >
                                                                <PlusIcon className="h-4 w-4 mr-1" /> Add Option
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </React.Fragment>
                                        )
                                    })}
                                    
                                    {fieldset.fields.length > 0 && dropIndicator?.fsIndex === fsIndex && dropIndicator?.fIndex === fieldset.fields.length - 1 && dropIndicator?.position === 'bottom' && (
                                        <DropIndicatorLine />
                                    )}

                                    {fieldset.fields.length === 0 && isSectionHighlighted && draggedItem?.type === 'field' && (
                                        <EmptySectionDropzone />
                                    )}

                                </div>
                                <button onClick={() => handleAddField(fsIndex)} className="flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:underline mt-2"><PlusIcon className="h-4 w-4 mr-1"/>Add Field</button>
                            </fieldset>
                            {showBottomSectionIndicator && <DropIndicatorLine />}
                        </React.Fragment>
                    );
                })}
                <button onClick={handleAddFieldset} className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"><PlusIcon className="h-5 w-5 mr-2"/>Add New Section</button>
            </div>
            <style>{`
            .form-input {
                display: block;
                width: 100%;
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
                line-height: 1.25rem;
                color: #111827;
                background-color: #f9fafb;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }
            .dark .form-input {
                color: #d1d5db;
                background-color: #374151;
                border-color: #4b5563;
            }
            .form-input:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                border-color: #6366f1;
                box-shadow: 0 0 0 2px #6366f1;
            }
            .dragging-item {
                opacity: 0.6;
                background: #eef2ff; /* indigo-50 */
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                outline: 2px dashed #4f46e5; /* indigo-600 */
                outline-offset: 2px;
                transform: scale(1.02);
                z-index: 50;
            }
            .dark .dragging-item {
                background: #3730a3; /* indigo-800 */
                color: white;
            }
            `}</style>
        </div>
    );
};

export default FormSchemaEditor;
