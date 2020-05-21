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
