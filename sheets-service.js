var request = require('request');
var GoogleSpreadsheet = require('./google-spreadsheet');
var creds = require('./google-credentials.json');
var async = require('async');
var fs = require('fs');
var ws = [];
var worksheets;
var interval;

try{
	worksheets = DB_Load();
	async.forEachOf(worksheets, function(sheet, key, callback){
		if(Number(key)>=0){
			var user = new GoogleSpreadsheet(sheet.id);
			user.useServiceAccountAuth(creds, function(){
				ws.push({instance:user, index: key});
				console.log("pushed");
				callback();			
			});
		}else
			callback();
	}, function(err){
		console.log("No. of sheets to watch -", ws.length);
		fs.writeFileSync("service-pid", String(process.pid), "utf8");
		setTimeout(watch, 0);
	});	
}catch(e){
	console.log(e.message);
}

//Utils
function watch(){
	async.forEachOf(ws, function(sheet, index, callback){
		sheet.instance.getInfo(function(err, info){
			if(!err){
				var lastUpdated = new Date(worksheets[sheet.index].updated);
				var newdate = new Date(info.updated);
				if(newdate>lastUpdated){
					publish(sheet.index, info, function(){
						callback();
					});
				}else{
					console.log('no update.');
					callback();
				}
			}else{
				console.log(err);
				callback();
			}
		});
	}, function(err){
		setTimeout(watch, 20000);
	});
}

function publish(index, info, cb){
	var id = info.id.match(/worksheets\/(.*?)\//)[1];
	var file_buffer = DB_Load();
	file_buffer[index] = {url: info.id, id: id, title: info.title, updated: info.updated};
	DB_Write(file_buffer);
	worksheets[index] = file_buffer[index];
	console.log("updated", info.title);
	if(worksheets.callback){
		request({method: 'POST', uri: worksheets.callback, body: worksheets[index], json:true, timeout: 1000}, function(error, response, body){
			cb();
		});
	}else
		cb();
}

function DB_Load(){
	var file_buffer;
	try{
		if(fs.existsSync('./data.json'))
			file_buffer = JSON.parse(fs.readFileSync('./data.json'));
		else{
			file_buffer = {counter:0};
			fs.writeFileSync("./data.json", JSON.stringify(file_buffer), "utf8");
		}
		return file_buffer;
	}catch(e){
		console.log(e);
		console.log(chalk.red("Could not create data file. Please give neccessary permissions."));
		process.exit(1);
	}
}

function DB_Write(file_buffer){
	try{
		fs.writeFileSync("./data.json", JSON.stringify(file_buffer), "utf8");
	}catch(e){
		console.log(chalk.red("Could not write to data file. Please give neccessary permissions."));
		process.exit(1);
	}
}