var datastore = require('./datastore')
var express = require('express');
var app = express();
var engines = require('consolidate');
var bodyParser = require('body-parser');

app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.use(bodyParser.json());

app.set('views', __dirname + '/../views');

app.use(bodyParser.json());
app.use("/", express.static(__dirname + '/../views'));
app.use("/js", express.static(__dirname + '/../views/js'));
app.use("/css", express.static(__dirname + '/../views/css'));

app.get('/index', function(req, res) {
  res.type('text/html'); // set content-type
  res.render('instructions.html');
});


// Record the workerid and key 
// Load the data with file mapping to the key (key.csv)
app.post('/api/startHIT', function(req,res){
	// The following comes in : Worker-id, key, language 
	// familiarity, participants age.
	
	var worker_id = req.body.worker_id;
	var response_array = req.body.responses;
	var key = req.body.key;
	console.log('Recieved Key '+key+' worker_id '+worker_id+' #responses '+response_array.length);
	// Load the queries for this experiment. 
	rstatus = datastore.loadHITBatchByKey(key);
	if (rstatus == true)
	{
		datastore.initializeWorkerBatchKeyProperties(worker_id, key);
		for(var i = 0; i < response_array.length;i++) 
		{
			for(var rkey in response_array[i])	
			{	
				//console.log('Response '+rkey +' '+response_array[i][rkey]);
				datastore.addResponseToDatabase(worker_id, key, rkey, 
								response_array[i][rkey], new Date().getTime());
			}
		}
		// Send the status value.
		res.json(true);	
	}
	else
	{	
    	res.statusCode = 400;
		res.send('Error 400: Got invalid Batch Id, please refer to '+
			'HIT description on MTurk for correct Id !');	  
	}
});

// For this worker and key, get the next available query-doc
// pair, if no more pairs left, return the code for 
// payment.
app.post('/api/getNextPair',function(req,res){
	
	var worker_id = req.body.worker_id;
	var key = req.body.key;
	var result = datastore.getNextPair(worker_id, key);
	if (result['status'] == false) 
	{
		// Out of pairs to show. 
		var code = datastore.generateSurveyHash(worker_id, key);
		res.json({'code':code});
	}
	else
	{
		datastore.addEventToDatabase(worker_id, key, 'load', result['next_pair'][0]+'\t'+result['next_pair'][3], (new Date()).getTime());
		res.json({'query_count':result['query_count'], 'next_pair':result['next_pair']});	
	}

});

app.post('/api/submitEventForQueryPair', function(req, res){
	// Submit the event sent by the client. Mainly the following
	// events are being logged: click, scroll of inner window with
	// timestamp.
	var worker_id = req.body.worker_id;
	var key = req.body.key;
	var event_array = req.body.responses;
	var query_document_id = req.body.query_document_id;
	var time = new Date();
	for(var i = 0; i < event_array.length;i++) 
	{
		for(var ekey in event_array[i])	
		{	
			//console.log('Event '+ekey +' '+event_array[i][ekey]);
			time = new Date(time.getTime()+100);
			datastore.addEventToDatabase(worker_id, key,query_document_id+'\t'+ ekey, event_array[i][ekey], time.getTime());
		}
	}
	res.json(true);

});

app.post('/api/submitQueryPairResponses', function(req, res){
	// Submit the data of 10 questions/
	var worker_id = req.body.worker_id;
	var key = req.body.key;
	var response_dict = req.body.responses;
	var query_document_id = req.body.query_document_id;
	var time = new Date();
	for(var rkey in response_dict) 
	{
		time = new Date(time.getTime()+100);
		//console.log('Response '+rkey +' '+response_array[i][rkey]+' '+time.getTime());
		datastore.addResponseToDatabase(worker_id, key, query_document_id+'\t'+rkey, response_dict[rkey], time.getTime());
	}
	res.json(true);
});

app.listen(process.env.PORT || 4730);

