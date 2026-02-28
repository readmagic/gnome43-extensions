
// This file uses the legacy `imports' system to load the
// ChineseCalendar library, because the code of the library is not
// coded in ES Modules

const GLib = imports.gi.GLib

// Code from gnome-shell 44 : extenstionUtils.js:installImporter
let custom_importer
const origSearchPath = imports.searchPath.slice()
imports.searchPath = [GLib.get_user_data_dir(), ...GLib.get_system_data_dirs()]
try {
  // importing a "subdir" creates a new importer object that doesn't affect
  // the global one
  custom_importer = imports.ChineseCalendar
} catch (e) {
  throw e
} finally {
  imports.searchPath = origSearchPath
}

var calendar = ((loader) => {
  // map to import functions targetModule -> sourceModule -> function
  const importMap = {
    decompressSunMoonData: {
      utilities: [
        'getJD',
      ],
    },
    calendar: {
      utilities: [
        'NdaysGregJul',
        'getJD',
      ],
      calendarData: [
        'offsets_sunMoon',
        'solarTerms',
        'newMoons',
        'fullMoons',
        'firstQuarters',
        'thirdQuarters',
        'solarTermMoonPhase_ystart',
        'ChineseToGregorian',
        'calendricalSolarTerms',
        'calendricalSolarTerms_ystart',
      ],
      decompressSunMoonData: [
        'decompress_solarTerms',
        'decompress_moonPhases',
      ],
      'eclipse_linksM722-2202': [
        'eclipse_year_range',
        'solar_eclipse_link',
        'lunar_eclipse_link',
      ],
    },
  }

  const { calendar } = loader

  for (const [target, imp] of Object.entries(importMap)) {
    const tmod = loader[target]
    for (const [src, n] of Object.entries(imp)) {
      const smod = loader[src]
      for (const fn of n) {
        tmod[fn] = smod[fn]
      }
    }
  }

  return calendar
})(custom_importer)
