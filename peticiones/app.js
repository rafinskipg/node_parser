/*jslint node: true*/
'use strict';
//Variables 
var Q = require('q'),
    http = require('http'),
    canProcess = false,
	fs = require('fs'),
    fileDocument = "ficheroUpload.txt",
    fileVideo = "video.wmv",
    fileImage = "image.jpg",
    outputFile = "dataClean.json",
    lazy = require('lazy'),
    _s = require('underscore.string'),
    _ = require('underscore'),
    counter = 10,
    multipart = require('multipart');

    var host = '192.168.0.55';
    var port = '9191';
    var crisis = '7ef320d7-f033-4de1-b539-99d3c8900697';          
                
                
//Lets check if we can work with that
if(fs.existsSync(fileImage)){
    canProcess = true;
    console.log('The file to be parsed exists ;)');
} else{
    console.log('There is nothing to do Old boy :|');
}

function generateRandomText(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function addMessage(txt){
   
    var deferred = Q.defer();
    var data =  {
        DescripcionMensaje: txt,
        TituloMensaje: counter
       };
    var dataString = JSON.stringify(data);
    var headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };

    var options = {
        host: host,
        path: '/api/crisis/'+crisis+'/mensaje',
        port: port,
         method: 'POST',
         headers : headers
        
    }
    console.log(dataString);
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        
        res.on('data', function (chunk) {
             var datosMensaje = JSON.parse(chunk);
             deferred.resolve(datosMensaje);
        });
        
    });
    
    req.write(dataString);
    req.end();
   
    return deferred.promise;
}


function uploadDocument(id, urlDocument){
    var deferred = Q.defer();
    var boundaryKey = Math.random().toString(16); // random string
    var headers = {
      'Content-Type': 'multipart/form-data; boundary="'+boundaryKey+'"'
    };

    var options = {
        host: host,
        path: '/api/crisis/'+crisis+'/mensaje/'+id+'/upload',
        port: port,
        method: 'POST',
        headers : headers
        
    }
    var request = http.request(options, function(res) {
        res.setEncoding('utf8');
        
        res.on('data', function (chunk) {
            console.log(chunk);
             var datosMensaje = JSON.parse(chunk);
             deferred.resolve(datosMensaje);
        });
        
    });
    
    
    // the header for the one and only part (need to use CRLF here)
    request.write( 
      '--' + boundaryKey + '\r\n'
      // use your file's mime type here, if known
      + 'Content-Type: application/octet-stream\r\n' 
      // "name" is the name of the form field
      // "filename" is the name of the original file
      + 'Content-Disposition: form-data; name="my_file"; filename="'+urlDocument+'"\r\n'
      + 'Content-Transfer-Encoding: binary\r\n\r\n' 
    );
    fs.createReadStream(urlDocument, { bufferSize: 4 * 1024 })
      .on('end', function() {
        // mark the end of the one and only part
        request.end('\r\n--' + boundaryKey + '--'); 
      })
      // set "end" to false in the options so .end() isn't called on the request
      .pipe(request, { end: false }) // maybe write directly to the socket here?
      
   return deferred.promise;
}
function getCrisis(){
    var deferred = Q.defer();
    var options = {
        host: host,
        path: '/api/crisis/'+crisis,
        port: port
    }
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var received = '';
        res.on('data', function(chunk){
          received += chunk;
        });
        res.on('end', function(){
          var datosMensaje = JSON.parse(received);
            deferred.resolve(datosMensaje);
        });
       
        
    });
    req.end();
    return deferred.promise;

}
function checkDocumentExists(crisis, idMessage){
    for(var i = 0; i<crisis.Mensajes.length; i++){
        var mensaje = crisis.Mensajes[i];
        if(mensaje.ID == idMessage){
            
            console.log(mensaje);
            if(mensaje.Documentos.length <1){
                return false;
            }else{
            
                return true;
            }
        }
    }
}
function checkImageExists(crisis, idMessage){
    for(var i = 0; i<crisis.Mensajes.length; i++){
        var mensaje = crisis.Mensajes[i];
        if(mensaje.ID == idMessage){
            
            console.log(mensaje);
            if(mensaje.Imagenes.length <1){
                return false;
            }else{
            
                return true;
            }
        }
    }
}
function checkVideoExists(crisis, idMessage){
    for(var i = 0; i<crisis.Mensajes.length; i++){
        var mensaje = crisis.Mensajes[i];
        if(mensaje.ID == idMessage){
            
            console.log(mensaje);
            if(mensaje.Videos.length <1){
                return false;
            }else{
            
                return true;
            }
        }
    }
}
var main = function(){
    counter--;
    if(counter > 0){
        var randomText = generateRandomText();
        addMessage(randomText).then(function(message){
            //uploadDocument(message.ID, fileDocument).then(function(resp){
            uploadDocument(message.ID, fileImage).then(function(resp){
            //uploadDocument(message.ID, fileVideo).then(function(resp){
                console.log('SE HA ADJUNTADO EL ARCHIVO');
                setTimeout(function(){
                     getCrisis().then(function(crisis){
                        console.log(message);
                        console.log('MIRAMOS SI EL ARCHIVO ESTÄ EN EL MENSAJE DE LA CRISIS CON ID ', crisis.ID);
                        //if(checkDocumentExists(crisis, message.ID)){
                        if(checkImageExists(crisis, message.ID)){
                        //if(checkVideoExists(crisis, message.ID)){
                            console.log('EXISTE EL ARCHIVO');
                            main();
                        }else{
                            console.log('Fail');
                        }
                    });
                },10);
            }); 
            
        });
    }  
}
//Do the job;
if(canProcess){
    
    main();
}