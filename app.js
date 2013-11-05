/*jslint node: true*/
'use strict';
//Variables 
var Q = require('q'),
    canProcess = false,
	fs = require('fs'),
    fileName = "dataDiamondRaw.txt",
    outputFile = "dataClean.json",
    lazy = require('lazy'),
    _s = require('underscore.string'),
    _ = require('underscore');

//Lets check if we can work with that
if(fs.existsSync(fileName)){
    canProcess = true;
    console.log('The file to be parsed exists ;)');
} else{
    console.log('There is nothing to do Old boy :|');
}

var readFileLineByLine = function(){
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

function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

var cleanText = function(text, thingsToRemove){
    _(thingsToRemove).each(function(item, index){
        text = _s.trim(text, item);
    });
    text = replaceAll('/ ', '/', text);
    text = replaceAll(' /', '/', text);
    text = _s.underscored(_s.trim(_s.clean(text)));
    return text;
}
var processLine = function(line, flag){
    return '"'+line+'" : "'+flag+'"';
}
var processLines = function(lines){
    var content = '{';
    var flag = '';    
    _(lines).each(function(line, index){
        line = cleanText(line, ['-	']);
        if(line == 'rojo' ||line == 'verde' ||line == 'amarillo'){
            flag = line;
        }else{
            line = processLine(line, flag);
            if(index == lines.length -1){
                line += '}';
            }else{
                line = line+',';
            }
            content = content +=line;
        }
    });
    saveFile(content);
}

var saveFile = function(content){
    return Q.nfcall(fs.writeFile, outputFile, '\ufeff' + content);
}

var main = function(){
    readFileLineByLine().then(function(lines){
        processLines(lines);
    });
}
//Do the job;
if(canProcess){
    main();
}