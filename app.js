var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello World!')
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})

app.post('/slack', function (req, res) {
    var request = require("request");

    var options = {
        method: 'GET',
        url: 'http://legacy.cafebonappetit.com/api/2/menus',
        qs: {cafe: '245,246,247'},
        headers: {
            'postman-token': '2cd40287-dcb1-599e-01f6-699e2061e71b',
            'cache-control': 'no-cache'
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
//        console.log(body);
        var data = JSON.parse(body);

  //      console.log(data.days[0].date);
        res.send(data.days[0].date);

    });


  //  console.log(req.body.text);
});


