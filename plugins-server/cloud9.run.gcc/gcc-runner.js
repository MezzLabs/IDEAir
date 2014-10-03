"use strict";

var util = require("util");
var c9util = require("../cloud9.core/util");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var Plugin = require("../cloud9.core/plugin");
var path = require("path");

/**
 * Run gcc with restricted user rights
 **/

var exports = module.exports = function(vfs, pm, sandbox, options, callback) {

  sandbox.getProjectDir(function(err, projectDir) {
    if (err) return callback(err);
    pm.addRunner("make",exports.factory(vfs, sandbox, projectDir, options));
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
      self._emit("make-data",msg)
      options.eventEmitter.removeListener(options.eventName, messageListener);
    }

    if(Runner.msgStart(msg)) 
      self._emit("make-data",msg);
  };
  options.eventEmitter.on(options.eventName, messageListener);

  var opts ={};
  opts.encoding = "ascii";
  opts.cwd = this.root;

  opts.env = this.message.env || {};
  opts.eventEmitter = options.eventEmitter;
  opts.eventName = options.eventName;
  opts.command = "make";
  this.nodeArgs = Runner.makeEnv(
      options.isDbg,
      frontArgs.env,
      frontArgs.project
  );
  this.scriptArgs = [];
  ShellRunner.call(this, vfs, opts, callback);
};
util.inherits(Runner, ShellRunner);

(function () {
  this.msgSucc = function(msg){
    return msg.type === "make-exit" && msg.code === 0
  };
  this.msgFail = function(msg){
    return msg.type === "make-exit" && msg.code === 1
  };
  this.msgError = function(msg){
    return msg.type === "make-exit" && msg.code === 2
  };
  this.msgStart = function(msg){
    return msg.type === "make-start"
  };
  this.msgExit = function(msg){
    return msg.type === "make-exit"
  };
  this.msgPublic = function(msg){
    return this.msgStart(msg) || this.msgExit(msg);
  };
  this.proDir = function(root,file,projectName){
    return root;
  };
  
  this.makeEnv = function(isDebug,env,project){
    var xx = isDebug ?  env.debugCflags : env.runCflags;
    var alwaysMake = 
      (project.alwaysMake == "true" && true || false);
    var overrides = [
      "-e",
      "Mainfile=" + project.mainFile,
      "-e",
      "DIR_BIN=./bin",
      "DIR_INC=./include",
      "DIR_OBJ=./obj",
      "DIR_SRC=./src",
      "-e",
      "CC=" + env.cc,
      "-e",
      "XX=" + env.xx,
      "-e",
      "CFLAGS=" + xx,
      ];
    if(alwaysMake) overrides.push("-B");
    return overrides;
  };
}).call(Runner);

(function () {
  this._stdout = function(msg){
    var command = "Command: " + this.describe().command;
    if(Runner.msgStart(msg)) return command

    var title = (
      //Runner.msgStart(msg) && "compiling..." || 
      Runner.msgSucc(msg) && "compile success" || 
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
