const stackframes = require('..')

document.body.innerHTML = `<xmp>${start}\nstart()</xmp><hr><h2>open devtools console to check results:</h2>`//'<h1> open devtools console: </h1>'
function start () {
  const sf1 = stackframes()
  console.log('[stackframes:1]', sf1)

  function bar() {
    const sf2 = stackframes()
    console.log('[stackframes:2]', sf2)
  }
  function foo(){ bar() }
  foo()
}
start()