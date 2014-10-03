var Connection = require('ssh2');

var c = new Connection();
c.on('connect', function() {
  console.log('Connection :: connect');
});
c.on('ready', function() {
  console.log('Connection :: ready');
  c.forwardOut('192.168.1.6', 8000, '127.0.0.1', 80, function(err, stream) {
    if (err) throw err;
    stream.on('data', function(data) {
      console.log('TCP :: DATA: ' + data);
    });
    stream.on('end', function() {
      console.log('TCP :: EOF');
    });
    stream.on('error', function(err) {
      console.log('TCP :: ERROR: ' + err);
    });
    stream.on('close', function(had_err) {
      console.log('TCP :: CLOSED');
      c.end();
    });
    var data = [
      'HEAD / HTTP/1.1',
      'User-Agent: curl/7.27.0',
      'Host: 127.0.0.1',
      'Accept: */*',
      'Connection: close',
      '',
      ''
    ];
    stream.write(data.join('\r\n'));
  });
});
c.on('error', function(err) {
  console.log('Connection :: error :: ' + err);
});
c.on('end', function() {
  console.log('Connection :: end');
});
c.on('close', function(had_error) {
  console.log('Connection :: close');
});
c.connect({
  host: '192.168.1.6',
  port: 22,
  username: 'qiu',
  password: 'qiu123'
});

// example output:
// Connection :: connect
// Connection :: ready
// TCP :: DATA: HTTP/1.1 200 OK
// Date: Thu, 15 Nov 2012 13:52:58 GMT
// Server: Apache/2.2.22 (Ubuntu)
// X-Powered-By: PHP/5.4.6-1ubuntu1
// Last-Modified: Thu, 01 Jan 1970 00:00:00 GMT
// Content-Encoding: gzip
// Vary: Accept-Encoding
// Connection: close
// Content-Type: text/html; charset=UTF-8
//
//
// TCP :: EOF
// TCP :: CLOSED
// Connection :: end
// Connection :: close
