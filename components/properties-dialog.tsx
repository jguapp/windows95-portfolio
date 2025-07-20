"use client"

import type React from "react"

interface PropertiesDialogProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function PropertiesDialog({ title, onClose, children }: PropertiesDialogProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r-2 border-b-2 border-[#000000] shadow-md w-80">
        <div className="flex items-center justify-between bg-[#000080] text-white px-2 py-1">
          <span className="text-sm font-bold">{title}</span>
          <button
            className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] w-4 h-4 flex items-center justify-center text-black font-bold"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end p-2 border-t border-[#808080]">
          <button
            className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-4 py-1 mr-2"
            style={{
              boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080",
            }}
            onClick={onClose}
          >
            OK
          </button>
          <button
            className="bg-[#c0c0c0] border-t border-l border-[#ffffff] border-r border-b border-[#000000] px-4 py-1"
            style={{
              boxShadow: "inset 1px 1px #dfdfdf, inset -1px -1px #808080",
            }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
