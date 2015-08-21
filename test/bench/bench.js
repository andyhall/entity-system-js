
// settings
var numCs = 200
var numEs = 500
var numCsPerE = 50


requirejs.config({
    baseUrl: '../..',
});

require(['entity-manager'], function (EntityManager) {
    var manager = new EntityManager();
    
    // randomly create/remove a few components to seed data structures
    var cs = [], es = []
    for (var i=0; i<100; ++i) {
        var obj = {state: {}}
        obj.name = String(Math.random())
        obj.state[String(Math.random())] = 1
        cs.push(obj.name)
        manager.addComponent( obj.name, obj)
        var ent = manager.createEntity([obj.name])
        es.push(ent)
    }
    for (var i=0; i<100; ++i) {
        manager.removeComponent(cs[i])
        manager.removeEntity(es[i])
    }
    
    // UI
    cachedMgr = manager
    document.getElementById('testbut').addEventListener('click', onTestButton) 
    
})



// benchmark thingy
var cachedMgr
var testing = false

function onTestButton() {
    if (!testing) {
        readInputs()
        startTest()
        out('Running...')
    } else {
        endTest()
        out([ runCt, ' iterations over ', numCs, ' components, ', 
            numEs, ' entities w/ ', numCsPerE, ' components each',
            '<br>init time <b>' + initTime.toFixed(2) + '</b> ms', 
            '<br>average time <b>' + (runTime/runCt).toFixed(2) + '</b> ms/iteration',
            '<br>checksum: ' + (runningSum/runCt).toFixed(0) + ' sum/iteration'
        ].join(''))
    }
    testing = !testing
    document.getElementById('testbut').innerHTML = (testing) ? "Stop" : "Start"
}
function out(s) {
    document.getElementById('output').innerHTML = s
}



var Es, compNames, initTime, runTime, runCt, runningSum, iterating, procs

// init everything needed for a batch of benchmark iterations
function startTest() {
    var t = performance.now()
    var mgr = cachedMgr
    compNames = []
    Es = []
    procs = []
    // create a bunch of components
    for (var i=0; i<numCs; ++i) {
        compNames[i] = 'comp_'+String(i)
        var obj = { state: {value:1} }
        obj.state[String(Math.random())] = 1
        mgr.addComponent(compNames[i], obj)
    }
    // create a bunch of entities and randomly add components
    for (var i=0; i<numEs; ++i) {
        var n = (numCs * Math.random())|0
        var toAdd = []
        for (var j=0; j<numCsPerE; ++j) {
            toAdd.push(compNames[(n+j)%numCs])
        }
        Es.push( mgr.createEntity(toAdd) )
    }
    // create a bunch of processes that sum up state properties
    for (var i=0; i<numCs; ++i) {
        var o = {}
        o.name = compNames[i]
        o.update = function(dt) {
            var sum = 0
            var entArr = mgr.getComponentsData(this.name)
            for (var j=0; j<entArr.length; ++j) {
                sum += entArr[j].value|0
            }
            runningSum += sum|0
        }
        procs.push(o)
        mgr.addProcessor(o)
    }
    // finish up and iterate
    initTime = performance.now() - t
    iterating = true
    runTime = runCt = runningSum = 0
    requestAnimationFrame(iterateTest)
}

// iteration to call each frame between start and stop
function iterateTest() {
    if (!iterating) return
    var t = performance.now()
    cachedMgr.update()
    // runningSum += sumOverComponents(cachedMgr, compNames)
    runTime += performance.now() - t
    runCt++
    if (iterating) requestAnimationFrame(iterateTest)
}

// finish the set of iterations
function endTest() {
    iterating = false
    // tear down
    for (var i=0; i<numCs; ++i) {
        cachedMgr.removeComponent(compNames[i])
    }
    compNames.length = 0
    for (i=0; i<numEs; ++i) {
        cachedMgr.removeEntity(Es[i])
    }
    Es.length = 0
    while(procs.length) {
        cachedMgr.removeProcessor(procs.pop())
    }
    procs.length = 0
}



function readInputs() {
    var nc = parseInt(document.getElementById('numC').value)
    var ne = parseInt(document.getElementById('numE').value)
    var ce = parseInt(document.getElementById('numCperE').value)
    if (nc>0) numCs = nc
    if (ne>0) numEs = ne
    if (ce>0) numCsPerE = ce
}

