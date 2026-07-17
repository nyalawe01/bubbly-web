// shared/constants/themes.ts
//
// Compatibility shim. The canonical theme source moved to shared/theme/ (bundle
// shape + derivation). This file just re-exports so existing imports
// (@/shared/constants/themes, @shared/constants/themes) keep resolving.
export * from "../theme/types";
export * from "../theme/themes";
