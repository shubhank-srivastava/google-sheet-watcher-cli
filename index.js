#!/usr/bin/env node
var program = require('commander');
var chalk = require('chalk');
var fs = require('fs');
var cp = require('child_process');
var GoogleSpreadsheet = require('./lib/google-spreadsheet');
var creds = require('./data/google-credentials.json');

program
	.version("1.0.0")
	.command("add <url>")
	.description("Add URL of google sheet to watch.")
//	.option("-i, --interval [interval]", "Time interval to check changes.")
	.action(addSheet);

program
	.command("del <index>")
	.description("Unwatch google sheet.")
	.action(delSheet);

program
	.command("list")
	.description("List all sheet watchers.")
	.action(listSheet);

program
	.command("import")
	.description("Import worksheets of authorised google user.")
	.action(importSheets);

program
	.command("watcher <action>")
	.description("Starts/restarts or stops watching all sheets.")
	.action(WATCHER)

program
	.command("callback <url>")
	.description("Give a callback URL to notify you of change in a sheet.")
	.action(setCallback)

program.parse(process.argv);

function addSheet(url){
	if(!/(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/.test(url)){
		console.log(chalk.red("This doesn't look like a spreadsheet URL."));
		process.exit(1);
	}else{
		var id = url.match(/spreadsheets\/d\/(.*?)\//)[1];
		var doc = new GoogleSpreadsheet(id);
		doc.useServiceAccountAuth(creds, function(){
			doc.getInfo(function(err, info){
				var file_buffer = DB_Load();
				try{
					file_buffer.counter+=1;
					file_buffer[file_buffer.counter] = {url: info.id, id: id, title: info.title, updated: info.updated};//, interval: options.interval||60};
					DB_Write(file_buffer);
					console.log(chalk.green("Worksheet successfully added."));
				}catch(e){
					console.log(chalk.red("Could not add this sheet."));
					process.exit(1);
				}
			});
		});
	}
}

function delSheet(index){
	try{
		var file_buffer = DB_Load();
		var title = file_buffer[index].title;
		delete file_buffer[index];
		DB_Write(file_buffer);
		console.log(chalk.red("Deleted: "+title));
	}catch(e){
		console.log(chalk.red("Please specify a valid index."));
	}
}

function listSheet(){
	try{
		var file_buffer = DB_Load();
		for(var index in file_buffer){
			if(Number(index)>0){
				console.log('['+index+']'+"\t"+chalk.cyan(file_buffer[index].title));
			}
		}
	}catch(e){
		console.log(chalk.red("Could not list the watchers."));
	}
}

function importSheets(){
	var doc = new GoogleSpreadsheet();
	doc.useServiceAccountAuth(creds, function(){
		doc.getSpreadsheetList(function(err, worksheets){
			if(err){
				console.log(chalk.red("Could not import the worksheets"));
				process.exit(1);
			}else if(worksheets.length==0){
				console.log(chalk.red("No worksheets were found."));
				process.exit(1);
			}else{
				var file_buffer = DB_Load();
				worksheets.forEach(function(ws){
					file_buffer.counter+=1;
					file_buffer[file_buffer.counter] = ws;
				});
				DB_Write(file_buffer);
				console.log(chalk.green(worksheets.length+' worksheet[s] successfully imported.'));
			}
		});
	});
}

function WATCHER(action){
	switch(action){
		case 'start':
			cp.exec('pm2 start '+__dirname+'/sheets-service.js', function(error, stdout){
				if(error)
					console.log(chalk.red("Could not start the watcher."));
				else
					console.log(chalk.green("Watcher has been started."));	
			});
		break;
		case 'restart':
			cp.exec('pm2 restart '+__dirname+'/sheets-service.js', function(error, stdout){
				if(error)
					console.log(chalk.red("Could not re-start the watcher."));
				else
					console.log(chalk.green("Watcher has been re-started."));	
			});
		break; 
		case 'stop':
			cp.exec('pm2 stop '+__dirname+'/sheets-service.js', function(error, stdout){
				if(error)
					console.log(chalk.red("Could not stop the watcher. You can kill the process id mentioned in service-pid file."));
				else
					console.log(chalk.green("Watcher has been stopped."));
			});
		break;
		default:
			console.log(chalk.red("Invaild command."));
	}
}

function setCallback(url){
	var file_buffer = DB_Load();
	if(url === 'view')
		console.log(chalk.green("Callback URL is "+file_buffer.callback));
	else{
		var status = file_buffer.callback?'updated.':'created.';
		file_buffer.callback = url;
		DB_Write(file_buffer);
		console.log(chalk.green("Callback URL is "+status));
	}
}

//Utils

function DB_Load(){
	var FILE_PATH = __dirname + '/data/data.json';
	var file_buffer;
	try{
		if(fs.existsSync(FILE_PATH))
			file_buffer = JSON.parse(fs.readFileSync(FILE_PATH));
		else{
			file_buffer = {counter:0};
			fs.writeFileSync(FILE_PATH, JSON.stringify(file_buffer), "utf8");
		}
		return file_buffer;
	}catch(e){
		console.log(e);
		console.log(chalk.red("Could not create data file. Please give neccessary permissions."));
		process.exit(1);
	}
}

function DB_Write(file_buffer){
	var FILE_PATH = __dirname + '/data/data.json';
	try{
		fs.writeFileSync(FILE_PATH, JSON.stringify(file_buffer), "utf8");
	}catch(e){
		console.log(chalk.red("Could not write to data file. Please give neccessary permissions."));
		process.exit(1);
	}
}