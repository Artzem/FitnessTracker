import { Capacitor } from '@capacitor/core'
import { Health } from '@capgo/capacitor-health'
import { createEmptyHealthSummary, HEALTH_PERMISSION_READ_TYPES } from '../types'

const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS
const SLEEP_STATES = new Set(['asleep', 'deep', 'light', 'rem'])

const toIso = (date) => date.toISOString()

const toNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const average = (samples = []) => {
  if (!samples.length) return null
  const total = samples.reduce((sum, sample) => sum + (toNumber(sample.value) || 0), 0)
  return Number((total / samples.length).toFixed(1))
}

const sumValues = (samples = []) =>
  Number(samples.reduce((sum, sample) => sum + (toNumber(sample.value) || 0), 0).toFixed(0))

const latestValue = (samples = []) => {
  if (!samples.length) return null
  const latest = [...samples].sort((left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime())[0]
  return toNumber(latest?.value)
}

const getYesterdayWindow = () => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const yesterdayStart = new Date(todayStart.getTime() - ONE_DAY_MS)
  return {
    yesterdayStart,
    todayStart
  }
}

const bucketSleepByEndDate = (samples = []) => {
  return samples.reduce((result, sample) => {
    if (!SLEEP_STATES.has(sample.sleepState)) return result
    const bucketKey = new Date(sample.endDate).toDateString()
    result[bucketKey] = (result[bucketKey] || 0) + (toNumber(sample.value) || 0)
    return result
  }, {})
}

const getLatestSleepHours = (samples = []) => {
  const buckets = bucketSleepByEndDate(samples)
  const latestBucket = Object.entries(buckets).sort((left, right) => new Date(right[0]).getTime() - new Date(left[0]).getTime())[0]
  if (!latestBucket) return null
  return Number((latestBucket[1] / 60).toFixed(1))
}

const filterAfter = (samples = [], startDate) =>
  samples.filter((sample) => new Date(sample.endDate || sample.startDate).getTime() >= startDate.getTime())

export const appleHealthProvider = {
  async getAccessState() {
    const platform = Capacitor.getPlatform()
    if (platform !== 'ios') {
      return {
        available: false,
        platform,
        connected: false,
        status: 'unavailable',
        reason: 'Apple Health requires the native iPhone app.'
      }
    }

    const availability = await Health.isAvailable()
    if (!availability.available) {
      return {
        available: false,
        platform: availability.platform || platform,
        connected: false,
        status: 'unavailable',
        reason: availability.reason || 'Apple Health is unavailable on this device.'
      }
    }

    const authorization = await Health.checkAuthorization({
      read: HEALTH_PERMISSION_READ_TYPES
    })

    const connected = HEALTH_PERMISSION_READ_TYPES.every((identifier) => authorization.readAuthorized.includes(identifier))
    return {
      available: true,
      platform: availability.platform || platform,
      connected,
      status: connected ? 'connected' : 'needs-permission',
      reason: connected ? '' : 'Allow Apple Health read access to improve workout coaching.'
    }
  },

  async requestPermissions() {
    await Health.requestAuthorization({
      read: HEALTH_PERMISSION_READ_TYPES
    })

    return this.getAccessState()
  },

  async readSummary({ lookbackHours = 48 } = {}) {
    const now = new Date()
    const windowStart = new Date(now.getTime() - (lookbackHours * ONE_HOUR_MS))
    const last24Start = new Date(now.getTime() - ONE_DAY_MS)
    const { yesterdayStart, todayStart } = getYesterdayWindow()

    const [sleepResult, stepsResult, heartRateResult, restingHeartRateResult, caloriesResult, hrvResult, workoutsResult] = await Promise.all([
      Health.readSamples({ dataType: 'sleep', startDate: toIso(windowStart), endDate: toIso(now), limit: 400, ascending: true }),
      Health.readSamples({ dataType: 'steps', startDate: toIso(last24Start), endDate: toIso(now), limit: 400, ascending: true }),
      Health.readSamples({ dataType: 'heartRate', startDate: toIso(last24Start), endDate: toIso(now), limit: 400, ascending: true }),
      Health.readSamples({ dataType: 'restingHeartRate', startDate: toIso(windowStart), endDate: toIso(now), limit: 50, ascending: true }),
      Health.readSamples({ dataType: 'calories', startDate: toIso(last24Start), endDate: toIso(now), limit: 400, ascending: true }),
      Health.readSamples({ dataType: 'heartRateVariability', startDate: toIso(windowStart), endDate: toIso(now), limit: 100, ascending: true }),
      Health.queryWorkouts({ startDate: toIso(yesterdayStart), endDate: toIso(todayStart), limit: 100, ascending: true })
    ])

    const sleepSamples = sleepResult.samples || []
    const heartRateSamples = filterAfter(heartRateResult.samples || [], last24Start)
    const hrvSamples = filterAfter(hrvResult.samples || [], last24Start)

    return {
      date: now.toISOString(),
      sleepHours: getLatestSleepHours(sleepSamples),
      steps: sumValues(stepsResult.samples || []),
      averageHeartRate: average(heartRateSamples),
      restingHeartRate: latestValue(restingHeartRateResult.samples || []),
      activeCalories: sumValues(caloriesResult.samples || []),
      workoutsYesterday: (workoutsResult.workouts || []).length,
      hrv: average(hrvSamples)
    }
  }
}
