// setting up servers
mongod --dbpath C:\MongoServers\replica\db1 --replSet nosql //this will be the default port
mongod --dbpath C:\MongoServers\replica\db2 --replSet nosql --port 27018
mongod --dbpath C:\MongoServers\replica\db3 --replSet nosql --port 27019

//configure the replication
//default oplog.rs size 5% of free disk space
var configuration = {
_id:'nosql',
members:[
{_id:0,host:'localhost:27017',votes:1},
{_id:1,host:'localhost:27018',slaveDelay:20,priority:0,votes:1},
{_id:2,host:'localhost:27019',votes:1},
]
}

//possibe primaries (27017,27019)
 rs.initiate(configuration)
 
// eneblae reading from secondaries primaryPreferred
 rs.slaveOk(true) 