$(function(){

  // Make sure all query/document pairs are in file xab in Data folder. 
  var key = 'xaa';
  var query_document_id = $('#query_document_id').val();
  var contentFrame;
  var total_scrolls = 0.0;
  var total_hovers = 0.0;

  
  $('#start').click(function(click_event){
	$.ajax({url:'api/startCheck',
		data: JSON.stringify({'worker_id':'check_pages','key':key}),
		contentType: "application/json",
		type:'post',
		success : function(output){
			//get new query pair
			GetNextPair(key);			
		},
		error : function(output)
		{
			alert(output.responseText);
		}
	});
  });
  
  $('#correct_button').click(function(click_event){
	GetNextPair(key);			
  });

  $('#incorrect_button').click(function(click_event){
  	var query_document_id = $('#query_document_id').val();
	alert(query_document_id);
	$.ajax({url:'api/submitIncorrectDocument',
		data: JSON.stringify({'key':key, 'query_document_id':query_document_id}),
		contentType: "application/json",
		type:'post',
		success : function(output){
			//get new query pair
			GetNextPair(key);			
		},
		error : function(output)
		{
			alert(output.responseText);
		}
	});
  	
  });

  // Record the scroll event of iframe.
  var iScrollPos = 0;
  $('#document_frame').load(function () {
	var iframe = $('#document_frame').contents();
	iframe.find('a').click(function(event) {
            event.preventDefault();
        }); 
	/*iframe.mousemove(function(event) {
		total_hovers+=1.0;
		var edict = {};
		edict['hover'] = event.type+' '+event.pageX + ' '+ event.pageY + ' '+ event.target.text;
		SubmitPageEvent(edict);
	});*/
	iframe.scroll(function() {
		total_scrolls+=1.0;
		var iCurScrollPos = iframe.scrollTop();
		var scrollType='';
		if (iCurScrollPos > iScrollPos) {
		   // Fire scroll down event.
		    scrollType='down';	
		} else {
		    scrollType='up';
		}
		iScrollPos = iCurScrollPos;
  	});
   }); 

});

function GetNextPair(key) {
    $('#start').hide();
    $('#document_frame').scrolling = 'no';
    $('#document_frame').attr("srcdoc", '');
    $.ajax({url:'api/getNextPair',
    	data:JSON.stringify({'worker_id':'check_pages', 'key':key}),
    	type:'post',
    	contentType: "application/json",
    	success : function(output){
    	    if('next_pair' in output)
    	    {
    	        $('#query').html(output['next_pair'][1]);
    	        $('#query_description').html(output['next_pair'][2]);
    	        $('#doc_url').html(output['next_pair'][5]);
    	        $('#query_count').html('Query-Webpage pair #'+output['query_count']);
    	        var query_doc_id = output['next_pair'][0]+'\t'+output['next_pair'][3];
    	        $('#query_document_id').val(query_doc_id);
    	  	iScrollPos = 0;
    	        total_scrolls = 0;
		total_hovers = 0;
		$('#document_frame').attr("srcdoc", output['next_pair'][4]);
		$('#doc_url').attr("href", output['next_pair'][5]);
    		$('#document_frame').scrolling = 'yes';
    	     
    	     }
    	     if('code' in output)
    	     {
    	    		$('#query_and_document').html(code);
    	     }
    	}
    });
    return false;
}
