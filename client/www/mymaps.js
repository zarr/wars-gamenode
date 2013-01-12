// Generated by CoffeeScript 1.3.3
(function() {

  require(["Theme", "Map", "gamenode", "base"], function(Theme, Map) {
    var changePage, client, filterMaps, initialPage, mapPainter, paginator, populateMapFilter, populateMyMaps, session, theme, updatePageControls;
    client = new GameNodeClient(Skeleton);
    session = null;
    theme = null;
    mapPainter = null;
    paginator = null;
    initialPage = /(\d+)/.exec(window.location.hash);
    if (initialPage !== null) {
      initialPage = parseInt(initialPage[1]);
    } else {
      initialPage = 1;
      window.location.hash = initialPage;
    }
    $(document).ready(function() {
      var loginUrl;
      loginUrl = "login.html?next=" + document.location.pathname + document.location.search;
      return session = resumeSessionOrRedirect(client, WARS_CLIENT_SETTINGS.gameServer, loginUrl, function() {
        return client.stub.profile(function(response) {
          theme = new Theme(response.profile.settings.gameTheme);
          return theme.load(function() {
            mapPainter = new Map(null, null, theme);
            populateNavigation(session);
            return populateMyMaps(client);
          });
        });
      });
    });
    updatePageControls = function() {
      var i, pageLink, pages;
      pages = $("#pages");
      pages.empty();
      i = 0;
      while (i < paginator.pages()) {
        pageLink = $("<a></a>");
        pageLink.text(i + 1);
        pageLink.attr("href", "#" + (i + 1));
        pageLink.attr("page", i + 1);
        pageLink.addClass("pageLink");
        pages.append(pageLink);
        ++i;
      }
      if (paginator.currentPage === paginator.firstPage()) {
        $("#firstPage").attr("href", "#" + paginator.firstPage()).addClass("disabled");
      }
      if (paginator.currentPage === paginator.lastPage()) {
        $("#lastPage").attr("href", "#" + paginator.lastPage()).addClass("disabled");
      }
      if (paginator.currentPage === paginator.firstPage()) {
        $("#prevPage").attr("href", "#" + paginator.prevPage()).addClass("disabled");
      }
      if (paginator.currentPage === paginator.lastPage()) {
        $("#nextPage").attr("href", "#" + paginator.nextPage()).addClass("disabled");
      }
      $(".pageLink").removeClass("current");
      $(".pageLink[page=\"" + paginator.currentPage + "\"]").addClass("current");
      $(".pageLink").click(function(e) {
        return changePage(e, parseInt($(this).attr("page")));
      });
      return $("#pageControls").toggle(paginator.pages() > 1);
    };
    changePage = function(e, page) {
      if (e !== undefined) {
        e.preventDefault();
      }
      paginator.setPage(page);
      window.location.hash = page;
      return updatePageControls();
    };
    populateMyMaps = function(client) {
      return mapPainter.doPreload(function() {
        return client.stub.myMaps(null, function(response) {
          var i, maps, myMaps, pageLink, pages;
          maps = response.maps;
          myMaps = $("#myMaps");
          paginator = new Paginator(maps, function() {
            return myMaps.empty();
          }, function(map) {
            var container, funds, name, players, preview, previewCanvas;
            container = $("<a></a>");
            name = $("<div></div>");
            preview = $("<div></div>");
            funds = $("<div></div>");
            players = $("<div></div>");
            previewCanvas = $("<canvas></canvas>");
            previewCanvas.text("Preview of " + map.name);
            previewCanvas.addClass("mapThumbnail");
            previewCanvas.attr("width", 200);
            previewCanvas.attr("height", 200);
            preview.append(previewCanvas);
            name.text(map.name);
            name.addClass("name");
            funds.text("Initial funds: " + map.funds);
            funds.addClass("info");
            players.text("Max players: " + map.players);
            players.addClass("info");
            container.append(name);
            container.append(preview);
            container.append(funds);
            container.append(players);
            container.addClass("mapContainer");
            container.attr("href", "mapeditor.html?mapId=" + map.mapId);
            myMaps.append(container);
            return client.stub.mapData(map.mapId, function(response) {
              var mapData;
              mapData = response.mapData;
              mapPainter.canvas = previewCanvas[0];
              mapPainter.tiles = mapData;
              return mapPainter.refresh();
            });
          });
          paginator.setPage(initialPage);
          pages = $("#pages");
          i = 0;
          while (i < paginator.pages()) {
            pageLink = $("<a></a>");
            pageLink.text(i + 1);
            pageLink.attr("href", "#" + (i + 1));
            pageLink.attr("page", i + 1);
            pageLink.addClass("pageLink");
            pages.append(pageLink);
            ++i;
          }
          $(".pageLink").click(function(e) {
            return changePage(e, parseInt($(this).attr("page")));
          });
          $("#firstPage").click(function(e) {
            return changePage(e, paginator.firstPage());
          });
          $("#lastPage").click(function(e) {
            return changePage(e, paginator.lastPage());
          });
          $("#nextPage").click(function(e) {
            return changePage(e, paginator.nextPage());
          });
          $("#prevPage").click(function(e) {
            return changePage(e, paginator.prevPage());
          });
          changePage(undefined, initialPage);
          return populateMapFilter(maps);
        });
      });
    };
    filterMaps = function(maps) {
      var maxPlayers, minPlayers, namePart;
      minPlayers = parseInt($("#minPlayers").val());
      maxPlayers = parseInt($("#maxPlayers").val());
      namePart = $("#mapName").val().toLowerCase();
      paginator.data = maps.filter(function(map) {
        return map.players >= minPlayers && map.players <= maxPlayers && (namePart === "" || map.name.toLowerCase().indexOf(namePart) !== -1);
      });
      paginator.setPage(paginator.firstPage());
      return updatePageControls();
    };
    return populateMapFilter = function(maps) {
      var i, maxOption, maxPlayers, maxPlayersSelect, minOption, minPlayers, minPlayersSelect;
      minPlayers = null;
      maxPlayers = null;
      maps.forEach(function(map) {
        minPlayers = (minPlayers && minPlayers < map.players ? minPlayers : map.players);
        return maxPlayers = (maxPlayers && maxPlayers > map.players ? maxPlayers : map.players);
      });
      minPlayersSelect = $("#minPlayers");
      maxPlayersSelect = $("#maxPlayers");
      i = minPlayers;
      while (i <= maxPlayers) {
        minOption = $("<option></option>");
        minOption.attr("value", i);
        minOption.text(i);
        minOption.prop("selected", i === minPlayers);
        minPlayersSelect.append(minOption);
        maxOption = $("<option></option>");
        maxOption.attr("value", i);
        maxOption.text(i);
        maxOption.prop("selected", i === maxPlayers);
        maxPlayersSelect.append(maxOption);
        ++i;
      }
      minPlayersSelect.change(function() {
        if (parseInt(maxPlayersSelect.val()) < parseInt($(this).val())) {
          return maxPlayersSelect.val($(this).val());
        }
      });
      maxPlayersSelect.change(function() {
        if (parseInt(minPlayersSelect.val()) > parseInt($(this).val())) {
          return minPlayersSelect.val($(this).val());
        }
      });
      return $("#mapFilterForm").submit(function(e) {
        e.preventDefault();
        return filterMaps(maps);
      });
    };
  });

}).call(this);
