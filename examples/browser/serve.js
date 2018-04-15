/**
 * Authors: alexlawrence, dangrasso, Paul_Yuhnovich, chrisdavidmills, bunnybooboo, johnjago, ugultopu, ebcoder,
 * mattmilburn, sergey-seleznev, Coco92, image72, h_ajsf.
 * From mozilla MDN web docs.
 * Url: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework (accessible on 2018.04.15)
 */

var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function (request, response) {
    console.log('request ', request.url);

    var filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './index.html';
    }
    else if (filePath == './steem-smartvotes.min.js') {
        filePath = '../../dist/browser/steem-smartvotes.min.js';
    }

    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };

    var contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                response.writeHead(404);
                response.end('404 Not found\n');
                response.end();
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, {'Content-Type': contentType});
            response.end(content, 'utf-8');
        }
    });

}).listen(8125);
console.log('Server running at http://127.0.0.1:8125/');
