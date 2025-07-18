if (GardenUnchained === undefined) var GardenUnchained = {};
var M = Game.Objects["Farm"].minigame;

//Todo: Configuration menu.
//Todo: Reorganise garden layout when panel becomes too small? Add a pop-out garden?
//! Errors through plotType mismatch (save and current).
//$ The x,y and y,x switch-arounds are annoying.
Game.registerMod("GardenUnchained", {
  GardenUnchained: this,

  init: function () {
    if (!GardenUnchained.settings) GardenUnchained.settings = { plotType: 1 };

    M.plotSize = {
      _width: 6,
      _height: 6,

      get width() {
        return this._width;
      },

      get height() {
        return this._height;
      },

      update() {
        //Giant -> Keeps growing each level
        const lvl = M.parent.level;
        var w = Math.ceil(lvl / 2 + 1.5);
        var h = Math.floor(lvl / 2 + 1.5);

        //Long -> Gain horizontal rows every level (after 9)
        if (GardenUnchained.settings.plotType <= 1 && lvl > 9) {
          w = lvl - 3; // 6x6 at lvl-9, 7x6 at lvl-10, 8x6 at lvl-11, etc.
          h = 6;
        }

        //Normal -> Max 6x6
        if (GardenUnchained.settings.plotType <= 0 && lvl > 9) w = 6;

        this._width = w;
        this._height = h;
      },
    };
    M.plotSize.update();

    M.computeBoostPlot = function () {
      M.plotSize.update();
      const h = M.plotSize.height;
      const w = M.plotSize.width;

      if (!M.plotBoost[y]) return;
      for (var y = 0; y < w; y++) {
        if (!M.plotBoost[y][x]) return;

        for (var x = 0; x < w; x++) {
          M.plotBoost[y][x] = [1, 1, 1];
        }
      }

      var effectOn = function (X, Y, s, mult) {
        for (var y = Math.max(0, Y - s); y < Math.min(h, Y + s + 1); y++) {
          for (var x = Math.max(0, X - s); x < Math.min(w, X + s + 1); x++) {
            if (X == x && Y == y) {
            } else {
              for (var i = 0; i < mult.length; i++) {
                M.plotBoost[y][x][i] *= mult[i];
              }
            }
          }
        }
      };

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var tile = M.plot[y][x];
          if (tile[0] > 0) {
            var me = M.plantsById[tile[0] - 1];
            var name = me.key;
            var stage = 0;
            if (tile[1] >= me.mature) stage = 4;
            else if (tile[1] >= me.mature * 0.666) stage = 3;
            else if (tile[1] >= me.mature * 0.333) stage = 2;
            else stage = 1;

            var soilMult = M.soilsById[M.soil].effMult;
            var mult = soilMult;

            if (stage == 1) mult *= 0.1;
            else if (stage == 2) mult *= 0.25;
            else if (stage == 3) mult *= 0.5;
            else mult *= 1;

            /*if (name=='elderwort') effectOn(x,y,1,[1+0.03*mult,1,1]);
          else if (name=='queenbeetLump') effectOn(x,y,1,[1,1-0.2*mult,1]);
          else if (name=='nursetulip') effectOn(x,y,1,[1,1+0.2*mult,1]);
          else if (name=='shriekbulb') effectOn(x,y,1,[1,1-0.05*mult,1]);
          else if (name=='tidygrass') effectOn(x,y,2,[1,1,0]);
          else if (name=='everdaisy') effectOn(x,y,1,[1,1,0]);
          else if (name=='ichorpuff') effectOn(x,y,1,[1-0.5*mult,1-0.5*mult,1]);*/

            var ageMult = 1;
            var powerMult = 1;
            var weedMult = 1;
            var range = 0;

            if (name == "elderwort") {
              ageMult = 1.03;
              range = 1;
            } else if (name == "queenbeetLump") {
              powerMult = 0.8;
              range = 1;
            } else if (name == "nursetulip") {
              powerMult = 1.2;
              range = 1;
            } else if (name == "shriekbulb") {
              powerMult = 0.95;
              range = 1;
            } else if (name == "tidygrass") {
              weedMult = 0;
              range = 2;
            } else if (name == "everdaisy") {
              weedMult = 0;
              range = 1;
            } else if (name == "ichorpuff") {
              ageMult = 0.5;
              powerMult = 0.5;
              range = 1;
            }

            if (ageMult >= 1) ageMult = (ageMult - 1) * mult + 1;
            else if (mult >= 1) ageMult = 1 / ((1 / ageMult) * mult);
            else ageMult = 1 - (1 - ageMult) * mult;
            if (powerMult >= 1) powerMult = (powerMult - 1) * mult + 1;
            else if (mult >= 1) powerMult = 1 / ((1 / powerMult) * mult);
            else powerMult = 1 - (1 - powerMult) * mult;

            if (range > 0)
              effectOn(x, y, range, [ageMult, powerMult, weedMult]);
          }
        }
      }
    };

    M.computeEffs = function () {
      M.toCompute = false;
      var effs = {
        cps: 1,
        click: 1,
        cursorCps: 1,
        grandmaCps: 1,
        goldenCookieGain: 1,
        goldenCookieFreq: 1,
        goldenCookieDur: 1,
        goldenCookieEffDur: 1,
        wrathCookieGain: 1,
        wrathCookieFreq: 1,
        wrathCookieDur: 1,
        wrathCookieEffDur: 1,
        reindeerGain: 1,
        reindeerFreq: 1,
        reindeerDur: 1,
        itemDrops: 1,
        milk: 1,
        wrinklerSpawn: 1,
        wrinklerEat: 1,
        upgradeCost: 1,
        buildingCost: 1,
      };

      if (!M.freeze) {
        var soilMult = M.soilsById[M.soil].effMult;

        for (var y = 0; y < M.plotSize.height; y++) {
          for (var x = 0; x < M.plotSize.width; x++) {
            var tile = M.plot[y][x];
            if (tile[0] > 0) {
              var me = M.plantsById[tile[0] - 1];
              var name = me.key;
              var stage = 0;
              if (tile[1] >= me.mature) stage = 4;
              else if (tile[1] >= me.mature * 0.666) stage = 3;
              else if (tile[1] >= me.mature * 0.333) stage = 2;
              else stage = 1;

              var mult = soilMult;

              if (stage == 1) mult *= 0.1;
              else if (stage == 2) mult *= 0.25;
              else if (stage == 3) mult *= 0.5;
              else mult *= 1;

              mult *= M.plotBoost[y][x][1];

              if (name == "bakerWheat") effs.cps += 0.01 * mult;
              else if (name == "thumbcorn") effs.click += 0.02 * mult;
              else if (name == "cronerice") effs.grandmaCps += 0.03 * mult;
              else if (name == "gildmillet") {
                effs.goldenCookieGain += 0.01 * mult;
                effs.goldenCookieEffDur += 0.001 * mult;
              } else if (name == "clover") effs.goldenCookieFreq += 0.01 * mult;
              else if (name == "goldenClover")
                effs.goldenCookieFreq += 0.03 * mult;
              else if (name == "shimmerlily") {
                effs.goldenCookieGain += 0.01 * mult;
                effs.goldenCookieFreq += 0.01 * mult;
                effs.itemDrops += 0.01 * mult;
              } else if (name == "elderwort") {
                effs.wrathCookieGain += 0.01 * mult;
                effs.wrathCookieFreq += 0.01 * mult;
                effs.grandmaCps += 0.01 * mult;
              } else if (name == "bakeberry") effs.cps += 0.01 * mult;
              else if (name == "chocoroot") effs.cps += 0.01 * mult;
              else if (name == "whiteChocoroot")
                effs.goldenCookieGain += 0.01 * mult;
              else if (name == "whiteMildew") effs.cps += 0.01 * mult;
              else if (name == "brownMold") effs.cps *= 1 - 0.01 * mult;
              else if (name == "meddleweed") {
              } else if (name == "whiskerbloom") effs.milk += 0.002 * mult;
              else if (name == "chimerose") {
                effs.reindeerGain += 0.01 * mult;
                effs.reindeerFreq += 0.01 * mult;
              } else if (name == "nursetulip") {
                effs.cps *= 1 - 0.02 * mult;
              } else if (name == "drowsyfern") {
                effs.cps += 0.03 * mult;
                effs.click *= 1 - 0.05 * mult;
                effs.goldenCookieFreq *= 1 - 0.1 * mult;
              } else if (name == "wardlichen") {
                effs.wrinklerSpawn *= 1 - 0.15 * mult;
                effs.wrathCookieFreq *= 1 - 0.02 * mult;
              } else if (name == "keenmoss") {
                effs.itemDrops += 0.03 * mult;
              } else if (name == "queenbeet") {
                effs.goldenCookieEffDur += 0.003 * mult;
                effs.cps *= 1 - 0.02 * mult;
              } else if (name == "queenbeetLump") {
                effs.cps *= 1 - 0.1 * mult;
              } else if (name == "glovemorel") {
                effs.click += 0.04 * mult;
                effs.cursorCps += 0.01 * mult;
                effs.cps *= 1 - 0.01 * mult;
              } else if (name == "cheapcap") {
                effs.upgradeCost *= 1 - 0.002 * mult;
                effs.buildingCost *= 1 - 0.002 * mult;
              } else if (name == "foolBolete") {
                effs.goldenCookieFreq += 0.02 * mult;
                effs.goldenCookieGain *= 1 - 0.05 * mult;
                effs.goldenCookieDur *= 1 - 0.02 * mult;
                effs.goldenCookieEffDur *= 1 - 0.02 * mult;
              } else if (name == "wrinklegill") {
                effs.wrinklerSpawn += 0.02 * mult;
                effs.wrinklerEat += 0.01 * mult;
              } else if (name == "greenRot") {
                effs.goldenCookieDur += 0.005 * mult;
                effs.goldenCookieFreq += 0.01 * mult;
                effs.itemDrops += 0.01 * mult;
              } else if (name == "shriekbulb") {
                effs.cps *= 1 - 0.02 * mult;
              }
            }
          }
        }
      }
      M.effs = effs;
      Game.recalculateGains = 1;
    };

    M.plot = [];
    for (var y = 0; y < M.plotSize.height; y++) {
      M.plot[y] = [];
      for (var x = 0; x < M.plotSize.width; x++) {
        M.plot[y][x] = [0, 0];
      }
    }

    M.plotBoost = [];
    for (var y = 0; y < M.plotSize.height; y++) {
      M.plotBoost[y] = [];
      for (var x = 0; x < M.plotSize.width; x++) {
        //age mult, power mult, weed mult
        M.plotBoost[y][x] = [1, 1, 1];
      }
    }

    M.toRebuild = false;
    M.toCompute = false;

    M.buildPlot = function () {
      M.toRebuild = false;
      M.plotSize.update();
      M.resizePlots();

      if (!l("gardenPlot")) return false;
      l("gardenPlot").innerHTML = "";

      //Intentionally generating 1 additional row/column which remains disabled. For smooth garden leveling purposes.
      var str = "";
      for (var y = 0; y <= M.plotSize.height; y++) {
        if (!M.plot[y]) M.plot[y] = []; // create missing rows
        for (var x = 0; x <= M.plotSize.width; x++) {
          if (!M.plot[y][x]) M.plot[y][x] = [0, 0]; // create empty tiles
          str += `
            <div 
              id="gardenTile-${x}-${y}" 
              class="gardenTile" 
              style="left:${x * M.tileSize}px; 
              top:${y * M.tileSize}px; 
              display:none;"
              ${Game.getDynamicTooltip(
                `Game.ObjectsById[${M.parent.id}].minigame.tileTooltip(${x},${y})`,
                "this"
              )}>
              <div id="gardenTileIcon-${x}-${y}" class="gardenTileIcon" style="display:none;"></div>
            </div>
          `;
        }
      }
      l("gardenPlot").innerHTML = str;

      for (var y = 0; y < M.plotSize.height; y++) {
        for (var x = 0; x < M.plotSize.width; x++) {
          AddEvent(
            l(`gardenTile-${x}-${y}`),
            "click",
            (function (x, y) {
              return function () {
                M.clickTile(x, y);
              };
            })(x, y)
          );
        }
      }

      //     AddEvent(
      //       l("gardenTile-" + x + "-" + y),
      //       "click",
      //       (function (x, y) {
      //         return function () {
      //           M.clickTile(x, y);
      //         };
      //       })(x, y)
      //     );
      //   }
      // }}

      var plants = 0;
      for (var y = 0; y < M.plotSize.height; y++) {
        for (var x = 0; x < M.plotSize.width; x++) {
          var tile = M.plot[y][x];
          var tileL = l(`gardenTile-${x}-${y}`);
          var iconL = l(`gardenTileIcon-${x}-${y}`);
          var me = 0;

          if (tile[0] > 0) {
            plants++;
            me = M.plantsById[tile[0] - 1];
            var stage = 0;
            if (tile[1] >= me.mature) stage = 4;
            else if (tile[1] >= me.mature * 0.666) stage = 3;
            else if (tile[1] >= me.mature * 0.333) stage = 2;
            else stage = 1;
            var dying =
              tile[1] + Math.ceil(me.ageTick + me.ageTickR) >= 100 ? 1 : 0;
            var icon = [stage, me.icon];
            iconL.style.opacity = dying ? 0.5 : 1;
            iconL.style.backgroundPosition =
              -icon[0] * 48 + "px " + -icon[1] * 48 + "px";
            iconL.style.display = "block";
            // iconL.innerHTML = M.plotBoost[y][x];
          } else iconL.style.display = "none";

          if (M.isTileUnlocked(x, y)) tileL.style.display = "block";
          else tileL.style.display = "none";
        }
      }
      if (plants >= 6 * 6) Game.Win("In the garden of Eden (baby)");

      // Game.Notify("Plots Built", "", "", 1);
    };

    M.getTile = function (x, y) {
      const w = M.plotSize.width;
      const h = M.plotSize.height;

      if (x < 0 || x >= w || y < 0 || y >= h || !M.isTileUnlocked(x, y))
        return [0, 0, 0];
      return M.plot[y][x];
    };

    M.isTileUnlocked = function (x, y) {
      const w = M.plotSize.width;
      const h = M.plotSize.height;

      return x >= 0 && x < w && y >= 0 && y < h;
    };

    M.harvestAll = function (type, mature, mortal) {
      var harvested = 0;

      for (var i = 0; i < 2; i++) {
        for (var y = 0; y < M.plotSize.height; y++) {
          for (var x = 0; x < M.plotSize.width; x++) {
            if (M.plot[y][x][0] >= 1) {
              var doIt = true;
              var tile = M.plot[y][x];
              var me = M.plantsById[tile[0] - 1];
              if (type && me != type) doIt = false;
              if (mortal && me.immortal) doIt = false;
              if (mature && tile[1] < me.mature) doIt = false;

              if (doIt) harvested += M.harvest(x, y) ? 1 : 0;
            }
          }
        }
      }
      if (harvested > 0)
        setTimeout(function () {
          PlaySound("snd/harvest1.mp3", 1, 0.2);
        }, 50);
      if (harvested > 2)
        setTimeout(function () {
          PlaySound("snd/harvest2.mp3", 1, 0.2);
        }, 150);
      if (harvested > 6)
        setTimeout(function () {
          PlaySound("snd/harvest3.mp3", 1, 0.2);
        }, 250);
    };

    //Shift click the seeds amount text to fill the garden.
    AddEvent(l("gardenSeedsUnlocked"), "click", function () {
      if (Game.sesame) {
        if (Game.keys[16] && Game.keys[17]) {
          for (var y = 0; y < M.plotSize.height; y++) {
            if (!M.plot[y]) continue;

            for (var x = 0; x < M.plotSize.width; x++) {
              if (!M.plot[y][x]) continue; // skip if tile undefined

              M.plot[y][x] = [
                choose(M.plantsById).id + 1,
                Math.floor(Math.random() * 100),
              ];
            }
          }
          M.toRebuild = true;
          M.toCompute = true;
        } else {
          var locked = 0;
          for (var i in M.plants) {
            if (!M.plants[i].unlocked) locked++;
          }
          if (locked > 0) {
            for (var i in M.plants) {
              M.unlockSeed(M.plants[i]);
            }
          } else {
            for (var i in M.plants) {
              M.lockSeed(M.plants[i]);
            }
          }
          M.unlockSeed(M.plants["bakerWheat"]);
        }
      }
    });

    M.onResize = function () {
      var width = l("gardenContent").offsetWidth;
      var panelW =
        Math.min(Math.max(width * 0.4, 320), width - 6 * M.tileSize) - 8;
      var fieldW =
        Math.max(Math.min(width * 0.6, width - panelW), 6 * M.tileSize) - 8;
      l("gardenField").style.width = fieldW + "px";
      l("gardenPanel").style.width = panelW + "px";
    };

    M.resizePlots = function () {
      const w = M.plotSize.width;
      const h = M.plotSize.height;

      // Expand plot
      for (let y = 0; y < h; y++) {
        if (!M.plot[y]) M.plot[y] = [];
        for (let x = 0; x < w; x++) {
          if (!M.plot[y][x]) M.plot[y][x] = [0, 0];
        }
      }

      // Trim extra rows/cols if downsizing
      M.plot.length = h;
      for (let y = 0; y < h; y++) M.plot[y].length = w;

      // Expand plotBoost
      for (let y = 0; y < h; y++) {
        if (!M.plotBoost[y]) M.plotBoost[y] = [];
        for (let x = 0; x < w; x++) {
          if (!M.plotBoost[y][x]) M.plotBoost[y][x] = [1, 1, 1];
        }
      }

      M.plotBoost.length = h;
      for (let y = 0; y < h; y++) M.plotBoost[y].length = w;
    };

    //Adds an way to recenter the GardenUI
    window.removeEventListener("resize", onresize);
    window.addEventListener("resize", () => {
      this.centerGardenUI();
      M.onResize();
    });

    M.reset = function (hard) {
      M.soil = 0;
      if (M.seedSelected > -1)
        M.plantsById[M.seedSelected].l.classList.remove("on");
      M.seedSelected = -1;

      M.nextStep = Date.now();
      M.nextSoil = Date.now();
      M.nextFreeze = Date.now();
      for (var y = 0; y < plotSize.height; y++) {
        for (var x = 0; x < plotSize.width; x++) {
          M.plot[y][x] = [0, 0];
        }
      }

      M.harvests = 0;
      if (hard) {
        M.convertTimes = 0;
        M.harvestsTotal = 0;
        for (var i in M.plants) {
          M.plants[i].unlocked = 0;
        }
      }

      M.plants["bakerWheat"].unlocked = 1;

      M.loopsMult = 1;

      M.getUnlockedN();
      M.computeStepT();

      M.computeMatures();

      M.buildPlot();
      M.buildPanel();
      M.computeEffs();
      M.toCompute = true;

      setTimeout(
        (function (M) {
          return function () {
            this.centerGardenUI();
            M.onResize();
          };
        })(M),
        10
      );
    };

    M.logic = function () {
      //run each frame
      var now = Date.now();

      if (!M.freeze) {
        M.nextStep = Math.min(M.nextStep, now + M.stepT * 1000);
        if (now >= M.nextStep) {
          M.computeStepT();
          M.nextStep = now + M.stepT * 5;

          M.computeBoostPlot();
          M.computeMatures();

          var weedMult = M.soilsById[M.soil].weedMult;

          var dragonBoost = 1 + 0.05 * Game.auraMult("Supreme Intellect");

          var loops = 1;
          if (M.soilsById[M.soil].key == "woodchips") loops = 3;
          loops = randomFloor(loops * dragonBoost);
          loops *= M.loopsMult;
          M.loopsMult = 1;

          for (var y = 0; y < M.plotSize.height; y++) {
            for (var x = 0; x < M.plotSize.width; x++) {
              if (M.isTileUnlocked(x, y)) {
                var tile = M.plot[y][x];
                var me = M.plantsById[tile[0] - 1];
                if (tile[0] > 0) {
                  //age
                  tile[1] += randomFloor(
                    (me.ageTick + me.ageTickR * Math.random()) *
                      M.plotBoost[y][x][0] *
                      dragonBoost
                  );
                  tile[1] = Math.max(tile[1], 0);
                  if (me.immortal) tile[1] = Math.min(me.mature + 1, tile[1]);
                  else if (tile[1] >= 100) {
                    //die of old age
                    M.plot[y][x] = [0, 0];
                    if (me.onDie) me.onDie(x, y);
                    if (
                      M.soilsById[M.soil].key == "pebbles" &&
                      Math.random() < 0.35
                    ) {
                      if (M.unlockSeed(me))
                        Game.Popup(
                          loc("Unlocked %1 seed.", me.name),
                          Game.mouseX,
                          Game.mouseY
                        );
                    }
                  } else if (!me.noContam) {
                    //other plant contamination
                    //only occurs in cardinal directions
                    //immortal plants and plants with noContam are immune

                    var list = [];
                    for (var i in M.plantContam) {
                      if (
                        Math.random() < M.plantContam[i] &&
                        (!M.plants[i].weed || Math.random() < weedMult)
                      )
                        list.push(i);
                    }
                    var contam = choose(list);

                    if (contam && me.key != contam) {
                      if (
                        (!M.plants[contam].weed && !M.plants[contam].fungus) ||
                        Math.random() < M.plotBoost[y][x][2]
                      ) {
                        var any = 0;
                        var neighs = {}; //all surrounding plants
                        var neighsM = {}; //all surrounding mature plants
                        for (var i in M.plants) {
                          neighs[i] = 0;
                          neighsM[i] = 0;
                        }

                        for (const [dx, dy] of [
                          [0, -1],
                          [0, +1],
                          [-1, 0],
                          [+1, 0],
                        ]) {
                          var neigh = M.getTile(x + dx, y + dy);
                          if (neigh[0] > 0) {
                            var age = neigh[1];
                            neigh = M.plantsById[neigh[0] - 1];
                            any++;
                            neighs[neigh.key]++;
                            if (age >= neigh.mature) {
                              neighsM[neigh.key]++;
                            }
                          }
                        }

                        if (neighsM[contam] >= 1)
                          M.plot[y][x] = [M.plants[contam].id + 1, 0];
                      }
                    }
                  }
                } else {
                  //plant spreading and mutation
                  //happens on all 8 tiles around this one
                  for (var loop = 0; loop < loops; loop++) {
                    var any = 0;
                    var neighs = {}; //all surrounding plants
                    var neighsM = {}; //all surrounding mature plants
                    for (var i in M.plants) {
                      neighs[i] = 0;
                      neighsM[i] = 0;
                    }

                    //Rather than repeat the code a few times, lets just use for twice.
                    for (let dx = -1; dx <= 1; dx++) {
                      for (let dy = -1; dy <= 1; dy++) {
                        var neigh = M.getTile(x + dx, y + dy);
                        if (neigh[0] > 0) {
                          var age = neigh[1];
                          neigh = M.plantsById[neigh[0] - 1];
                          any++;
                          neighs[neigh.key]++;
                          if (age >= neigh.mature) {
                            neighsM[neigh.key]++;
                          }
                        }
                      }
                    }

                    if (any > 0) {
                      var muts = M.getMuts(neighs, neighsM);

                      var list = [];
                      for (var ii = 0; ii < muts.length; ii++) {
                        if (
                          Math.random() < muts[ii][1] &&
                          (!M.plants[muts[ii][0]].weed ||
                            Math.random() < weedMult) &&
                          ((!M.plants[muts[ii][0]].weed &&
                            !M.plants[muts[ii][0]].fungus) ||
                            Math.random() < M.plotBoost[y][x][2])
                        )
                          list.push(muts[ii][0]);
                      }
                      if (list.length > 0)
                        M.plot[y][x] = [M.plants[choose(list)].id + 1, 0];
                    } else if (loop == 0) {
                      //weeds in empty tiles (no other plants must be nearby)
                      var chance = 0.002 * weedMult * M.plotBoost[y][x][2];
                      if (Math.random() < chance)
                        M.plot[y][x] = [M.plants["meddleweed"].id + 1, 0];
                    }
                  }
                }
              }
            }
          }
          M.toRebuild = true;
          M.toCompute = true;

          //Extend instead of replace?
        }
      }
      if (M.toRebuild) M.buildPlot();
      if (M.toCompute) M.computeEffs();

      if (Game.keys[27]) {
        //esc
        if (M.seedSelected > -1)
          M.plantsById[M.seedSelected].l.classList.remove("on");
        M.seedSelected = -1;
      }
    };

    this.reStyleDivs();

    M.toRebuild = true;
    M.buildPlot();
    M.buildPanel();
    M.computeBoostPlot();

    M.save = function () {
      GardenUnchained.save;
    };
    M.load = function () {
      GardenUnchained.load;
    };

    console.log("Garden Unchained init done!");
  },

  reStyleDivs: function () {
    const plot = l("gardenPlot");
    plot.style.width = null;
    plot.style.height = null;

    //Makes the soils not scroll with the window.
    const field = l("gardenField");
    field.style.overflow = "auto";

    //Places the soils in the bottom
    const soils = l("gardenSoils");
    soils.style.marginTop = "240px";
    soils.style.position = "fixed";
    soils.style.transform = "translateX(-50%)";

    //Places sugar info at the bottom
    const sugarInfo = l("gardenInfo");
    sugarInfo.style.marginTop = "288px";
    sugarInfo.style.position = "fixed";
    sugarInfo.style.transform = "translateX(-50%)";

    //Set and forget Once
    const layout = l("gardenContent");
    layout.style.display = "flex";
    layout.style.gap = "8px";

    //The sidepanel.
    const panel = l("gardenPanel");
    panel.style.minWidth = "320px";
    panel.style.flex = "0 1 40%";

    //field
    field.style.minWidth = 6 * M.tileSize + "px";
    field.style.flex = "1";

    this.centerGardenUI();
  },

  centerGardenUI: function () {
    const field = l("gardenField");
    const soils = l("gardenSoils");
    const sugarInfo = l("gardenInfo");

    const fieldRect = field.getBoundingClientRect();

    soils.style.left = fieldRect.left + fieldRect.width / 2 + "px";
    sugarInfo.style.left = fieldRect.left + fieldRect.width / 2 + "px";
  },

  save: function () {
    M.plotSize.update();
    const w = M.plotSize.width;
    const h = M.plotSize.height;

    var str =
      "" +
      parseFloat(M.nextStep) +
      ":" +
      parseInt(M.soil) +
      ":" +
      parseFloat(M.nextSoil) +
      ":" +
      parseInt(M.freeze) +
      ":" +
      parseInt(M.harvests) +
      ":" +
      parseInt(M.harvestsTotal) +
      ":" +
      parseInt(M.parent.onMinigame ? "1" : "0") +
      ":" +
      parseFloat(M.convertTimes) +
      ":" +
      parseFloat(M.nextFreeze) +
      ":" +
      parseFloat(M.plantsById.length) +
      ": "; // Added number of plants

    //Unlocked seeds
    for (var i in M.plants) {
      str += "" + (M.plants[i].unlocked ? "1" : "0");
    }
    str += " ";

    //Variable plot size
    str += parseFloat(w) + ":" + parseFloat(h) + " ";

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (!M.plot[y][x][0]) M.plot[y][x] = [0, 0];
        str +=
          parseInt(M.plot[y][x][0]) + ":" + parseInt(M.plot[y][x][1]) + ":";
      }
    }

    return str;
    //output cannot use ",", ";" or "|"  },
  },

  load: function (str) {
    M.plotSize.update();

    console.log(str);
    //interpret str; called after .init
    //note: not actually called in the Game's load; see "minigameSave" in main.js
    if (!str) return false;
    var i = 0;
    var spl = str.split(" ");
    var spl2 = spl[i++].split(":");
    var i2 = 0;
    M.nextStep = parseFloat(spl2[i2++] || M.nextStep);
    M.soil = parseInt(spl2[i2++] || M.soil);
    M.nextSoil = parseFloat(spl2[i2++] || M.nextSoil);
    M.freeze = parseInt(spl2[i2++] || M.freeze) ? 1 : 0;
    M.harvests = parseInt(spl2[i2++] || 0);
    M.harvestsTotal = parseInt(spl2[i2++] || 0);
    var on = parseInt(spl2[i2++] || 0);
    if (on && Game.ascensionMode != 1) M.parent.switchMinigame(1);
    M.convertTimes = parseFloat(spl2[i2++] || M.convertTimes);
    M.nextFreeze = parseFloat(spl2[i2++] || M.nextFreeze);
    var plantsN = parseFloat(spl2[i2++] || M.plants.length);

    if (!M.plantsById.length == plantsN)
      return "Error! saved/loaded plants mismatch.";

    var seeds = spl[i++] || "";
    if (seeds) {
      var n = 0;
      console.log(M.plants);
      for (ii in M.plants) {
        if (seeds.charAt(n) == "1") M.plants[ii].unlocked = 1;
        else M.plants[ii].unlocked = 0;
        n++;
      }
    }
    M.plants["bakerWheat"].unlocked = 1;

    var w = parseFloat(spl[i++] || M.plotSize.width);
    var h = parseFloat(spl2[i2++] || M.plotSize.height);

    var plot = spl[i++] || 0;
    if (plot) {
      plot = plot.split(":");
      var n = 0;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          if (M.plot[y] == undefined) console.log(h, y, "width:", w, x);
          M.plot[y][x] = [parseInt(plot[n]), parseInt(plot[n + 1])];
          n += 2;
        }
      }
    }

    M.getUnlockedN();
    M.computeStepT();

    M.buildPlot();
    M.buildPanel();

    M.computeBoostPlot();
    M.toCompute = true;

    Game.Notify("Load?", "", "", 1);
  },
});
