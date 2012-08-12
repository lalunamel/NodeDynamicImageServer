var http = require('http');
var url = require('url');
var fs = require('fs');
var gm = require('gm');

var server = http.createServer(function(request, response){
	var url_parts = url.parse(request.url).path.substring(1).split("/");

	var width = parseInt(url_parts[0]);
	var height = parseInt(url_parts[1]);
    var max = Math.max(width, height);

	if(!isNaN(width) && !isNaN(height))
	{
        response.writeHead(200, {'content-type': 'image/png'});
        gm('nodejs.png').
            resize(max, max).
            crop(width, height, 0, 0).
            stream(function(err, stdout, stderr){
                if(err) {
                    console.log(err)
                }
                else {
                    stdout.pipe(response);
                }
            });
	}
    else {
        response.writeHead(400, {'content-type' : 'text/plain'});
        response.end();
    }
})
.listen(1337, '127.0.0.1');