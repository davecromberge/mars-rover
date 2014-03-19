(function(jsc, app) {
  "use strict";

  jsc.clear();

  var specifiers = {

    position: function() {
      return function generator() {
        return new app.models.Position(jsc.integer(1000)(), jsc.integer(1000)(), jsc.one_of(app.DIRECTIONS)());
      };
    },

    spaceship: function() {
      return function generator(position) {
        return new app.models.Spaceship(position);
      };
    },

    obstacle: jsc.object({ 
            x: jsc.integer(1000)(),
            y: jsc.integer(1000)()
    }),

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
         position.getOrientation() !== newPosition.getOrientation()));
  }, [specifiers.position, jsc.integer(-2, 2)]);


  jsc.claim("Position model: Rotating 4 times leaves orientation unchanged", function(verdict, positionFunc, delta) {
    var position = positionFunc(),
        newPosition = position.rotate(delta).rotate(delta).rotate(delta).rotate(delta);
    return verdict(position._x === newPosition._x && 
                   position._y === newPosition._y &&
                   position.getOrientation() === newPosition.getOrientation());
  }, [specifiers.position, jsc.one_of([-1, 1])]);


  jsc.claim("Spaceship model: Moving left changes orientation", function(verdict, positionFunc, spaceshipFunc) {
    var spaceship = spaceshipFunc(positionFunc()),
        newShip = spaceship.left();

    switch (spaceship.getPosition().getOrientation()) {
      case app.CONSTS.North: return verdict(newShip.getPosition().getOrientation() === app.CONSTS.West);
      case app.CONSTS.South: return verdict(newShip.getPosition().getOrientation() === app.CONSTS.East);
      case app.CONSTS.East:  return verdict(newShip.getPosition().getOrientation() === app.CONSTS.North);
      case app.CONSTS.West:  return verdict(newShip.getPosition().getOrientation() === app.CONSTS.South);
    }
  }, [specifiers.position, specifiers.spaceship]);


  jsc.claim("Spaceship model: Moving right changes orientation", function(verdict, positionFunc, spaceshipFunc) {
    var spaceship = spaceshipFunc(positionFunc()),
        newShip = spaceship.right();

    switch (spaceship.getPosition().getOrientation()) {
      case app.CONSTS.North: return verdict(newShip.getPosition().getOrientation() === app.CONSTS.East);
      case app.CONSTS.South: return verdict(newShip.getPosition().getOrientation() === app.CONSTS.West);
      case app.CONSTS.East:  return verdict(newShip.getPosition().getOrientation() === app.CONSTS.South);
      case app.CONSTS.West:  return verdict(newShip.getPosition().getOrientation() === app.CONSTS.North);
    }
  }, [specifiers.position, specifiers.spaceship]);


  jsc.claim("Spaceship model: Moving forward changes position", function(verdict, positionFunc, spaceshipFunc) {
    var spaceship = spaceshipFunc(positionFunc()),
        newShip = spaceship.forward();

    switch (spaceship.getPosition().getOrientation()) {
      case app.CONSTS.North: return verdict(newShip.getPosition()._y === spaceship.getPosition()._y - 1);
      case app.CONSTS.South: return verdict(newShip.getPosition()._y === spaceship.getPosition()._y + 1);
      case app.CONSTS.East:  return verdict(newShip.getPosition()._x === spaceship.getPosition()._x + 1);
      case app.CONSTS.West:  return verdict(newShip.getPosition()._x === spaceship.getPosition()._x - 1); 
    }
  }, [specifiers.position, specifiers.spaceship]);


  jsc.claim("Spaceship model: Moving backward changes position", function(verdict, positionFunc, spaceshipFunc) {
    var spaceship = spaceshipFunc(positionFunc()),
        newShip = spaceship.back();

    switch (spaceship.getPosition().getOrientation()) {
      case app.CONSTS.North: return verdict(newShip.getPosition()._y === spaceship.getPosition()._y + 1);
      case app.CONSTS.South: return verdict(newShip.getPosition()._y === spaceship.getPosition()._y - 1);
      case app.CONSTS.East:  return verdict(newShip.getPosition()._x === spaceship.getPosition()._x - 1);
      case app.CONSTS.West:  return verdict(newShip.getPosition()._x === spaceship.getPosition()._x + 1); 
    }
  }, [specifiers.position, specifiers.spaceship]);


  jsc.claim("Spaceship model: Cannot move over obstacle", function(verdict, obstacle, spaceshipFunc) {
    var ship = spaceshipFunc(new app.models.Position(obstacle.x, obstacle.y));
    ship._obstacles = [obstacle];
    return verdict(ship.back().forward()._isStuck);
  }, [specifiers.obstacle, specifiers.spaceship]);


  jsc.claim("Game model: Number of path edges matches number of moves", function(verdict, commands) {
    var game = new app.models.Game();
    return verdict(game.move(commands).length === commands.length + 1);
  }, [jsc.string(jsc.integer(1, 1000), jsc.one_of("FBLR"))]);


  JSC.on_fail(function (obj) { 
    console.dir(obj); 
  });

  JSC.on_report(function (str) { 
    console.log(str); 
  });

  jsc.check();
}(JSC, APP));
