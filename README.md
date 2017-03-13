# google-sheet-watcher-cli

This is a Node.js application with CLI that enables you to watch for changes to google speadsheets that are either public or privately owned and notifies any HTTP server on a given callback URL. 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes -

### Prerequisites

You would need the following things -

1. [PM2](https://github.com/Unitech/pm2)
```
npm install pm2 -g
```

2. Google Service Account Key - Login to [Google Apps Console](https://console.developers.google.com), click on create credentials->service account key. Select a service account and key type as JSON and click on create. After you have downlaoded the JSON file save it as ./data/google-credentials.json

### Installing

```
npm i google-sheet-watcher-cli -g
```


## Commands Overview

```
gsheets import
```
Import spreadsheets of auhtorised google user. Remember that all the sheets shared at the email mentioned as client_email field in the generated JSON file are ONLY the private files that will be imported.

```
gsheets add <URL>
```
Add a Google Spreadsheet (should be public or privately visible to client_email field in the downloaded JSON file.)
```
gsheets list
```
List all sheets that have been added/imported.
```
gsheets del <INDEX>
```
Remove a spreadsheet from the list.
```
gsheets watcher start/stop/restart
```
Starts the watcher to look for changes in any of the spreadsheets.
```
gsheets callback <URL>
```
Give a callback URL that gets a hit with details if there is change in any spreadsheet.
For Example - 
```
POST http://<your_domain>.com/callback
BODY
{ 
	url: 'https://spreadsheets.google.com/feeds/worksheets/1SLRMX0APFh_EVb7Y3ac4PFn3bM2ipnGx7NaxhAVE8Qk/private/full',
  	id: '1SLRMX0APFh_EVb7Y3ac4PFn3bM2ipnGx7NaxhAVE8Qk',
  	title: 'Interview candidates',
  	updated: '2017-03-13T18:51:58.957Z' 
}
```
