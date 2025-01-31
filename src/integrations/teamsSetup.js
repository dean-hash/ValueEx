'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.TeamsSetup = void 0;
var teams_client_1 = require('@microsoft/teams-client');
var microsoft_graph_client_1 = require('@microsoft/microsoft-graph-client');
var teamsVoiceCollaboration_1 = require('./teamsVoiceCollaboration');
var TeamsSetup = /** @class */ (function () {
  function TeamsSetup() {
    this.initializeClients();
    this.voiceCollab = new teamsVoiceCollaboration_1.TeamsVoiceCollaboration();
  }
  TeamsSetup.prototype.initializeClients = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Initialize with cascade@divvytech.com credentials
        this.teamsClient = new teams_client_1.TeamsClient({
          credentials: {
            clientId: process.env.TEAMS_CLIENT_ID,
            clientSecret: process.env.TEAMS_CLIENT_SECRET,
            tenantId: process.env.TENANT_ID,
          },
        });
        this.graphClient = microsoft_graph_client_1.GraphServiceClient.init({
          authProvider: function (done) {
            done(null, process.env.GRAPH_TOKEN);
          },
        });
        return [2 /*return*/];
      });
    });
  };
  TeamsSetup.prototype.cleanupEnvironment = function () {
    return __awaiter(this, void 0, void 0, function () {
      var teams, _i, _a, team;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            return [4 /*yield*/, this.graphClient.teams.get()];
          case 1:
            teams = _b.sent();
            (_i = 0), (_a = teams.value);
            _b.label = 2;
          case 2:
            if (!(_i < _a.length)) return [3 /*break*/, 5];
            team = _a[_i];
            if (!!this.isEssentialTeam(team.displayName)) return [3 /*break*/, 4];
            return [4 /*yield*/, this.archiveTeam(team.id)];
          case 3:
            _b.sent();
            _b.label = 4;
          case 4:
            _i++;
            return [3 /*break*/, 2];
          case 5:
            // Remove unused licenses
            return [4 /*yield*/, this.cleanupLicenses()];
          case 6:
            // Remove unused licenses
            _b.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  TeamsSetup.prototype.isEssentialTeam = function (teamName) {
    var essentialTeams = ['ValueEx Core', 'Cascade Collaboration'];
    return essentialTeams.includes(teamName);
  };
  TeamsSetup.prototype.archiveTeam = function (teamId) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.graphClient.teams[teamId].archive.post({})];
          case 1:
            _a.sent();
            console.log('Archived team '.concat(teamId));
            return [2 /*return*/];
        }
      });
    });
  };
  TeamsSetup.prototype.cleanupLicenses = function () {
    return __awaiter(this, void 0, void 0, function () {
      var users, essentialUsers, _i, _a, user;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            return [4 /*yield*/, this.graphClient.users.get()];
          case 1:
            users = _b.sent();
            essentialUsers = [
              'dean@valueex.ai',
              'clark.johnson@divvytech.com',
              'cascade@divvytech.com',
            ];
            (_i = 0), (_a = users.value);
            _b.label = 2;
          case 2:
            if (!(_i < _a.length)) return [3 /*break*/, 5];
            user = _a[_i];
            if (!!essentialUsers.includes(user.userPrincipalName.toLowerCase()))
              return [3 /*break*/, 4];
            // Remove licenses from non-essential users
            return [4 /*yield*/, this.removeLicenses(user.id)];
          case 3:
            // Remove licenses from non-essential users
            _b.sent();
            _b.label = 4;
          case 4:
            _i++;
            return [3 /*break*/, 2];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  TeamsSetup.prototype.removeLicenses = function (userId) {
    return __awaiter(this, void 0, void 0, function () {
      var licenses;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.graphClient.users[userId].assignedLicenses.get()];
          case 1:
            licenses = _a.sent();
            return [
              4 /*yield*/,
              this.graphClient.users[userId].assignedLicenses.delete({
                addLicenses: [],
                removeLicenses: licenses.value.map(function (l) {
                  return l.skuId;
                }),
              }),
            ];
          case 2:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  TeamsSetup.prototype.setupNewEnvironment = function () {
    return __awaiter(this, void 0, void 0, function () {
      var team, channels, _i, channels_1, channel;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              this.teamsClient.createTeam({
                displayName: 'ValueEx Command Center',
                description: 'Central hub for ValueEx development and operations',
                visibility: 'private',
              }),
            ];
          case 1:
            team = _a.sent();
            channels = [
              {
                displayName: 'Strategy & Planning',
                description: 'High-level strategy discussions and planning',
              },
              {
                displayName: 'Development',
                description: 'Technical development and implementation',
              },
              {
                displayName: 'Business Operations',
                description: 'Business operations and administration',
              },
              {
                displayName: 'Voice Collaboration',
                description: 'Direct voice communication channel',
              },
            ];
            (_i = 0), (channels_1 = channels);
            _a.label = 2;
          case 2:
            if (!(_i < channels_1.length)) return [3 /*break*/, 5];
            channel = channels_1[_i];
            return [4 /*yield*/, this.teamsClient.createChannel(team.id, channel)];
          case 3:
            _a.sent();
            _a.label = 4;
          case 4:
            _i++;
            return [3 /*break*/, 2];
          case 5:
            // Setup voice collaboration
            return [4 /*yield*/, this.voiceCollab.setupVoiceChannel()];
          case 6:
            // Setup voice collaboration
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  return TeamsSetup;
})();
exports.TeamsSetup = TeamsSetup;
// Execute setup
var setup = new TeamsSetup();
Promise.all([setup.cleanupEnvironment(), setup.setupNewEnvironment()]).then(function () {
  console.log('Teams environment setup complete');
});
