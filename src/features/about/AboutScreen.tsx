import { Link, useNavigate } from 'react-router-dom'
import { Smartphone, ChevronRight } from 'lucide-react'
import { CHANGELOG } from '../../data/changelog'
import { Card, ScreenHeader } from '../../components/ui'
import { t, useLanguage } from '../../data/i18n'
import { useState } from 'react'

export function AboutScreen() {
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)
  const language = useLanguage()

  return (
    <div className="stack">
      <ScreenHeader
        title={t('settings.about')}
        action={
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/settings')}>
            {t('common.back')}
          </button>
        }
      />

      <p className="muted" style={{ margin: '0.5rem 0 0' }}>
        {t('about.versionLine', { version: CHANGELOG[0].version })}
      </p>

      <Card>
        <p style={{ margin: 0 }}>{t('about.intro')}</p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          {t('about.introDetail')}
        </p>
      </Card>

      <h3>{t('about.installingHeading')}</h3>

      <Link to="/settings/about/install" className="btn btn-block" style={{ textDecoration: 'none' }}>
        <Smartphone size={16} />{' '}
        <span className="grow" style={{ textAlign: 'left' }}>
          {t('settings.install')}
        </span>
        <ChevronRight size={16} />
      </Link>

      <p className="muted">{t('about.installNote')}</p>

      <h3>{t('about.barcodeHeading')}</h3>
      <Card>
        <p style={{ margin: 0 }}>{t('about.barcodeNote')}</p>
        <p className="muted" style={{ margin: '0.5rem 0 0' }}>
          {t('about.barcodeNote2')}
        </p>
      </Card>

      <h3>{t('about.backupHeading')}</h3>
      <Card>
        <p className="muted" style={{ margin: 0 }}>
          {t('about.backupNote')}
        </p>
      </Card>

      <h3>{t('about.changesHeading')}</h3>
      {(showAll ? CHANGELOG : CHANGELOG.slice(0, 3)).map((release) => (
        <Card key={release.version}>
          <div className="row">
            <strong className="grow">
              {t('about.versionLine', { version: release.version })}
            </strong>
            <span className="muted">{release.date}</span>
          </div>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
            {(language === 'de' && release.changesDe ? release.changesDe : release.changes).map(
              (c, i) => (
                <li key={i} className="muted">
                  {c}
                </li>
              )
            )}
          </ul>
        </Card>
      ))}

      {CHANGELOG.length > 3 && (
        <button className="btn btn-ghost btn-block" onClick={() => setShowAll(!showAll)}>
          {showAll
            ? t('about.showRecentOnly')
            : t('about.showAllVersions', { n: CHANGELOG.length })}
        </button>
      )}
    </div>
  )
}