
var tl = {}
// 繁體字
tl[1] = {
  "干支": "幹支",
  "节日": "節日",
  "%(SHI)时": "%(SHI)時",
}

// en
tl[0] = {
  "节日": "Holidays",
  "干支": "Sexagenary cycle",
  "%(SHI)时": "%(SHI) H",
}
tl[-1] = {
  ...tl[0],
  "%(SHI)时": "H.o.%(SHI)",
}

// de
tl[-2] = {
  "节日": "Feste",
  "干支": "Stamm und Zweig",
  "%(SHI)时": "%(SHI).S",
}
tl[-3] = {
  ...tl[-2],
  "%(SHI)时": "S.d.%(SHI)",
}

tl = (tl => (lang, str) => {
  if (lang in tl && str in tl[lang])
    return tl[lang][str]
  else
    return str
})(tl)
