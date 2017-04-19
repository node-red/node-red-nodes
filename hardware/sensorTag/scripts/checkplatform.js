var spawn = require('child_process').spawn;

if (process.argv.length === 3) {
    var command = process.argv[2];

    if (process.platform === 'linux') {
        var dir = __dirname;
        var script = spawn(dir + "/" + command);
        script.on('close',function(code) {
            process.exit(code);
        });
    }
    else {
        process.exit(0);
    }
} else {
    process.exit(0);
}
