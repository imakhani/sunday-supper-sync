import { useState } from 'react'
import { useFirebaseData } from './useFirebaseData'
import { getSundays, fmtDate, fmtShort, dateKey, CURATED_MEALS, TAG_COLORS } from './constants'

const SUNDAYS = getSundays(3)
const TABS = ['🗓 Schedule', '👨‍👩‍👧 Families', '🍴 Meal Ideas', '📖 History']

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const { config, dinners, loading, syncing, error, famById, toggleAvail, confirmDinner, saveMealLog } = useFirebaseData()

  const [tab, setTab]           = useState(0)
  const [toast, setToast]       = useState(null)
  const [suggDk, setSuggDk]     = useState(null)
  const [aiLoading, setAiLoad]  = useState(false)
  const [aiMeals, setAiMeals]   = useState([])
  const [aiErr, setAiErr]       = useState('')
  const [logModal, setLogModal] = useState(null)
  const [logInput, setLogInput] = useState({ what: '', recipe: '', notes: '', rating: 5, how: 'cooked' })

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const getDinner = key => dinners[key] || null

  const handleToggle = async (sunday, famId) => {
    await toggleAvail(dateKey(sunday), famId)
    notify('Updated! ✓')
  }

  const handleConfirm = async (sunday) => {
    await confirmDinner(dateKey(sunday))
    notify('Dinner confirmed! 🍽️')
  }

  const bestSundays = () => {
    const total = config?.families?.length || 1
    return SUNDAYS
      .map(s => {
        const d = getDinner(dateKey(s))
        return { date: s, score: (d?.available?.length || 0) / total, dinner: d }
      })
      .filter(s => !s.dinner?.confirmed)
      .sort((a, b) => b.score - a.score)
  }

  const fetchAiMeals = async key => {
    setAiLoad(true); setAiMeals([]); setAiErr('')
    const dinner = getDinner(key)
    const host   = famById(dinner?.hostId)
    const month  = new Date(key + 'T12:00:00').toLocaleString('en-US', { month: 'long' })
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1200,
          messages: [{ role: 'user', content:
            `Suggest 4 Sunday dinner ideas for: 6 adults, 5 kids aged 1–6 (soft textures, mild, no choking hazards). Season: ${month}. Host: ${host?.name || 'rotating'}.\nReturn ONLY a valid JSON array of 4 objects, no markdown:\n[{"name":"...","emoji":"...","desc":"...","kidTip":"...","prepTime":"...","difficulty":"Easy|Medium|Involved","tags":["..."]}]`
          }]
        })
      })
      const j   = await res.json()
      const txt = j.content?.map(c => c.text || '').join('').replace(/```json|```/g, '').trim()
      setAiMeals(JSON.parse(txt))
    } catch { setAiErr('Couldn\'t load AI picks — showing curated classics below.') }
    setAiLoad(false)
  }

  const openSugg = key => { setSuggDk(key); fetchAiMeals(key) }

  const openLog = key => {
    const d = getDinner(key)
    setLogInput(d?.mealLog || { what: '', recipe: '', notes: '', rating: 5, how: 'cooked' })
    setLogModal({ dateKey: key })
  }

  const handleSaveLog = async () => {
    if (!logModal || !logInput.what.trim()) return
    await saveMealLog(logModal.dateKey, logInput)
    setLogModal(null)
    notify('Meal logged! 📖')
  }

  if (loading) return (
    <div className="loading-screen">
      <div style={{ fontSize: 54 }}>🍽️</div>
      <p>Setting the table…</p>
    </div>
  )

  if (error && !config) return (
    <div className="loading-screen">
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: '#b85c5c', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
        Firebase not connected.<br />
        <strong>Open <code>src/firebase.js</code> and paste your config.</strong>
      </p>
    </div>
  )

  const best = bestSundays()
  const confirmedDinners = Object.values(dinners)
    .filter(d => d.confirmed)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div style={S.root}>
      <div style={S.grain} />
      <div style={S.blob1} /><div style={S.blob2} /><div style={S.blob3} />

      {toast && <div style={{ ...S.toast, background: toast.type === 'ok' ? '#4a7c59' : '#7a6a5a' }}>{toast.msg}</div>}

      {syncing && (
        <div style={S.syncBar}>
          <div style={S.spinner} /> Syncing…
        </div>
      )}

      {/* Suggestion panel */}
      {suggDk && (
        <SuggPanel
          dk={suggDk} dinner={getDinner(suggDk)} famById={famById}
          aiLoading={aiLoading} aiMeals={aiMeals} aiErr={aiErr}
          onPick={meal => { setLogInput({ what: meal.name, recipe: '', notes: '', rating: 5, how: 'cooked' }); setLogModal({ dateKey: suggDk }); setSuggDk(null) }}
          onClose={() => setSuggDk(null)} onRefresh={() => fetchAiMeals(suggDk)}
        />
      )}

      {/* Meal log modal */}
      {logModal && (
        <LogModal input={logInput} setInput={setLogInput} onSave={handleSaveLog} onClose={() => setLogModal(null)} />
      )}

      {/* Header */}
      <header style={S.header}>
        <div style={S.hInner}>
          <div style={S.logoRow}>
            <span style={{ fontSize: 44 }}>🍽️</span>
            <div>
              <h1 style={S.title}>Sunday Table</h1>
              <p style={S.sub}>Imran & Rachana · Rahul & Leena · Iqbal & Zarpheen</p>
            </div>
          </div>
        </div>
      </header>

      {/* Best pick banner */}
      {best.length > 0 && best[0].score > 0 && (
        <div style={S.banner}>
          <p style={S.bLabel}>✨ Best upcoming Sunday</p>
          <p style={S.bDate}>{fmtDate(best[0].date)}</p>
          <p style={S.bStat}>{Math.round(best[0].score * 100)}% of families available</p>
        </div>
      )}

      {/* Tabs */}
      <div style={S.tabBar}>
        {TABS.map((t, i) => (
          <button key={i} style={{ ...S.tab, ...(tab === i ? S.tabOn : {}) }} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      <main style={S.main}>
        {tab === 0 && <ScheduleTab sundays={SUNDAYS} config={config} best={best} getDinner={getDinner} famById={famById} onToggle={handleToggle} onConfirm={handleConfirm} openSugg={openSugg} openLog={openLog} />}
        {tab === 1 && <FamiliesTab config={config} dinners={dinners} famById={famById} />}
        {tab === 2 && <MealIdeasTab />}
        {tab === 3 && <HistoryTab confirmedDinners={confirmedDinners} famById={famById} openLog={openLog} />}
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SCHEDULE TAB
═══════════════════════════════════════════════════════════ */
function ScheduleTab({ sundays, config, best, getDinner, famById, onToggle, onConfirm, openSugg, openLog }) {
  return (
    <div>
      <p style={S.note}>Tap a family bubble: ✓ available → ✗ unavailable → — clear</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sundays.map(sun => {
          const key       = dateKey(sun)
          const dinner    = getDinner(key)
          const confirmed = dinner?.confirmed
          const host      = confirmed ? famById(dinner.hostId) : null
          const isBest    = !confirmed && best[0]?.date.getTime() === sun.getTime()
          const hasLog    = !!dinner?.mealLog?.what

          return (
            <div key={key} style={{ ...C.card, ...(confirmed ? C.cConf : {}), ...(isBest ? C.cBest : {}) }}>
              <div style={C.cardHead}>
                <div>
                  <p style={C.month}>{sun.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  <p style={C.day}>{sun.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {confirmed && <Pill bg="#4a7c59">Confirmed ✓</Pill>}
                  {isBest    && <Pill bg="#c17f5e">Best Pick ⭐</Pill>}
                  {!confirmed && dinner?.available?.length > 0 && (
                    <span style={{ color: '#7a9e7e', fontSize: 12 }}>{dinner.available.length}/{config?.families?.length} available</span>
                  )}
                </div>
              </div>

              {confirmed && host && (
                <div style={C.hostRow}>
                  <span style={{ fontSize: 19 }}>{host.emoji}</span>
                  <span style={{ color: '#4a7c59', fontSize: 14, fontFamily: 'Lora,serif' }}>Hosted by {host.name}</span>
                </div>
              )}

              {hasLog && (
                <div style={C.mealPreview}>
                  <span style={{ fontSize: 17 }}>{dinner.mealLog.how === 'cooked' ? '👩‍🍳' : '🛵'}</span>
                  <span style={{ flex: 1, fontSize: 14, color: '#5c3d2e', fontFamily: 'Lora,serif' }}>{dinner.mealLog.what}</span>
                  <span style={{ fontSize: 12 }}>{'⭐'.repeat(dinner.mealLog.rating)}</span>
                </div>
              )}

              {/* Family availability bubbles */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 13 }}>
                {(config?.families || []).map(fam => {
                  const av = dinner?.available?.includes(fam.id)
                  const dc = dinner?.declined?.includes(fam.id)
                  return (
                    <button key={fam.id} disabled={confirmed}
                      onClick={() => onToggle(sun, fam.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 11px', borderRadius: 30, fontSize: 12,
                        background: av ? fam.color : dc ? '#e8ddd4' : '#f2ede8',
                        color: av ? '#fff' : dc ? '#b0a090' : '#7a6a5a',
                        border: av ? `2px solid ${fam.color}` : '2px solid transparent',
                        opacity: confirmed ? 0.8 : 1, cursor: confirmed ? 'default' : 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.15s',
                      }}>
                      <span style={{ fontSize: 14 }}>{fam.emoji}</span>
                      <span>{fam.name.split(' & ')[0]}</span>
                      <span style={{ fontWeight: 'bold', fontSize: 11 }}>{av ? '✓' : dc ? '✗' : '—'}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!confirmed && dinner?.available?.length > 0 && (
                  <button style={{ ...C.btn, background: '#5c3d2e', color: '#fdf6ee', flex: 1 }} onClick={() => onConfirm(sun)}>
                    Confirm dinner →
                  </button>
                )}
                {confirmed && <>
                  <button style={{ ...C.btn, background: '#fff', color: '#c17f5e', border: '1.5px solid #c17f5e', flex: 1 }} onClick={() => openSugg(key)}>🍴 Meal Ideas</button>
                  <button style={{ ...C.btn, background: '#fff', color: '#8b6f9e', border: '1.5px solid #8b6f9e', flex: 1 }} onClick={() => openLog(key)}>{hasLog ? '📖 Edit Log' : '📖 Log Meal'}</button>
                </>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FAMILIES TAB
═══════════════════════════════════════════════════════════ */
function FamiliesTab({ config, dinners, famById }) {
  const families     = config?.families     || []
  const hostRotation = config?.hostRotation || []
  const lastHostIdx  = config?.lastHostIndex ?? -1
  const nextHostIdx  = (lastHostIdx + 1) % (hostRotation.length || 1)

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {families.map(fam => {
          const hosted  = Object.values(dinners).filter(d => d.confirmed && d.hostId === fam.id).length
          const ri      = hostRotation.indexOf(fam.id)
          const isNext  = ri === nextHostIdx

          return (
            <div key={fam.id} style={{ ...C.card, display: 'flex', padding: 0, overflow: 'hidden' }}>
              <div style={{ width: 6, background: fam.color, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 32 }}>{fam.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: '#3d2c1e', fontSize: 17, fontFamily: 'Lora,serif' }}>{fam.name}</p>
                    <p style={{ margin: '2px 0 0', color: '#b0a090', fontSize: 13 }}>
                      Hosted {hosted} dinner{hosted !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isNext && <Pill bg="#c17f5e">Up next 🏡</Pill>}
                </div>
                <div style={{ borderTop: '1px solid #f0e9e0', paddingTop: 10 }}>
                  <p style={{ margin: '0 0 6px', color: '#c0a890', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>Rotation position</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {hostRotation.map((fid, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: fid === fam.id ? fam.color : '#ddd4c8' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rotation order */}
      <div style={C.card}>
        <p style={{ margin: '0 0 14px', color: '#5c3d2e', fontSize: 17, fontFamily: 'Lora,serif' }}>🔄 Host Rotation Order</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hostRotation.map((fid, i) => {
            const fam    = famById(fid)
            const isNext = i === nextHostIdx
            if (!fam) return null
            return (
              <div key={fid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                  background: isNext ? '#c17f5e' : '#e8ddd4', color: isNext ? '#fff' : '#7a6a5a'
                }}>{i + 1}</span>
                <span style={{ fontSize: 20 }}>{fam.emoji}</span>
                <span style={{ flex: 1, color: '#5c3d2e', fontFamily: 'Lora,serif', fontSize: 15 }}>{fam.name}</span>
                {isNext && <Pill bg="#c17f5e">Next!</Pill>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MEAL IDEAS TAB
═══════════════════════════════════════════════════════════ */
function MealIdeasTab() {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'kid-staple', 'crowd-pleaser', 'quick', 'make-ahead', 'healthy', 'comfort', 'special-occasion']
  const shown   = filter === 'all' ? CURATED_MEALS : CURATED_MEALS.filter(m => m.tags?.includes(filter))

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fef9e7', border: '1.5px solid #f5e6b8', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <span style={{ fontSize: 28 }}>👶🧒🧒🧒🧒</span>
        <div>
          <p style={{ margin: 0, fontFamily: 'Lora,serif', color: '#5c3d2e', fontSize: 15, fontWeight: 600 }}>Curated for your crew</p>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#8b6f5e' }}>Every recipe works for 6 adults + 5 kids aged 1–6 · soft textures · mild flavours</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 13px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1.5px solid ${filter === f ? '#5c3d2e' : '#e0d6c8'}`,
              background: filter === f ? '#5c3d2e' : '#fff',
              color: filter === f ? '#fdf6ee' : '#8b6f5e',
            }}>{f}</button>
        ))}
      </div>
      <p style={{ color: '#a08870', fontSize: 13, marginBottom: 14, fontStyle: 'italic' }}>{shown.length} meal ideas</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((m, i) => <MealCard key={i} meal={m} onPick={() => {}} />)}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   HISTORY TAB
═══════════════════════════════════════════════════════════ */
function HistoryTab({ confirmedDinners, famById, openLog }) {
  if (confirmedDinners.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <p style={{ fontSize: 54, margin: 0 }}>🍽️</p>
      <p style={{ color: '#5c3d2e', fontSize: 20, fontFamily: 'Lora,serif', marginTop: 16 }}>No confirmed dinners yet.</p>
      <p style={{ color: '#b0a090', fontSize: 14, marginTop: 8 }}>Confirm a Sunday in the Schedule tab to start!</p>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {confirmedDinners.map((dinner, i) => {
          const host      = famById(dinner.hostId)
          const date      = new Date(dinner.date + 'T12:00:00')
          const attendees = (dinner.available || []).map(famById).filter(Boolean)
          const log       = dinner.mealLog

          return (
            <div key={dinner.date} style={C.card}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: host?.color || '#c17f5e', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Lora,serif', fontSize: 14,
                }}>{confirmedDinners.length - i}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#3d2c1e', fontSize: 16, fontFamily: 'Lora,serif' }}>{fmtDate(date)}</p>
                  {host && <p style={{ margin: '4px 0 8px', color: '#7a9e7e', fontSize: 13 }}>{host.emoji} Hosted by {host.name}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {attendees.map(f => (
                      <span key={f.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: f.color + '22', color: f.color, fontFamily: 'Lora,serif' }}>
                        {f.emoji} {f.name.split(' & ')[0]}
                      </span>
                    ))}
                  </div>
                  {log?.what ? (
                    <div style={{ background: '#faf7f3', border: '1px solid #f0e0c8', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 19 }}>{log.how === 'cooked' ? '👩‍🍳' : '🛵'}</span>
                          <p style={{ margin: 0, fontFamily: 'Lora,serif', color: '#5c3d2e', fontSize: 15 }}>{log.what}</p>
                        </div>
                        <span style={{ fontSize: 12 }}>{'⭐'.repeat(log.rating)}</span>
                      </div>
                      {log.recipe && <p style={{ margin: '0 0 4px', fontSize: 12, color: '#8b6f5e' }}>📌 {log.recipe}</p>}
                      {log.notes  && <p style={{ margin: 0, fontSize: 13, color: '#7a6a5a', fontStyle: 'italic', lineHeight: 1.5 }}>"{log.notes}"</p>}
                      <button onClick={() => openLog(dinner.date)} style={{ marginTop: 10, background: 'none', border: '1px solid #c0a890', color: '#c0a890', borderRadius: 20, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>
                        ✏️ Edit log
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => openLog(dinner.date)} style={{ ...C.btn, background: '#fff', color: '#8b6f9e', border: '1.5px solid #8b6f9e' }}>
                      📖 Log what you made
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          [confirmedDinners.length, 'Dinners'],
          [confirmedDinners.filter(d => d.mealLog?.what).length, 'Meals logged'],
          [confirmedDinners.length ? Math.round(confirmedDinners.reduce((a, d) => a + (d.available?.length || 0), 0) / confirmedDinners.length * 10) / 10 : 0, 'Avg families'],
        ].map(([n, l], i) => (
          <div key={i} style={{ ...C.card, textAlign: 'center', padding: '18px 10px' }}>
            <p style={{ margin: 0, color: '#5c3d2e', fontSize: 30, fontFamily: 'Lora,serif' }}>{n}</p>
            <p style={{ margin: '4px 0 0', color: '#b0a090', fontSize: 12 }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUGGESTIONS PANEL
═══════════════════════════════════════════════════════════ */
function SuggPanel({ dk, dinner, famById, aiLoading, aiMeals, aiErr, onPick, onClose, onRefresh }) {
  const host = famById(dinner?.hostId)
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'Easy', 'quick', 'kid-staple', 'make-ahead', 'healthy']
  const filtered = filter === 'all' ? CURATED_MEALS : CURATED_MEALS.filter(m => m.tags?.includes(filter) || m.diff === filter)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,25,15,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: 'min(560px,100vw)', background: '#faf7f3', height: '100vh', overflowY: 'auto', animation: 'slideIn 0.25s ease' }}>
        <div style={{ background: 'linear-gradient(135deg,#5c3d2e,#8b5e3c)', padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontFamily: 'Lora,serif', color: '#fdf6ee' }}>🍴 Meal Ideas</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#e8c9a8', fontStyle: 'italic' }}>
              {host ? `${host.emoji} ${host.name} hosting · ` : ''}6 adults + 5 kids aged 1–6
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fef9e7', borderBottom: '1px solid #f5e6b8', padding: '12px 20px' }}>
          <span style={{ fontSize: 22 }}>👶🧒</span>
          <p style={{ margin: 0, fontSize: 13, color: '#5c3d2e', lineHeight: 1.5 }}>
            All suggestions adapted for <strong>toddlers & preschoolers</strong> — soft textures, mild flavours.
          </p>
        </div>

        {/* AI picks */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #ece4d8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ margin: 0, fontFamily: 'Lora,serif', color: '#5c3d2e', fontSize: 15, fontWeight: 600 }}>✨ AI Personalised Picks</p>
            <button onClick={onRefresh} disabled={aiLoading}
              style={{ background: 'none', border: '1px solid #c17f5e', color: '#c17f5e', borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
              {aiLoading ? '…' : '↺ New ideas'}
            </button>
          </div>
          {aiLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
              <div style={{ width: 20, height: 20, border: '2px solid #f0e0c8', borderTop: '2px solid #c17f5e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 13, color: '#a08870' }}>Finding perfect ideas…</p>
            </div>
          )}
          {aiErr && <p style={{ fontSize: 13, color: '#b85c5c', margin: '0 0 8px' }}>{aiErr}</p>}
          {!aiLoading && aiMeals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiMeals.map((m, i) => <MealCard key={i} meal={m} onPick={() => onPick(m)} highlight />)}
            </div>
          )}
        </div>

        {/* Curated */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px', fontFamily: 'Lora,serif', color: '#5c3d2e', fontSize: 15, fontWeight: 600 }}>📋 Tried & Tested Classics</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '5px 13px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                  border: `1.5px solid ${filter === f ? '#5c3d2e' : '#e0d6c8'}`,
                  background: filter === f ? '#5c3d2e' : '#fff',
                  color: filter === f ? '#fdf6ee' : '#8b6f5e',
                }}>{f}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((m, i) => <MealCard key={i} meal={m} onPick={() => onPick(m)} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MEAL CARD
═══════════════════════════════════════════════════════════ */
function MealCard({ meal, onPick, highlight }) {
  const [open, setOpen] = useState(false)
  const dc = meal.diff === 'Easy' ? '#7a9e7e' : meal.diff === 'Medium' ? '#c4956a' : '#b85c5c'

  return (
    <div style={{ background: highlight ? '#fffbf6' : '#fff', borderRadius: 12, border: `1.5px solid ${highlight ? '#c4956a' : '#f0e9e0'}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>{meal.emoji || '🍽'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <p style={{ margin: 0, fontFamily: 'Lora,serif', color: '#3d2c1e', fontSize: 15, fontWeight: 600 }}>{meal.name}</p>
            {meal.diff && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: dc + '22', color: dc }}>{meal.diff}</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {meal.prepTime  && <span style={{ fontSize: 11, color: '#a08870' }}>⏱ {meal.prepTime}</span>}
            {typeof meal.kidScore === 'number' && <span style={{ fontSize: 11, color: '#a08870' }}>{'🟢'.repeat(meal.kidScore)}{'⚪'.repeat(5 - meal.kidScore)} kid-friendly</span>}
          </div>
        </div>
        <span style={{ color: '#c0a890', fontSize: 13, marginTop: 2 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f5f0ea' }}>
          <p style={{ margin: '10px 0 8px', fontSize: 13, color: '#5c3d2e', lineHeight: 1.6 }}>{meal.desc}</p>
          {meal.kidTip && (
            <div style={{ display: 'flex', gap: 8, background: '#f0faf3', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>👶</span>
              <p style={{ margin: 0, fontSize: 13, color: '#3d5c3d', lineHeight: 1.5 }}><strong>Kid tip:</strong> {meal.kidTip}</p>
            </div>
          )}
          {meal.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {meal.tags.map((t, i) => (
                <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: (TAG_COLORS[t] || '#aaa') + '22', color: TAG_COLORS[t] || '#888' }}>{t}</span>
              ))}
            </div>
          )}
          <button onClick={onPick} style={{ background: '#5c3d2e', color: '#fdf6ee', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            Use this meal → log it
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MEAL LOG MODAL
═══════════════════════════════════════════════════════════ */
function LogModal({ input, setInput, onSave, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,25,15,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: 'min(480px,100%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ margin: 0, fontFamily: 'Lora,serif', color: '#5c3d2e', fontSize: 20 }}>📖 Log the Meal</p>
          <button onClick={onClose} style={{ background: '#f0e9e0', border: 'none', color: '#8b6f5e', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {[
          ['What did you eat?', <input style={F.inp} placeholder="e.g. Homemade Pizza Night" value={input.what} onChange={e => setInput(x => ({ ...x, what: e.target.value }))} />],
        ].map(([lbl, el], i) => <div key={i} style={{ marginBottom: 16 }}><label style={F.lbl}>{lbl}</label>{el}</div>)}

        <div style={{ marginBottom: 16 }}>
          <label style={F.lbl}>Home-cooked or ordered in?</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['cooked', '👩‍🍳 Home-cooked'], ['ordered', '🛵 Ordered in']].map(([v, l]) => (
              <button key={v} onClick={() => setInput(x => ({ ...x, how: v }))}
                style={{ flex: 1, padding: '9px', border: `1.5px solid ${input.how === v ? '#c17f5e' : '#e0d6c8'}`, borderRadius: 10, background: input.how === v ? '#fdf0e8' : '#faf7f3', color: input.how === v ? '#c17f5e' : '#7a6a5a', fontSize: 13, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={F.lbl}>Recipe or restaurant <span style={{ color: '#c0a890', fontWeight: 400 }}>(optional)</span></label>
          <input style={F.inp} placeholder="e.g. Ottolenghi Simple p.42 or Pizza Palace 🍕" value={input.recipe} onChange={e => setInput(x => ({ ...x, recipe: e.target.value }))} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={F.lbl}>Notes — what worked, kid reactions, what to change</label>
          <textarea style={{ ...F.inp, minHeight: 80, resize: 'vertical' }} rows={3}
            placeholder="Kids devoured it! Add less salt next time…"
            value={input.notes} onChange={e => setInput(x => ({ ...x, notes: e.target.value }))} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={F.lbl}>Rating — {input.rating}/5 {'⭐'.repeat(input.rating)}</label>
          <input type="range" min={1} max={5} step={1} value={input.rating}
            onChange={e => setInput(x => ({ ...x, rating: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: '#c17f5e', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c0a890' }}>
            <span>😬 Meh</span><span>😋 Everyone loved it</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: '#f0e9e0', color: '#8b6f5e', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onSave} style={{ flex: 2, padding: '11px', background: '#5c3d2e', color: '#fdf6ee', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Save Meal Log ✓</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ATOMS & STYLES
═══════════════════════════════════════════════════════════ */
function Pill({ bg, children }) {
  return <span style={{ background: bg, color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{children}</span>
}

const S = {
  root:    { minHeight: '100vh', background: '#faf7f3', position: 'relative', overflow: 'hidden', paddingBottom: 60 },
  grain:   { position: 'fixed', inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")", pointerEvents: 'none', zIndex: 0 },
  blob1:   { position: 'fixed', top: -140, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'rgba(193,127,94,0.07)', pointerEvents: 'none' },
  blob2:   { position: 'fixed', bottom: -120, left: -120, width: 380, height: 380, borderRadius: '50%', background: 'rgba(122,158,126,0.07)', pointerEvents: 'none' },
  blob3:   { position: 'fixed', top: '38%', left: '58%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(196,149,106,0.06)', pointerEvents: 'none' },
  toast:   { position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', color: '#fff', padding: '10px 24px', borderRadius: 40, fontSize: 13, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' },
  syncBar: { position: 'fixed', bottom: 16, right: 16, background: '#5c3d2e', color: '#fdf6ee', padding: '8px 16px', borderRadius: 30, fontSize: 12, zIndex: 1999, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' },
  spinner: { width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header:  { background: 'linear-gradient(135deg,#5c3d2e 0%,#8b5e3c 100%)', padding: '26px 20px 22px' },
  hInner:  { maxWidth: 620, margin: '0 auto' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 16 },
  title:   { margin: 0, color: '#fdf6ee', fontSize: 27, fontFamily: 'Lora,serif', fontWeight: 600, letterSpacing: 0.3 },
  sub:     { margin: '3px 0 0', color: '#e8c9a8', fontSize: 12, fontStyle: 'italic', fontFamily: 'Lora,serif' },
  banner:  { background: 'linear-gradient(90deg,#7a9e7e,#4a7c59)', padding: '13px 20px', textAlign: 'center' },
  bLabel:  { margin: 0, color: '#c8e6d0', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  bDate:   { margin: '3px 0 2px', color: '#fff', fontSize: 16, fontFamily: 'Lora,serif' },
  bStat:   { margin: 0, color: '#a8d4b5', fontSize: 12 },
  tabBar:  { display: 'flex', background: '#f0e9e0', borderBottom: '1px solid #e0d6c8', maxWidth: 620, margin: '0 auto', overflowX: 'auto' },
  tab:     { flex: '1 0 auto', padding: '12px 8px', background: 'none', border: 'none', fontSize: 12, color: '#a08870', cursor: 'pointer', borderBottom: '3px solid transparent', whiteSpace: 'nowrap' },
  tabOn:   { color: '#5c3d2e', borderBottomColor: '#c17f5e', fontWeight: 500, background: '#faf7f3' },
  main:    { maxWidth: 620, margin: '0 auto', padding: '20px 16px', position: 'relative', zIndex: 1 },
  note:    { color: '#a08870', fontSize: 13, fontStyle: 'italic', marginBottom: 18, textAlign: 'center' },
}

const C = {
  card:     { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 14px rgba(92,61,46,0.07)', border: '1.5px solid #f0e9e0' },
  cConf:    { background: '#f0f8f2', border: '1.5px solid #b8d8be' },
  cBest:    { border: '1.5px solid #c17f5e', boxShadow: '0 2px 18px rgba(193,127,94,0.14)' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  month:    { margin: 0, color: '#b0a090', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  day:      { margin: '2px 0 0', color: '#3d2c1e', fontSize: 19, fontFamily: 'Lora,serif' },
  hostRow:  { display: 'flex', alignItems: 'center', gap: 8, background: '#e8f4ec', borderRadius: 8, padding: '8px 12px', marginBottom: 12 },
  mealPreview: { display: 'flex', alignItems: 'center', gap: 10, background: '#fdf6ee', borderRadius: 8, padding: '8px 12px', marginBottom: 12, border: '1px solid #f0e0c8' },
  btn:      { padding: '10px 14px', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' },
}

const F = {
  inp: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0d6c8', fontSize: 14, color: '#3d2c1e', background: '#faf7f3', boxSizing: 'border-box', outline: 'none', display: 'block' },
  lbl: { display: 'block', marginBottom: 6, color: '#5c3d2e', fontSize: 13, fontWeight: 500 },
}
