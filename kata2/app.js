/*jslint node: true*/
'use strict';
//Variables 
var Q = require('q'),
    canProcess = false,
    fs = require('fs'),
    path = require('path'),
    rawFiles = 'raw/initial',
    outputDir = 'generated',
    originalDocsDir = 'raw/uploads/',
    generatedDocsDir = 'generated/files/riesgos',
    originalJsonDir = 'raw/initial/',
    lazy = require('lazy'),
    _s = require('underscore.string'),
    _ = require('underscore');

//Lets check if we can work with that
var stats = fs.lstatSync(rawFiles);
if (stats.isDirectory()) {
    canProcess = true;
    console.log('The folder to read files from, exists ;)');
} else {
    console.log('There is nothing to do Old boy :|');
}

var loadFilesFromDir = function(path) {
    var files = fs.readdirSync(path);
    console.log(files);
    /* _(files).each(function(file, index){
        readFileLineByLine(file).then(function(lines){
            var content = processLines(lines);
            saveFile(outPutDir,file,content);
        });
    });*/
}

var readFileLineByLine = function(fileName) {
    var deferred = Q.defer();
    var linesReaded = [];
    new lazy(fs.createReadStream('./' + fileName))
        .on('end', function() {
            deferred.resolve(linesReaded);
        })
        .lines
        .forEach(function(line) {
            linesReaded.push(line.toString());
        });
    return deferred.promise;
}
var readFileToJson = function(fileUrl) {
    var data = fs.readFileSync(fileUrl, 'UTF-8');
    return JSON.parse(data);
}

    function replaceAll(find, replace, str) {
        return str.replace(new RegExp(find, 'g'), replace);
    }
var trim = function(text, thingsToRemove) {
    _(thingsToRemove).each(function(item, index) {
        text = _s.trim(text, item);
    });
    text = _s.trim(text);
    return text;
}
var cleanText = function(text, thingsToRemove) {
    text = trim(text, thingsToRemove);
    text = replaceAll('/ ', '/', text);
    text = replaceAll(' /', '/', text);
    text = _s.underscored(_s.slugify(_s.trim(_s.clean(text))));
    return text;
}
var filterNameDoc = function(text) {
    text = replaceAll('.docx', '', text);
    text = replaceAll('.pdf', '', text);
    text = replaceAll('.doc', '', text);
    text = trim(text, [/(\d+)([a-z])(-)/i]);
    text = _s.titleize(_s.humanize(text));
    return text;
}
var adaptBody = function(cuerpo) {
    cuerpo = replaceAll('&bull;', '', cuerpo);
    return replaceAll('<span', '<span class=\"dotted\"></span><span class=\"desc\"', cuerpo);
}

var isArray = function(item) {
    if (Object.prototype.toString.call(item) === '[object Array]') {
        return true;
    }
    return false;
}
var saveFile = function(path, file, content) {
    return Q.nfcall(fs.writeFile, path + '/' + file, '\ufeff' + content);
}
var generateDocJson = function(fichero) {

    if (fs.existsSync(originalDocsDir + fichero.file)) {
        fs.createReadStream(originalDocsDir + '/' + fichero.file).pipe(fs.createWriteStream(generatedDocsDir + '/' + fichero.originalName));
    }
    var jsonData = {
        titulo: fichero.name,
        descripcion: fichero.originalName
    }
    saveFile(generatedDocsDir, fichero.originalName + '.json', JSON.stringify(jsonData));
}

var tryToGenerateChildJson = function(id) {
    if (fs.existsSync(originalJsonDir + id + '.json')) {
        var json = readFileToJson(originalJsonDir + id + '.json');
        json = _.omit(json, ['ciudad', 'documentos', 'entradilla', 'paisCiudad', 'libres', 'subtitulo', 'fechaModificacion', 'fechaCreacion', 'tipo']);
        if (typeof(json.ficheros) != 'undefined' && json.ficheros.length > 0) {
            _(json.ficheros).each(function(fichero, i) {
                json.ficheros[i].name = filterNameDoc(fichero.originalName);
                generateDocJson(json.ficheros[i]);
            });
        }
        if (typeof(json.cuerpo) != 'undefined') {
            json.cuerpo = adaptBody(json.cuerpo);
        }
        return json;
    } else {
        return [];
    }

}
var generateKeysValues = function(array, json, parent) {

    _(array).each(function(item, index) {

        var cleanName = cleanText(item.name, [/(-)(esp)/i, /(-)(en)/i, /(-)(\s+)(esp)/i, /(\d+)([a-z])(\.)/i, /(\d+)(\.)/i]);
        var nodes = [];
        var data = {};
        if (typeof(item.nodes) != 'undefined') {
            if (item.nodes.length > 0) {
                nodes = generateKeysValues(item.nodes, nodes, cleanName);
            } else {
                data = tryToGenerateChildJson(item.id);
            }
        }
        var obj = {};
        obj.parent = parent;
        console.log(parent);
        obj.ref = cleanName;
        obj.id = item.id;
        obj.name = trim(item.name, [/(-)(esp)/i, /(-)(en)/i, /(-)(\s+)(esp)/i, /(\d+)([a-z])(\.)/i, /(\d+)(\.)/i]);
        obj.nodes = nodes;
        _.extend(obj, data);
        //If parent json is array push that item into it, otherwise, it is a property of the json object
        if (isArray(json)) {
            json.push(obj);
        } else {
            json[cleanName] = obj;
        }

    });
    return json;
}
var main = function() {
    var mainJson = readFileToJson('raw/listado.json');
    var elementsFiltered = _.filter(mainJson.nodes, function(node) {
        return node.name.indexOf('Escenarios de riesgo') != -1;
    });
    var ResultingJson = {};

    ResultingJson = generateKeysValues(elementsFiltered[0].nodes, ResultingJson);
    saveFile('generated', 'riesgos.json', JSON.stringify(ResultingJson));
}
//Do the job;
if (canProcess) {
    main();
}
