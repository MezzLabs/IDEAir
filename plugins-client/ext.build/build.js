/**
 * Build a project with Makefile
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

  var ide = require("core/ide");
  var ext = require("core/ext");
  var menus = require("ext/menus/menus");
  var c9console = require("ext/console/console");
  var noderunner = require("ext/noderunner/noderunner");
  var commands = require("ext/commands/commands");
  var runpanel = require("ext/runpanel/runpanel");
  var settings = require("ext/settings/settings");
  var save = require("ext/save/save");
  var editors = require("ext/editors/editors");

  var $name = "ext/build/build";

  module.exports = ext.register($name, {
    name    : "Build",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    $name   : $name,
    disableLut: { "terminal": true },

    nodes   : [],
    live    : null,

    onLoad: function () {},

    hook: function() { 
      if (ide.readonly)
        return;
      var _self = this;

      this.nodes.push(
        menus.$insertByIndex(barTools, new apf.button({
          skin : "c9-toolbarbutton-glossy",
          "class" : "build",
          tooltip : "Build your project",
          caption : "Build",
          disabled : "{!!!ide.onLine}",
          command  : "build",
        }), 10)
      );

      commands.addCommand({
        name: "build",
        "hint": "build an application",
        //"commands": { "[PATH]": {""} },
        //bindKey: {mac: "F5", win: "F5"},
        exec: function () {
          if (stProcessRunning.active)
        noderunner.stop();
          else
        _self.build();
      }
      });
    },
    build: function(){
      var config = runpanel.currentConfig(); 
      console.log(config)
      //var ace = editors.currentEditor.amlEditor.$editor;
      //console.log(ace.session.getValue())
      //console.log(ace.inMultiSelectMode);
      c9console.show(true);
      if(!runpanel.valid(config)){ 
        c9console.showConsole();
      }else{
        c9console.showOutput();
        this.buildConfig(config);
        ide.dispatchEvent("track_action", {type: "make"});
      }
    },

    buildConfig: function(config){
      var model = settings.model;
      var saveallbeforerun = apf.isTrue(model.queryValue("general/@saveallbeforerun"));
      if (saveallbeforerun) 
        save.saveall();

      var page = ide.getActivePageModel();
      var command = {
        "command" : "build",
        "runner"  : "build",
        "args"    : runpanel.getArgs(config),
        "version" : "",
        "env"     : {}
      };
      ide.send(command);
    },

    init: function() {},
  });

});
