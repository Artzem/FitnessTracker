const HEALTH_SUMMARY_CACHE_PREFIX = 'fittrack_health_summary'

const getCacheKey = (userId = 'guest') => `${HEALTH_SUMMARY_CACHE_PREFIX}_${userId}`

export const loadCachedHealthSummary = (userId) => {
  try {
    const raw = localStorage.getItem(getCacheKey(userId))
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Could not read cached health summary:', error)
    return null
  }
}

export const saveCachedHealthSummary = (userId, summary) => {
  try {
    localStorage.setItem(getCacheKey(userId), JSON.stringify(summary))
  } catch (error) {
    console.error('Could not cache health summary:', error)
  }
}
