import { Capacitor } from '@capacitor/core'
import { saveCachedHealthSummary, loadCachedHealthSummary } from './cache'
import { appleHealthProvider } from './providers/appleHealthProvider'
import { noopHealthProvider } from './providers/noopHealthProvider'

const getProvider = () => {
  const platform = Capacitor.getPlatform()
  return platform === 'ios' ? appleHealthProvider : noopHealthProvider
}

export const getHealthAccessState = async () => getProvider().getAccessState()

export const requestHealthPermissions = async () => getProvider().requestPermissions()

export const readHealthSummary = async ({ userId, lookbackHours = 48 } = {}) => {
  const summary = await getProvider().readSummary({ lookbackHours })
  if (userId && summary) {
    saveCachedHealthSummary(userId, summary)
  }
  return summary
}

export const getCachedHealthSummary = (userId) => loadCachedHealthSummary(userId)
