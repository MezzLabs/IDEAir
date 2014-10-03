var GccRunner = require("./gcc-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var assert = require("assert");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;

    assert(options.gccPathes, "Option 'gccPathes' is required");

    GccRunner.call(this, vfs, pm, sandbox, options, function (err) {
      if (err) return register(err);

      register(null, { "run-make": { Runner: GccRunner.Runner } });
    });
};

(function() {
  this.name = "make";

  this.createChild = function(callback) {
    this.args = this.nodeArgs.concat(this.scriptArgs);
    ShellRunner.prototype.createChild.call(this, callback);
  };

}).call(GccRunner.Runner.prototype);
