/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: {
      name: string
      phone: string
      isLoggedIn: boolean
    }
  }
}
