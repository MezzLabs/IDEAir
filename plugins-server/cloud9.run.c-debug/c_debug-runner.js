"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var Plugin = require("../cloud9.core/plugin");
var path = require("path");

/**
 * Run c scripts with restricted user rights
 */
var exports = module.exports = function(vfs, pm, sandbox, options, callback) {

  sandbox.getProjectDir(function(err, projectDir) {
    if (err) return callback(err);
    pm.addRunner("c_debug",exports.factory(vfs, sandbox, projectDir, options));
    callback();
  });
};

exports.factory = function(vfs, sandbox, root, settings) {
  return function(args, eventEmitter, eventName, callback) {
    var options = {};

    c9util.extend(options, args);
    options.root = root;
    options.settings = settings;
    options.eventEmitter = eventEmitter;
    options.eventName = eventName;
    options.sandbox = sandbox;

    new Runner(vfs, options, callback);
  };
};

var Runner = exports.Runner = function(vfs, options, callback) {

  this.message = options.message;
  var frontArgs = this.message.args; 
  this.vfs = vfs;
  this.root = options.root;
  this.eventName = options.eventName;
  this.eventEmitter = options.eventEmitter;

  var self = this;
  var messageListener = function (msg) {
    if(Runner.msgExit(msg)){
      self._emit("c_debug-data",msg)
      options.eventEmitter.removeListener(options.eventName, messageListener);
    }

    if(Runner.msgGdbServerReady(msg)){
      self.eventEmitter.emit(self.eventName, {
        type: "c-debug-ready",
        pid:  msg.pid,
        args: self.message.args,
        extra: msg.extra
      });
    };

    if(Runner.msgStart(msg)) 
      self._emit("c_debug-data",msg);
  };
  options.eventEmitter.on(options.eventName, messageListener);

  var opts ={};
  opts.encoding = "ascii";
  opts.cwd = this.root;
  opts.env = this.message.env || {};
  opts.eventEmitter = options.eventEmitter;
  opts.eventName = options.eventName;
  opts.command = frontArgs.env.gdbServer

  this.nodeArgs   = ["127.0.0.1:9000"]; 
  this.scriptArgs = ["./bin/" + frontArgs.project.mainFile];
  ShellRunner.call(this, vfs, opts, callback);
};
util.inherits(Runner, ShellRunner);

(function () {
  this.msgSucc = function(msg){
    return msg.type === "c_debug-exit" && msg.code === 0
  };
  this.msgFail = function(msg){
    return msg.type === "c_debug-exit" && msg.code === 1
  };
  this.msgError = function(msg){
    return msg.type === "c_debug-exit" && msg.code === 2
  };
  this.msgStart = function(msg){
    return msg.type === "c_debug-start"
  };
  this.msgExit = function(msg){
    return msg.type === "c_debug-exit"
  };
  this.msgData = function(msg){
    return msg.type === "c_debug-data";
  };
  this.msgGdbServerReady = function(msg){
    return this.msgData(msg) && (/Listening/).test(msg.data);
  };

  this.msgPublic = function(msg){
    return this.msgStart(msg) || this.msgExit(msg);
  };
}).call(Runner);

(function () {
  this._stdout = function(msg){
    var command = "Command: " + this.describe().command;
    if(Runner.msgStart(msg)) return command

    var title = (
      //Runner.msgStart(msg) && "compiling..." || 
     // Runner.msgSucc(msg) && "run success" || 
      Runner.msgFail(msg) && "fail" || "")
      return [title].join("\n")
  }

  this._emit = function(type,msg){
    this.eventEmitter.emit(this.eventName, {
      type: type,
      stream: "stdout",
      data: this._stdout(msg),
      extra: {tip: true},
      pid: msg.pid
    });
  }
}).call(Runner.prototype);
