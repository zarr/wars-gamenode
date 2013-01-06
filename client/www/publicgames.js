require(["jquery-1.6.2.min.js","gamenode", "base"], function() {
  var client = new GameNodeClient(Skeleton);
  var session = null;

  var initialPage = /(\d+)/.exec(window.location.hash);
  if(initialPage !== null) {
    initialPage = parseInt(initialPage[1]);
  } else {
    initialPage = 1;
    window.location.hash = initialPage;
  }

  $(document).ready(function() {
    var loginUrl = "login.html?next=" + document.location.pathname + document.location.search;
    session = resumeSessionOrRedirect(client, WARS_CLIENT_SETTINGS.gameServer, loginUrl, function() {
      populateNavigation(session);
      populatePublicGames(client);
    });
  });
  
  function updatePageControls() {
    $("#firstPage").attr("href", "#" + paginator.firstPage()).toggle(paginator.currentPage != paginator.firstPage());
    $("#lastPage").attr("href", "#" + paginator.lastPage()).toggle(paginator.currentPage != paginator.lastPage());
    $("#prevPage").attr("href", "#" + paginator.prevPage()).toggle(paginator.currentPage != paginator.firstPage());
    $("#nextPage").attr("href", "#" + paginator.nextPage()).toggle(paginator.currentPage != paginator.lastPage());
    $(".pageLink").removeClass("current");
    $(".pageLink[page=\"" + paginator.currentPage + "\"]").addClass("current");
  }

  function populatePublicGames(client) {
    client.stub.publicGames(null, function(response) {
      if(!response.success) {
        alert("Error loading games! " + response.reason);
        return
      }
      
      var games = $("#games tbody");
      
      paginator = new Paginator(response.games, function(){ games.empty() }, function(game) {
        var row = $("<tr></tr>");
        
        var nameItem = $("<td></td>");
        var mapItem = $("<td></td>");
        var playersItem = $("<td></td>");
        var gameRoundItem = $("<td></td>");
        
        var name = $("<a></a>");
        var map = $("<a></a>");
        var players = $("<a></a>");
        var gameRound = $("<a></a>");
        
        name.text(game.name);
        map.text(game.map.name);
        players.text(game.numPlayers);
        gameRound.text(game.round);
        
        nameItem.append(name);
        mapItem.append(map);
        playersItem.append(players);
        gameRoundItem.append(gameRound);
        
        row.append(nameItem);
        row.append(mapItem);
        row.append(playersItem);
        row.append(gameRoundItem);
        
        $("a", row).attr("href",  "game.html?gameId=" + game.gameId);
        
        games.append(row);
      });

      paginator.setPage(initialPage);
      
      var pages = $("#pages");
      for(var i = 0; i < paginator.pages(); ++i) {
        var pageLink = $("<a></a>");
        pageLink.text(i + 1);
        pageLink.attr("href", "#" + (i + 1));
        pageLink.attr("page", i + 1);
        pageLink.addClass("pageLink");
        pages.append(pageLink);
      }
      
      function changePage(e, page) {
        e.preventDefault();
        paginator.setPage(page);
        window.location.hash = page;
        updatePageControls();
      }
      
      updatePageControls();
      
      $(".pageLink").click(function(e) { changePage(e, parseInt($(this).attr("page"))); });
      $("#firstPage").click(function(e) { changePage(e, paginator.firstPage()); });
      $("#lastPage").click(function(e) { changePage(e, paginator.lastPage()); });
      $("#nextPage").click(function(e) { changePage(e, paginator.nextPage()); });
      $("#prevPage").click(function(e) { changePage(e, paginator.prevPage()); });
      
      if(paginator.pages() == 1) {
        $("#pageControls").hide();
      }
    });
  }
});