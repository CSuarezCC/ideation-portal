import { useRef, useState } from 'react'
import { ideaService, type Attachment } from '../../services/ideaService'
import { Button } from './Button'

interface FileUploadProps {
  ideaId: string
  attachments: Attachment[]
  onUpload: (attachment: Attachment) => void
  onRemove: (fileKey: string) => void
  maxFiles?: number
}

export function FileUpload({ ideaId, attachments, onUpload, onRemove, maxFiles = 5 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { uploadUrl, fileKey } = await ideaService.getUploadUrl(ideaId, file.name, file.type, file.size)
      await ideaService.uploadFile(uploadUrl, file)
      onUpload({ fileKey, fileName: file.name, fileSize: file.size, contentType: file.type, uploadedAt: new Date().toISOString() })
    } catch { /* silent */ }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  return (
    <div data-testid="file-upload">
      {attachments.map(a => (
        <div key={a.fileKey} className="flex items-center justify-between bg-gray-50 p-2 rounded mb-1">
          <span className="text-sm text-gray-700 truncate">{a.fileName} ({(a.fileSize / 1024).toFixed(0)} KB)</span>
          <button data-testid={`remove-file-${a.fileKey}`} onClick={() => onRemove(a.fileKey)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
        </div>
      ))}
      {attachments.length < maxFiles && (
        <>
          <input ref={inputRef} type="file" onChange={handleFile} className="hidden" data-testid="file-input" />
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} loading={uploading} data-testid="add-attachment-button">
            Add Attachment ({attachments.length}/{maxFiles})
          </Button>
        </>
      )}
    </div>
  )
}
