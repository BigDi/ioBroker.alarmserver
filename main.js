"use strict"; 

/*
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const net = require("net");
let server=null;
let adapter;
// Load your modules here, e.g.:
// const fs = require("fs");

class Alarmserver extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "alarmserver",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
		adapter = this;
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here
		serverStart();

		const islistening = server.listening;

		if(islistening){
			this.log.info("Server is listening");
		}else{
			this.log.info("Server is not listening!");
		}
		// Reset the connection indicator during startup
		this.setState("info.connection", false, true);

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config serverPort: " + this.config.serverPort);

		

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		// await this.setObjectAsync("motionDetect", {
		// 	type: "state",
		// 	common: {
		// 		name: "motionDetect",
		// 		type: "boolean",
		// 		role: "indicator",
		// 		read: true,
		// 		write: true,
		// 	},
		// 	native: {},
		// });

		// in this template all states changes inside the adapters namespace are subscribed
		// this.subscribeStates("*");

		/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		// let result = await this.checkPasswordAsync("admin", "iobroker");
		// this.log.info("check user admin pw ioboker: " + result);

		// result = await this.checkGroupAsync("admin", "admin");
		// this.log.info("check group user admin group admin: " + result);
	}
	

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Alarmserver(options);
} else {
	// otherwise start the instance directly
	new Alarmserver();
}


function serverStart() {
	server = net.createServer(onclientConnected);
	let port = adapter.config.serverPort;
	
	server.listen(port,(err) => {
		if (err) {
		  return adapter.log.error('something bad happened', err)
		}
	  
		adapter.log.info(`server is listening on ${port}`)
	  })

	server.on("close",function(){
		adapter.log.info("Server closed !");
	});

	

}
function onclientConnected(socket) {
  
	socket.setEncoding("utf8");

	socket.setTimeout(800000,function(){
	// called after timeout -> same as socket.on('timeout')
	// it just tells that soket timed out => its ur job to end or destroy the socket.
	// socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
	// whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
	adapter.log.error ("Socket timed out");
	});

	socket.on("data",function(data){
	adapter.log.info("(Event)Client connected");
	//let bread = socket.bytesRead;
	//let bwrite = socket.bytesWritten;
	//console.log('Bytes read : ' + bread);
	//console.log('Bytes written : ' + bwrite);
		const jsonData = data.substring(20,data.length);
		let obj=null;
		try{
			obj = JSON.parse(jsonData);
		}
		catch(e)
		{
			adapter.log.error ("Parsing JSON Data");
			return;
		}

		if (obj.Event=="MotionDetect")
		{
			adapter.log.info("Motion : " + obj.Status);
			//adapter.setObjectNotExists();

			let queue = createChannel(obj.SerialID);
			Promise.all(queue)
							.then(() => {
								let promises= createObject(obj);

								Promise.all(promises).then(() => {
									adapter.log.debug("update states from summary");
									updateStates(jsonData);
								}).catch((err) => {
									adapter.log.error("error: " + err);
								});
							})
							.catch((err) => {
								adapter.log.error("error: " + err);
				})
		;



			

		}
	});
	socket.on("error",function(error){
		adapter.log.info("Error : " + error);
	});
}

function createChannel(serialNr)
{
	const promises = [];
	promises.push(	adapter.setObjectNotExistsAsync(serialNr, {
		type: 'channel',
		common: {
		  name: serialNr,
		  write: false,
		  read: true
		},
		native: {}
	  }));
	  
	return promises;
}

function createObject(jsonObj) {
	const promises = [];

	if (typeof(jsonObj.StartTime) !== 'undefined')
	{
	promises.push(adapter.setObjectNotExistsAsync(jsonObj.SerialID+".StartTime", {
		type: 'state', 
		common: {
			name: jsonObj.Status,
			write: false,
			read: true
		}, 
		native: {}
	  }));
	}
	if (typeof(jsonObj.EndTime) !== 'undefined')
	{
	  promises.push(adapter.setObjectNotExistsAsync(jsonObj.SerialID+".EndTime", {
		type: 'state', 
		common: {
			name: jsonObj.Status,
			write: false,
			read: true
		}, 
		native: {}
	  }));
	}
	if (typeof(jsonObj.Status) !== 'undefined')
	{
	  promises.push(adapter.setObjectNotExistsAsync(jsonObj.SerialID+".Status", {
		type: 'state', 
		common: {
			name: jsonObj.Status,
			write: false,
			read: true
		}, 
		native: {}
	  }));
	}
	if (typeof(jsonObj.Channel) !== 'undefined')
	{
	  promises.push(adapter.setObjectNotExistsAsync(jsonObj.SerialID+".Channel", {
		type: 'state', 
		common: {
			name: jsonObj.Status,
			write: false,
			read: true
		}, 
		native: {}
	  }));
	}
	return promises;
  }

  function updateStates(jsonObj)
  {
	if (typeof(jsonObj.StartTime) !== 'undefined')
	{
		adapter.setState(jsonObj.SerialID+".StartTime",jsonObj.StartTime,true);
	}
	if (typeof(jsonObj.EndTime) !== 'undefined')
	{
		adapter.setState(jsonObj.SerialID+".EndTime",jsonObj.StartTime,true);
	}
	if (typeof(jsonObj.Status) !== 'undefined')
	{
		adapter.setState(jsonObj.SerialID+".Status",jsonObj.Status,true);
	}
	if (typeof(jsonObj.Channel) !== 'undefined')
	{
		adapter.setState(jsonObj.SerialID+".Channel",jsonObj.Channel,true);
	}

  }

  

