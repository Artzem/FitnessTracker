import { createEmptyHealthSummary, createHealthAccessState } from '../types'

export const noopHealthProvider = {
  async getAccessState() {
    return {
      ...createHealthAccessState(),
      reason: 'Apple Health is only available in the native iPhone app.'
    }
  },

  async requestPermissions() {
    return {
      ...createHealthAccessState(),
      status: 'unavailable',
      reason: 'Apple Health is only available in the native iPhone app.'
    }
  },

  async readSummary() {
    return createEmptyHealthSummary()
  }
}
