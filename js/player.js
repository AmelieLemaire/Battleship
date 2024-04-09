/*jslint browser this */
/*global _, shipFactory, player, utils */

(function (global) {
  "use strict";

  var sheep = { dom: { parentNode: { removeChild: function () {} } } };

  var player = {
    grid: [],
    tries: [],
    fleet: [],
    game: null,
    activeShip: 0,
    init: function () {
      // créé la flotte
      this.fleet.push(shipFactory.build(shipFactory.TYPE_BATTLESHIP));
      this.fleet.push(shipFactory.build(shipFactory.TYPE_DESTROYER));
      this.fleet.push(shipFactory.build(shipFactory.TYPE_SUBMARINE));
      this.fleet.push(shipFactory.build(shipFactory.TYPE_SMALL_SHIP));

      // créé les grilles
      this.grid = utils.createGrid(10, 10);
      this.tries = utils.createGrid(10, 10);
    },
    setGame: function (game) {
      this.game = game;
    },
    play: function (col, line) {
      // appel la fonction fire du game, et lui passe une calback pour récupérer le résultat du tir
      this.game.fire(
        this,
        col,
        line,
        _.bind(function (hasSucced) {
          this.tries[line][col] = hasSucced;
        }, this)
      );
    },
    // quand il est attaqué le joueur doit dire si il a un bateaux ou non à l'emplacement choisi par l'adversaire
    receiveAttack: function (col, line, callback) {
      var succeed = false;

      if (this.grid[line][col] !== 0) {
          succeed = true;
          var idShip = this.grid[line][col];
          this.grid[line][col] = 0;

          const flowedShip = this.fleet.find(ship => ship.id === idShip);

          var newLife = flowedShip.getLife() - 1;
          newLife = newLife <= 0 ? 0 : newLife;
          flowedShip.setLife(newLife);

          if(this.game.currentPhase === "PHASE_PLAY_OPPONENT" && flowedShip.getLife() === 0) {
              var shipNode = document.querySelector(`.${flowedShip.name.toLowerCase()}`);
              shipNode.classList.add("sunk");
          }
      }
      callback.call(undefined, succeed);
  },
    setActiveShipPosition: function (x, y) {
      const ship = this.fleet[this.activeShip];
      const middleLength = Math.floor(ship.getLife() / 2);

      const startX = x - (this.game.isPlacingVertical ? 0 : middleLength);
      const startY = y - (this.game.isPlacingVertical ? middleLength : 0);

      const endX =
        startX + (this.game.isPlacingVertical ? 0 : ship.getLife() - 1);
      const endY =
        startY + (this.game.isPlacingVertical ? ship.getLife() - 1 : 0);

      if (startX < 0 || endX > 9) return false;
      if (startY < 0 || endY > 9) return false;

    //   console.log(this.grid.join("\n"));

      for (let cx = startX; cx <= endX; cx++)
        for (let cy = startY; cy <= endY; cy++) {
          if (this.grid[cy][cx] !== 0) return false;
        }
      for (let cx = startX; cx <= endX; cx++)
        for (let cy = startY; cy <= endY; cy++) {
          this.grid[cy][cx] = ship.getId();
        }
 //     console.log(this.grid.join("\n"));

      ship.dom.style.transform = this.game.isPlacingVertical
        ? "rotate(-90deg)"
        : "rotate(0deg)";
      ship.dom.style.transformOrigin = "center";
      if (ship.getLife() % 2 === 0)
        ship.dom.style.transformOrigin = "center calc(50% - 30px)";

      return true;
    },

    clearPreview: function () {
      this.fleet.forEach(function (ship) {
        if (ship.dom.parentNode) {
          ship.dom.parentNode.removeChild(ship.dom);
        }
      });
    },
    resetShipPlacement: function () {
      this.clearPreview();

      this.activeShip = 0;
      this.grid = utils.createGrid(10, 10);
    },
    activateNextShip: function () {
      if (this.activeShip < this.fleet.length - 1) {
        this.activeShip += 1;
        return true;
      } else {
        return false;
      }
    },
    renderTries: function (grid) {
      this.tries.forEach(function (row, rid) {
        row.forEach(function (val, col) {
          var node = grid.querySelector(
            ".row:nth-child(" +
              (rid + 1) +
              ") .cell:nth-child(" +
              (col + 1) +
              ")"
          );

          if (val === true) {
            node.style.backgroundColor = "#e60019";
          } else if (val === false) {
            node.style.backgroundColor = "#aeaeae";
          }
        });
      });
    },
    renderShips: function (grid) {},
  };

  global.player = player;
})(this);
