# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**韬纪元AI** — A WeChat Mini Program (微信小程序) for AI-powered loan assistance report generation and customer data management. The platform serves loan advisors, institutional managers, and customers to streamline the loan application process via AI-driven profile analysis, form filling, and document packaging.

## Development Environment

This project uses **WeChat DevTools** as the primary development environment. There are no npm build scripts — compilation (TypeScript → JS, SCSS → WXSS) is handled automatically by the WeChat DevTools compiler.

```bash
# Install type definitions only
cd miniprogram_c && npm install
```

To develop, open the `miniprogram_c/` directory in WeChat DevTools (WeChat 开发者工具). The appid is `wxc9ebcb4c289511eb`.

## Project Structure

All source code lives under `miniprogram_c/miniprogram/`:

- **`app.ts`** — App entry point: initializes `wx.login()`, stores startup logs in `wx.setStorageSync`
- **`pages/`** — Page components (each page has `.ts`, `.wxml`, `.wxss`, `.json`)
- **`components/navigation-bar/`** — Custom navigation bar component with back/home button, platform-aware safe area, iOS/Android styling, and animated show/hide
- **`utils/util.ts`** — `formatTime()` and `formatNumber()` helpers

## Architecture

### WeChat Mini Program Conventions
- Pages are registered via `Page({})`, components via `Component({})`
- Global state lives on `app.globalData` (accessed via `getApp<IAppOption>()`)
- Navigation uses `wx.navigateTo()` / `wx.navigateBack()`
- Custom navigation is enabled globally (`"navigationStyle": "custom"` in `app.json`)

### Rendering Stack
- **Renderer:** Skyline (modern WeChat renderer, enabled in `app.json`)
- **Component framework:** `glass-easel` (NDK-based, configured in `project.config.json`)
- **Lazy loading:** `requiredComponents` strategy — only components used in a page are loaded

### TypeScript
Strict mode is enforced (`noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`). Type definitions for WeChat APIs are in `miniprogram_c/typings/` — do not use `wx.*` APIs without corresponding type coverage.

### Styling
Global styles in `app.scss`. Page/component styles in co-located `.scss` files. The SASS compiler plugin is configured in `project.config.json`.

## Key Configuration Files

| File | Purpose |
|------|---------|
| `miniprogram_c/project.config.json` | WeChat DevTools project settings, compiler plugins |
| `miniprogram_c/miniprogram/app.json` | App-level page list, window config, renderer settings |
| `miniprogram_c/tsconfig.json` | TypeScript compiler options |

## Documentation

Feature specifications and UI screenshots are in `docs/韬纪元AI_公网功能清单_20260615/`. Key constraints from the spec:
- The platform does **not** directly issue loans or guarantee amounts
- All AI-generated results require advisor review before submission
- Public demo URL is documented in the HTML spec files
