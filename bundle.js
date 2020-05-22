(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const stackframes = require('..')

document.body.innerHTML = `<xmp>${demo}\ndemo()</xmp><hr><h2>open devtools console to check results:</h2>`//'<h1> open devtools console: </h1>'

demo()

function demo () {
  var error

  try {
    function foobarbaz () { throw new Error('foobar') }
    function bazbarfoo () { foobarbaz() }
    bazbarfoo()
  } catch (e) {
    error = e
  }

  example()
  function example () { foo() }
  function foo () { bar() }
  function bar () { baz() }
  function baz () {

    const defaultFlags = stackframes.defaultFlags
    console.log(defaultFlags)
    const flags = defaultFlags.filter((_, i) => i%2) // take every second flag

    console.log('0', stackframes(error, flags))
    console.log('1', stackframes())
    console.log('2', stackframes({ exclude: foo }))
    console.log('3', stackframes({ exclude: example }))
    console.log('4', stackframes({ depths: 2, exclude: baz }))
    console.log('5', stackframes({ depths: 2 }))
    console.log('6', stackframes(null, flags))
  }
}

},{"..":3}],2:[function(require,module,exports){

module.exports = jsonloop

function jsonloop (specialChar = '.') {
  const safeSpecialChar = '\\x' + ('0' + specialChar.charCodeAt(0).toString(16)).slice(-2)
  const escapedSafeSpecialChar = '\\' + safeSpecialChar
  const specialCharRG = new RegExp(safeSpecialChar, 'g')
  const safeSpecialCharRG = new RegExp(escapedSafeSpecialChar, 'g')
  const safeStartWithSpecialCharRG = new RegExp('(?:^|([^\\\\]))' + escapedSafeSpecialChar)
  const indexOf = [].indexOf || function (v) {
      for(var i=this.length;i--&&this[i]!==v;);
      return i
    }

  return { stringify, parse }
  function parse (text, reviver) {
    return JSON.parse(text, generateReviver(reviver))
  }
  function stringify (value, replacer, space) {
    const replace = generateReplacer(value, replacer)
    return JSON.stringify(value, replace, space)
  }
  function generateReplacer (value, replacer, resolve) {
    replacer = typeof replacer === 'object' ? (key, value) => key !== '' && indexOf.call(replacer, key) < 0 ? void 0 : value : replacer
    const path = []
    const all  = [value]
    const seen = [value]
    const mapp = [specialChar]
    var doNotIgnore = false
    var last = value
    var lvl  = 1
    var i
    return function (key, value) {
      try {
        // the replacer has rights to decide
        // if a new object should be returned
        // or if there's some key to drop
        // let's call it here rather than "too late"
        if (replacer) value = replacer.call(this, key, value)
        if (doNotIgnore) { // first pass should be ignored, since it's just the initial object
          if (last !== this) {
            i = lvl - indexOf.call(all, this) - 1
            lvl -= i
            all.splice(lvl, all.length)
            path.splice(lvl - 1, path.length)
            last = this
          }
          if (typeof value === 'object' && value) {
            // if object isn't referring to parent object, add to the
            // object path stack. Otherwise it is already there.
            if (indexOf.call(all, value) < 0) all.push(last = value)
            lvl = all.length
            i = indexOf.call(seen, value)
            if (i < 0) {
              i = seen.push(value) - 1
              // key cannot contain specialChar but could be not a string
              path.push(('' + key).replace(specialCharRG, safeSpecialChar))
              mapp[i] = specialChar + path.join(specialChar)
            } else {
              value = `#${mapp[i]}` // https://tools.ietf.org/html/rfc6901
            }
          } else {
            if (typeof value === 'string' && resolve) {
              // ensure no special char involved on deserialization
              // in this case only first char is important
              // no need to replace all value (better performance)
              value = value.replace(safeSpecialChar, escapedSafeSpecialChar).replace(specialChar, safeSpecialChar)
            }
          }
        } else {
          doNotIgnore = true
        }
        return value
      } catch (e) {
        console.log('ERROR', e)
        return value
      }
    }
  }
  function retrieveFromPath (current, keys) {
    for (var i = 0, length = keys.length; i < length; i++) {
      // keys should be normalized back here
      current = current[keys[i].replace(safeSpecialCharRG, specialChar)]
    }
    return current
  }
  function generateReviver (reviver) {
    return function (key, value) {
      var isString = typeof value === 'string'
      if (isString && value.charAt(0) === '#' && value.charAt(1) === specialChar) return new String(value.slice(2))
      if (key === '') value = regenerate(value, value, {})
      // again, only one needed, do not use the RegExp for this replacement
      // only keys need the RegExp
      if (isString) value = value.replace(safeStartWithSpecialCharRG, '$1' + specialChar).replace(escapedSafeSpecialChar, safeSpecialChar)
      return reviver ? reviver.call(this, key, value) : value
    }
  }
  function regenerateArray(root, current, retrieve) {
    for (var i = 0, length = current.length; i < length; i++) current[i] = regenerate(root, current[i], retrieve)
    return current
  }
  function regenerateObject(root, current, retrieve) {
    for (var key in current) if (current.hasOwnProperty(key)) current[key] = regenerate(root, current[key], retrieve)
    return current
  }
  function regenerate(root, current, retrieve) {
    return current instanceof Array
      ? regenerateArray(root, current, retrieve) // fast Array reconstruction
      : current instanceof String
        ? current.length  // root is an empty string
          ? retrieve.hasOwnProperty(current)
            ? retrieve[current]
            : retrieve[current] = retrieveFromPath(root, current.split(specialChar))
          : root
        : current instanceof Object // dedicated Object parser
          ? regenerateObject(root, current, retrieve)
          : current // value as it is
  }
}
},{}],3:[function(require,module,exports){
const jsonloop = require('jsonloop')
const cJSON = jsonloop()

const methods = {
  "getThis": callsite => {                                            // getThis: returns the value of this
    const self = callsite.getThis()
    const ctor = self.constructor
    const ctorName = ctor ? `:${ctor.name}` : ''
    const isGlobal = self === globalThis
    const type = `${isGlobal ? 'global' : 'local'}${ctorName}`
    var json
    try {
      json = isGlobal ? `${self}` : cJSON.stringify(self)
    } catch (error) {
      json = `${self}:${error}`
    }
    return { type, json }
  },
  "getTypeName": callsite => callsite.getTypeName(),                  // getTypeName: returns the type of this as a string. This is the name of the function stored in the constructor field of this, if available, otherwise the object’s [[Class]] internal property.
  "getFunctionSource": callsite => {                           // getFunction: returns the current function
    const getF = callsite.getFunction()
    if (getF) return `${getF}`
  },
  "getFunction": callsite => {                                        // getFunction: returns the current function
    const getF = callsite.getFunction()
    if (getF) {
      const name = getF.name || '(anonymous)'
      const ctor = getF.constructor
      if (ctor) return { async: false, name }
      const ctorName = ctor.name === "AsyncFunction"
      return { type: ctorName, name }
    }
  },
  "getFunctionName": callsite => callsite.getFunctionName(),          // getFunctionName: returns the name of the current function, typically its name property. If a name property is not available an attempt is made to infer a name from the function’s context.
  "getMethodName": callsite => callsite.getMethodName(),              // getMethodName: returns the name of the property of this or one of its prototypes that holds the current function
  "getFileName": callsite => callsite.getFileName(),                  // getFileName: if this function was defined in a script returns the name of the script
  "getLineNumber": callsite => callsite.getLineNumber(),              // getLineNumber: if this function was defined in a script returns the current line number
  "getColumnNumber": callsite => callsite.getColumnNumber(),          // getColumnNumber: if this function was defined in a script returns the current column number
  "getEvalOrigin": callsite => callsite.getEvalOrigin(),              // getEvalOrigin: if this function was created using a call to eval returns a string representing the location where eval was called
  "isToplevel": callsite => callsite.isToplevel(),                    // isToplevel: is this a top-level invocation, that is, is this the global object?
  "isEval": callsite => callsite.isEval(),                            // isEval: does this call take place in code defined by a call to eval?
  "isNative": callsite => callsite.isNative(),                        // isNative: is this call in native V8 code?
  "isConstructor": callsite => callsite.isConstructor(),              // isConstructor: is this a constructor call?
  "isAsync": callsite => callsite.isAsync(),                          // isAsync: is this an async call (i.e. await or Promise.all())?
  "isPromiseAll": callsite => callsite.isPromiseAll(),                // isPromiseAll: is this an async call to Promise.all()?
  "getPromiseIndex": callsite => callsite.getPromiseIndex(),          // getPromiseIndex: returns the index of the promise element that was followed in Promise.all() for async stack traces, or null if the CallSite is not a Promise.all() call.
  "NameOrSourceURL": callsite => callsite.getScriptNameOrSourceURL(),
  "getPosition": callsite => callsite.getPosition()
}
const defaultFlags = Object.keys(methods)

stackframes.defaultFlags = defaultFlags

module.exports = stackframes

function stackframes (err = {}, flags = defaultFlags) {
  var depths, exclude
  if (!(err instanceof Error)) {
    if (!err) err = {}
    depths = err.depths
    exclude = err.exclude
    err = void 0
  }
  if (!(depths > -1)) depths = Infinity
  if (typeof err === "number") (depths = err, err = void 0)
  const exclude_this_and_below = exclude || stackframes
  const oldLimit = Error.stackTraceLimit
  const v8Handler = Error.prepareStackTrace
  Error.stackTraceLimit = depths
  Error.prepareStackTrace = prepareStackTrace
  if (!err) (err = {}, Error.captureStackTrace(err, exclude_this_and_below))
  const extractor = extract.bind(flags)
  const frames = err.stack.map(extractor)
  Error.prepareStackTrace = v8Handler
  Error.stackTraceLimit = oldLimit
  return frames
}
function prepareStackTrace (_, stack) {
  return stack
}
function extract (callsite) {
  const flags = this
  const frame = {}
  for (var i = 0, len = flags.length; i < len; i++) {
    const flag = flags[i]
    const fn = methods[flag]
    if (fn) frame[flag] = fn(callsite)
  }
  return frame
}

},{"jsonloop":2}]},{},[1]);
