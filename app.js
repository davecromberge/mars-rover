Number.prototype.mod = function(n) {
  return ((this%n)+n)%n;
};

var APP = APP || {};

APP.CONSTS = {
  North:     "North",
  East:      "East",
  South:     "South",
  West:      "West",
  DefaultBounds: 15,
  DefaultObstacles: 15
};

APP.DIRECTIONS = [
  APP.CONSTS.North,
  APP.CONSTS.East,
  APP.CONSTS.South,
  APP.CONSTS.West
];

APP.models = (function(_) {

  var Position = function(x, y, orientation) {
    this._x = x || 0;
    this._y = y || 0;
    this._orientation = orientation || APP.DIRECTIONS[0];
  };

  Position.prototype.dx = function(d) {
    return new Position(this._x + d, this._y, this._orientation);
  };

  Position.prototype.dy = function(d) {
    return new Position(this._x, this._y + d, this._orientation);
  };

  Position.prototype.getOrientation = function() {
    return this._orientation;
  };

  Position.prototype.boundedTo = function(bounds) {
    bounds = bounds || { x: APP.CONSTS.MaxBounds, y: APP.CONSTS.MaxBounds };
    return new Position(this._x.mod(bounds.x), this._y.mod(bounds.y), this._orientation);
  }

  Position.prototype.rotate = function(d) {
    var index = APP.DIRECTIONS.indexOf(this._orientation),
        rotated = (index + d).mod(APP.DIRECTIONS.length);
    return new Position(this._x, this._y, APP.DIRECTIONS[rotated]);
  };

  var Spaceship = function(position, obstacles) {
    this._position = position || new Position();
    this._obstacles = obstacles || [];
    this._isStuck = false;
  };

  var rotate = function(ship, d, obstacles) {
    return new Spaceship(ship.getPosition().rotate(d), obstacles);
  }

  var isObstacle = function(position, obstacles) {
    return _.some(obstacles, function(o) {
        return position._x === o.x && position._y === o.y
    });
  };

  var move = function(ship, d, obstacles) {
    var position = ship.getPosition(),
        newShip = {};

    switch (position.getOrientation()) {
      case APP.CONSTS.North: 
        newShip = new Spaceship(position.dy(-1 * d), obstacles);
        break;
      case APP.CONSTS.West: 
        newShip = new Spaceship(position.dx(-1 * d), obstacles);
        break;
      case APP.CONSTS.South: 
        newShip = new Spaceship(position.dy(d), obstacles);
        break;
      case APP.CONSTS.East: 
        newShip = new Spaceship(position.dx(d), obstacles);
        break;
    }

    if (isObstacle(newShip.getPosition(), obstacles)) {
      ship._isStuck = true;
      return ship;
    } else {
      ship._isStuck = false;
      return newShip;
    }
  }

  Spaceship.prototype.left = function() {
    return rotate(this, -1, this._obstacles);
  }

  Spaceship.prototype.right = function() {
    return rotate(this, 1, this._obstacles);
  }

  Spaceship.prototype.forward = function() {
    return move(this, 1, this._obstacles);
  }

  Spaceship.prototype.back = function() {
    return move(this, -1, this._obstacles);
  };
  
  Spaceship.prototype.getPosition = function() {
    return this._position;
  };
  
  var Game = function(config) {
    this._config = config || {
      startPosition: new Position(),
      size: {
        x : APP.CONSTS.DefaultBounds,
        y : APP.CONSTS.DefaultBounds
      },
      obstacles: []
    };
    this._spaceship = new Spaceship(this._config.startPosition, this._config.obstacles);
  };

  Game.prototype.getSize = function() {
    return this._config.size;
  };

  Game.prototype.getShip = function() {
    return this._spaceship;
  };

  Game.prototype.move = function(commands) {

    function moveOne(command, ship) {
      switch (command) {
        case 'F': return ship.forward();
        case 'L': return ship.left();
        case 'B': return ship.back();
        case 'R': return ship.right();
        default: throw new Error("command not supported");
      }
    }

    return _.foldl(commands.split(""),
      function(acc, x) {
        acc.push(moveOne(x, _.last(acc)));
        return acc;
      },
    [this._spaceship]);
  };

  return {
    Position: Position,
    Spaceship: Spaceship,
    Game: Game
  };
}(_));

APP.view = (function(_) {
  function getSvgSize(gridSize, squareLength) {
    var width = gridSize.x * squareLength;
    var height = gridSize.y * squareLength;
    return { width:width, height:height };
  }

  function isBorder(x, y, gridSize) {
    return x==0 || y == 0 || x == (gridSize.x-1) || y == (gridSize.y-1);
  }

  function getScale(gridSize, svgSize) {
    var xScale = d3.scale.linear().domain([0,gridSize.x]).range([0,svgSize.width]);
    var yScale = d3.scale.linear().domain([0,gridSize.y]).range([0,svgSize.height]);
    return { x:xScale, y:yScale };
  }

  function drawCells(svgContainer, scales, data, cssClass) {
    var gridGroup = svgContainer.append("g");
    var cells = gridGroup.selectAll("rect")
                .data(data)
                .enter()
                .append("rect");
    var cellAttributes = cells
             .attr("x", function (d) { return scales.x(d.x); })
             .attr("y", function (d) { return scales.y(d.y); })
             .attr("width", function (d) { return squareLength; })
             .attr("height", function (d) { return squareLength; })
             .attr("class", cssClass);
  }

  function buildMap(gridSize, obstacles) {

    function isObstacle(x, y) {
      return _.some(obstacles, function(o) {
        return o.x === x && o.y === y;
      });
    }

    var map = { grid:[], obstacle:[], rock:[] };
    for (x = 0; x < gridSize.x; x++) {
        map.grid[x] = [];
        for (y = 0; y < gridSize.y; y++) {
            var type = isObstacle(x,y) ? "obstacle" : "rock";
            var cell = { x:x, y:y , type:type };
            map.grid[x][y] = cell;
            map[type].push(cell);
        }
    }
    return map;
  }

  var gridSize = {},
      squareLength = 40,
      circleRadius = 15,
      svgSize = 0,
      map = {},
      svgContainer = {},
      scales = {},
      groups = {};

  function init(gameSize, startPosition, obstacles) {
    gridSize = gameSize;

    svgSize = getSvgSize(gridSize, squareLength);
    map = buildMap(gridSize, obstacles);

    svgContainer = d3.select(".display")
                     .append("svg")
                     .attr("width", svgSize.width)
                     .attr("height", svgSize.height);

    scales = getScale(gridSize, svgSize);

    drawCells(svgContainer, scales, map.rock, "rock");
    drawCells(svgContainer, scales, map.obstacle, "obstacle");

    groups = { 
      path:svgContainer.append("g"),
      position:svgContainer.append("g") 
    };

    render([startPosition]);
  }

  function render(ships) {
    var path = ships.map(function(x) {
      var boundedPosition = x.getPosition().boundedTo(gridSize);
      return {
        "x": boundedPosition._x,
        "y": boundedPosition._y,
        "direction": boundedPosition._orientation,
        "isStuck": x._isStuck
      };
    });

    // path
    groups.path.selectAll(".path").remove();
    var lineFunction = d3.svg.line()
               .x(function(d) { return scales.x(d.x + 0.5); })
               .y(function(d) { return scales.y(d.y + 0.5); })
               .interpolate("linear");

    var lineGraph = groups.path.append("path")
                               .attr("d", lineFunction(path))
                               .attr("class", "path")
                               .attr("fill", "none");

    // position
    var circleData = groups.position.selectAll("circle").data(path);
    circleData.exit().remove();
    var circles = circleData.enter().append("circle");
    var circleAttributes = circles
             .attr("cx", function (d) { return scales.x(d.x + 0.5); })
             .attr("cy", function (d) { return scales.y(d.y + 0.5); })
             .attr("r", function (d) { return circleRadius; })
             .attr("class", function (d) { if (d.isStuck) return "stuck position"; else return "position"; });

    // position number
    var textData = groups.position.selectAll("text").data(path);
    textData.exit().remove();
    var texts = textData.enter().append("text");
    var textAttributes = texts
             .attr("x", function (d) { return scales.x(d.x + 0.5); })
             .attr("y", function (d) { return scales.y(d.y + 0.5); })
             .attr("dy", ".31em")
             .text(function(d,i) { return i + ":" + d.direction.split("")[0] })
             .attr("class", "positionNumber");
  }

  return {
    render: render,
    init: init
  };
}(_));

APP.controller = (function($, view, models) {
  
  function createGameConfig() {
    var gameSize = {};
  
    function random(max) {
      return Math.floor((Math.random()*max)+1);
    };
  
    function generateObstacles(gameSize) {
      var numberObstacles = random(APP.CONSTS.DefaultObstacles),
          xs = _.sample(_.range(gameSize.x), numberObstacles),
          ys = _.sample(_.range(gameSize.y), numberObstacles);
      return _.map(_.zip(xs, ys), function(zs) {
        return { x: zs[0], y: zs[1] };
      });
    }
  
    function generateStartingPosition(gameSize) {
      return new models.Position(random(gameSize.x), random(gameSize.y));
    }

    function generateGameSize() {
      return {
        x: APP.CONSTS.DefaultBounds,
        y: APP.CONSTS.DefaultBounds
      };
    }

    gameSize = generateGameSize();

    return {
      startPosition: generateStartingPosition(gameSize),
      size: gameSize,
      obstacles: generateObstacles(gameSize)
    };
  }
  

  $(function() {
    var game = {},
        config = createGameConfig();

    game = new models.Game(config);
    view.init(game.getSize(), game.getShip(), config.obstacles);

    $('#commands').on('input', function(e) {
      var path = [],
          content = $('#commands').val();
      content = content.toUpperCase().replace(/[^FBLR]/g, "");
      $('#commands').val(content);
      path = game.move(content);
      view.render(path);
    });
  });
}(jQuery, APP.view, APP.models));
