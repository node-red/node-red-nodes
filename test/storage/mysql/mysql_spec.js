var sinon = require('sinon');
var should = require('should');
var proxyquire =  require('proxyquire');
var helper = require('../../../test/helper.js');
var mysqlConnection,
  mysqlMock = {
    createConnection: function () {
      return mysqlConnection;
    }
  };
var mysqlNode = proxyquire('../../../storage/mysql/68-mysql.js',
                    { 'mysql': mysqlMock });

describe('test MySql Node', function() {
    var flow = [ {
      id:"n1",
      type:"mysql",
      name:"mysql",
      mydb: "mysqlConfig",
      wires:[[]],
      query: "SELECT * FROM tables WHERE columnB = {{B}} AND columnA IN ({{A}})"
    },
    {
      id: 'mysqlConfig',
      type: 'MySQLdatabase',
      host: 'some-host',
      port: 'some-port'
    }];
    var creds = {
      "mysqlConfig": {
        user: 'some-user',
        password: 'some-pass'
      }
    }
    var queryNode;

    beforeEach(function(done){
        helper.load(mysqlNode, flow, creds, function() {
            queryNode = helper.getNode('n1');
            done();
        });
        mysqlConnection = {
          connect: function(callback){
            callback();
          },
          on: sinon.spy(),
          query: sinon.spy()
        };
    });
    afterEach(function(done) {
        helper.unload().then(done);
    });
    it('can make a simple query query', function(done) {
        queryNode.query = "SELECT * FROM table";
        queryNode.receive({
          topic: 'some-topic',
          payload: "A Message"
        });

        setTimeout(function() {
            mysqlConnection.query.calledWith(
              "SELECT * FROM table",
              []).should.be.true();
            done();
        }, 25);
    });

    it('can accept moustache style variables in query', function(done) {
        queryNode.receive({payload:{"A":"ParamA", "B":"ParamB"}});

        setTimeout(function() {
            mysqlConnection.query.calledWith(
              "SELECT * FROM tables WHERE columnB = ? AND columnA IN (?)",
              [
              "ParamB",
              "ParamA"
            ]).should.be.true();
            done();
        }, 25);
    });

    it('can use deeply nested properties for variable source', function(done) {
        queryNode.parameterSource = "payload.deeply.nested";
        queryNode.receive({
            payload: {
                deeply: {
                    nested: {
                        "A": "ParamA",
                        "B": "ParamB"
                    }
                }
            }
        });

        setTimeout(function() {
            mysqlConnection.query.calledWith(
              "SELECT * FROM tables WHERE columnB = ? AND columnA IN (?)",
              [
              "ParamB",
              "ParamA"
            ]).should.be.true();
            done();
        }, 25);
    });

    it('can fallback to topic based queries', function(done) {
        queryNode.query = "";
        queryNode.receive({
            topic: 'SELECT * FROM table',
            payload: {
                "A": "ParamA",
                "B": "ParamB"
            }
        });

        setTimeout(function() {
            mysqlConnection.query.calledWith(
              "SELECT * FROM table",
              []).should.be.true();
            done();
        }, 25);
    });
});
