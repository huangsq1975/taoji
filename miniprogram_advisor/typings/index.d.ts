/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    advisorInfo?: {
      name: string
      role: string
      institutionName: string
    }
    token?: string
    loginDone?: boolean
  }
  loginReadyCallback: (() => void) | null
}
