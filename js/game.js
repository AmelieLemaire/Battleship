/*jslint browser this */
/*global _, player, computer, utils */

(function () {
  "use strict";

  var game = {
    PHASE_INIT_PLAYER: "PHASE_INIT_PLAYER",
    PHASE_INIT_OPPONENT: "PHASE_INIT_OPPONENT",
    PHASE_PLAY_PLAYER: "PHASE_PLAY_PLAYER",
    PHASE_PLAY_OPPONENT: "PHASE_PLAY_OPPONENT",
    PHASE_GAME_OVER: "PHASE_GAME_OVER",
    PHASE_WAITING: "waiting",

    currentPhase: "",
    phaseOrder: [],
    // garde une référence vers l'indice du tableau phaseOrder qui correspond à la phase de jeu pour le joueur humain
    playerTurnPhaseIndex: 2,

    // l'interface utilisateur doit-elle être bloquée ?
    waiting: false,

    // garde une référence vers les noeuds correspondant du dom
    grid: null,
    miniGrid: null,

    // liste des joueurs
    players: [],

    // stockage des coordonnonnés des tires effectués
    firedShotsX: [],
    firedShotsY: [],

    opponentHitsCounter: 0,
    playerHitsCounter: 0,

    // lancement du jeu
    init: function () {

      var mainTheme = document.getElementById("mainTheme");
      mainTheme.play();

      // initialisation
      this.grid = document.querySelector(".board .main-grid");
      this.miniGrid = document.querySelector(" .mini-grid");

      // défini l'ordre des phase de jeu
      this.phaseOrder = [
        this.PHASE_INIT_PLAYER,
        this.PHASE_INIT_OPPONENT,
        this.PHASE_PLAY_PLAYER,
        this.PHASE_PLAY_OPPONENT,
        this.PHASE_GAME_OVER,
      ];
      this.playerTurnPhaseIndex = 0;

      // initialise les joueurs
      this.setupPlayers();

      // ajoute les écouteur d'événement sur la grille
      this.addListeners();

      // c'est parti !
      this.goNextPhase();
    },
    setupPlayers: function () {
      // donne aux objets player et computer une réference vers l'objet game
      player.setGame(this);
      computer.setGame(this);

      // todo : implémenter le jeu en réseaux
      this.players = [player, computer];

      this.players[0].init();
      this.players[1].init();
    },
    goNextPhase: function () {
      // récupération du numéro d'index de la phase courante
      var ci = this.phaseOrder.indexOf(this.currentPhase);
      var self = this;

      if (ci !== this.phaseOrder.length - 1) {
        this.currentPhase = this.phaseOrder[ci + 1];
      } else {
        this.currentPhase = this.phaseOrder[0];
      }

      switch (this.currentPhase) {
        case this.PHASE_GAME_OVER:
          // detection de la fin de partie
          if (!this.gameIsOver()) {
            // le jeu n'est pas terminé on recommence un tour de jeu
            this.currentPhase = this.phaseOrder[this.playerTurnPhaseIndex];
          }
        case this.PHASE_INIT_PLAYER:
          utils.info("Placez vos bateaux");
          break;
        case this.PHASE_INIT_OPPONENT:
          this.wait();
          utils.info("En attente de votre adversaire");
          this.players[1].isShipsOk(function () {
            self.stopWaiting();

            //Choix du joueur qui commence
            utils.info("Choisissez qui commence !");

            var startChoiceZone = document.createElement("div");
            startChoiceZone.classList.add("startChoiceZone");

            var choicetxt = document.createElement('p');
            choicetxt.textContent = 'Qui va commencer ?';

            var playerButton = document.createElement("button");
            playerButton.classList.add("playerButton");
            playerButton.textContent = 'joueur';

            var opponentButton = document.createElement("button");
            opponentButton.classList.add("opponentButton");
            opponentButton.textContent = 'ordinateur';

            var randomButton = document.createElement("button");
            randomButton.classList.add("randomButton");
            randomButton.textContent = 'aléatoire';

            startChoiceZone.appendChild(choicetxt);
            startChoiceZone.appendChild(playerButton);
            startChoiceZone.appendChild(opponentButton);
            startChoiceZone.appendChild(randomButton);

            document.body.appendChild(startChoiceZone);

            playerButton.addEventListener("click", function () {
              startChoiceZone.remove();
              self.goNextPhase();
            });

            opponentButton.addEventListener("click", function () {
              startChoiceZone.remove();
              self.currentPhase = self.PHASE_PLAY_PLAYER;
              self.goNextPhase();
            })

            randomButton.addEventListener("click", function () {
              startChoiceZone.remove();

              var randomNumber = Math.random();
              var result = 0;

              if (randomNumber > 0.3) result = 1 ?? result;

              if (result = 1) {
                self.currentPhase = self.PHASE_PLAY_PLAYER;
                self.goNextPhase();
              } else {
                self.goNextPhase();
              }

            })

          });
          break;
        case this.PHASE_PLAY_PLAYER:
          utils.info("A vous de jouer, choisissez une case !");
          break;
        case this.PHASE_PLAY_OPPONENT:
          utils.info("A votre adversaire de jouer...");
          this.players[1].play();
          break;
      }
    },
    gameIsOver: function () {
      return false;
    },
    getPhase: function () {
      if (this.waiting) {
        return this.PHASE_WAITING;
      }
      return this.currentPhase;
    },
    // met le jeu en mode "attente" (les actions joueurs ne doivent pas être pris en compte si le jeu est dans ce mode)
    wait: function () {
      this.waiting = true;
    },
    // met fin au mode mode "attente"
    stopWaiting: function () {
      this.waiting = false;
    },
    addListeners: function () {
      // on ajoute des acouteur uniquement sur la grid (délégation d'événement)
      this.grid.addEventListener(
        "mousemove",
        _.bind(this.handleMouseMove, this)
      );
      this.grid.addEventListener("click", _.bind(this.handleClick, this));
      this.grid.addEventListener("contextmenu", _.bind(this.rightClick, this));
    },
    isPlacingVertical: false,
    rightClick: function (event) {
      event?.preventDefault();
      if (!event) return;
      if (event.button !== 2) return;
      this.isPlacingVertical = !this.isPlacingVertical;
    },

    handleMouseMove: function (e) {
      // on est dans la phase de placement des bateau
      if (
        this.getPhase() === this.PHASE_INIT_PLAYER &&
        e.target.classList.contains("cell")
      ) {
        var ship = this.players[0].fleet[this.players[0].activeShip];

        ship.dom.style.transform = this.isPlacingVertical
          ? "rotate(-90deg)"
          : "rotate(0deg)";
        ship.dom.style.transformOrigin = "center";
        if (ship.getLife() % 2 === 0)
          ship.dom.style.transformOrigin = "center calc(50% - 30px)";

        // si on a pas encore affiché (ajouté aux DOM) ce bateau
        if (!ship.dom.parentNode) {
          this.grid.appendChild(ship.dom);
          // passage en arrière plan pour ne pas empêcher la capture des événements sur les cellules de la grille
          ship.dom.style.zIndex = -1;
        }

        // décalage visuelle, le point d'ancrage du curseur est au milieu du bateau
        ship.dom.style.top =
          "" +
          utils.eq(e.target.parentNode) * utils.CELL_SIZE -
          (600 + this.players[0].activeShip * 60) +
          "px";
        ship.dom.style.left =
          "" +
          utils.eq(e.target) * utils.CELL_SIZE -
          Math.floor(ship.getLife() / 2) * utils.CELL_SIZE +
          "px";
      }
    },
    handleClick: function (e) {
      // self garde une référence vers "this" en cas de changement de scope
      var self = this;
      // si on a cliqué sur une cellule (délégation d'événement)
      if (e.target.classList.contains("cell")) {
        // si on est dans la phase de placement des bateau
        if (this.getPhase() === this.PHASE_INIT_PLAYER) {
          // on enregistre la position du bateau, si cela se passe bien (la fonction renvoie true) on continue
          if (
            this.players[0].setActiveShipPosition(
              utils.eq(e.target),
              utils.eq(e.target.parentNode)
            )
          ) {
            // et on passe au bateau suivant (si il n'y en plus la fonction retournera false)
            if (!this.players[0].activateNextShip()) {
              this.wait();
              this.grid.removeEventListener("contextmenu", this.rightClick);
              utils.confirm(
                "Confirmez le placement ?",
                function () {
                  // si le placement est confirmé
                  self.stopWaiting();
                  self.renderMiniMap();
                  self.players[0].clearPreview();
                  self.goNextPhase();
                },
                function () {
                  self.stopWaiting();
                  // sinon, on efface les bateaux (les positions enregistrées), et on recommence
                  self.players[0].resetShipPlacement();
                }
              );
            }
          }
          // si on est dans la phase de jeu (du joueur humain)
        } else if (this.getPhase() === this.PHASE_PLAY_PLAYER) {
          this.players[0].play(
            utils.eq(e.target),
            utils.eq(e.target.parentNode)
          );
        }
      }
    },
    // fonction utlisée par les objets représentant les joueurs (ordinateur ou non)
    // pour placer un tir et obtenir de l'adversaire l'information de réussite ou non du tir
    fire: function (from, col, line, callback) {

      var fireSound = document.getElementById("fireSound");
      fireSound.play();

      setTimeout(function () {

        this.wait();
        var self = this;
        var msg = "";

        // determine qui est l'attaquant et qui est attaqué
        var target =
          this.players.indexOf(from) === 0 ? this.players[1] : this.players[0];

        if (this.currentPhase === this.PHASE_PLAY_OPPONENT) {
          msg += "Votre adversaire vous a... ";
        }

        // Vérifier si les coordonnées se trouvent dans les tableaux firedShotsX et firedShotsY

        target.receiveAttack(col, line, function (hasSucceed) {

          if (hasSucceed) {
            msg += "Touché !";
            var hitSound = document.getElementById("hitSound");
            hitSound.play();
          } else {
            msg += "Manqué...";
            var splashSound = document.getElementById("splashSound");
            splashSound.play();
          }

          if (hasSucceed && self.currentPhase === self.PHASE_PLAY_OPPONENT) {
            var cellElement = document.createElement("div");
            cellElement.classList.add("hit-cell");
            cellElement.style.width = "59px";
            cellElement.style.height = "59px";
            cellElement.style.backgroundColor = "red";
            cellElement.style.position = "absolute";
            cellElement.style.left = col * 60 + "px";
            cellElement.style.top = line * 60 + "px";
            cellElement.style.zIndex = -1;
            var mainGrid = document.querySelector(".mini-grid");
            mainGrid.appendChild(cellElement);

            self.opponentHitsCounter++;

            if (self.opponentHitsCounter >= 17) {
              self.currentPhase = self.PHASE_GAME_OVER;
              msg = "Votre ennemi à gagné !";
              utils.info(msg);
              self.gameIsOver();
              return;
            }
          }

          if (hasSucceed && self.currentPhase === self.PHASE_PLAY_PLAYER) {
            self.playerHitsCounter++;

            var cellElement = document.createElement("div");
            cellElement.classList.add("hit-cell");
            cellElement.style.width = "59px";
            cellElement.style.height = "59px";
            cellElement.style.backgroundColor = "#e60019";
            cellElement.style.position = "absolute";
            cellElement.style.left = col * 60 + "px";
            cellElement.style.top = line * 60 + "px";
            cellElement.style.zIndex = -2;
            var mainGrid = document.querySelector(".main-grid");
            mainGrid.appendChild(cellElement);

            if (self.playerHitsCounter >= 17) {
              self.currentPhase = self.PHASE_GAME_OVER;
              msg = "Vous avez Gagné !";
              utils.info(msg);
              self.gameIsOver();
              return;
            }
          }

          if (self.currentPhase === self.PHASE_PLAY_PLAYER) {
            var isTargetHit = false;
            for (var i = 0; i < self.firedShotsX.length; i++) {
              if (
                self.firedShotsX[i].col === col &&
                self.firedShotsY[i].line === line
              ) {
                isTargetHit = true;
                break;
              }
            }

            if (isTargetHit) {
              // Si la zone a déjà été attaquée, afficher un message et ne pas effectuer d'action
              msg += "La zone à déjà été attaquée";
              utils.info(msg);
              callback(false); // Indiquer que l'attaque a échoué
              setTimeout(function () {
                self.stopWaiting();
                self.goNextPhase(); //ici je veux retourner a PHASE_PLAY_PLAYER
              }, 1100);
              return;
            }

            // Ajouter les coordonnées aux tableaux firedShotsX et firedShotsY
            self.firedShotsX.push({ col });
            self.firedShotsY.push({ line });

            if (hasSucceed) {
              var explosionGif = document.createElement('img');
              explosionGif.classList.add('explosionGif');
              explosionGif.src = "https://i.gifer.com/origin/a0/a07ad08920f303f655251b1a0b353b86_w200.gif";
              explosionGif.style.width = "59px";
              explosionGif.style.height = "59px";
              explosionGif.style.position = "absolute";
              explosionGif.style.left = col * 60 + "px";
              explosionGif.style.top = line * 60 + "px";
              explosionGif.style.zIndex = -1;
              var mainGrid = document.querySelector(".main-grid");
              mainGrid.appendChild(explosionGif);

              setTimeout(function () {
                explosionGif.remove();
              }, 1000);
            } else {
              var ploufGif = document.createElement('img');
              ploufGif.classList.add('ploufGif');
              ploufGif.src = "https://qph.cf2.quoracdn.net/main-qimg-41edc9f0cbfeaa793f8961ec1be68a2c";
              ploufGif.style.width = "59px";
              ploufGif.style.height = "59px";
              ploufGif.style.position = "absolute";
              ploufGif.style.left = col * 60 + "px";
              ploufGif.style.top = line * 60 + "px";
              ploufGif.style.zIndex = -1;
              var mainGrid = document.querySelector(".main-grid");
              mainGrid.appendChild(ploufGif);

              setTimeout(function () {
                ploufGif.remove();
              }, 1000);
            }

            // Afficher visuellement l'attaque sur la grille
            var cellElement = document.createElement("div");
            cellElement.classList.add(hasSucceed ? "hit-cell" : "miss-cell");
            cellElement.style.width = "59px";
            cellElement.style.height = "59px";
            cellElement.style.backgroundColor = hasSucceed ? "#e60019" : "grey";
            cellElement.style.position = "absolute";
            cellElement.style.left = col * 60 + "px";
            cellElement.style.top = line * 60 + "px";
            cellElement.style.zIndex = -2;
            var mainGrid = document.querySelector(".main-grid");
            mainGrid.appendChild(cellElement);
          }

          utils.info(msg);

          // Appeler le callback pour transmettre le résultat de l'attaque à l'attaquant
          callback(hasSucceed);

          // Faire une pause avant de passer à la phase suivante
          setTimeout(function () {
            self.stopWaiting();
            if (self.currentPhase === self.PHASE_PLAY_PLAYER) {
              self.goNextPhase();
            } else {
              msg = "A vous de jouer, choisissez une case !";
              utils.info(msg);
              self.currentPhase = self.PHASE_PLAY_PLAYER;
            }
          }, 2600);
        });
      }.bind(this), 1100);
    },

    renderMap: function () {
      this.players[0].renderTries(this.grid);
    },
    renderMiniMap: function () {
      this.players[0].fleet.forEach(function (ship) {
        this.miniGrid.appendChild(ship.dom.cloneNode());
      }, this);
      this.miniGrid.style.transform =
        "scale(0.5) translateX(-250px) translateY(-14.25%)";
    },
  };

  // point d'entrée
  document.addEventListener("DOMContentLoaded", function () {
    game.init();
  });
})();