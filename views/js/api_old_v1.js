var questions_dict = [
  	{"type":"familier",
	"question" : "Rate your <i><u>knowledge</u></i> on the topic? (this does not affect your pay)",
	"options": {"none":"No Knowledge", "beginner":"Very little knowledge",
	"intermediate" :"Some knowledge", "expert":"Expert"}}, 
	{"type":"happy", 
	"question" : " Would you be <i><u>satisfied (happy)</u></i> with this search result? ",
	"options": {"yes":"Yes", "no":"No","somewhat" :"Somewhat", 
	"cant-judge":"Cant Judge (skip the remaining questions)"}}, 
  	{"type":"relevance",
	"question" : "Is this document <i><u>relevant</u></i> to the query?",
	"options": {"non-rel":"Not Relevant", "some-rel":"Somewhat Relevant",
	"rel" :"Relevant", "high-rel":"Highly Relevant", 
	"broken-url": "Url is broken (Page not found or some error)"}}, 
  	//{"type":"read",
	//"question" : "How easy was it to <i><u>read</u></i> the document?",
	//"options": {"v-diff":"Very Difficult", "some-diff":"Somewhat Difficult",
	//"v-easy" :"Very Easy", "easy":"Easy" }},
  	{"type":"find-info",
	"question" : "Did you <i><u>find</u></i> the required information in the document?",
	"options": {"yes":"Yes, found all the information", 
	"no":"No, did not find required information",
	"partial" :"Somewhat, found only partial information"}},
  	{"type":"find",
	"question" : "Was it <i><u>easy to find</u></i> answer of the query in the document?",
	"options": {"v-diff":"Very Difficult", "some-diff":"Somewhat Difficult",
	"v-easy" :"Very Easy", "easy":"Easy" }}
];
 
var curr_question = -1;
var skipped = 0;

$(function(){


  // Check the values of worker_id and key.
  var worker_id = $('#worker_id').val();
  var key = $('#key').val();
  var query_document_id = $('#query_document_id').val();

  var contentFrame;
  var total_scrolls = 0.0;
  var total_hovers = 0.0;
  var cheat =0.0;
  
  // Collect the radio responses and build the dictionary.
  var radio_dict = {};
  var cant_judge = -1;
 
  // Adding Highlights.
  rangy.init();

  // If no worker_id or key is present
  // load the only the instructions and consent.	
  if(worker_id == '' && key == '')
  {
	$('#labels_page').hide();
	$('#instructions').hide();
	$('#important_button').hide();
	$('#view_important_button').hide();
	$('#important_div').hide();
	$('#attributes_and_description').hide();
	$('#code_page').hide();
  }

  // Load/Hide the instructions on click
  $('#instructions').click(function(click_event) {
	// Toggle instructions.
	var isVisible = $('#attributes_and_description').is(':visible');
	var isHidden = $('#attributes_and_description').is(':hidden');
	if (isVisible)
	{	
		$('#attributes_and_description').hide();
	}
	else
		$('#attributes_and_description').show();
		
  });

  // Add important content
  $('#important_button').click(function(click_event) {

	var contentFrame = document.getElementById('document_frame');
	var rangySelection = rangy.getSelection(contentFrame);
	//alert('selected '+rangySelection);
	var content = $('#important_div').text();
	//alert(content);
	if (content.indexOf(rangySelection) == -1)
		$('#important_div').append('<br/>'+rangySelection);
	
  });

  $('#view_important_button').click(function(click_event){
	var isVisible = $('#important_div').is(':visible');
	var isHidden = $('#important_div').is(':hidden');
	if (isVisible)
		$('#important_div').hide();
	else
		$('#important_div').show();
  });

  // Check and submit questions responses.
  $('#questions_form').validate({
		rules: {
			label_question: {
				required:true
			}
		},
		errorPlacement: function(error, element) {
			error.css("color","red");
			error.css('text-decoration', 'bold');
			error.appendTo('#'+element.attr("name")+'_input_error');
		},
		submitHandler: function postForm(validator, form, submit_event) {
			
			worker_id = $('#worker_id').val().trim();
			key = $('#key').val().trim();
		 	query_document_id = $('#query_document_id').val().trim();
			 
			if (total_scrolls == 0 && cheat < 3) {
				cheat+=1;	
				$('#questions_form_error').css("color","red");
				$('#questions_form_error').css('text-decoration', 'bold');
    		        	$('#questions_form_error').html('Please read the document'+
				' carefully before submitting answers. You will be given '+(3-cheat)+' more'+
				' attempts.');
				$('#questions_form input:radio').removeAttr('checked');
				$('#questions_form textarea').each(function () {
					$(this).val('');	
				});
			}
			else if (cheat == 3)
			{
    	    			$('#instructions_page').hide();
    	    			$('#labels_page').hide();
    	    			$('#instructions').hide();
    	    			$('#important_button').hide();
    	    			$('#view_important_button').hide();
    	    			$('#important_div').hide();
    	    			$('#attributes_and_description').hide();
    	    			$('#code_page').show();
    	    			$('#code_page').html('You have cheated thrice! Sorry, but you would not'+
				' allowed to annotate more documents. You shall not be payed for the remaining hits.');
			}
			else {
    	    			$('#questions_form_error').html("");
				$('#questions_form input[type="radio"]:checked').each(function() {
					radio_dict[$(this).attr('id')] = $(this).val();
					if ((questions_dict[curr_question]["type"] == "happy") && 
								($(this).val() == "cant-judge")) {
						cant_judge =1;
					}
					else if ((questions_dict[curr_question]["type"] == "find-info") && 
								($(this).val() == "no")) {
						curr_question+=2;
					}
					else {	
						// find the next question to select.
						curr_question+=1;
						if (curr_question < questions_dict.length)
							UpdateQuestionText(questions_dict,curr_question);
					}
					if (curr_question  == (questions_dict.length - 1 ))
						$("#next_question").val("Next Page");	
				});
			}

			// If all questions have been answered
			if ((curr_question >= questions_dict.length) || cant_judge == 1 ) {
				// Fetch the importants 
				var important_text = $('#important_div').text().trim();
				curr_question = -1;
				if (important_text.length>2)
				{
					var dict ={};
					dict['important_text'] = important_text;
					//alert(important_text);
					radio_dict.push(dict);
				}
				// Register the responses.
				$.ajax({url:'api/submitQueryPairResponses',
					data: JSON.stringify({'worker_id':worker_id ,
					 'key':key, 'query_document_id':query_document_id,
					 'responses':radio_dict }),
    		    			contentType: "application/json",
    		    			type:'post',
    		    			success : function(output){
						$('#questions_form input:radio').removeAttr('checked');
						$('#questions_form textarea').each(function () {
							$(this).val('');
						});
    		        			//get new query pair
						GetNextPair(worker_id, key);			
    		    			},
    		    			error : function(output)
    		    			{
						$('#questions_form_error').css("color","red");
						$('#questions_form_error').css('text-decoration', 'bold');
    		        			$('#questions_form_error').html(output.responseText);
    		    			}
   		    		});
    	        		total_scrolls = 0;
				radio_dict = [];
			}	
		
    		    return false;
		}	
  }); 
  
  // Check and submit worker information.
  $('#worker_id_and_key_form').validate({
		rules: { 
			worker_id_input: {
				required:true
			},
			key_input: {
				required:true
			},
			proficiency: {
				required:true
			}				
		},
		errorPlacement: function(error, element) {
			error.css("color","red");
			error.css('text-decoration', 'bold');
    			if (element.attr("name") == "proficiency") 
      				error.appendTo("#worker_id_and_key_form_error");
			else
				error.appendTo('#'+element.attr("name")+'_error');
  		},
		submitHandler: function postForm(validator, form, submit_event) {
			worker_id = $('#worker_id_input').val().trim();
			key = $('#key_input').val().trim();
			var proficiency = $("#worker_id_and_key_form input[name='proficiency']:checked").val();
			// Clear any incorrect key error.
			$('#worker_id_and_key_form_error').html('');
			$.ajax({url:'api/startHIT',
    		    		data: JSON.stringify({'worker_id':worker_id , 'key':key, 'responses':[{'proficiency':proficiency}] }),
    		    		contentType: "application/json",
    		    		type:'post',
    		    		success : function(output){
    		    		    $('#worker_id').val(worker_id);
    		    		    $('#key').val(key);
		    		    $('#instructions_page').hide();
		    		    $('#attributes_and_description').hide();
		    		    $('#important_div').hide();
		    		    $('#instructions').show();
		    		    $('#important_button').show();
		    		    $('#view_important_button').show();
		    		    $('#labels_page').show();
    		    		    //get new query pair
		    		    GetNextPair(worker_id, key );				
    		    		},
    		    		error : function(output)
    		    		{
	    		    		$('#worker_id_and_key_form_error').css("color","red");
	    		    		$('#worker_id_and_key_form_error').css('text-decoration', 'bold');
    		   	    		$('#worker_id_and_key_form_error').html(output.responseText);
    		    		}

			});
			return false;
		}	
  });  

  // Record the clicks and selections of the form.
  $('#questions_form input:radio').change(function(){
	var edict = {};
	edict[ $(this).attr('name')+'_click' ] = $(this).val();
	SubmitPageEvent(edict);
	return false;
  });


  // Record the scroll event of iframe.
  var iScrollPos = 0;
  $('#document_frame').load(function () {
	var iframe = $('#document_frame').contents();

	iframe.find('a').click(function(event) {
            event.preventDefault();
        }); 
 
	iframe.mousemove(function(event) {
		total_hovers+=1.0;
		var edict = {};
		edict['hover'] = event.type+' '+event.pageX + ' '+ event.pageY + ' '+ event.target.text;
		SubmitPageEvent(edict);
	});

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
		var edict = {};
        	edict['scroll' ] = scrollType;
		SubmitPageEvent(edict);
  	});
   }); 


});


function SubmitPageEvent(edict) {
	worker_id = $('#worker_id').val();
	key = $('#key').val();
	var query_doc_id = $('#query_document_id').val().trim();
	$.ajax({url:'api/submitEventForQueryPair',
		data: JSON.stringify({'worker_id':worker_id , 'key':key,'query_document_id':query_doc_id, 'responses':[edict] }),
		contentType: "application/json",
		type:'post',
		success : function(output){
		},
		error : function(output)
		{
		    	$('#questions_form_error').css("color","red");
		    	$('#questions_form_error').css('text-decoration', 'bold');
			$('#questions_form_error').html(output.responseText);
		}
	});
}


function GetNextPair(worker_id, key) {

    $.ajax({url:'api/getNextPair',
    	data:JSON.stringify({'worker_id':worker_id, 'key':key}),
    	type:'post',
    	contentType: "application/json",
    	success : function(output){
    	    	
    	    if('next_pair' in output)
    	    {
    	        $('#query').html(output['next_pair'][1]);
    	        $('#query_description').html(output['next_pair'][2]);
    	        $('#query_count').html('Query-Webpage pair #'+output['query_count']);
    	        var query_doc_id = output['next_pair'][0]+'\t'+output['next_pair'][3];
    	        $('#query_document_id').val(query_doc_id);
    	  	iScrollPos = 0;
    	        total_scrolls = 0;
		total_hovers = 0;
		$('#document_frame').attr("srcdoc", output['next_pair'][4]);
    	    	$('#instructions').focus();
    	    	$('#important_div').text('');
    	    	$('#questions_form_error').html("");
    	     
		// Show the first question	
		curr_question = 0;
		UpdateQuestionText(questions_dict, curr_question);
		$("#next_question").val("Next Question");	
    	     }
    	     if('code' in output)
    	     {
    	    		$('#instructions_page').hide();
    	    		$('#labels_page').hide();
    	    		$('#instructions').hide();
    	    		$('#important_button').hide();
    	    		$('#view_important_button').hide();
    	    		$('#important_div').hide();
    	    		$('#attributes_and_description').hide();
    	    		$('#code_page').show();
    	    		var code = output['code'];
    	    		$('#code_div').html(code);
    	     }
    	}
    });
    return false;
}

function UpdateQuestionText(questions_dict, question_index) {
	// Get the question type.
  	// <table border="0" cellpadding="0" cellspacing="4" align = "center"  name ="label_question_table">
  	// <tr> <td valign="center">   <input name="familier" type="radio" value="none" /><span class="answertext">No Knowledge</span> </td> </tr>
  	//	</table>
  	// Clear html
  	$("#label_question_table").html("");
	var type = questions_dict[question_index]["type"];
	var question = questions_dict[question_index]["question"];
	var options = questions_dict[question_index]["options"];
	$("#label_question_table").append("<b>"+(question_index+1)+". "+question+"<b>");
	for(key in options) {
		var $col = $("<td>", {"valign":"center"}).append($("<input>", {"name": "label_question", "id":type, "type": "radio", "value":key}));
		$col.append($("<span>", {"class":"answertext", "html":options[key]}));	
        	var $row = $("<tr>").append($col);
        	$row.appendTo("#label_question_table");		
    	}
	return false;
}
