'use client'

import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
import { cn } from '@/lib/utils'

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[200px] w-full border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm">Loading editor...</span>
      </div>
    </div>
  )
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
  minHeight?: string
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['blockquote', 'code-block'],
    ['link'],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
}

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'indent',
  'blockquote', 'code-block',
  'link',
  'color', 'background'
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  readOnly = false,
  minHeight = '300px'
}: RichTextEditorProps) {
  return (
    <div className={cn('rich-text-editor w-full', className)}>
      <style jsx global>{`
        .rich-text-editor .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        
        .rich-text-editor .ql-toolbar {
          border: 1px solid rgb(229 231 235);
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: white;
        }
        
        .dark .rich-text-editor .ql-toolbar {
          border-color: rgb(31 41 55);
          background: rgb(17 24 39);
        }
        
        .rich-text-editor .ql-container {
          border: 1px solid rgb(229 231 235);
          border-top: none;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: white;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: ${minHeight};
        }
        
        .dark .rich-text-editor .ql-container {
          border-color: rgb(31 41 55);
          background: rgb(17 24 39);
        }
        
        .rich-text-editor .ql-editor {
          flex: 1;
          font-size: 0.9375rem;
          line-height: 1.6;
          color: rgb(17 24 39);
        }
        
        .dark .rich-text-editor .ql-editor {
          color: rgb(243 244 246);
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(156 163 175);
          font-style: normal;
        }
        
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(107 114 128);
        }
        
        /* Toolbar button styles */
        .rich-text-editor .ql-toolbar button {
          color: rgb(55 65 81);
        }
        
        .dark .rich-text-editor .ql-toolbar button {
          color: rgb(209 213 219);
        }
        
        .rich-text-editor .ql-toolbar button:hover {
          color: rgb(17 24 39);
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover {
          color: white;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active {
          color: rgb(59 130 246);
        }
        
        .dark .rich-text-editor .ql-toolbar button.ql-active {
          color: rgb(96 165 250);
        }
        
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: rgb(55 65 81);
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: rgb(209 213 219);
        }
        
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: rgb(55 65 81);
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: rgb(209 213 219);
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: rgb(17 24 39);
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: white;
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: rgb(17 24 39);
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: white;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: rgb(59 130 246);
        }
        
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: rgb(96 165 250);
        }
        
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: rgb(59 130 246);
        }
        
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: rgb(96 165 250);
        }
        
        /* Dropdown styles */
        .rich-text-editor .ql-toolbar .ql-picker-label {
          color: rgb(55 65 81);
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-label {
          color: rgb(209 213 219);
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-options {
          background: white;
          border: 1px solid rgb(229 231 235);
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-options {
          background: rgb(31 41 55);
          border-color: rgb(55 65 81);
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-item {
          color: rgb(17 24 39);
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-item {
          color: rgb(243 244 246);
        }
      `}</style>
      
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  )
}
