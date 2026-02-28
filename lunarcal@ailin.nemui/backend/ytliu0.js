
const Gio = imports.gi.Gio
const GLib = imports.gi.GLib

const Me = imports.misc.extensionUtils.getCurrentExtension()

const {console} = Me.imports.convenience
const {myCalendar, langConstant, unhtmlchar} = Me.imports.backend['ytliu0-calendar']
const {tlMap, tlLeap} = Me.imports.backend['ytliu0-lang']

function ucfirst ([first, ...rest]) {
  return first.toUpperCase() + rest.join('')
}

function weekth (day) {
  let a = 1
  while (day > 7) {
    day -= 7
    a += 1
  }
  return a
}

// name of the holiday data file
const holiday_fn = 'liblunar/holiday.dat'

var LunarDateX = class LunarDateX {

  constructor () {
    // calendar data
    this._calendar = null
    this._oldCalendar = null
    this._solar_date = new Date(undefined)

    // language data
    this._lang = 0
    this._langVars = langConstant(Math.clamp(this._lang, 0, 2))
    this._holidayLang = ''

    // holidays changed notify
    this._notifyHoliday = null

    // holiday file
    this._userHolidayFile = Gio.File.new_for_path(GLib.get_user_config_dir() + '/' + holiday_fn)
    this._holidayData = new GLib.KeyFile()
    this._holidayData.set_list_separator('|'.codePointAt(0))
    this._load_holiday()

    // holiday file monitor
    this._holidayMon = this._userHolidayFile.monitor_file(Gio.FileMonitorFlags.NONE, null)
    const userConfigDirFile = Gio.File.new_for_path(GLib.get_user_config_dir())
    this._holidayMon.connect('changed', (mon, file, otherFile, event) => {
      if ((event === Gio.FileMonitorEvent.CHANGES_DONE_HINT ||
           event === Gio.FileMonitorEvent.DELETED) &&
             userConfigDirFile.get_relative_path(file) === holiday_fn) {
        this._load_holiday()
      }
    })
  }

  _load_holiday () {
    try {
      const [ok, file] = this._holidayData.load_from_dirs(holiday_fn, [
        GLib.get_user_config_dir(),
        GLib.get_user_data_dir(),
        ...GLib.get_system_data_dirs()
      ], GLib.KeyFileFlags.KEEP_TRANSLATIONS)
      if (this._notifyHoliday)
        this._notifyHoliday()
      return true
    } catch (e) {
      console.log(`lunarcal: could not load holiday file: ${e}`)
      return false
    }
  }

  // Check whether there is a holiday on the current date
  // Returns: 1 if there is holidays, "" if not
  getHoliday () {
    if (!this._calendar)
      return ""
    if (this.getSolterm() !== undefined)
      return 1
    if (this._holidayData.has_group("SOLAR")) {
      const solar = "%02d%02d".format(this.sm, this.sd)
      try {
        this._holidayData.get_locale_string("SOLAR", solar, this._holidayLang)
        return 1
      } catch {}
    }
    if (this._holidayData.has_group("LUNAR")) {
      const lunar = "%02d%02d".format(this.cm, this.cd)
      try {
        this._holidayData.get_locale_string("LUNAR", lunar, this._holidayLang)
        return 1
      } catch {}
    }
    if (this._holidayData.has_group("WEEK")) {
      const week = "%02d%01d%01d".format(this.sm, weekth(this.sd), this._solar_date.getDay())
      try {
        this._holidayData.get_locale_string("WEEK", week, this._holidayLang)
        return 1
      } catch {}
    }
    return ""
  }

  _get_holiday_str (group, key) {
    const str = this._holidayData.get_locale_string_list(group, key, this._holidayLang)
    return str[str.length - 1]
  }

  // Return the holidays, separated by `sep'
  get_jieri (sep) {
    if (!this._calendar)
      return ""
    let jieri = []
    const solterm = this.getSolterm()
    if (solterm !== undefined) {
      if (this._lang in tlMap && "soltermNames" in tlMap[this._lang])
        jieri.push(tlMap[this._lang].soltermNames[solterm])
      else
        jieri.push(this._langVars.soltermNames[solterm])
    }
    if (this._holidayData.has_group("SOLAR")) {
      const solar = "%02d%02d".format(this.sm, this.sd)
      try {
        jieri.push(this._get_holiday_str("SOLAR", solar))
      } catch {}
    }
    if (this._holidayData.has_group("LUNAR")) {
      const lunar = "%02d%02d".format(this.cm, this.cd)
      try {
        jieri.push(this._get_holiday_str("LUNAR", lunar))
      } catch {}
    }
    if (this._holidayData.has_group("WEEK")) {
      const week = "%02d%01d%01d".format(this.sm, weekth(this.sd), this._solar_date.getDay())
      try {
        jieri.push(this._get_holiday_str("WEEK", week))
      } catch {}
    }
    return jieri.join(sep)
  }

  getSolterm () {
    return this._calendar.month[this.sm - 1].solterms[this.sd]
  }

  // set up the calendar for the selected solar date
  _ensureCalendar () {
    if (!this._calendar || this._calendar.yearc != this.sy) {
      const old = this._oldCalendar
      this._oldCalendar = this._calendar
      if (old && old.yearc == this.sy) {
        this._calendar = old
      } else {
        try {
          this._calendar = myCalendar(this.sy)
        } catch {
          this._calendar = null
        }
      }
    }
  }

  // locale specific formatting functions
  _tlFormat (format) {
    if (this._lang in tlMap && format in tlMap[this._lang])
      return tlMap[this._lang][format]
    else
      return format
  }

  _tlSex (sex) {
    if (this._lang in tlMap && "elements" in tlMap[this._lang])
      return tlMap[this._lang].elementsJoin(
        tlMap[this._lang].elements[~~(sex.h / 2)],
        this._tlAnimal(sex.e)
      )
    else if (this._lang <= 0)
      return unhtmlchar(this._langVars.heaven[sex.h] + ' ' + this._langVars.earth[sex.e])
    else
      return this._langVars.heaven[sex.h] + this._langVars.earth[sex.e]
  }

  _tlMonth (cm) {
    return (cm.leap ? tlLeap[Math.clamp(this._lang, 0, 2)] : '') + this._langVars.cmonth[cm.cm - 1]
  }

  _tlDay (cd) {
    if (this._lang <= 0)
      return cd
    else
      return this._langVars.date_numChi[cd - 1]
  }

  _tlAnimal (animal) {
    if (this._lang in tlMap && "animal" in tlMap[this._lang])
      return tlMap[this._lang].animal[animal]
    else
      return this._langVars.animal[animal]
  }

  // calendar properties of currently selected day
  //
  // lunar day object
  get cday () {
    return this._calendar.month[this.sm - 1].day[this.sd]
  }

  // lunar month object
  get cmon () {
    const cmon = this._calendar.month[this.sm - 1].cmon
    const lunar = this.cday.lunar
    const [ cm ] = cmon.cmonth.filter((e) => e.cm === lunar.cm && e.leap === lunar.leap)
    return cm
  }

  // lunar year object
  get cyear () {
    const cy = this._calendar.cyear
    const ny = cy.length
    if (ny >= 3) {
      if ((this.sm == cy[1].between[0].month &&
           this.sd >= cy[1].between[0].day) ||
          (this.sm > cy[1].between[0].month &&
           this.sm < cy[1].between[1].month) ||
          (this.sm == cy[1].between[1].month &&
           this.sd <= cy[1].between[1].day))
        return cy[1]
    }
    if (ny >= 2) {
      if ((this.sm == cy[ny-1].onAndAfter.month &&
           this.sd >= cy[ny-1].onAndAfter.day) ||
          this.sm > cy[ny-1].onAndAfter.month)
        return cy[ny-1]
    }
    return cy[0]
  }

  // gregorian day
  get sd () {
    return this._solar_date.getDate()
  }

  // gregorian month
  get sm () {
    return this._solar_date.getMonth() + 1
  }

  // gregorian year
  get sy () {
    return this._solar_date.getFullYear()
  }

  // Format lunar date according to `format'
  strftime (format) {
    if (!this._calendar)
      return ""
    return this._tlFormat(format).replaceAll(/%\(([^)]+)\)/g, (_, p1) => this[p1])
  }

  // the bazi are currently unimplemented, do not use
  get Y8 () {
    return '?'
  }

  get M8 () {
    return '?'
  }

  get D8 () {
    return '?'
  }

  // supported formats:
  //
  // sexagenary year
  get Y60 () {
    const sex = this.cyear.cyear
    return this._tlSex(sex)
  }

  // sexagenary month
  get M60 () {
    const sex = this.cmon.cmsex
    return this._tlSex(sex)
  }

  // sexagenary day
  get D60 () {
    const sex = this.cday.sexagenary
    return this._tlSex(sex)
  }

  // zodiac
  get shengxiao () {
    return this._tlAnimal(this.cyear.animal)
  }

  // sexagenary year
  get NIAN () {
    const sex = this.cyear.cyear
    return this._tlSex(sex)
  }

  // gregorian year at time of lunar new year
  get csy () {
    return this.cyear.soly
  }

  // Lunar month
  get cm () {
    const lunar = this.cday.lunar
    return lunar.leap ? -lunar.cm : lunar.cm
  }

  get YUE () {
    const lunar = this.cday.lunar
    return this._tlMonth(lunar)
  }

  // Lunar day (untranslated)
  get cd () {
    return this.cday.lunar.cd
  }

  get ri () {
    return this.cd
  }

  // Lunar day
  get RI () {
    return this._tlDay(this.cd)
  }

  // double hour
  get shi () {
    return (~~((this._solar_date.getHours() + 1) / 2)) % 12
  }

  getShi () {
    if (this._lang in tlMap && "hours" in tlMap[this._lang]) {
      if (tlMap[this._lang].hours)
        return tlMap[this._lang].hours[this.shi]
      else
        return this._tlAnimal(this.shi)
    } else if (this._lang <= 0) {
      return ucfirst(unhtmlchar(this._langVars.earth[this.shi]))
    } else {
      return this._langVars.earth[this.shi]
    }
  }

  get SHI () {
    return this.getShi()
  }

  // Set current date to `date' at noon
  setDateNoon (date) {
    let noonDate = new Date(date)
    noonDate.setHours(12, 0, 0, 0)
    this._solar_date = noonDate
    this._ensureCalendar()
  }

  // Set current date to `date'
  setDate (date) {
    this._solar_date = new Date(date)
    this._ensureCalendar()
  }

  // set the language
  setLang (lang) {
    this._lang = lang
    this._langVars = langConstant(Math.clamp(this._lang, 0, 2))
  }

  // set the holiday language
  setHoliday (lang) {
    this._holidayLang = lang
  }
}

LunarDateX.prototype.strftimex = LunarDateX.prototype.strftime
LunarDateX.backend = 'ytliu0'
