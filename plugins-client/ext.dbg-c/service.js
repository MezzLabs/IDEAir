define(function(require, exports, module) {
"use strict";

var Util = require("v8debug/util");
var EventEmitter = Util.EventEmitter;
var ide = require("core/ide");

var DebuggerService = module.exports = function(pid, runner, settings) {
    this.settings = settings;
    this.$pid = pid;
    this.$runner = runner;
    this.$onMessageHandler = this.$onMessage.bind(this);
};

(function() {

    Util.implement(this, EventEmitter);

    this.connect = function() {
        if (this.state != "connected")
            ide.addEventListener("socketMessage", this.$onMessageHandler);
        this.state = "connected";
    };

    this.disconnect = function() {
        ide.removeEventListener("message", this.$onMessageHandler);
        this.debuggerCommand(0, 
          '{ "seq": 1, "type": "request", "command": "disconnect" }',
          this.settings)

        this.state = null;
    };

    this.$onMessage = function(data) {
        var message = data.message;
        if (message.type == "c-debug" && message.pid == this.$pid) {
            console.log("=====c emit debugger_command_0===< service.js")
            this.emit("debugger_command_0", {data: message.body});
        }
    };

    this.debuggerCommand = function(tabId, v8Command,settings) {
      console.log("=====v8Command===< service.js")
      //console.log(v8Command)

        ide.send({
            command: "debugC",
            pid: this.$pid,
            runner: this.$runner,
            settings: this.settings,
            body: JSON.parse(v8Command)
        });
    };

}).call(DebuggerService.prototype);

});
