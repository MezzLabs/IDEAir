define(function(require, exports, module) {

  var ide = require("core/ide");
  var ext = require("core/ext");
  var menus = require("ext/menus/menus");
  var util = require("core/util");
  var markup = require("text!ext/weknow/weknow.xml");
  var settings = require("ext/settings/settings");
  var skin    = require("text!ext/weknow/skin.xml");
  var css     = require("text!ext/weknow/style/style.css");

  module.exports = ext.register("ext/weknow/weknow", {
    name   : "QA platform",
    dev    : "intel",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,
    desp   : [],
    requireFailed : false,
    inited : false,
    skin    : {
      id   : "weknowskin",
    data : skin,
    "media-path" : ide.staticPrefix + "/ext/weknow/style/images/",
    "icon-path"  : ide.staticPrefix + "/ext/weknow/style/icons/"
    },
    css     : util.replaceStaticPrefix(css),
    nodes : [],
    home : "http://stackoverflow.com", 
    queryUrl: "http://stackoverflow.com/search/?q=",
    hook : function(){
      var _self = this;
      menus.$insertByIndex(barTools, new apf.button({
        id : "menu-weknow",
        skin : "c9-toolbarbutton-glossy",
        tooltip : "weKnow",
        caption : "weKnow",
        disabled : false,
        onclick : function() {
          _self.weknow(_self.home)
        }
      }), 212);
    },

    init : function(amlNode)
    {
      apf.importCssString(this.css || "");
    },

    onbeforeresize: function(){
      var el = document.createElement("div");
      el.style.backgroundColor = "red";
      el.style.position = "absolute";
      el.style.width = "100%";
      el.style.height= "100%";
      el.style.zIndex= "9999999";
      el.style.left = "0px";
      el.style.top = "0px";
      el.className = "iframe_p";
      el.style.opacity = "0";
      el.style.MozOpacity = "0";
      el.style.KhtmlOpacity = "0";
      el.style.filter = "alpha(Opacity=0)";
      winWeknow.$ext.appendChild(el)
    },

    onafterresize: function(){
      var els = winWeknow.$ext.getElementsByClassName("iframe_p");
      if(null != els){
          //console.log(els[els.length-1])
          winWeknow.$ext.removeChild(els[els.length-1]);
       }
    },
    onLoad: function(){},

    weknow: function(url){
      this.show();
      var frmWeknow = this.getIframe();
        if (frmWeknow.$ext.src !== url)
          this.refresh(url);
    },
    refresh: function (url) {
      var frmWeknow = this.getIframe();
      url = url || txtWeknow.getValue();
      frmWeknow.$ext.src = url;
      txtWeknow.setValue(url);
      //settings.save();
    },

    popup: function (url) {
        url = url || txtWeknow.getValue();
        window.open(url, "_blank");
    },

    getIframe: function() {
        return pgWeknow.selectSingleNode("iframe");
    },

    show : function(){
      if(!this.inited){
        ext.initExtension(this);
        this.inited = true;
      }
      winWeknow.show();
      setTimeout(function() {
        winWeknow.focus();
        txtWeknow.focus();
      }, 0);
    },

    destroy : function(){
      menus.remove("Tools/~", 1000000);
      menus.remove("Tools/weknow...");
      this.$destroy();
    }
  });

});
