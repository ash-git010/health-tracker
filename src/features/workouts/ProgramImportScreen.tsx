import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Check, X } from 'lucide-react'
import { previewImport, importProgram, type ImportPreview } from '../../data/programImport'
import { Button, Card, ScreenHeader } from '../../components/ui'
import { t, plural } from '../../data/i18n'

export function ProgramImportScreen() {
  const navigate = useNavigate()
  const [raw, setRaw] = useState<unknown>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [reading, setReading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setReading(true)
    setError(null)
    setPreview(null)
    setRaw(null)

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(await file.text())
    } catch {
      setError(t('programs.import.invalidJson'))
      setReading(false)
      return
    }

    try {
      const result = await previewImport(parsedJson)
      setRaw(parsedJson)
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('programs.import.invalidJson'))
    }
    setReading(false)
  }

  async function handleConfirm() {
    if (raw === null || importing) return
    setImporting(true)
    await importProgram(raw)
    navigate('/workouts/routines')
  }

  return (
    <div className="stack" style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title={t('programs.import.title')} onBack={() => navigate('/workouts/routines')} />

      {!preview && (
        <>
          <label className="btn btn-block" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {t('programs.import.chooseFile')}
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </label>

          {reading && <p className="muted">{t('programs.import.parsing')}</p>}
        </>
      )}

      {error && (
        <p className="danger" style={{ margin: 0 }}>
          {error}
        </p>
      )}

      {preview && (
        <>
          <Card>
            <h3 style={{ margin: 0 }}>{preview.built.programName}</h3>
            <p className="muted" style={{ margin: '0.25rem 0 0' }}>
              {plural(
                new Set(preview.built.days.map((d) => d.week)).size,
                'programs.import.weekCount'
              )}
            </p>
          </Card>

          <h3 style={{ marginTop: '1.25rem' }}>{t('programs.import.exercisesHeading')}</h3>
          {preview.matches.map((m) => (
            <div className="row" key={`${m.isSubstitute ? 'sub' : 'primary'}:${m.name}`} style={{ padding: '0.375rem 0' }}>
              {m.matched ? (
                <Check size={16} className="success" style={{ flexShrink: 0 }} />
              ) : (
                <X size={16} className="warn" style={{ flexShrink: 0 }} />
              )}
              <div className="grow" style={{ marginLeft: '0.5rem', minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>
                  {m.name}
                  {m.isSubstitute && <span className="faint"> · {t('programs.import.substituteLabel')}</span>}
                </div>
                <div className="faint">
                  {m.matched
                    ? t('programs.import.matched', { name: m.matchedName ?? m.name })
                    : m.isSubstitute
                      ? t('programs.import.substituteDropped')
                      : t('programs.import.noMatch')}
                </div>
              </div>
            </div>
          ))}

          {preview.built.warnings.length > 0 && (
            <>
              <h3 style={{ marginTop: '1.25rem' }}>{t('programs.import.warningsHeading')}</h3>
              {preview.built.warnings.map((w, i) => (
                <p key={i} className="warn" style={{ margin: '0.25rem 0' }}>
                  {w}
                </p>
              ))}
            </>
          )}

          <div className="form-actions">
            <Button
              variant="ghost"
              onClick={() => {
                setPreview(null)
                setRaw(null)
              }}
            >
              {t('common.cancel')}
            </Button>
            <span className="grow">
              <Button variant="primary" block onClick={handleConfirm} disabled={importing}>
                {importing ? t('programs.import.importing') : t('programs.import.confirm')}
              </Button>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
