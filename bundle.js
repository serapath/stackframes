(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const stackframes = require('..')

document.body.innerHTML = `<xmp>${start}\nstart()</xmp><hr><h2>open devtools console to check results:</h2>`//'<h1> open devtools console: </h1>'
start()

function start () {
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
    console.log('0', stackframes(error))
    console.log('1', stackframes())
    console.log('2', stackframes({ exclude: foo }))
    console.log('3', stackframes({ exclude: example }))
    console.log('4', stackframes({ depths: 2, exclude: baz }))
    console.log('5', stackframes({ depths: 2 }))
  }
}

},{"..":2}],2:[function(require,module,exports){
module.exports = stackframes

function stackframes (err = {}) {
  var depths, exclude
  if (!(err instanceof Error)) {
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
  const frames = err.stack.map(extract)
  const stack = frames.filter(keep)
  Error.prepareStackTrace = v8Handler
  Error.stackTraceLimit = oldLimit
  return stack
}
function prepareStackTrace (_, stack) {
  return stack
}
function extract (callsite) {
  const getF = callsite.getFunction()
  const isAsync = getF && getF.constructor.name === "AsyncFunction"
  const getFunction = getF && { async: isAsync, name: getF.name || '(anonymous)', source: `${getF}` }
  const self = callsite.getThis()
  const getThis = self === globalThis ? 'global' : 'local'
  const getTypeName = callsite.getTypeName()
  const getFunctionName = callsite.getFunctionName() || getFunction.name || getTypeName
  const frame = {
    getThis         : getThis,                    // getThis: returns the value of this
    getTypeName     : getTypeName,                // getTypeName: returns the type of this as a string. This is the name of the function stored in the constructor field of this, if available, otherwise the object’s [[Class]] internal property.
    getFunction     : getFunction,                // getFunction: returns the current function
    getFunctionName : getFunctionName,            // getFunctionName: returns the name of the current function, typically its name property. If a name property is not available an attempt is made to infer a name from the function’s context.
    getMethodName   : callsite.getMethodName(),   // getMethodName: returns the name of the property of this or one of its prototypes that holds the current function
    getFileName     : callsite.getFileName(),     // getFileName: if this function was defined in a script returns the name of the script
    getLineNumber   : callsite.getLineNumber(),   // getLineNumber: if this function was defined in a script returns the current line number
    getColumnNumber : callsite.getColumnNumber(), // getColumnNumber: if this function was defined in a script returns the current column number
    getEvalOrigin   : callsite.getEvalOrigin(),   // getEvalOrigin: if this function was created using a call to eval returns a string representing the location where eval was called
    isToplevel      : callsite.isToplevel(),      // isToplevel: is this a top-level invocation, that is, is this the global object?
    isEval          : callsite.isEval(),          // isEval: does this call take place in code defined by a call to eval?
    isNative        : callsite.isNative(),        // isNative: is this call in native V8 code?
    isConstructor   : callsite.isConstructor(),   // isConstructor: is this a constructor call?
    isAsync         : callsite.isAsync(),         // isAsync: is this an async call (i.e. await or Promise.all())?
    isPromiseAll    : callsite.isPromiseAll(),    // isPromiseAll: is this an async call to Promise.all()?
    getPromiseIndex : callsite.getPromiseIndex(), // getPromiseIndex: returns the index of the promise element that was followed in Promise.all() for async stack traces, or null if the CallSite is not a Promise.all() call.
    NameOrSourceURL : callsite.getScriptNameOrSourceURL(),
    getPosition     : callsite.getPosition(),
  }
  return frame
}
function keep (frame) {
  // if (!frame.getFileName && !frame.getFunctionName) return console.log('skip', frame)
  // if (frame.getFileName.startsWith('internal')) return console.log('skip internal', frame)
  return true
}
},{}]},{},[1]);
