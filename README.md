# stackframes
stackframes

https://www.npmjs.com/package/stackframes

https://serapath.github.io/stackframes/

# use
`npm install stackframes`
```js
const stackframes = require('stackframes')

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
```