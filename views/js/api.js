$(function(){


  // Check the values of worker_id and key.
  var worker_id = $('#worker_id').val();
  var key = $('#key').val();
  var query_document_id = $('#query_document_id').val();

  var contentFrame;
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

  $('#instructions').mouseover(function(hover_event) {
	$('#instructions').css("color","blue");
	$('#instructions').css('text-decoration', 'underline');
  });

  $('#instructions').mouseout(function(hover_out_event){

	$('#instructions').css("color","black");
	$('#instructions').css('text-decoration', 'none');
	$('#instructions').css('text-decoration', 'bold');
  });


  $('#important_button').mouseover(function(hover_event) {
	$('#important_button').css("color","red");
	$('#important_button').css('text-decoration', 'underline');
  });

  $('#important_button').mouseout(function(hover_out_event){

	$('#important_button').css("color","black");
	$('#important_button').css('text-decoration', 'none');
	$('#important_button').css('text-decoration', 'bold');
  });

  $('#view_important_button').mouseover(function(hover_event) {
	$('#view_important_button').css("color","green");
	$('#view_important_button').css('text-decoration', 'underline');
  });

  $('#view_important_button').mouseout(function(hover_out_event){

	$('#view_important_button').css("color","black");
	$('#view_important_button').css('text-decoration', 'none');
	$('#view_important_button').css('text-decoration', 'bold');
  });

	
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
	alert('selected '+rangySelection);
	var content = $('#important_div').text();
	alert(content);
	if (content.indexOf(rangySelection) == -1)
		$('#important_div').append('<br/>'+rangySelection);
	
  });

  $('#view_important_button').click(function(click_event){
	var isVisible = $('#important_div').is(':visible');
	var isHidden = $('#important_div').is(':hidden');
	if (isVisible)
	{	
		$('#important_div').hide();
	}
	else
		$('#important_div').show();
		

  });

  // Check and submit questions responses.
  $('#questions_form').validate({
		rules: {
			happy: {
				required:true
			},
			familier: {
				required: {
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
			relevance: {
				required:{
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
			understand: {
				required:{
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
			read: {
				required:{
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
			find: {
				required:{
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
			understand_very_diff: {
				required:{
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
			find_info: {
				required:{
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
			find_time: {
				required:{
					depends:function(element) {
						return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
					}
				}
			},
		//	read_dup: {
		//		required:{
		//			depends:function(element) {
		//				return !($("#questions_form input[name='happy']:checked").val() == 'cant-judge');
		//			}
		//		}
		//	}
		},
		errorPlacement: function(error, element) {
			error.css("color","red");
			error.css('text-decoration', 'bold');
			error.appendTo('#'+element.attr("name")+'_input_error');
		},
		submitHandler: function postForm(validator, form, submit_event) {
			// Collect the radio responses and build the dictionary.
			var radio_list = [];
			worker_id = $('#worker_id').val().trim();
			key = $('#key').val().trim();
		 	query_document_id = $('#query_document_id').val().trim();
			
		 	$('#questions_form input[type="radio"]:checked').each(function() {
				var dict ={};
				dict[$(this).attr('name')] = $(this).val();
	    			radio_list.push(dict);
			});
			
			// Collect the non-empty text responses and build dictionary.
		 	$('#questions_form textarea').each(function() {
				var dict ={};
				var content =  $(this).val().trim();
				if (content.length> 2)
				{	
					dict[$(this).attr('name')+'_textarea'] = content;
	    				radio_list.push(dict);
				}
			});
			
			// Fetch the importants 
			var important_text = $('#important_div').text().trim();
			if (important_text.length>2)
			{
				var dict ={};
				dict['important_text'] = important_text;
				alert(important_text);
				radio_list.push(dict);
			}
			
			// Register the responses.
			$.ajax({url:'api/submitQueryPairResponses',data: JSON.stringify({'worker_id':worker_id , 'key':key, 'query_document_id':query_document_id,'responses':radio_list }),
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
			{
				error.appendTo('#'+element.attr("name")+'_error');
			}
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
	worker_id = $('#worker_id').val();
	key = $('#key').val();
	query_document_id = $('#query_document_id').val().trim();
	var edict = {};
	edict[ $(this).attr('name')+'_click' ] = $(this).val();
	
	$.ajax({url:'api/submitEventForQueryPair',
	    data: JSON.stringify({'worker_id':worker_id , 'key':key,'query_document_id':query_document_id, 'responses':[edict] }),
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
	    return false;
  });


  // Record the scroll event of iframe.
  var iScrollPos = 0;
  $('#document_frame').load(function () {
	var iframe = $('#document_frame').contents();


	iframe.find('a').click(function(event) {
            event.preventDefault();
        }); 
 
	iframe.scroll(function() {
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
		});
  	}); 


});

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
            $('#document_frame').attr("srcdoc", output['next_pair'][4]);
		    $('#instructions').focus();
			$('#important_div').text('');
			
			
	 }
		if('code' in output)
		{
			$('#instructions_page').hide();
			$('#labels_page').hide();
			$('#instructions').hide();
			$('#attributes_and_description').hide();
			$('#code_page').show();
			var code = output['code'];
			$('#code_div').html(code);
		}
    }
    });
	return false;
}



