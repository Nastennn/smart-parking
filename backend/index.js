const http = require("http");
const { Consumer } = require("sqs-consumer");
const mysql = require("mysql2");
const PORT = 8080;

let db;

function requestHandler(req, res) {
    if (req.method === "GET") {
        db.execute(
            "SELECT * FROM parking_slot",
            [],
            function(err, results) {
                res.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"});
                let preparedObj = results.map((obj) => {
                    const {id: parking_id, is_busy: busy} = obj;
                    return {parking_id, busy};
                });
                preparedObj.sort((a, b) => {
                    return a.parking_id - b.parking_id;
                });
                console.log(JSON.stringify(preparedObj));
                res.write(JSON.stringify(preparedObj));
                res.end();
            }
        );
    }
}

function start() {
    const server = http.createServer(requestHandler);
    // create the db to database
    db = mysql.createConnection({
        host: "smart-parking.cmligb5fd92d.us-east-1.rds.amazonaws.com",
        port: 3306,
        user: "admin",
        password: process.env.DB_PASSWORD,
        database: "smart_parking"
    });


    server.listen(PORT, (err) => {
        if (err) {
            return console.log("something bad happened", err);
        }
        console.log(`server is listening on ${PORT}`);
    });

    const consumer = Consumer.create({
        queueUrl: "https://sqs.us-east-1.amazonaws.com/069968953470/smart-parking-queue",
        handleMessage: async (message) => {
            let body;
            try {
                body = JSON.parse(message.Body);
                const {is_busy, parking_id, parking_slot_id} = body;
                console.log(`parking_id = ${parking_id}; parking_slot_id = ${parking_slot_id}; is_busy = ${is_busy}`);
                db.execute(
                    "UPDATE parking_slot set is_busy = ? where parking_id = ? and id = ?",
                    [is_busy, parking_id, parking_slot_id],
                    (err) => {
                        if (err) {
                            console.error(err);
                        }
                    }
                );
            } catch (error) {
                console.error(error);
            }
        }
    });

    consumer.start();
}

start();
