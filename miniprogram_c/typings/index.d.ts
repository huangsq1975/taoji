/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo: {
      name: string
      phone: string
      isLoggedIn: boolean
    }
    customerId: number | null
    advisorId: number | null
    token: string | null
    needsAdvisorSelection: boolean
  }
  loginReadyCallback: (() => void) | null
}
