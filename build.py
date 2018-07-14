#!/usr/bin/env python3

import re, requests, subprocess

def js_gcc(code):

	try:
		print('Trying to build JS project locally')
		res = subprocess.getoutput(
			'java -jar libs/jqspa/lib/closure-compiler.jar -W QUIET js/app.build.js'
		)
	except Exception as e:
		print('Local JS build failed\ncalling google...')
		res = requests.post('https://closure-compiler.appspot.com/compile', {
			'output_format': 'text',
			'output_info': 'compiled_code',
			'compilation_level': 'SIMPLE_OPTIMIZATIONS',
			'js_code' : code,
		}).text

	match = re.match(
		'^(?P<filename>.+):(?P<line_number>\d+):\s(?P<error>.+)\n(?P<text>.+\n.+)\n',
		res
	)

	if match: is_error = True

	return res, True if match else False

def parseLine(line):
	matchScript = re.match(
		'^(?P<pre>[\s\t]*)spa\.includeScript\([\s\t]*[\'\"]\/?(?P<dir>.+)[\'\"][\s\t]*\)',
		line, re.X
	)
	matchTemplate = re.match(
		'^(?P<pre>[\s\t]*).*spa\.includeTemplate\([\s\t]*[\'\"]\/?(?P<dir>.+)[\'\"][\s\t]*\)',
		line, re.M
	)

	if matchScript:
		
		return parseFile(
			matchScript.groupdict()['dir'],
			matchScript.groupdict()['pre']
		)
	
	if matchTemplate:

		return parseTemplate(matchTemplate.groupdict()['dir'], line)

	return line

def parseTemplate(file, line):
	try:
		templateString = """'{}'""".format( re.sub('[\s\t]+',' ', open(file).read().replace('\n','').replace("'", "\\'") ) )
		return re.sub('spa\.includeTemplate\(.*\)', templateString, line)
	except Exception as e:
		return line

def parseFile(file, pre=None):
	pre = pre if pre else ''
	with open(file) as file:
		
		_file = ''.join(parseLine(pre+line) for line in file)
	return _file + ";\n"

if __name__ == "__main__":
	code = parseFile('js/app.js')

	with open('js/app.build.js', 'w') as file:
		file.write(code)
	with open('js/app.min.js', 'w') as file:
		res, is_error = js_gcc(code)
		file.write(res)

	if is_error:
		print('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!')
		print('!!! ERROR IN JS BUILD !!!!!')
		print('!!!!!!!!!!!!!!!!!!!!!!!!!!!\n')
		print(res,'\n===========================')
		exit(1)
	else:
		print('JS build succeeded')
		exit(0)
