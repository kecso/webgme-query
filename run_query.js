var webgme = require('webgme'),
    requirejs = requirejs || require('requirejs');

//TODO getting some configuration
var config = {
    mongodatabase:'query',
    mongoip:'127.0.0.1'
    };
webGMEGlobal.setConfig(config);

requirejs(['src/query'],function(QUERY){
    var myConfig = webGMEGlobal.getConfig();
    var storage = new webgme.serverUserStorage({'host':myConfig.mongoip, 'port':myConfig.mongoport, 'database':myConfig.mongodatabase});
    storage.openDatabase(function(err) {
        if (!err) {
            storage.openProject('querytest', function (err, project) {
                if (!err) {
                    var core = new webgme.core(project, {corerel: 2});
                    project.getBranchHash("master","#hack",function(err,commitHash){
                        if(!err){
                            project.loadObject(commitHash,function(err,commit) {
                                if (!err && commit) {
                                    core.loadRoot(commit.root, function (err, root) {
                                        if(!err){
                                            var query = QUERY.getQuery(root,core);
                                            query.children().children().parent().parent().toArray(function(err,nodes){
                                                for(var i=0;i<nodes.length;i++){
                                                    console.log(core.getAttribute(nodes[i],'name'));
                                                }
                                                storage.closeDatabase();
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});
