(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    var PipefyProfile;
    var debug = false;
    PipefyProfile = (function() {
      function PipefyProfile(config) {
        var _this;
        this.config = config;
        this.addTimer = __bind(this.addTimer, this);
        this.pipeNameSelector = ".pipe-header .pipe-title a";
        this.cardNameSelector = "div.card-title div.content h1.card-name";
        this.actionSelector = ".card-action-dates";
        this.platformLoaded = false;
        this.actionElement = null;
        this.renderTries = 0;
        this.timerListItem = null;

        _this = this;
        document.addEventListener('DOMContentLoaded', function() {
          _this.loadHarvestPlatform();

          _this.addTimerWhenUrlChanges();
          _this.addTimerIfAlreadyInCard();

          //document.querySelector("sidebar-nav").style.display = "none";
        });
      }

      PipefyProfile.prototype.loadHarvestPlatform = function() {
        var configScript, ph, platformConfig, platformScript,
          _this = this;
        platformConfig = {
          applicationName: "Pipefy",
          permalink: "https://app.pipefy.com/pipes/%PROJECT_ID%#cards/%ITEM_ID%",
          environment: "production",
          skipStyling: true
        };
        configScript = document.createElement("script");
        configScript.innerHTML = "window._harvestPlatformConfig = " + (JSON.stringify(platformConfig)) + ";";
        platformScript = document.createElement("script");
        platformScript.src = "https://platform.harvestapp.com/assets/platform.js";
        platformScript.async = true;
        ph = document.getElementsByTagName("script")[0];
        ph.parentNode.insertBefore(configScript, ph);
        ph.parentNode.insertBefore(platformScript, ph);
        return document.body.addEventListener("harvest-event:ready", function() {
          _this.platformLoaded = true;
          return _this.addTimer();
        });
      };

      PipefyProfile.prototype.addTimer = function() {
        var data, timer;

        timer = document.querySelector(".harvest-timer");

        if (!this.platformLoaded) {
          !debug || console.info("No platform");
          return;
        }

        if (timer != null) {
          !debug || console.info("Timer present!");
          return;
        }

        this.tryBuildTimer();
      };

      PipefyProfile.prototype.tryBuildTimer = function() {
        setTimeout((function(_this) {
          return function() {
            _this.renderTries++;
            !debug || console.info("trying to add button");

            var hasTimer = !!document.querySelector(".harvest-timer");
            var hasActions = !!document.querySelector(_this.actionSelector);
            var hasTitle = !!document.querySelector(_this.cardNameSelector);

            if (hasTimer) {
              !debug || console.info("already in!!! romving it!");
              if (this.actionElement != null) {
                this.actionElement.removeChild(this.timerListItem);
                this.actionElement = null;
                this.timerListItem = null;
              }
            }

            data = _this.getDataForTimer();
            if (_this.notEnoughInfo(data) || !hasActions || !hasTitle) {
              !debug || console.info("pipefy is not ready...");
              _this.tryBuildTimer(data);
              return;
            }

            _this.buildTimer(data);
            _this.notifyPlatformOfNewTimers();
            _this.addTimerAgainIfElementRerendered();

            !debug || console.info("button added!" + (_this.renderTries > 1 ? "(for the " + _this.renderTries + " time)" : ""));
          }
        })(this), 100);
      }

      PipefyProfile.prototype.getDataForTimer = function() {
        var itemName, link, linkParts, projectName, _ref, _ref1;
        itemName = (_ref = document.querySelector(this.cardNameSelector)) != null ? _ref.innerText.trim() : void 0;
        projectName = (_ref1 = document.querySelector(this.pipeNameSelector)) != null ? _ref1.innerText.trim() : void 0;
        link = window.location.href;
        linkParts = link.match(/^https?:\/\/app\.pipefy\.com.*\/pipes\/([0-9]+)#cards\/([0-9]+)$/);

        return {
          project: {
            id: linkParts != null ? linkParts[2] : void 0,
            name: projectName
          },
          item: {
            id: linkParts != null ? linkParts[3] : void 0,
            name: itemName
          }
        };
      };

      PipefyProfile.prototype.notEnoughInfo = function(data) {
        var _ref, _ref1;
        return !(((data != null ? (_ref = data.project) != null ? _ref.id : void 0 : void 0) != null) && ((data != null ? (_ref1 = data.item) != null ? _ref1.id : void 0 : void 0) != null));
      };

      PipefyProfile.prototype.buildTimer = function(data) {
        var actions = document.querySelector(this.actionSelector);

        if (!actions) {
          return;
        }

        this.actionElement = actions;

        var timer = document.createElement("div");
        timer.className = "harvest-timer js-add-trello-timer date-block white";
        timer.setAttribute("id", "harvest-trello-timer");
        timer.setAttribute("data-project", JSON.stringify(data.project));
        timer.setAttribute("data-item", JSON.stringify(data.item));
        timer.style.cursor = "pointer";

        var spacer = document.createElement("span");
        spacer.innerHTML = "&nbsp;";

        var timerLabel = document.createElement("span");
        timerLabel.className = "label";
        timerLabel.innerHTML = "TRACK";

        var timerDate = document.createElement("div");
        timerDate.className = "date";

        var timerDateDay = document.createElement("strong");
        timerDateDay.className = "day";

        var timerDateDayIcon = document.createElement("i");
        timerDateDayIcon.className = "fa fa-clock-o";

        var timerDateMonth = document.createElement("span");
        timerDateMonth.className = "month";
        timerDateMonth.innerHTML = "TIME";

        timerDateDay.appendChild(timerDateDayIcon);

        timerDate.appendChild(timerDateDay);
        timerDate.appendChild(timerDateMonth);

        timer.appendChild(timerLabel);
        timer.appendChild(timerDate);

        timer.onclick = function(evt) { evt.preventDefault(); }

        actions.insertBefore(spacer, actions.children[0]);
        actions.insertBefore(timer, actions.children[0]);
      };

      PipefyProfile.prototype.notifyPlatformOfNewTimers = function() {
        var evt;
        evt = new CustomEvent("harvest-event:timers:chrome:add");
        return document.querySelector("#harvest-messaging").dispatchEvent(evt);
      };

      PipefyProfile.prototype.addTimerIfAlreadyInCard = function() {
        var link = window.location.href;
        var linkParts = !!link.match(/^https?:\/\/app\.pipefy\.com.*\/pipes\/[0-9]+#cards\/[0-9]+$/);
        if(linkParts)
          this.addTimer();
      }

      PipefyProfile.prototype.addTimerAgainIfElementRerendered = function() {
        var interval = 1000;
        var handler = setInterval((function(_this){
          return function(){
            var actions = document.querySelector(_this.actionSelector);

            if (!actions) {
              // We are not at the card anymore!
              !debug || console.info("Goodbye Mr. Card!");
              _this.renderTries = 0;
              clearInterval(handler);
              return;
            }

            if (_this.actionElement == actions)
              return;

            // It rerendered for some reason!
            !debug || console.info("Card rerendered!");
            clearInterval(handler);
            var timer = document.querySelector(".harvest-timer");
            if (!!timer)
              timer.parentNode.removeChild(timer);
            _this.renderTries = 0;
            _this.addTimer();
          }
        })(this), interval);
      }

      PipefyProfile.prototype.addTimerWhenUrlChanges = function() {
        var ph, script,
          _this = this;
        script = document.createElement("script");
        script.innerHTML = "(" + (this.notifyOnUrlChanges.toString()) + ")()";
        ph = document.getElementsByTagName("script")[0];
        ph.parentNode.insertBefore(script, ph);
        return window.addEventListener("message", function(evt) {
          if (evt.source !== window) {
            return;
          }
          if (evt.data !== "urlChange") {
            return;
          }
          _this.addTimer();
        });
      };

      PipefyProfile.prototype.notifyOnUrlChanges = function() {
        var change, fn;
        change = function() {
          return window.postMessage("urlChange", "*");
        };
        fn = window.history.pushState;
        window.history.pushState = function() {
          fn.apply(window.history, arguments);
          return change();
        };
        return window.addEventListener("popstate", change);
      };

      return PipefyProfile;

    })();
    console.log("Harvest for Pipefy extension. Github: https://github.com/ateliware/pipefy-harvest-chrome")
    return new PipefyProfile();
  })();

}).call(this);
