const jsonloop = require('jsonloop')
const cJSON = jsonloop()

const methods = {
  "getThis": callsite => {                                            // getThis: returns the value of this
    const self = callsite.getThis()
    const isGlobal = self === globalThis
    const type = isGlobal ? 'global' : 'local'
    const json = isGlobal ? `${self}` : cJSON.stringify(self)
    return { type, json }
  },
  "getTypeName": callsite => callsite.getTypeName(),                  // getTypeName: returns the type of this as a string. This is the name of the function stored in the constructor field of this, if available, otherwise the object’s [[Class]] internal property.
  "getFunction": callsite => {                                        // getFunction: returns the current function
    const getF = callsite.getFunction()
    if (getF) {
      const source = `${getF}`
      const name = getF.name || '(anonymous)'
      const ctor = getF.constructor
      if (ctor) return { async: false, name, source }
      const isAsync = ctor.name === "AsyncFunction"
      return { async: isAsync, name, source }
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
