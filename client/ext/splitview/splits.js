/**
 * Show a split view; two editors next to each other in one tab
 *
 * @copyright 2010, Ajax.org B.V.
 * @author Mike de Boer <mike AT c9 DOT io>
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var Grids = require("ext/splitview/grids");
var Splits = [];
var EditorClones = {};
var ActiveClass = "splitview_active";
var InactiveClass = "splitview_inactive";
var SplitView, ActiveSplit;

exports.init = function(splitView) {
    SplitView = splitView;
    //Grids.init(Grids.DEFAULT_GRID);
};

exports.create = function(page, gridLayout, type) {
    type = type || null;
    
    Grids.init(gridLayout);
    
    //var grid = createGrids(page)[layout];
    var editor = page.$editor.amlEditor;
    
    var split = {
        editors: [editor],
        pages: [page],
        gridLayout: gridLayout
    };
    addEditorListeners.call(this, editor);
    Splits.push(split);

    if (type == "clone") {
        if (!EditorClones.cloneEditor) {
            EditorClones.cloneEditor = editor.cloneNode(true);
            EditorClones.cloneEditor.removeAttribute("id");
            apf.document.body.appendChild(EditorClones.cloneEditor);
            
            addEditorListeners.call(this, EditorClones.cloneEditor);
        }
        split.editors.push(EditorClones.cloneEditor);
    }
    
    return split;
};

exports.show = function(split) {
    if (!split || split === ActiveSplit)
        return this;

    this.update(split);
    Grids.show(split.gridLayout);
    
    var i, l;
    // maintain page button styles
    Splits.forEach(function(aSplit) {
        if (aSplit === split)
            return;
        for (i = 0, l = aSplit.pages.length; i < l; ++i)
            aSplit.pages[i].$deactivateButton();
    });
    console.log("pages",split.pages.map(function(page){return page.name;}));
    for (i = 0, l = split.pages.length; i < l; ++i)
        split.pages[i].$activateButton();
    
    ActiveSplit = split;
    
    return this;
};

exports.hide = function(split) {
    split = split || ActiveSplit;
    Grids.hide(split);
    if (split === ActiveSplit)
        ActiveSplit = null;
};

exports.update = function(split, gridLayout) {
    split = split || ActiveSplit;
    gridLayout = Grids.init(gridLayout || split.gridLayout);
    
    var page = split.pages[0];
    var amlPage = page.fake ? page.relPage : page;
    split.gridLayout = gridLayout;
    
    // destroy the split view if it contains NOT more than 1 editor.
    //console.log("number of pages in split view:", split.pages.length,"vs editors:", 
    //  split.editors.length,page.name,split.pages.map(function(page){return page.name}));
    if (split.pages.length === 1) {
        var editor = page.$editor.amlEditor;
        editor.removeAttribute("model");
        editor.removeAttribute("actiontracker");
        amlPage.appendChild(editor);
        editor.show();
        
        removeEditorListeners(editor);
        removeEditorListeners(split.editors[0]);
        clearSplitViewStyles(page);
        
        Grids.hide(split.gridLayout);
        
        if (ActiveSplit === split)
            ActiveSplit = null;
        Splits.remove(split);
        console.log("split removed",Splits);
        // split removed, use the escape hatch...
        return;
    }
    
    // make sure current grid is the only one visible.
    Grids.show(gridLayout);
    
    // sort the editors and pages before being added to the grid
    sortEditorsAndPages(split);
    //console.log("split editors:", split.editors.length, split.editors.map(function(e) { return e.id; }));
    Grids.update(gridLayout, split);
    
    return this;
};

exports.mutate = function(split, page) {
    split = split || ActiveSplit;
    console.log("mutate called");
    var activePage = tabEditors.getPage();
    var pageIdx = split ? split.pages.indexOf(page) : -1;
    var _self = this;
            
    // Remove an editor from the split view
    if (pageIdx > -1) {
        // @todo re-instate CLONE view
        if (split.clone && split.clone === page)
            return this.endCloneView(page);

        var editorIdx = pageIdx;
        split.pages.splice(pageIdx, 1);
        
        var editor = split.editors[editorIdx];
        split.editors.splice(editorIdx, 1);
        editor.removeAttribute("model");
        editor.removeAttribute("actiontracker");
        removeEditorListeners(editor);
        
        // use setTimout to circumvent the APF layout manager to go bonkers
        setTimeout(function() {
            clearSplitViewStyles(page);
            editor.hide();
            if (tabEditors.getPage() !== split.pages[0])
                tabEditors.set(split.pages[0]);
            _self.update(split);
        });
    }
    // Add an editor to the split view
    else if (!split || split.editors.length < 3) {
        var clones = createEditorClones.call(this, page.$editor.amlEditor);
        
        if (!split) {
            // create the split view, with the currently active tab as first page
            // and editor
            if (page === activePage)
                return true;

            split = this.create(activePage);
            var oEditor = activePage.$editor.amlEditor;
            oEditor.setAttribute("model", activePage.$model);
            oEditor.setAttribute("actiontracker", activePage.$at);
        }
        
        var editorToUse;
        for (var i = 0, l = clones.length; i < l; ++i) {
            if (split.editors.indexOf(clones[i]) == -1) {
                editorToUse = clones[i];
                break;
            }
        }
        if (!editorToUse && split.editors.indexOf(page.$editor.amlEditor) === -1)
            editorToUse = page.$editor.amlEditor;
        
        split.pages.push(page);
        split.editors.push(editorToUse);
        //console.log("setting model of ", editorToUse.id, "to", page.$model.data.xml);
        editorToUse.setAttribute("model", page.$model);
        editorToUse.setAttribute("actiontracker", page.$at);
        consolidateEditorSession(page, editorToUse);
        addEditorListeners.call(_self, editorToUse);
        
        // use setTimout to circumvent the APF layout manager to go bonkers
        setTimeout(function() {
            _self.show(split);
        });
    }
};

exports.get = function(amlNode) {
    var nodeName = amlNode.tagName;
    var split
    var i = 0;
    var l = Splits.length;
    var splits = [];

    if (nodeName.indexOf("page") > -1) {
        for (; i < l; ++i) {
            split = Splits[i];
            if (!split || split.pages.indexOf(amlNode) === -1)
                continue;
            return [split];
        }
    }
    // search by editor (may yield multiple results)
    else {
        for (; i < l; ++i) {
            split = Splits[i];
            if (!split || split.editors.indexOf(amlNode) === -1)
                continue;
            splits.push(split);
        }
    }
    return splits;
};

exports.is = function(amlNode) {
    return !!this.get(amlNode);
};

function sortEditorsAndPages(split) {
    // lstOpenFiles.$model.data.selectNodes("//file")
    var pages = tabEditors.getPages();
    var p = [];
    var e = [];
    var index;
    //console.log("before sort: ", [].concat(split.pages).map(function(p) { return p.name; }), 
    //  [].concat(split.editors).map(function(e) { return e.id; }));
    for (var i = 0, c = 0, l = pages.length, l2 = split.pages.length; i < l && c < l2; ++i) {
        if ((index = split.pages.indexOf(pages[i])) > -1) {
            //console.log("pushing page at index " + i + " which is in the split at " 
            //  + index + ", names " + pages[i].name + ", " + split.pages[index].name);
            p.push(split.pages[index]);
            e.push(split.editors[index]);
            ++c;
        }
    }
    //console.log("after sort:", p.map(function(p) { return p.name; }), e.map(function(e) { return e.id; }));
    split.pages = p;
    split.editors = e;
}

function createEditorClones(editor) {
    var id = editor.tagName;
    if (EditorClones[id] && EditorClones[id].length)
        return EditorClones[id];

    EditorClones[id] = [];
    
    var editor;
    for (var i = 0; i < 2; ++i) {
        editor = editor.cloneNode(true);
        editor.removeAttribute("id");
        editor.setAttribute("visible", false);
        EditorClones[id].push(editor);
        apf.document.body.appendChild(editor);
        addEditorListeners.call(this, editor);
    }
    
    return EditorClones[id];
}

/**
 * Add listeners to the editor element, to keep track of the editor's focus.
 * Each time the focus changes, the tab title color will highlight.
 */
function addEditorListeners(editor) {
    if (editor.$splitListener)
        return;
    editor.addEventListener("focus", editor.$splitListener = function(e) {
        //console.log("got focus?", editor.id);
        onEditorFocus(editor);
    });
}

function removeEditorListeners(editor) {
    if (!editor.$splitListener)
        return;
    editor.removeEventListener("focus", editor.$splitListener);
    delete editor.$splitListener;
}

function onEditorFocus(editor) {
    var splits = exports.get(editor);

    splits.forEach(function(split) {
        var activePage = split.pages[split.editors.indexOf(editor)];
        split.pages.forEach(function(page) {
            if (page === activePage)
                apf.setStyleClass(page.$button, ActiveClass, [InactiveClass]);
            else
                apf.setStyleClass(page.$button, InactiveClass, [ActiveClass]);
        });
    });
}

function consolidateEditorSession(page, editor) {
    var session = SplitView.getEditorSession(page);
    if (!session && page.$editor.setDocument)
        page.$editor.setDocument(page.$doc, page.$at);
    session = SplitView.getEditorSession(page)
    if (editor.value !== session)
        editor.setProperty("value", session);
}

function clearSplitViewStyles(splitOrPage) {
    var pages = (typeof splitOrPage.tagName != "undefined") ? [splitOrPage] : split.pages;
    pages.forEach(function(page) {
        apf.setStyleClass(page.$button, null, [ActiveClass, InactiveClass]);
    });
}

});