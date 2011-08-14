var entities = require("./entities");

function Skeleton(client) {
  this.client = client;
  this.server = this.client.server;
  this.session = null;
  this.sessionId = null;

  client.onDisconnect = function() {
    this.server.subscriptions.removeAllSubscriptions(this);
  }
}

exports.Skeleton = Skeleton;


// GAME MANAGEMENT

Skeleton.prototype.createGame = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var game = new entities.Game(null, this.session.userId, info.name, info.mapId, "pregame", 0, 0, 0, 0, 
                               {public: info.public, turnLength: info.turnLength});
  var requestId = this.client.requestId;
  var this_ = this;
  this.server.gameManagement.createGame(game, function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true, gameId: result.gameId});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.joinGame = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameManagement.joinGame(userId, info.gameId, info.playerNumber, function(result) {
    if(result.success) {
      this_.server.database.user(userId, function(result) {
        this_.server.subscriptions.forSubscribers(function(sub) {
          var isMe = result.user.userId == sub.session.userId;
          sub.client.stub.playerJoined({number:info.playerNumber, name: result.user.username, isMe: isMe});
        }, "game-" + info.gameId);
      });
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.leaveGame = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameManagement.leaveGame(userId, info.gameId, info.playerNumber, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.playerLeft({number:info.playerNumber});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.startGame = function(gameId) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameManagement.startGame(userId, gameId, function(result) {
    if(result.success) {
      this_.server.gameActions.nextTurn(gameId, userId, function(result) {
        if(result.success) {
          this_.server.subscriptions.forSubscribers(function(sub) {
            sub.client.stub.gameStarted(gameId);
          }, "game-" + gameId);
          this_.client.sendResponse(requestId, {success: true});
        } else {
          this_.client.sendResponse(requestId, {success: false, reason: result.reason});
        }
      });
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.deleteGame = function(gameId) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameManagement.deleteGame(userId, gameId, function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.openGames = function() {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var requestId = this.client.requestId;
  var this_ = this;
  this.server.gameManagement.openGames(function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true, games: result.games});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.myGames = function() {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var requestId = this.client.requestId;
  var this_ = this;
  this.server.gameManagement.myGames(this.session.userId, function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true, games: result.games});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.players = function(gameId) {
  
}

Skeleton.prototype.setEmailSetting = function(gameId, value) {
  
}

Skeleton.prototype.emailSetting = function(gameId) {
  
}

// MAP MANAGEMENT

Skeleton.prototype.createMap = function(mapInfo) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var map = new entities.Map(null, this.session.userId, mapInfo.name, mapInfo.initialFunds, mapInfo.mapData);
  var requestId = this.client.requestId;
  var this_ = this;
  this.server.database.createMap(map, function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true, mapId: result.mapId});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.updateMap = function(mapInfo) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var requestId = this.client.requestId;
  var this_ = this;
  var map = new entities.Map(mapInfo.mapId, this.session.userId, mapInfo.name, mapInfo.initialFunds, mapInfo.mapData);
  this.server.database.updateMap(map, function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.mapData = function(mapId) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var requestId = this.client.requestId;
  var this_ = this;
  
  this.server.database.map(mapId, function(result) {
    if(!result.success) {
      this_.client.sendResponse(requestId, {success: false});
    } else {
      var map = result.map;
      this_.server.database.mapData(mapId, function(result) {
        if(result.success) {
          this_.client.sendResponse(requestId, {success: true, name: map.name, funds: map.funds, 
                                                players: map.players, mapData: result.mapData});
        } else {
          this_.client.sendResponse(requestId, {success: false, reason: result.reason});
        }
      });
    }
  });
}

Skeleton.prototype.maps = function() {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var requestId = this.client.requestId;
  var this_ = this;
  this.server.database.maps(function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true, maps: result.maps});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.myMaps = function() {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var requestId = this.client.requestId;
  var this_ = this;
  this.server.database.myMaps(this.session.userId, function(result) {
    if(result.success) {
      this_.client.sendResponse(requestId, {success: true, maps: result.maps});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

// PROFILE MANAGEMENT

Skeleton.prototype.saveProfile = function(username, password, email, theme, defaultEmailSetting) {
  
}

Skeleton.prototype.profile = function() {
  
}

// USER MANAGEMENT

Skeleton.prototype.newSession = function(credentials) {
  var requestId = this.client.requestId;
  var this_ = this;
  this.server.database.userId(credentials.username, credentials.password, function(result) {
    if(result.success) {
      this_.session = {userId: result.userId};
      this_.sessionId = this_.server.sessionStorage.createSession(this_.session);
      this_.client.sendResponse(requestId, {success: true, sessionId: this_.sessionId});
    } else {
      this_.client.sendResponse(requestId, {success: false, sessionId: null, reason: result.reason});
    }
  });
}

Skeleton.prototype.resumeSession = function(sessionId) {
  this.session = this.server.sessionStorage.getSession(sessionId);
  this.sessionId = sessionId;
  if(this.session !== undefined) {
    return {success: true, sessionId: sessionId};
  } else {
    return {success: false, sessionId: null};
  }
}

Skeleton.prototype.closeSession = function() {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var success = this.server.sessionStorage.deleteSession(this.sessionId);
  return {success: success};
}

Skeleton.prototype.register = function(userInfo) {
  var user = new entities.User(null, userInfo.username, userInfo.password, userInfo.email, 
                               {emailNotifications: true, gameTheme: "default"});
  var requestId = this.client.requestId;
  var this_ = this;
  this.server.database.register(user, function(userId) {
    if(userId !== null) {
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

// GAME

Skeleton.prototype.gameRules = function(gameId) {
  var elements = this.server.settings.gameElements;
  var rules = {
    armors: elements.armors,
    units: elements.units,
    terrains: elements.terrains,
    weapons: elements.weapons,
    terrainFlags: elements.terrainFlags,
    unitClasses: elements.unitClasses,
    movementTypes: elements.movementTypes,
    unitFlags: elements.unitFlags
  }
  
  if(gameId !== null) {
    rules.bannedUnits = [];
  }
  
  return rules;
}

Skeleton.prototype.gameData = function(gameId) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}

  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.database.gameData(gameId, function(result) {
    if(result.success) {
      var author = result.game.authorId == userId;
      var game = result.game;
      for(var i = 0; i < game.players.length; ++i) {
        game.players[i].isMe = game.players[i].userId == userId;
      }
      this_.client.sendResponse(requestId, {success: true, game: game, author: author});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.myFunds = function(gameId) {
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.database.game(gameId, function(result) {
    if(!result.success) {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    } else {
      var game = result.game;
    
      this_.server.database.players(gameId, function(result) {
        if(result.success) {
          var players = result.players;
          var funds = null;
          var passedInTurn = false;
          for(var i = 0; i < players.length; ++i) {
            var player = players[i];
            if(player.playerNumber == game.inTurnNumber) {
              passedInTurn = true;
            }
            if(player.userId == userId) {
              if(passedInTurn) {
                funds = player.funds;
                break;
              } else if(funds === null) {
                funds = player.funds;
              } 
            }
          }
          
          if(funds !== null) {
            this_.client.sendResponse(requestId, {success: true, funds: funds});
          } else {
            this_.client.sendResponse(requestId, {success: false, reason: "No player for user!"});
          }
        } else {
          this_.client.sendResponse(requestId, {success: false, reason: result.reason});
        }
      
      });
    }
  });
}

Skeleton.prototype.turnRemaining = function(gameId) {
  
}

Skeleton.prototype.subscribeGame = function(gameId) {
  this.server.subscriptions.addSubscription(this, "game-" + gameId);
  return {success: true};
}

Skeleton.prototype.unsubscribeGame = function(gameId) {
  this.server.subscriptions.removeSubscription(this, "game-" + gameId);
  return {success: true};
}

Skeleton.prototype.move = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.move(info.gameId, userId, info.unitId, info.destination, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.moveAndAttack = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.moveAndAttack(info.gameId, userId, info.unitId, info.destination, info.targetId, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.moveAndWait = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.moveAndWait(info.gameId, userId, info.unitId, info.destination, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.moveAndCapture = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.moveAndCapture(info.gameId, userId, info.unitId, info.destination, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.moveAndDeploy = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.moveAndDeploy(info.gameId, userId, info.unitId, info.destination, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.undeploy = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.undeploy(info.gameId, userId, info.unitId, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.moveAndLoadInto = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.moveAndLoadInto(info.gameId, userId, info.unitId, info.carrierId, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.moveAndUnload = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.moveAndUnload(info.gameId, userId, info.unitId, info.destination, 
                                      info.carriedUnitId, info.unloadDestination, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.build = function(info) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.build(info.gameId, userId, info.unitTypeId, info.destination, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: info.gameId, tileChanges: result.changedTiles});
      }, "game-" + info.gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.endTurn = function(gameId) {
  if(this.sessionId === null)
    return {success: false, reason: "Not logged in"}
    
  var requestId = this.client.requestId;
  var this_ = this;
  var userId = this.session.userId;
  this.server.gameActions.nextTurn(gameId, userId, function(result) {
    if(result.success) {
      this_.server.subscriptions.forSubscribers(function(sub) {
        sub.client.stub.gameUpdate({gameId: gameId, tileChanges: result.changedTiles});
        if(result.finished) {
          sub.client.stub.gameFinished({gameId: gameId});
        } else {
          sub.client.stub.gameTurnChange({gameId: gameId, inTurnNumber: result.inTurnNumber});
        }
      }, "game-" + gameId);
      this_.client.sendResponse(requestId, {success: true});
    } else {
      this_.client.sendResponse(requestId, {success: false, reason: result.reason});
    }
  });
}

Skeleton.prototype.surrender = function(gameId) {
  
}

// CHAT

Skeleton.prototype.chatMessages = function(gameId) {
  
}

Skeleton.prototype.subscribeLobbyChat = function() {
  this.server.subscriptions.addSubscription(this, "lobbyChat");
}

Skeleton.prototype.lobbyChat = function(message) {
  var this_ = this;
  var time = (new Date()).toUTCString();
  this.server.database.user(this.session.userId, function(result) {
    var sender = result.user.username;
    this_.server.subscriptions.forSubscribers(function(sub) {
      sub.client.stub.chatMessage({time: time, sender: sender, content: message});
    }, "lobbyChat");
  });
}

Skeleton.prototype.chat = function(info) {
  var this_ = this;
  var time = (new Date()).toUTCString();
  this.server.database.user(this.session.userId, function(result) {
    var sender = result.user.username;
    this_.server.subscriptions.forSubscribers(function(sub) {
      sub.client.stub.chatMessage({time: time, sender: sender, content: info.message});
    }, "game-" + info.gameId);
  });
}

// GAME EVENT TICKER

Skeleton.prototype.tickerMessages = function(gameId, count) {
  
}

// GAME STATISTICS

Skeleton.prototype.gameStatistics = function(gameId) {
  
}

Skeleton.prototype.lastTurnStatistics = function(gameId) {
  
}