define([], function () {
    "use strict";
    function multipleNodeOriginatedQuery(nodes,core){
        var _object = {};

        return _object;
    }

    function singleNodeOriginatedQuery(node,core){
        var self = this,
            query = {},
            nodesCache = {},
            nodes = {},
            toRemove = {},
            callingQueue = [],
            error = null;

        nodesCache[core.getPath(node)] = node;
        nodes[core.getPath(node)] = true;

        //internal functions
        var removeNode = function(nodeId) {
                toRemove[nodeId] = true;
            },
            addNode = function(node) {
                var nodeId = core.getPath(node);
                //handling in the query
                nodes[nodeId] = true;
                delete toRemove[nodeId];
                //handling in the cache
                if(!nodesCache[nodeId]){
                    nodesCache[nodeId] = node;
                }
            },
            nodeArray = function(){
                var keys = Object.keys(nodes),
                    items = [],
                    i;
                for(i=0;i<keys.length;i++){
                    items.push(keys[i]);
                }
                return items;
            },
            addFunctionToQueue = function(functionObject){
                if(callingQueue.length === 0){
                    callingQueue.push(functionObject);
                    return callNextInQueue();
                } else {
                    callingQueue.push(functionObject)
                }
            },
            callNextInQueue = function(){
                var next = callingQueue[0];
                if(next && typeof next.function === 'function'){
                    next.function.apply(self,next.parameters || []);
                }
            },
            finishedInQueue = function(){
                //cleaning the toRemove from nodes
                var keys = Object.keys(toRemove),
                    i;
                for(i=0;i<keys.length;i++){
                    delete nodes[keys[i]];
                }
                toRemove = {};

                callingQueue.shift();
            },
            children = function(){
                var startingNodeIds = nodeArray(),
                    i,
                    waiting = startingNodeIds.length,
                    childrenLoaded = function(err,children){
                        error = error || err;
                        if(!err){
                            for(var i=0;i<children.length;i++){
                                addNode(children[i]);
                            }
                        }
                        if(--waiting === 0){
                            //we are finished the loading so we can go to the next function in the line
                            finishedInQueue();
                            return callNextInQueue();
                        }
                    };


                //what if there is nothing to do
                if(waiting === 0){
                    finishedInQueue();
                    return callNextInQueue();
                }

                for(i=0;i<startingNodeIds.length;i++){
                    removeNode(startingNodeIds[i]);
                    core.loadChildren(nodesCache[startingNodeIds[i]],childrenLoaded);
                }
            },
            parent = function(){
                var startingNodeIds = nodeArray(),
                    parent,
                    i;
                for(i=0;i<startingNodeIds.length;i++){
                    removeNode(startingNodeIds[i]);
                    parent = core.getParent(nodesCache[startingNodeIds[i]]);
                    if(parent){
                        addNode(parent);
                    }
                }
                finishedInQueue();
                return callNextInQueue();
            },
            base = function(){
                var startingNodeIds = nodeArray(),
                    base,
                    i;
                for(i=0;i<startingNodeIds.length;i++){
                    removeNode(startingNodeIds[i]);
                    base = core.getBase(nodesCache[startingNodeIds[i]]);
                    if(base){
                        addNode(base);
                    }
                }
                finishedInQueue();
                return callNextInQueue();
            },
            toNodeArray = function(callback){
                var nodeIds = nodeArray(),
                    i,
                    items=[];
                for(i=0;i<nodeIds.length;i++){
                    items.push(nodesCache[nodeIds[i]]);
                }
                callback(error,items);
            };


        //traversing functions
        //they all create a new promise type query object
        query.children = function(){
            addFunctionToQueue({function:children,parameters:[]});
            return query;
        };
        query.parent = function(){
            addFunctionToQueue({function:parent,parameters:[]});
            return query;
        };
        query.base = function(){
            addFunctionToQueue({function:base,parameters:[]});
            return query;
        };

        //async functions - they didn't return with the query object!!!
        query.toArray = function(callback){
            addFunctionToQueue({function:toNodeArray,parameters:[callback]});
        };

        return query;
    }
    return {
        getQuery : singleNodeOriginatedQuery,
        getMultiQuery : multipleNodeOriginatedQuery
    }
});

