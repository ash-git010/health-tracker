import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { routineFolders } from '../../data/routines'
import { Button } from '../../components/ui'

const NEW_FOLDER = '__new_folder__'

export function FolderPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const folders = useLiveQuery(() => routineFolders(), [])
  const [addingFolder, setAddingFolder] = useState(false)

  return (
    <label className="field">
      <span className="field-label">Folder</span>
      {addingFolder ? (
        <div className="row">
          <input
            type="text"
            autoFocus
            value={value}
            placeholder="e.g. Push/Pull/Legs"
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            size="sm"
            onClick={() => {
              setAddingFolder(false)
              onChange('')
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === NEW_FOLDER) {
              setAddingFolder(true)
              onChange('')
            } else {
              onChange(e.target.value)
            }
          }}
        >
          <option value="">No folder</option>
          {(folders ?? []).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value={NEW_FOLDER}>New folder…</option>
        </select>
      )}
    </label>
  )
}
