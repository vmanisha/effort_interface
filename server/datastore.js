// TODO(mverma): Add the hash function code.
// TODO(mverma): Check if each entry in database needs a unique id. 
// TODO(mverma): Check if dictionary items are checked by contains
// TODO(mverma): Check if databases have to be closed. 

// Load, Store and retrieve data specific to 
// a worker and hit batch key. 
var fs = require('fs');
var MicroDB = require('nodejs-microdb');
var url = require('url');
var cheerio = require('cheerio');
var sanitizer = require('sanitize-html');
worker_batchkey_dict = {};
key_data_dict = {};
current_worker_key_query_index= {};
survey_code_database = new MicroDB({'file':'survey_code.db', 'defaultClean':true});
event_database = new MicroDB({'file':'event.db', 'defaultClean':true});
response_database  = new MicroDB({'file':'response.db',	'defaultClean':true});

// Shuffle elements for each user.
function shuffle(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

// Function to replace all relative urls with docUrl 
function ReplaceRelativeLinks(source, baseUrl) {

	$ = cheerio.load(source);
	// Replace all the relative links with absolute page.
	$('[src]').each(function(i, ele) {
		src = $(this).attr('src');
		$(this).attr('src', FullUrl(src, baseUrl));
	});
	$('[srcset]').each(function(i, ele) {
		src = $(this).attr('src');
		$(this).attr('srcset', FullUrl(src, baseUrl));
	});
	
	// Replace all the outlinks by modify url function 
	$('a[href]').each(function(i, ele) {
		href = $(this).attr('href');
		// Check if there is no image.
		$(this).attr('href', FullUrl(href, baseUrl));
	});
  
	$('link[href]').each(function(i, ele) {
	href = $(this).attr('href');
	$(this).attr('href', FullUrl(href, baseUrl));
	});

	$('[background]').each(function(i,ele) {
	href = $(this).attr('background');
	$(this).attr('background', FullUrl(href, baseUrl));
	});
	
	return $.html();	
}

function Relative(uri) {
  return !url.parse(uri || '').host;
}

function FullUrl(uri, baseUrl) {
 
  full_url =  (uri && Relative(uri)) ? url.resolve(baseUrl, uri) : uri;
  return full_url; 
}


module.exports =
{
	// Given the key, load the key file -- query, description and html list. 
	loadHITBatchByKey: function(key)
	{
		if(!(key in key_data_dict)) {
			// Check if the key is already present
        		var fileName = __dirname+'/Data/'+key;
			try 
			{
				var array = fs.readFileSync(fileName).toString().split("\n");
				console.log('Loading '+key+' '+array.length);
				key_data_dict[key] = [];
        			//load the query, description and html. 
        			for (var i in array)
        			{
            				var split = array[i].split('\t');
					// format : queryid query-type, query, query-description, doc-id, doc-label, doc_url doc-content
            				if(split.length == 8)
					{
						split[7] = ReplaceRelativeLinks(split[7], split[6]);
						var sanitized_html = sanitizer(split[7],{allowedTags:false, 
								allowedAttributes:false, 
								exclusiveFilter: function(frame) {
								        return frame.tag === 'noscript' && !frame.text.trim();
    								}
							});
						
						// Fix the qoutes problem.
						// qcount = split[7].match(/\"/g).length;
						// unhandled qoute, replace them all by
						// &ldquo; 
						//if (qcount%2 == 1)
						//	split[7] = split[7].replace(/"/g,"&ldquo;");
						key_data_dict[key].push([split[0],split[2],split[3],
									split[4],sanitized_html, split[6]]);

					}
					else
						console.log('Error in file '+key+' line '+i+ ' '+array[i] +' '+split.length);
        			}
				// Shuffle the entries.
				key_data_dict[key] = shuffle(key_data_dict[key]);
        			console.log('Loaded Query-document pairs for '+key+' documents '+key_data_dict[key].length);
				return true;
			}
			catch(error) 
			{
				console.log(error);
				return false;
			}
		}
		else
			return true;
	},
	
	// Create data stores (event and responses) for the workerid-batchkey pair. 
	initializeWorkerBatchKeyProperties: function(worker_id,key)
	{
		var dict_key = worker_id+'\t'+key;
		current_worker_key_query_index[dict_key] = 0;
	},
		
	// Add event to worker-batchkey event database
	addEventToDatabase: function(worker_id, key, event_type, event_value, timestamp)
	{
			
		var dict_key = worker_id+'\t'+key;
		//console.log('Event '+dict_key+' '+event_type+' '+event_value);
		event_database.add({'key':dict_key, 'event_type':event_type, 'event_value':event_value}, timestamp);
	}, 
	
	// Add the responses to the worker-batchkey responses database
	addResponseToDatabase: function(worker_id, key, response_type, response_value, timestamp) 
	{

		var dict_key = worker_id+'\t'+key;
		//console.log('Response '+dict_key+' '+response_type+' '+response_value);
		response_database.add({'key':dict_key, 'response_type':response_type, 'response_value':response_value}, timestamp);
	},	

	// Generate the hash for survey code
	generateSurveyHash: function (worker_id, key) 
	{
		
		var worker_key = worker_id+'\t'+key;
		var code = worker_key.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0); 
		survey_code_database.add({'worker-id':worker_id, 'key':key, 'code':code});
		return code;
	},
	
	// Return next pair to label by worker-id
	getNextPair: function(worker_id, key)
	{
		// Write the cached db to file
		event_database.flush();
		response_database.flush();
		var worker_key = worker_id+'\t'+key;
		// finished doing all the queries, return false.
		if (key_data_dict[key].length == current_worker_key_query_index[worker_key])
			return {'status':false};
		else {
		
			var return_array = key_data_dict[key][current_worker_key_query_index[worker_key]];	
			// increment the array index
			current_worker_key_query_index[worker_key]++;
			console.log('Key '+worker_key + ' '+return_array[0]+' '+return_array[1]+' '+return_array[3]);
			return {'status':true, 'query_count':current_worker_key_query_index[worker_key], 'next_pair':return_array};
		}
	}

};
