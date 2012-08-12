**Creating a simple dynamic image server in Node.js**

This tutorial will show how a simple hello world example can be turned into a dynmic image server.

As a first project I find [Felix's Node.js tutorial](http://nodeguide.com/beginner.html#learning-javascript) to be an excellent starting point that goes just a little beyond Hello World. If you've never worked with Node before, read Felix's tutorial first to get a handle on things. In this article we will go a bit further by creating a not-quite-static image server, something like [Placekitten](http://www.placekitten.com).
Let's get started!

**Setup**

For this tutorial you will need
- Node.js - Check out [Felix's tutorial](http://nodeguide.com/beginner.html#learning-javascript) for how to install
- A text editor - I use [Sublime Text](http://www.sublimetext.com/)
- GraphicsMagick - If you're on linux, do a `sudo apt-get install graphicsmagick`
- [Node.js docs](http://nodejs.org/api/index.html) - If you don't know what something does, start here


**Starter Code**

So, let's start with a simple [hello world example](http://nodejs.org) from the nodejs home page.
First, create a file called main.js and paste this code in.

	var http = require('http');
	http.createServer(function (req, res) {
	  res.writeHead(200, {'Content-Type': 'text/plain'});
	  res.end('Hello World\n');
	}).listen(1337, '127.0.0.1');
	console.log('Server running at http://127.0.0.1:1337/');

To run this example, open up your terminal, navigate to main.js, and type `node main.js`

Let's walk through what's going on.

	1 Create the variable http by _requiring_ the module *http*
	2 Create an instance of a server
	3 Write http header information to output. _200_ means everything is okay, _Content-Type: text/plain_ means the server will be sending plain text
	4 Write _Hello World_ to the stream, then end the transaction
	5 End initialization of the _createServer_ function and listen on port *1337*
	6 Write server information to the console

So, now we have a server that responds with *Hello World* all the time.

** Adding an image **

Let's add an image into the mix, since, after all, we *are* building a suped-up image server.
Go ahead and grab an image and put it into the same directory as `main.js`. I used a logo from the [Nodejs homepage](http://nodejs.org/logos/). Stick it into your working directory and name it `nodejs.png`. For the remainder of the tutorial I'll assume your image is named `nodejs.png`.

Since we're going to need to read from disk, we have to include a module called `fs`. If you're interested in learning more, check out the fs entry at the user created [Nodejs manual](http://nodemanual.org/latest/nodejs_ref_guide/fs.html).

We include fs the same way we included http. Just add the `require` code to the top of main.js.

	var fs = require('fs');

The way to read a file using `fs` is, big surprise, with the function `readFile(fname, callback(error, data))`. This function is asynchronous.
`fname` is the path to your file. In our case, this is just `nodejs.png` since the image is in the same directory as `main.js`.
`error` and `data` are two objects passed to the callback once the file is read. If no errors are raised while reading, `error` is null and `data` contains a buffer of your file.

Take out the two lines that would print "Hello World!" and replace it with our new code.
	fs.readFile('nodejs.png', function(error, data){
		if(error) {
			response.writeHead(404);
			response.end();
		} else {
			response.writeHead(200, {'content-type': 'img/png'});
			response.end(data, 'binary');
		}
	});

Now, if there is an error during read, the server will return 404. Else, the image is returned. `content-type` specifies the MIME Type of the file. `binary` specifies the encoding of the returned file. 

Look at that, we're serving files and returning 404 error messages just like our friend Apache! Not too hard, eh?

If you'd like to test the server out point your browser to `http://127.0.0.1:1337`.

** Resizing the image ** 

Now we need to resize the image based on the path of the url. For example, a url of `http://127.0.0.1:1337/40/50` would result in an image 40 pixels high by 50 pixels wide.

To grab this information from the url's path we need yet another module called `url`. Require that at the top just like before.

Let's take just the end of the url and then split that into the parts we want. 
Replace the code inside of the `createServer` callback with this:

	var url_parts = url.parse(request.url).path.substring(1).split("/");
	var width = url_parts[0];
	var height = url_parts[1];
    var max = Math.max(width, height);


For image manipulation we will use a module called [graphicsmagick](https://github.com/aheckmann/gm). Enter `npm install gm` to install this module to your system and require it with `var im = require('gm');`. Because the module is just bindings you will also need to install GraphicsMagick to your local machine. If you're running linux you can run `sudo apt-get install graphicsmagick` to install.

To resize the image and return it, make a call to gm's resize function and then stream the output to the server response. Append this code to the first part you just added
	
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

Now, when a request comes in we parse the width and height and assign them to their respective variables. Then the image is scaled up to the greater of the width and height and then cropped down to the desired size. The resized and cropped image is now sent back to the server, else if there is an error, log it and return 404.

What if a request is made and a width and a height aren't specified? To handle that wrap the code above in an if statement to catch `NaN` values.

	if(!isNaN(width) && !isNaN(height))
	{
        // ...above...
	}
    else {
        response.writeHead(400, {'content-type' : 'text/plain'});
        response.end();
    }

** Done! **

At this point we've successfully created an image server that takes a width and a height via url and returns an image with the specified dimensions. 

Here is the end result:

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

Open up [http://127.0.0.1:1337/50/75](http://127.0.0.1:1337/50/75) to see your handywork!

Great! Now you're a Node master, right? To learn more about nodejs go to their website [here](http://nodejs.org/). 

If you have any improvements, corrections, or comments please contact me on github [github](https://github.com/lalunamel) by submitting an issue to this project. You can find me on the web [here](http://codysehl.net).