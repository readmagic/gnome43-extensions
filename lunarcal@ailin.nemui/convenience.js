
const Gi = imports._gi

var console = {
  log: globalThis.log,
  assert: (condition, message) => {
    if (!condition)
      throw new Error(message)
  }
}

var InjectionManager = class InjectionManager {
  constructor () {
    this._savedMethods = new Map()
  }

  overrideMethod (prototype, methodName, createOverrideFunc) {
    const originalMethod = this._saveMethod(prototype, methodName)
    this._installMethod(prototype, methodName, createOverrideFunc(originalMethod))
  }

  restoreMethod (prototype, methodName) {
    const savedProtoMethods = this._savedMethods.get(prototype)
    if (!savedProtoMethods)
      return

    const originalMethod = savedProtoMethods.get(methodName)
    if (originalMethod === undefined)
      delete prototype[methodName]
    else
      this._installMethod(prototype, methodName, originalMethod)

    savedProtoMethods.delete(methodName)
    if (savedProtoMethods.size === 0)
      this._savedMethods.delete(prototype)
  }

  clear () {
    for (const [proto, map] of this._savedMethods) {
      map.forEach(
        (_, methodName) => this.restoreMethod(proto, methodName))
    }
    console.assert(this._savedMethods.size === 0,
                   `${this._savedMethods.size} overrides left after clear()`)
  }

  _saveMethod(prototype, methodName) {
    let savedProtoMethods = this._savedMethods.get(prototype)
    if (!savedProtoMethods) {
      savedProtoMethods = new Map()
      this._savedMethods.set(prototype, savedProtoMethods)
    }

    const originalMethod = prototype[methodName]
    savedProtoMethods.set(methodName, originalMethod)
    return originalMethod
  }

  _installMethod (prototype, methodName, method) {
    if (methodName.startsWith('vfunc_')) {
      const giPrototype = prototype[Gi.gobject_prototype_symbol]
      giPrototype[Gi.hook_up_vfunc_symbol](methodName.slice(6), method)
    } else {
      prototype[methodName] = method
    }
  }
}
