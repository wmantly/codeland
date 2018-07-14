spa.Model.add({ // codelandManager
	name: 'codelandManager',
	cache: false,
	init: function(){
		var that = this;

	    interpreters = {
		    'javascript': 'echo "{{code}}"|base64 --decode| node', 
		    'python': 'echo "{{code}}"|base64 --decode| python3',
		    'c': 'echo "{{code}}"|base64 --decode| gcc -xc -o run1 - && ./run1',
		    'bash': 'echo "{{code}}"|base64 --decode| bash',
		    'R': 'echo "{{code}}" | base64 --decode | R --no-save',
		}
		
		spa.subscribe('code-run', function(args){
			console.log(args)
			args.code = window.btoa(args.code);
			args.language = args.language || 'bash';

			args.code = Mustache.render(interpreters[args.language], args);

			args.callback = function(data){
				data.token = args.token;
				data.res = window.atob(data.res);
				spa.publish('codelandManager-run-finished', data);
				

			}.bind(this);

			spa.services['codeland-crunner'].run(args);
		});

		spa.subscribe('codelandManager-run-finished', function(args){
			spa.publish('code-output', args);
		});
	},
});
