/// This code is based on
///
/// https://github.com/ytliu0/ChineseCalendar
///
/// Licence:  GPL-3.0

const Me = imports.misc.extensionUtils.getCurrentExtension()

const {calendar} = Me.imports.backend['ytliu0-loader']

function unhtmlchar (input) {
  return input.replaceAll(/&#(\d+);/g, (_, p1) => String.fromCodePoint(~~p1))
}

function myAddChineseDate(y, m, d, calVars) {
  // # of days from Dec 31 in the previous year
  let dd = calVars.mday[m] + d
    
  // Determine the month and date in Chinese calendar
  let cd, cm=0, n=calVars.cmonthDate.length
  for (let i=0; i<n-1; i++) {
    if (dd >= calVars.cmonthDate[i] && dd < calVars.cmonthDate[i+1]) {
      cm = calVars.cmonthNum[i]
      cd = dd - calVars.cmonthDate[i] + 1
    }
  }

  if (cm==0) {
    cm = calVars.cmonthNum[n-1]
    cd = dd - calVars.cmonthDate[n-1] + 1
  }

  return {
    newMoonClose: calendar.newMoonCloseToMidnight(y, cm),
    cm: Math.abs(cm),
    leap: cm < 0,
    cd
  }
}

function myAddSexagenaryDays(m, d, calVars) {
  // # of days from Dec 31 in the previous year
  let dd = calVars.mday[m] + d
  let jd = calVars.jd0 + dd + 1

  return {
    h: (jd-1) % 10,
    e: (jd+1) % 12
  }
}

function myAdd24solterms(m, calVars) {
  let m0 = calVars.mday[m]
  let m1 = calVars.mday[m+1]
  let result = {}
    
  for (let i=0; i<calVars.solar.length; i++) {
    let dd = Math.floor(calVars.solar[i])
    if (dd > m0 && dd <= m1) {
      let h = 24.0*(calVars.solar[i] - dd)
      let d = dd - m0
      result[d] = i
    }
  }

  return result
}

// Calculate the number of Chinese months spanned by 
// this Gregorian/Julian month m in year y. This is equal to 1 + number 
// of first dates of Chinese months occurring on and 
// after the second day of this month and before the 
// first date of the next month.
// Also calculate the sexagenary month cycle for years > -480.
function myAddChineseMonths(m, y, cyear, calVars) {
  let m0 = calVars.mday[m]
  let m1 = calVars.mday[m+1]

  // Sexagenary year cycle for year y-1
  let ihy1 = (y + 725) % 10
    
  let nMonth = 1, j
  let cmonth = [], cmyear = []
  // Determine the Chinese month on the first day of 
  // this Gregorian/Julian month
  let n = calVars.cmonthDate.length
  for (let i=0; i<n; i++) {
    if (calVars.cmonthDate[i] <= m0+1 && calVars.cmonthDate[i+1] > m0+1) {
      let cm = calVars.cmonthNum[i]
      let jian = calVars.cmonthJian[i]
      // sexagenary month cycle
      let mm = 12*(ihy1 + calVars.cmonthXiaYear[i]) + Math.abs(jian)
      mm = (mm+1) % 10
      let cmsex = {
        h: mm,
        e: (Math.abs(jian)+1) % 12
      }
      let tmp = {
        cmsex,
        cm: Math.abs(cm),
        leap: cm < 0,
        cmonthLong: calVars.cmonthLong[i]
      }
      cmonth.push(tmp)
      tmp = cyear[calVars.cmonthYear[i]]
      cmyear.push(tmp)
      j = i+1
      break
    }
  }
  for (let i=j; i<n; i++) {
    let d1 = calVars.cmonthDate[i]
    if (d1 > m0+1 && d1 <= m1) {
      nMonth++
      let cm = calVars.cmonthNum[i]
      let jian = calVars.cmonthJian[i]
      // sexagenary month cycle
      let mm = 12*(ihy1 + calVars.cmonthXiaYear[i]) + Math.abs(jian)
      mm = (mm+1) % 10
      let cmsex = {
        h: mm,
        e: (Math.abs(jian)+1) % 12
      }
      let tmp = {
        cmsex,
        cm: Math.abs(cm),
        leap: cm < 0,
        cmonthLong: calVars.cmonthLong[i]
      }
      cmonth.push(tmp)
      tmp = cyear[calVars.cmonthYear[i]]
      cmyear.push(tmp)
    }
  }
  return {nMonth, cmonth, cmyear}
}

// Print the table for one Gregorian/Julian month
function myPrintMonth(m, year, cyear, calVars) {
  const cmon = myAddChineseMonths(m, year, cyear, calVars)
  let result = {
    cmon,
    day: [],
    solterms: myAdd24solterms(m, calVars)
  }
    
  // # of days in the months
  let n = calVars.mday[m+1] - calVars.mday[m]
  for (let i=1; i<=n; i++) {
    result.day[i] = {
      lunar: myAddChineseDate(year, m, i, calVars),
      sexagenary: myAddSexagenaryDays(m, i, calVars),
    }
  }

  return result
}

// Set up the calendar for the Gregorian/Julian year
function myCalendar (year) {
  // we do not support ancient calendar even though the original code does
  if (year < 1734 || year > 2200)
    throw new Error('year out of range')

  const calVars = calendar.calDataYear(year, {region: 'default'})
    
  // How many Chinese years does this Gregorian/Julian calendar span?
  const n = calVars.cmonthDate.length
  const Ncyear = calVars.cmonthYear[n-1] - calVars.cmonthYear[0] + 1
    
  // Determine the date(s) of the Chinese new year
  let mm, dd
  let mm1 = [], dd1 = []
  let firstMonth = []
  for (let i=0; i<3; i++) {
    // if (year > -110)
    firstMonth[i] = calendar.firstMonthNum(year-1+i)
  }
  for (let i=1; i<Ncyear; i++) {
    const firstMon = firstMonth[calVars.cmonthYear[0] + i]
    for (let j=1; j<n; j++) {
      if (calVars.cmonthYear[j]==calVars.cmonthYear[0]+i && 
          calVars.cmonthNum[j]==firstMon) {
        dd = calVars.cmonthDate[j]
        for (let k=0; k<13; k++) {
          if (dd <= calVars.mday[k]) {
            mm = k
            break
          }
        }
        mm1.push(mm)
        dd1.push(dd - calVars.mday[mm-1])
      }
    }
  }
    
  const ih0 = (year + 725) % 10
  const ie0 = (year + 727) % 12
  const ih = (year + 726) % 10
  const ie = (year + 728) % 12
  const ih2 = (year + 727) % 10
  const ie2 = (year + 729) % 12
  const yearc = year.toString()
  const sy0 = year-1
  const cy0 = calVars.cmonthYear[0]
  const animal = [ie0, ie, ie2]
  const cyear = [
    {h: ih0, e: ie0},
    {h: ih, e: ie},
    {h: ih2, e: ie2}
  ]

  let result = {
    yearc,
    month: []
  }
  if (Ncyear==1) {
    result.cyear = [
      {
        cyear: cyear[cy0],
        animal: animal[cy0],
        soly: sy0+cy0,
      }
    ]
  } else if (Ncyear==2) {
    result.cyear = [
      {
        before: {
          month: mm1[0],
          day: dd1[0],
        },
        cyear: cyear[cy0],
        animal: animal[cy0],
        soly: sy0+cy0,
      },
      {
        onAndAfter: {
          month: mm1[0],
          day: dd1[0],
        },
        cyear: cyear[cy0+1],
        animal: animal[cy0+1],
        soly: sy0+cy0+1,
      },
    ]
  } else {
    result.cyear = [
      {
        before: {
          month: mm1[0],
          day: dd1[0],
        },
        cyear: cyear[cy0],
        animal: animal[cy0],
        soly: sy0+cy0,
      },
      {
        between: [
          {
            month: mm1[0],
            day: dd1[0],
          },
          {
            month: mm1[1],
            day: dd1[1]-1,
          }
        ],
        cyear: cyear[cy0+1],
        animal: animal[cy0+1],
        soly: sy0+cy0+1,
      },
      {
        onAndAfter: {
          month: mm1[1],
          day: dd1[1],
        },
        cyear: cyear[cy0+2],
        animal: animal[cy0+2],
        soly: sy0+cy0+2,
      }
    ]
  }

  for (let m=0; m<12; m++) {
    result.month[m] = myPrintMonth(m, year, cyear, calVars)
  }

  return result
}

var langConstant = calendar.langConstant
