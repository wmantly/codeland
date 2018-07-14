spa.Service.add({ // codeland-crunner
	name: 'codeland-crunner',
	run: function(args){ // language, code, callback

		$.ajax({
			jar: args.jar,
			method: 'POST',
			url: 'http://codeland.bytedev.co:2000/api/run/'+ args.name,
			// dataType: "json",
			data: {
				code: args.code
			},
			success: function(data){
				data.token = args.token;
				(args.callback || spa.utils.emptyFunc)(data);
			}
		});
	},
});
