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
    generatedDocsDir = 'generated/files/anexos',
    originalJsonDir = 'raw/initial/',
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
    });
    text = _s.trim(text);
    return text;
}
var underscorify = function(text){
    var thingsToRemove = [/(-)(esp)/i, /(-)(en)/i , /(-)(\s+)(esp)/i , /(\d+)([a-z])(\.)/i , /(\d+)(\.)/i];
    text = trim(text, thingsToRemove);
    text = replaceAll('/ ', '/', text);
    text = replaceAll(' /', '/', text);
    text = _s.underscored(_s.slugify(_s.trim(_s.clean(text))));
    return text;
}

var humanReadable = function(text){
    var thingsToRemove = [/(-)(esp)/i, /(-)(en)/i , /(-)(\s+)(esp)/i , /(\d+)([a-z])(\.)/i , /(\d+)(\.)/i];
    return trim(text, thingsToRemove);
}
var filterNameDoc = function( text){
    text = replaceAll('.docx','', text);
    text = replaceAll('.pdf','', text);
    text = replaceAll('.doc','', text);
    text = trim(text, [/(\d+)([a-z])(-)/i]);
    text = _s.titleize(_s.humanize(text));
    return text; 
}
var cleanBody = function(cuerpo){
    cuerpo = replaceAll('&bull;', '', cuerpo);
    return replaceAll('<span', '<span class=\"dotted\"></span><span class=\"desc\"', cuerpo);
}


var saveFile = function(path, file,content){
    return Q.nfcall(fs.writeFile, path+'/' + file, '\ufeff' + content);
}
var generateDocJson = function(fichero){
    
    if(fs.existsSync(originalDocsDir+fichero.file)){
        fs.createReadStream(originalDocsDir+'/'+fichero.file).pipe(fs.createWriteStream(generatedDocsDir+'/'+fichero.originalName));
    }
    var jsonData = {
        titulo : fichero.name,
        descripcion: fichero.originalName
    }
    saveFile(generatedDocsDir, fichero.originalName+'.json', JSON.stringify(jsonData));
}



var getJsonAnexo = function(id){
    var json = readFileToJson('raw/initial/'+id+'.json');
    json = _.omit(json, ['ciudad', 'documentos','entradilla', 'paisCiudad','libres','subtitulo','fechaModificacion','fechaCreacion','tipo']);
    _(json.ficheros).each(function(fichero, i){
        json.ficheros[i].name = filterNameDoc(fichero.originalName);
        generateDocJson(json.ficheros[i]);
    });
    if(typeof(json.cuerpo) != 'undefined'){
        //json.cuerpo = cleanBody(json.cuerpo);
    }
    json.id =  underscorify(json.titulo);
    
    return json;
}


var createJson = function(data){
    var json = [];
    
    _(data.nodes).each(function(item,index){
        var key = underscorify(item.name);
        var categoria_anexo = {
            name : humanReadable(item.name),
            id : key,
            anexos: []
        };
        _(item.nodes).each(function(anexo, i){
            categoria_anexo.anexos.push(getJsonAnexo(anexo.id));
        });
        json.push(categoria_anexo);
    });
    
    
    saveFile('generated', 'anexos.json', JSON.stringify(json));
}


var main = function(){
    var mainJson = readFileToJson('raw/listado.json');
    var elementsFiltered = _.filter(mainJson.nodes, function(node){ return node.name.indexOf('Anexo') != -1; });
    if(elementsFiltered.length == 0 ){
        elementsFiltered = _.filter(mainJson.nodes, function(node){ return node.id == 'd0bdce5e-4963-413b-8b1e-90d49fe27106'; });
    }
    
    if(elementsFiltered.length != 0){
        createJson(elementsFiltered[0]);
    }
   
}
//Do the job;
if(canProcess){
    main();
}