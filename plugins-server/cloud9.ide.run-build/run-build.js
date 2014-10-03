var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "build-runtime"
var ProcessManager;
var EventBus;
var gccRunner = require("../cloud9.run.gcc/gcc-runner").Runner;

//var sshRunner = require("../cloud9.run.ssh/ssh-runner").Runner;
//var piaSshRunner = require("../cloud9.run.pia_ssh/pia_ssh-runner").Runner;

module.exports = function setup(options, imports, register) {
  ProcessManager = imports["process-manager"];
  EventBus = imports.eventbus;
  imports.ide.register(name, BuildRuntimePlugin, register);
};

var BuildRuntimePlugin = function(ide, workspace) {
  this.ide = ide;
  this.pm = ProcessManager;
  this.eventbus = EventBus;
  this.workspace = workspace;
  this.workspaceId = workspace.workspaceId;

  this.channel = this.workspaceId + "::build-runtime";

  this.hooks = ["command"];
  this.name = name;
  this.processCount = 0;
};

util.inherits(BuildRuntimePlugin, Plugin);

(function() {
  this.init = function() {
    var self = this;

    this.eventbus.on(this.channel, function(msg) {

      if(gccRunner.msgExit(msg)){
        self.workspace.getExt("state").publishState();
      }

      if (msg.type == "gcc-start")
      self.processCount += 1;

    if (msg.type == "gcc-exit"){
      self.processCount -= 1;
    }

    self.ide.broadcast(JSON.stringify(msg), self.name);
    });
  };

  this.command = function(user, message, client) {
    if (!(/build/.test(message.runner))) return false;

    this.message = message;
    this.client = client;

    var res = true;
    var cmd = (message.command || "").toLowerCase();

    switch (cmd) {
      case "build":
        this.$build();
        break;
      default:
        res = false;
    }
    return res;
  };

  this.$build = function(isDbg, onBreak) {
    var self = this;
    this.workspace.getExt("state").getState(function(err, state) {
      if (err)
      return self.error(err, 1, self.message, self.client);

    if (state.processRunning)
      return self.error("Child process already running!", 1, self.message);
    })
    self.pm.spawn("make", {
      isDbg: isDbg,
      onBreak: onBreak,
      message: self.message
    }, self.channel, function(err, pid, child) {
      if (err)
      self.error(err, 1, self.message, client);
    });
  };
  this.$kill = function(pid, message, client) {
    var self = this;
    this.pm.kill(pid, function(err) {
      if (err)
      return self.error(err, 1, message, client);
    });
  };

  this.canShutdown = function() {
    return this.processCount === 0;
  };

}).call(BuildRuntimePlugin.prototype);
