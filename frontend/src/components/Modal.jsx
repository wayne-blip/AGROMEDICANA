import React from 'react'

export default function Modal({ title, open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded p-6 max-w-sm w-full">
        <h3 className="font-semibold mb-3">{title}</h3>
        <div>{children}</div>
        <div className="mt-4 text-right">
          <button className="px-3 py-1 bg-gray-300 rounded" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
