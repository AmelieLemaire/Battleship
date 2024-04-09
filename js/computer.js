/*jslint browser this */
/*global _, player */

(function (global) {
    "use strict";

    var computer = _.assign({}, player, {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        play: function () {
            var self = this;
            setTimeout(function () {
                var x = Math.floor(Math.random() * 10);
                    var y = Math.floor(Math.random() * 10);
                self.game.fire(this, x, y, function (hasSucced) {
                    self.tries[x][y] = hasSucced;
                });
            }, 100);
        },
        isShipsOk: function (callback) {
            var tries = 0;
            this.fleet.forEach(function (ship) {
                var placed = false;
                while (!placed && tries < 1000) {
                    var orientation = Math.floor(Math.random() * 2);
                    var x = Math.floor(Math.random() * 10);
                    var y = Math.floor(Math.random() * 10);
        
                    if (orientation === 0 && x + ship.getLife() > 10) {
                        x = 10 - ship.getLife();
                    }
                    if (orientation === 1 && y + ship.getLife() > 10) {
                        y = 10 - ship.getLife();
                    }
        
                    var canPlace = true;
                    for (var i = 0; i < ship.getLife(); i++) {
                        if (orientation === 0 && this.grid[y][x + i] !== 0) {
                            canPlace = false;
                            break;
                        } else if (orientation === 1 && this.grid[y + i][x] !== 0) {
                            canPlace = false;
                            break;
                        }
                    }
        
                    if (canPlace) {
                        for (var i = 0; i < ship.getLife(); i++) {
                            if (orientation === 0) {
                                this.grid[y][x + i] = ship.getId();
                            } else {
                                this.grid[y + i][x] = ship.getId();
                            }
                        }
                        placed = true;
                    }
                    tries++;

                   console.log(this.grid.join("\n"));
                    
                }
            }, this);

            setTimeout(function () {
                callback();
            }, 500);
        }
    });

    global.computer = computer;

}(this));