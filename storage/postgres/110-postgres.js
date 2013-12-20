/**
 * Copyright 2013 Kris Daniels.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var RED = require(process.env.NODE_RED_HOME+"/red/red");
var pg=require('pg');
var named=require('node-postgres-named');

function PostgresDatabaseNode(n) {
    RED.nodes.createNode(this,n);
    this.hostname = n.hostname;
    this.port = n.port;
    this.db = n.db;
    this.username = n.username;
    this.password = n.password;
}

RED.nodes.registerType("postgresdb",PostgresDatabaseNode);

function PostgresNode(n) {
	RED.nodes.createNode(this,n);
    
    this.topic = n.topic;
    this.postgresdb = n.postgresdb;
    this.postgresConfig = RED.nodes.getNode(this.postgresdb);
    this.sqlquery = n.sqlquery;
    this.outputs = n.outputs;
    
    var node = this;
    if(this.postgresConfig)
    {
		
		var conString = 'postgres://'+this.postgresConfig.username +':' + this.postgresConfig.password + '@' + this.postgresConfig.hostname + ':' + this.postgresConfig.port + '/' + this.postgresConfig.db;
		node.clientdb = new pg.Client(conString);
		named.patch(node.clientdb);

		node.clientdb.connect(function(err){
				if(err) { node.error(err); }
				else {
					node.on('input', 
						function(msg){
							node.clientdb.query(node.sqlquery,
										 msg.payload,
										 function (err, results) {
											 if(err) { node.error(err); }
											 else {
												if(node.outputs>0)
												{
													msg.payload = results.rows;
													node.send(msg);
												}
											 }
										 });
						});
				}
		});
	} else {
        this.error("missing postgres configuration");
    }
    
    this.on("close", function() {
        if(node.clientdb) node.clientdb.end();
    });
}

RED.nodes.registerType("postgres",PostgresNode);
