/*jslint node: true*/
'use strict';
//Variables 
var Q = require('q'),
    canProcess = false,
	fs = require('fs'),
	path = require('path'),
    rawFiles = 'raw/initial',
    outputDir = 'raw/filteredByNode',
    lazy = require('lazy'),
    _s = require('underscore.string'),
    _ = require('underscore');

//Lets check if we can work with that
var stats = fs.lstatSync(rawFiles);
if(stats.isDirectory()){
    canProcess = true;
    console.log('The folder to read files from, exists ;)');
} else{
    console.log('There is nothing to do Old boy :|');
}

var loadFilesFromDir = function(path){
    var files = fs.readdirSync(path);
    console.log(files);
    /* _(files).each(function(file, index){
        readFileLineByLine(file).then(function(lines){
            var content = processLines(lines);
            saveFile(outPutDir,file,content);
        });
    });*/
}

var readFileLineByLine = function(fileName){
    var deferred = Q.defer();
    var linesReaded = [];
    new lazy(fs.createReadStream('./'+fileName))
        .on('end', function() { deferred.resolve(linesReaded); })
        .lines
        .forEach(function(line){
            linesReaded.push(line.toString());
        });
    return deferred.promise;
}
var readFileToJson = function(fileUrl){
    var data = fs.readFileSync(fileUrl,'UTF-8');
    return JSON.parse(data);
}
function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}
var trim = function (text, thingsToRemove){
    _(thingsToRemove).each(function(item, index){
        text = _s.trim(text, item);
        text = _s.trim(text);
    });
    return text;
}
var cleanText = function(text, thingsToRemove){
    text = trim(text, thingsToRemove);
    text = replaceAll('/ ', '/', text);
    text = replaceAll(' /', '/', text);
    text = _s.underscored(_s.slugify(_s.trim(_s.clean(text))));
    return text;
}

var isArray = function(item){
    if(Object.prototype.toString.call( item ) === '[object Array]'){
        return true;
    }
    return false;
}
var saveFile = function(a, file,content){
    return Q.nfcall(fs.writeFile, a+'/' + file, '\ufeff' + content);
}

var tryToGenerateChildJson = function(id){
    if(fs.existsSync('raw/initial/'+id+'.json')){
        var json = readFileToJson('raw/initial/'+id+'.json');
        return json;
    }else{
        return [];
    }
    
}
var generateKeysValues = function(array, json){
    
    _(array).each(function(item, index){
        var cleanName = cleanText(item.name, ['-esp','-en', '- esp', '[0-9]*.']);
        var nodes = [];
        var data = {};
        if(typeof(item.nodes) != 'undefined'){
            if( item.nodes.length > 0 ){
                nodes = generateKeysValues(item.nodes, nodes);
            }else{
                data = tryToGenerateChildJson(item.id);
            }
        }
        var obj = {};

        obj.ref = cleanName;
        obj.id = item.id;
        obj.name = trim(item.name, ['-esp','-en', '- esp', '[0-9]*.']); 
        obj.nodes = nodes;
        _.extend(obj, data) ;
        //If parent json is array push that item into it, otherwise, it is a property of the json object
        if(isArray(json)){
            json.push( obj);
        }else{
            json[cleanName] = { nodes : nodes};
        }
        
    });
    return json;
}
var main = function(){
    var mainJson = readFileToJson('raw/listado.json');
    var elementsFiltered = _.filter(mainJson.nodes, function(node){ return node.name.indexOf('Escenarios de riesgo') != -1; });
    var ResultingJson = {};
    
    ResultingJson = generateKeysValues(elementsFiltered[0].nodes, ResultingJson);
    
    saveFile('raw', 'test.json', JSON.stringify(ResultingJson));
}
//Do the job;
if(canProcess){
    main();
}