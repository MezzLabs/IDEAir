var Plugin = require("../cloud9.core/plugin");
var util = require("util");

var name = "c-runtime"
var ProcessManager;
var EventBus;
var gccRunner = require("../cloud9.run.gcc/gcc-runner").Runner;

//var sshRunner = require("../cloud9.run.ssh/ssh-runner").Runner;
//var piaSshRunner = require("../cloud9.run.pia_ssh/pia_ssh-runner").Runner;

module.exports = function setup(options, imports, register) {
  ProcessManager = imports["process-manager"];
  EventBus = imports.eventbus;
  imports.ide.register(name, CRuntimePlugin, register);
};

var CRuntimePlugin = function(ide, workspace) {
  this.ide = ide;
  this.pm = ProcessManager;
  this.eventbus = EventBus;
  this.workspace = workspace;
  this.workspaceId = workspace.workspaceId;
  this.exitMsg = null;
  this.startMsg = null;
  this.isDbg = null;

  this.channel = this.workspaceId + "::c-runtime";

  this.hooks = ["command"];
  this.name = name;
  this.processCount = 0;
};

util.inherits(CRuntimePlugin, Plugin);

(function() {
  this.init = function() {
    var self = this;

    this.eventbus.on(this.channel, function(msg) {

      if(gccRunner.msgSucc(msg) && self.isDbg){
        self.$dbg();
        self.workspace.getExt("state").publishState();
      }

      if(gccRunner.msgSucc(msg) && !self.isDbg)
        self.$run();

      if(gccRunner.msgError(msg)){
        self.workspace.getExt("state").publishState();
      }

      msg.type = msg.type.replace(/^c-debug-(start|data|exit)$/, "c-$1");
      var type = msg.type;
       
      if(type == "c-exit" && !self.startMsg){
	self.exitMsg = msg;
      	self.processCount -= 1;
        return;
      };

    if (msg.type == "c-start" && self.exitMsg){
      self.ide.broadcast(JSON.stringify(msg), self.name);
      self.ide.broadcast(JSON.stringify(self.exitMsg), self.name);
      self.workspace.getExt("state").publishState();
      self.exitMsg = null;
      self.processCount += 1;
      return;
    }

    if(msg.type == "c-start"){
      self.startMsg = msg
      self.workspace.getExt("state").publishState();
      self.processCount += 1;
    } 

    if (msg.type == "c-exit"){
      self.processCount -= 1;
      self.workspace.getExt("state").publishState();
    }

    self.ide.broadcast(JSON.stringify(msg), self.name);
    });
  };

  this.command = function(user, message, client) {
    if (!(/c/.test(message.runner))) return false;

    this.message = message;
    this.client = client;

    var res = true;
    var cmd = (message.command || "").toLowerCase();

    switch (cmd) {
      case "run":
        this.isDbg = false;
        this.$build();
        break;
      case "rundebug":
        this.$build(true);
        break;
      case "rundebugbrk":
        this.isDbg = true;
        this.$build(true, true);
        break;
      case "kill":
        this.$kill(message.pid, message, client);
        break;
      case "debugc":
        if(message.body.command == "disconnect"){ return;}
        break;
      default:
        res = false;
    }
    return res;
  };

  this.$dbg = function(){
    var self = this;
    this.workspace.getExt("state").getState(function(err, state) {
      if (err)
      return self.error(err, 1, self.message, self.client);

    if (state.processRunning)
      return self.error("Child process already running!", 1, self.message);
    })
    self.pm.spawn("c_debug", {
      message: self.message
    }, self.channel, function(err, pid, child) {
      console.log("======> dbg pid")
      console.log(pid)
      if (err)
      self.error(err, 1, self.message, self.client);
    });

    //var msg = {
    //  type: "c-debug-ready",
    //  pid:  0,
    //  args: this.message.args,
    //  extra: "" 
    //}
    //this.ide.broadcast(JSON.stringify(msg), this.name);
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
      self.error(err, 1, self.message, self.client);
    });
  };

  this.$run = function(isDbg, onBreak) {
    var self = this;
    this.workspace.getExt("state").getState(function(err, state) {
      if (err)
      return self.error(err, 1, self.message, self.client);

    if (state.processRunning)
      return self.error("Child process already running!", 1, self.message);
    })
    self.pm.spawn("c", {
      isDbg: isDbg,
      onBreak: onBreak,
      message: self.message
    }, self.channel, function(err, pid, child) {
      if (err)
      self.error(err, 1, self.message, self.client);
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

}).call(CRuntimePlugin.prototype);
