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
var querystring = require('querystring');

RED.httpAdmin.get('/postgresdb/:id',function(req,res) {
    var credentials = RED.nodes.getCredentials(req.params.id);
    if (credentials) {
        res.send(JSON.stringify({user:credentials.user,hasPassword:(credentials.password&&credentials.password!="")}));
    } else {
        res.send(JSON.stringify({}));
    }
});

RED.httpAdmin.delete('/postgresdb/:id',function(req,res) {
    RED.nodes.deleteCredentials(req.params.id);
    res.send(200);
});

RED.httpAdmin.post('/postgresdb/:id',function(req,res) {
    var body = "";
    req.on('data', function(chunk) {
        body+=chunk;
    });
    req.on('end', function(){
        var newCreds = querystring.parse(body);
        var credentials = RED.nodes.getCredentials(req.params.id)||{};
        if (newCreds.user == null || newCreds.user == "") {
            delete credentials.user;
        } else {
            credentials.user = newCreds.user;
        }
        if (newCreds.password == "") {
            delete credentials.password;
        } else {
            credentials.password = newCreds.password||credentials.password;
        }
        RED.nodes.addCredentials(req.params.id,credentials);
        res.send(200);
    });
});


function PostgresDatabaseNode(n) {
    RED.nodes.createNode(this,n);
    this.hostname = n.hostname;
    this.port = n.port;
    this.db = n.db;
    
	var credentials = RED.nodes.getCredentials(n.id);
	if (credentials) {
		this.user = credentials.user;
		this.password = credentials.password;
	}
}

RED.nodes.registerType("postgresdb",PostgresDatabaseNode);

function PostgresNode(n) {
	RED.nodes.createNode(this,n);
    
    this.topic = n.topic;
    this.postgresdb = n.postgresdb;
    this.postgresConfig = RED.nodes.getNode(this.postgresdb);
    this.sqlquery = n.sqlquery;
    this.output = n.output;
    
    var node = this;

    if(this.postgresConfig)
    {
		
		var conString = 'postgres://'+this.postgresConfig.user +':' + this.postgresConfig.password + '@' + this.postgresConfig.hostname + ':' + this.postgresConfig.port + '/' + this.postgresConfig.db;
		node.clientdb = new pg.Client(conString);
		named.patch(node.clientdb);

		node.clientdb.connect(function(err){
				if(err) { node.error(err); }
				else {
					node.on('input', 
						function(msg){
							if(!msg.queryParameters) msg.queryParameters={};
							node.clientdb.query(msg.payload,
										 msg.queryParameters,
										 function (err, results) {
											 if(err) { node.error(err); }
											 else {
												if(node.output)
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
