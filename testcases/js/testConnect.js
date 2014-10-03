var net = require('net');

var client = net.connect({port: 5858,host: "172.16.149.134"},function() { //'connect' listener
  console.log('client connected');
  client.write('world!\r\n');
});
client.on('data', function(data) {
  console.log(data.toString());
  client.end();
});
client.on('error', function(data) {
  console.log("---------")
  console.log(data.toString());
  client.end();
});
client.on('end', function() {
  console.log('client disconnected');
});
