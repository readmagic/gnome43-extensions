
const Me = imports.misc.extensionUtils.getCurrentExtension()

let LunarDateX
try {
  ;({LunarDateX} = Me.imports.backend.ytliu0)
} catch (e0) {
  try {
    ;({LunarDateX} = Me.imports.backend.yetist)
  } catch {
    e0.message = "lunarcal: could not load Lunar Calendar back-end: " + e0.message
    throw e0
  }
}

var LunarDate = LunarDateX
