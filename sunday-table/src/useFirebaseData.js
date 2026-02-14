import { useState, useEffect, useCallback } from 'react'
import {
  doc, getDoc, setDoc, collection,
  onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { FAMILIES, HOST_ROTATION } from './constants'

async function ensureConfig() {
  const ref  = doc(db, 'config', 'app')
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      families:      FAMILIES,
      hostRotation:  HOST_ROTATION,
      lastHostIndex: -1,
      createdAt:     serverTimestamp(),
    })
  }
}

export function useFirebaseData() {
  const [config,  setConfig]  = useState(null)
  const [dinners, setDinners] = useState({})   // { 'YYYY-MM-DD': dinnerObject }
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    ensureConfig().catch(e => setError(e.message))

    const unsub = onSnapshot(
      doc(db, 'config', 'app'),
      snap => { if (snap.exists()) setConfig(snap.data()); setLoading(false) },
      e    => { setError(e.message); setLoading(false) }
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'dinners'),
      snap => {
        const map = {}
        snap.forEach(d => { map[d.id] = d.data() })
        setDinners(map)
      },
      e => console.error('Dinners listener:', e)
    )
    return unsub
  }, [])

  const famById = useCallback(
    id => config?.families?.find(f => f.id === id),
    [config]
  )

  const toggleAvail = useCallback(async (dateKey, famId) => {
    setSyncing(true)
    try {
      const ref  = doc(db, 'dinners', dateKey)
      const snap = await getDoc(ref)

      if (!snap.exists()) {
        await setDoc(ref, {
          date: dateKey, available: [famId], declined: [],
          confirmed: false, hostId: null, mealLog: null,
          updatedAt: serverTimestamp(),
        })
      } else {
        const d  = snap.data()
        const av = d.available || []
        const dc = d.declined  || []

        if (av.includes(famId)) {
          await updateDoc(ref, { available: arrayRemove(famId), declined: arrayUnion(famId), updatedAt: serverTimestamp() })
        } else if (dc.includes(famId)) {
          await updateDoc(ref, { declined: arrayRemove(famId), updatedAt: serverTimestamp() })
        } else {
          await updateDoc(ref, { available: arrayUnion(famId), updatedAt: serverTimestamp() })
        }
      }
    } catch (e) { setError(e.message) }
    setSyncing(false)
  }, [])

  const confirmDinner = useCallback(async (dateKey) => {
    setSyncing(true)
    try {
      const cfgRef  = doc(db, 'config', 'app')
      const cfgSnap = await getDoc(cfgRef)
      const cfg     = cfgSnap.data()
      const nextIdx = (cfg.lastHostIndex + 1) % cfg.hostRotation.length
      const hostId  = cfg.hostRotation[nextIdx]

      await updateDoc(doc(db, 'dinners', dateKey), { confirmed: true, hostId, updatedAt: serverTimestamp() })
      await updateDoc(cfgRef, { lastHostIndex: nextIdx })
    } catch (e) { setError(e.message) }
    setSyncing(false)
  }, [])

  const saveMealLog = useCallback(async (dateKey, log) => {
    setSyncing(true)
    try {
      const ref  = doc(db, 'dinners', dateKey)
      const snap = await getDoc(ref)
      const payload = { mealLog: { ...log, savedAt: new Date().toISOString() }, updatedAt: serverTimestamp() }
      if (!snap.exists()) {
        await setDoc(ref, { date: dateKey, available: [], declined: [], confirmed: false, hostId: null, ...payload })
      } else {
        await updateDoc(ref, payload)
      }
    } catch (e) { setError(e.message) }
    setSyncing(false)
  }, [])

  return { config, dinners, loading, syncing, error, famById, toggleAvail, confirmDinner, saveMealLog }
}
