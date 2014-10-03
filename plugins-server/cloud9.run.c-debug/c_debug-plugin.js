var CDebugRunner = require("./c_debug-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var assert = require("assert");

module.exports = function setup(options, imports, register) {
  var pm = imports["process-manager"];
  var sandbox = imports.sandbox;
  var vfs = imports.vfs;


  CDebugRunner.call(this, vfs, pm, sandbox, options, function (err) {
    if (err) return register(err);

    register(null, { "run-c_debug": { Runner: CDebugRunner.Runner } });
  });
};

(function() {
  this.name = "c_debug";

  this.createChild = function(callback) {
    this.args = this.nodeArgs.concat(this.scriptArgs);
    ShellRunner.prototype.createChild.call(this, callback);
  };

}).call(CDebugRunner.Runner.prototype);
