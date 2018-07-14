spa.Model.add({
    name: 'gotty',
    gotty: function($element) {
        var gotty = {
            AuthToken: Math.random().toString(36).substr(2, 5)
        };

        spa.services['codeland-crunner'].run({
            code: '/usr/local/bin/gotty -w -c '+gotty.AuthToken+' bash >/dev/null 2>&1 & echo "done"',
            callback: function(data){

                console.log(data)
                gotty.runnerName = data.ip;

                var httpsEnabled = window.location.protocol == "https:";
                var args = window.location.search;
                var url = (httpsEnabled ? 'wss://' : 'ws://') + '8080.'+data.rname+'.'+data.wname+'.workers.codeland.us/ws';
                var protocols = ["gotty"];
                var autoReconnect = -1;

                var openWs = function() {
                    var ws = new WebSocket(url, protocols);
                    gotty.ws = ws;
                    var term;

                    var pingTimer;

                    ws.onopen = function(event) {
                        ws.send(JSON.stringify({ Arguments: args, AuthToken: gotty.AuthToken,}));
                        pingTimer = setInterval(sendPing, 30 * 1000, ws);

                        hterm.defaultStorage = new lib.Storage.Local();
                        hterm.defaultStorage.clear();

                        term = new hterm.Terminal();
                        window.gottyTerm = term;

                        term.getPrefs().set("send-encoding", "raw");

                        term.onTerminalReady = function() {
                            var io = term.io.push();

                            gotty.termStroke = io.onVTKeystroke = function(str) {
                                ws.send("0" + str);
                            };
                            io.sendString = io.onVTKeystroke;

                            io.onTerminalResize = function(columns, rows) {
                                ws.send(
                                    "2" + JSON.stringify(
                                        {
                                            columns: columns,
                                            rows: rows,
                                        }
                                    )
                                )
                            };

                            term.installKeyboard();
                        };

                        term.decorate($element[0]);
                    };

                    ws.onmessage = function(event) {
                        data = event.data.slice(1);
                        switch(event.data[0]) {
                        case '0':
                            term.io.writeUTF8(window.atob(data));
                            break;
                        case '1':
                            // pong
                            break;
                        case '2':
                            term.setWindowTitle(data);
                            break;
                        case '3':
                            preferences = JSON.parse(data);
                            Object.keys(preferences).forEach(function(key) {
                                console.log("Setting " + key + ": " +  preferences[key]);
                                term.getPrefs().set(key, preferences[key]);
                            });
                            break;
                        case '4':
                            autoReconnect = JSON.parse(data);
                            console.log("Enabling reconnect: " + autoReconnect + " seconds")
                            break;
                        }
                    };

                    ws.onclose = function(event) {
                        if (term) {
                            term.uninstallKeyboard();
                            term.io.showOverlay("Connection Closed", null);
                        }
                        clearInterval(pingTimer);
                        if (autoReconnect > 0) {
                            setTimeout(openWs, autoReconnect * 1000);
                        }
                    };
                }

                var sendPing = function(ws) {
                    ws.send("1");
                }

                openWs();

                setInterval(function(gotty) {
                    console.log('gotty', gotty)
                    spa.services['codeland-crunner'].run({
                        name: gotty.runnerName,
                        code: "ZWNobwo="
                    });
                },30000, gotty);
            }  
        });
        return gotty;
    },
});
