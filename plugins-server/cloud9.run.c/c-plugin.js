var CRunner = require("./c-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var assert = require("assert");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;


    CRunner.call(this, vfs, pm, sandbox, options, function (err) {
      if (err) return register(err);

      register(null, { "run-c": { Runner: CRunner.Runner } });
    });
};

(function() {
  this.name = "c";

  this.createChild = function(callback) {
    this.args = this.nodeArgs.concat(this.scriptArgs);
    ShellRunner.prototype.createChild.call(this, callback);
  };

}).call(CRunner.Runner.prototype);
