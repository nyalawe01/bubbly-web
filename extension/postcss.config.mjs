// Empty on purpose — extension/ doesn't use Tailwind, but PostCSS resolves
// config by walking up directories, so without this it silently inherited
// the root web app's tailwind.config.ts (extension/ is a subfolder of that
// repo). This file shadows that lookup and keeps the two fully isolated.
export default {};
