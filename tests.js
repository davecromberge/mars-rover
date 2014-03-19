(function(jsc, app) {
  "use strict";

  jsc.clear();

  var specifiers = {

    position: function() {
      return function generator() {
        return new app.models.Position(jsc.integer(1000)(), jsc.integer(1000)(), jsc.one_of(app.DIRECTIONS)());
      };
    },

    size: jsc.object({ 
            x: jsc.integer(1000)(),
            y: jsc.integer(1000)()
          })
  };

  // Model tests
  // -----------

  jsc.claim("Position model: X delta leaves Y unchanged", function(verdict, positionFunc, delta) {
    var position = positionFunc(),
        newPosition = position.dx(delta);
    return verdict(position._y === newPosition._y && 
                   position._x + delta === newPosition._x);
  }, [specifiers.position, jsc.integer(-1000, 1000)]);


  jsc.claim("Position model: Y delta leaves X unchanged", function(verdict, positionFunc, delta) {
    var position = positionFunc(),
        newPosition = position.dy(delta);
    return verdict(position._x === newPosition._x && 
                   position._y + delta === newPosition._y);
  }, [specifiers.position, jsc.integer(-1000, 1000)]);


  jsc.claim("Position model: Rotation leaves X and Y unchanged", function(verdict, positionFunc, delta) {
    var position = positionFunc(),
        newPosition = position.rotate(delta);
    return verdict(
      (delta === 0) ||
        (position._x === newPosition._x &&
         position._y === newPosition._y &&
         position._orientation !== newPosition._orientation));
  }, [specifiers.position, jsc.integer(-2, 2)]);

  jsc.claim("Position model: Rotating 4 times leaves orientation unchanged", function(verdict, positionFunc, delta) {
    var position = positionFunc(),
        newPosition = position.rotate(delta).rotate(delta).rotate(delta).rotate(delta);
    return verdict(position._x === newPosition._x && 
                   position._y === newPosition._y &&
                   position._orientation === newPosition._orientation);
  }, [specifiers.position, jsc.one_of([-1, 1])]);

  jsc.claim("Position model: Bounded positions in range", function(verdict, positionFunc, size, delta) {
    var position = positionFunc(),
        newPosition = position.dx(delta).dx(delta).dy(delta).dy(delta).boundedTo(size);

    return verdict(newPosition._x >= 0 && newPosition._x <= size.x &&
                   newPosition._y >= 0 && newPosition._y <= size.y);
  }, [specifiers.position, specifiers.size, jsc.integer(-1000, 1000)]);

  JSC.on_fail(function (obj) { 
    console.dir(obj); 
  });

  JSC.on_report(function (str) { 
    console.log(str); 
  });

  jsc.check();
}(JSC, APP));
